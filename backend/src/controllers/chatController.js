const crypto = require("crypto");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Timetable = require("../models/Timetable");
const BusLocation = require("../models/BusLocation");
const ChatHistory = require("../models/ChatHistory");
const ollamaService = require("../services/ollamaService");
const qdrantService = require("../services/qdrantService");
const { chatMessageSchema } = require("../utils/chatSchemas");

// Maximum number of past turns to include in the LLM context window
const HISTORY_WINDOW = 6;

// ── Helper: build grounded system prompt ─────────────────────────────────────
const buildSystemPrompt = ({ studentContext, faqChunks }) => {
  const contextBlock = studentContext
    ? `
## Student Context (live data from the database)
- Name: ${studentContext.name}
- Roll Number: ${studentContext.rollNumber}
- Department: ${studentContext.department}, Semester ${studentContext.semester}
- Overall Attendance: ${studentContext.overallAttendance}%
- Today's Classes: ${studentContext.todayClasses}
- Active Bus Route ETA: ${studentContext.busETA}
`
    : "";

  const faqBlock =
    faqChunks.length > 0
      ? `\n## Relevant Campus Policies / FAQs\n${faqChunks.map((c, i) => `${i + 1}. ${c}`).join("\n\n")}`
      : "";

  return `You are CampusBot, a helpful and friendly AI assistant for a smart campus management system called CampusOne. You help students with questions about their attendance, timetable, bus tracking, coding leaderboard, campus policies, and general academic queries.

Always respond in a concise, friendly, and professional tone. Use bullet points or numbered lists where appropriate. If you don't know the exact answer, say so and suggest where the student can get help.

When answering questions about the student's personal data (attendance, schedule, etc.), use the live data provided below — do NOT make up values.
${contextBlock}${faqBlock}

Current date and time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
};

// ── Helper: build student context object ──────────────────────────────────────
const fetchStudentContext = async (userId) => {
  try {
    const student = await Student.findOne({ userId }).populate(
      "userId",
      "name",
    );
    if (!student) return null;

    // Overall attendance % (lightweight — count presents vs total)
    const attendanceLogs = await Attendance.find({ studentId: student._id });
    const presentCount = attendanceLogs.filter(
      (l) => l.status === "present",
    ).length;
    const totalCount = attendanceLogs.filter(
      (l) => l.status !== "leave",
    ).length;
    const overallAttendance =
      totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : "100.0";

    // Today's timetable classes
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayDay = days[new Date().getDay()];
    const todaySlots = await Timetable.find({
      type: "recurring",
      dayOfWeek: todayDay,
      department: student.department,
      semester: student.semester,
      batch: student.batch,
    }).sort({ startTime: 1 });

    const todayClasses =
      todaySlots.length > 0
        ? todaySlots
            .map(
              (s) =>
                `${s.startTime}–${s.endTime} ${s.subjectName} (${s.room || "TBD"})`,
            )
            .join(", ")
        : "No classes scheduled today";

    // Latest bus location ETA (most recent entry)
    const latestBus = await BusLocation.findOne()
      .sort({ createdAt: -1 })
      .populate("routeId", "name");
    const busETA = latestBus
      ? `Route ${latestBus.routeId?.name || "Unknown"} last updated ${new Date(latestBus.createdAt).toLocaleTimeString("en-IN")}`
      : "Bus location not available";

    return {
      name: student.userId?.name || "Student",
      rollNumber: student.rollNumber,
      department: student.department,
      semester: student.semester,
      overallAttendance,
      todayClasses,
      busETA,
    };
  } catch {
    return null; // Degrade gracefully
  }
};

// ── Controller: POST /api/chat ─────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    // 1. Validate request body
    const result = chatMessageSchema.safeParse(req.body);
    if (!result.success) {
      const error = new Error(
        result.error.issues?.[0]?.message || "Validation failed",
      );
      error.statusCode = 400;
      return next(error);
    }

    const { message, conversationId: providedConvId } = result.data;
    const conversationId = providedConvId || crypto.randomUUID();

    // 2. Fetch student context (live data)
    const studentContext = await fetchStudentContext(req.user._id);

    // 3. Embed user message and retrieve top FAQ chunks
    let faqChunks = [];
    try {
      const queryEmbedding = await ollamaService.getEmbedding(message);
      faqChunks = await qdrantService.search(queryEmbedding, 3);
      // Filter out empty strings from fallback zero-vectors
      faqChunks = faqChunks.filter(Boolean);
    } catch {
      // Non-fatal — proceed without RAG context
    }

    // 4. Build grounded system prompt
    const systemPrompt = buildSystemPrompt({ studentContext, faqChunks });

    // 5. Load last N turns of conversation history
    const historyDocs = await ChatHistory.find({
      userId: req.user._id,
      conversationId,
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(HISTORY_WINDOW)
      .lean();

    // Reverse to chronological order for the LLM
    const messages = historyDocs
      .reverse()
      .map((h) => ({ role: h.role, content: h.content }));

    // Add the current user message
    messages.push({ role: "user", content: message });

    // 6. Call Ollama for the reply
    const reply = await ollamaService.chat(systemPrompt, messages);

    // 7. Persist both turns to ChatHistory
    await ChatHistory.insertMany([
      {
        userId: req.user._id,
        conversationId,
        role: "user",
        content: message,
      },
      {
        userId: req.user._id,
        conversationId,
        role: "assistant",
        content: reply,
      },
    ]);

    // 8. Return response
    res.status(200).json({
      status: "success",
      data: {
        reply,
        conversationId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Controller: GET /api/chat/history ─────────────────────────────────────
const getHistory = async (req, res, next) => {
  const { conversationId, limit = 50 } = req.query;

  try {
    const query = { userId: req.user._id };
    if (conversationId) query.conversationId = conversationId;

    const history = await ChatHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    res.status(200).json({
      status: "success",
      data: history.reverse(), // Return in chronological order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getHistory };
