const request = require("supertest");
const mongoose = require("mongoose");
const crypto = require("crypto");

const server = require("../src/index");
const User = require("../src/models/User");
const Student = require("../src/models/Student");
const ChatHistory = require("../src/models/ChatHistory");
const ollamaService = require("../src/services/ollamaService");
const qdrantService = require("../src/services/qdrantService");

let studentToken, studentId, userId;
let getEmbeddingSpy,
  chatSpy,
  initCollectionSpy,
  upsertPointsSpy,
  getPointCountSpy,
  searchSpy;

const registerAndLoginStudent = async (email, rollNumber) => {
  const payload = {
    name: "Chat Student",
    email,
    password: "password123",
    role: "student",
    rollNumber,
    department: "CSE",
    semester: 4,
    batch: "2023-2027",
  };

  const reg = await request(server).post("/api/auth/register").send(payload);

  if (reg.status !== 201) {
    throw new Error(
      `Registration failed in test helper: ${JSON.stringify(reg.body)}`,
    );
  }

  const studentDoc = await Student.findOne({ rollNumber });

  return {
    token: reg.body.data.accessToken,
    userId: reg.body.data.user.id,
    studentId: studentDoc._id,
  };
};

beforeEach(async () => {
  // Clear any existing mock/spy states
  jest.restoreAllMocks();

  // Setup spys to intercept real service calls
  getEmbeddingSpy = jest
    .spyOn(ollamaService, "getEmbedding")
    .mockResolvedValue(new Array(768).fill(0.123));
  chatSpy = jest
    .spyOn(ollamaService, "chat")
    .mockResolvedValue("Mocked response from Ollama");

  initCollectionSpy = jest
    .spyOn(qdrantService, "initCollection")
    .mockResolvedValue(undefined);
  upsertPointsSpy = jest
    .spyOn(qdrantService, "upsertPoints")
    .mockResolvedValue(undefined);
  getPointCountSpy = jest
    .spyOn(qdrantService, "getPointCount")
    .mockResolvedValue(0);
  searchSpy = jest
    .spyOn(qdrantService, "search")
    .mockResolvedValue([
      "Mocked FAQ: attendance condonation threshold is 65%.",
      "Mocked FAQ: semester registration rules apply.",
    ]);

  const credentials = await registerAndLoginStudent(
    "chat_student@campus.edu",
    "ROLL-CHAT-999",
  );
  studentToken = credentials.token;
  userId = credentials.userId;
  studentId = credentials.studentId;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AI Chat API Test Suite", () => {
  // 1. Unauthenticated route protection
  it("should return 401 if request is unauthenticated", async () => {
    const res = await request(server)
      .post("/api/chat")
      .send({ message: "Hello bot" });

    expect(res.status).toBe(401);
  });

  // 2. Body schema Zod validation
  it("should reject empty message or missing message with 400", async () => {
    const res = await request(server)
      .post("/api/chat")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ message: "  " }); // whitespace only

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Message cannot be empty");
  });

  // 3. Valid chat request triggers RAG retrieval + LLM call
  it("should complete valid RAG flow and return reply", async () => {
    const res = await request(server)
      .post("/api/chat")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ message: "What is the attendance policy?" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.reply).toBe("Mocked response from Ollama");
    expect(res.body.data.conversationId).toBeDefined();

    // Verify service spies were triggered
    expect(getEmbeddingSpy).toHaveBeenCalledWith(
      "What is the attendance policy?",
    );
    expect(searchSpy).toHaveBeenCalled();
    expect(chatSpy).toHaveBeenCalled();

    // Verify chat turns saved in DB
    const history = await ChatHistory.find({ userId });
    expect(history.length).toBe(2); // One user turn, one assistant turn
    expect(history[0].role).toBe("user");
    expect(history[0].content).toBe("What is the attendance policy?");
    expect(history[1].role).toBe("assistant");
    expect(history[1].content).toBe("Mocked response from Ollama");
  });

  // 4. Conversation continuations with history lookup
  it("should include conversation history in system prompt or message context", async () => {
    const conversationId = crypto.randomUUID();

    // Seed some prior conversation context directly in the test database
    await ChatHistory.insertMany([
      {
        userId,
        conversationId,
        role: "user",
        content: "Hi there!",
        createdAt: new Date(Date.now() - 2000),
      },
      {
        userId,
        conversationId,
        role: "assistant",
        content: "Hello student, how can I help you today?",
        createdAt: new Date(Date.now() - 1000),
      },
    ]);

    const res = await request(server)
      .post("/api/chat")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ message: "Tell me about the bus.", conversationId });

    expect(res.status).toBe(200);
    expect(res.body.data.conversationId).toBe(conversationId);

    // Assert that the chatSpy was called with prior history populated
    expect(chatSpy).toHaveBeenCalled();
    const mockChatCalls = chatSpy.mock.calls;
    expect(mockChatCalls.length).toBe(1);
    const [, messagesSent] = mockChatCalls[0];

    // messagesSent should be: [ { role: 'user', content: 'Hi there!' }, { role: 'assistant', content: '...' }, { role: 'user', content: 'Tell me about the bus.' } ]
    expect(messagesSent.length).toBe(3);
    expect(messagesSent[0].content).toBe("Hi there!");
    expect(messagesSent[1].content).toBe(
      "Hello student, how can I help you today?",
    );
    expect(messagesSent[2].content).toBe("Tell me about the bus.");

    // DB should now have 4 turns for this conversation
    const historyCount = await ChatHistory.countDocuments({
      userId,
      conversationId,
    });
    expect(historyCount).toBe(4);
  });

  // 5. GET chat history endpoint
  it("should return chronological chat history", async () => {
    const conversationId = crypto.randomUUID();

    await ChatHistory.insertMany([
      {
        userId,
        conversationId,
        role: "user",
        content: "First message",
        createdAt: new Date(Date.now() - 2000),
      },
      {
        userId,
        conversationId,
        role: "assistant",
        content: "First reply",
        createdAt: new Date(Date.now() - 1000),
      },
    ]);

    const res = await request(server)
      .get(`/api/chat/history?conversationId=${conversationId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].content).toBe("First message");
    expect(res.body.data[1].content).toBe("First reply");
  });
});
