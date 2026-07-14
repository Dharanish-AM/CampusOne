/**
 * faqSeeds.js
 * Static knowledge-base chunks used to seed the Qdrant vector store.
 * Each chunk is a standalone paragraph of campus policy or FAQ answer.
 * Keep chunks concise (100-300 words) for high retrieval precision.
 */

const FAQ_CHUNKS = [
  // ── Attendance Policy ─────────────────────────────────────────────────────
  {
    id: "att_policy_75",
    text: `Attendance Policy — 75% Minimum Requirement: All students must maintain a minimum of 75% attendance in each subject to be eligible to appear in the end-semester examinations. Students who fall below this threshold will be detained and will not be permitted to sit the exam for that subject. The attendance percentage is calculated as: (Number of classes attended / Total classes held) × 100. Medical leave supported by a doctor's certificate from the college health centre may be considered separately by the HOD, but does not automatically exempt the student from the 75% rule.`,
  },
  {
    id: "att_condonation",
    text: `Attendance Condonation: Students with attendance between 65% and 75% may apply for condonation of attendance shortage, subject to the following: (1) A written application must be submitted to the HOD within two weeks of the shortage being identified. (2) Valid documentary evidence (medical certificates, participation in inter-college events, NCC/NSS duties) must accompany the application. (3) Condonation is not a right — it is granted at the discretion of the Academic Council. Students below 65% attendance are not eligible for condonation and will be detained.`,
  },
  {
    id: "att_calculation",
    text: `How Attendance is Calculated: Attendance is tracked at the individual subject level, not the overall level. A student may have 80% overall but still be detained in a specific subject if that subject's attendance is below 75%. Each period (lecture or lab session) counts as one unit. Lab sessions of 2 or 3 periods count as a single attendance unit. Attendance is updated in real-time on the CampusOne app as faculty mark it. Students can view their subject-wise attendance breakdown and receive predictive warnings if they are approaching the 75% boundary.`,
  },
  {
    id: "att_shortage_recovery",
    text: `Recovering from Attendance Shortage: If your attendance in a subject drops below 75%, the CampusOne app will show you how many consecutive classes you must attend to recover. The formula used is: Classes to attend = ceil(3 × total_classes - 4 × present_count). For example, if you have attended 14 out of 20 classes (70%), you need to attend at least 4 consecutive classes without any absence to recover to 75%. Plan ahead — missing classes while already in shortage makes recovery exponentially harder.`,
  },

  // ── Timetable & Scheduling ─────────────────────────────────────────────────
  {
    id: "timetable_structure",
    text: `Timetable Structure: The academic timetable is structured into regular weekly recurring classes (Mon–Sat) and special exam slots. Regular periods run from 8:00 AM to 4:30 PM in 6 periods of 55 minutes each, with a 30-minute lunch break at 12:30 PM. Lab sessions are 3 consecutive periods and are shown as a single block. The CampusOne Timetable screen shows today's schedule by default. Use the day-selector chips to browse other days. Tap any class card to see the faculty name, room number, and subject code.`,
  },
  {
    id: "timetable_exam",
    text: `Exam Timetable: Exam schedules are published by the examination cell at least 21 days before the exam. They appear in the CampusOne app under the Timetable screen with an "EXAM" badge. Model exams and unit tests are posted by the class coordinator. Semester end exams are posted by the Controller of Examinations. Students will receive a push notification when a new exam timetable is published. Exam halls are allotted separately and are shown in the exam card details.`,
  },
  {
    id: "class_cancellation",
    text: `Class Cancellation and Rescheduling: If a class is cancelled by the faculty, it should be reported to the class coordinator within 24 hours. Cancelled classes are not counted towards the total class count for attendance purposes. Compensatory classes may be scheduled on Saturdays or during free periods. Students will be notified via the CampusOne app notifications when a class is cancelled or rescheduled. It is the student's responsibility to attend compensatory classes — they are counted for attendance.`,
  },

  // ── Smart Bus Tracking ─────────────────────────────────────────────────────
  {
    id: "bus_tracking",
    text: `Smart Bus Tracking: The CampusOne app provides real-time GPS tracking of all college buses. The Bus Tracking screen displays the live location of your assigned bus on a map, along with the estimated arrival time at each stop, current occupancy, and driver details. Bus location is updated every 15 seconds. If the bus is not yet operational (before 6:00 AM or after 7:00 PM), the map will show the last known parked location. Contact the transport office for route queries: transport@campusone.edu.`,
  },
  {
    id: "bus_routes",
    text: `Bus Routes and Timings: The college operates 12 bus routes covering major residential areas. Morning pickup starts at 6:30 AM from the furthest stop and arrives at campus by 8:00 AM. Evening departure from campus begins at 4:45 PM. Students who miss the bus must arrange their own transport — no refunds are applicable for missed trips. Route changes or new stop requests must be submitted to the transport office at least 15 days before the semester begins. Monthly and semester-wise bus passes are available at the transport office.`,
  },
  {
    id: "bus_emergency",
    text: `Bus Emergency Procedures: In case of a bus breakdown, the driver will notify the transport office immediately. A replacement vehicle will be dispatched within 45 minutes. Students will receive a push notification via CampusOne. The transport office helpline (available 6:00 AM to 8:00 PM on working days) is: +91-XXXXXXXXXX. Students should not flag down personal vehicles and must wait for the replacement bus or contact their parents. For medical emergencies, call 108 immediately before contacting the transport office.`,
  },

  // ── Coding Leaderboard ─────────────────────────────────────────────────────
  {
    id: "leaderboard_howto",
    text: `Coding Leaderboard — How It Works: The CampusOne Coding Leaderboard aggregates your competitive programming stats from LeetCode, Codeforces, and GitHub into a single score. To appear on the leaderboard, link your handles on the Leaderboard screen using the "Edit" button. Your data is automatically synced every 24 hours. The overall score is a weighted combination: LeetCode problems solved, Codeforces rating, and GitHub stars + repos. You can filter the leaderboard by platform to see platform-specific rankings.`,
  },
  {
    id: "leaderboard_scoring",
    text: `Leaderboard Scoring Formula: The overall score is calculated as follows — LeetCode: each solved problem contributes 10 points (easy), 25 points (medium), 60 points (hard). Codeforces: rating points contribute directly. GitHub: each star on your repositories contributes 5 points; each public repository contributes 2 points. The leaderboard is refreshed daily. If your handle is incorrect, update it in the app and wait for the next sync cycle (up to 24 hours).`,
  },

  // ── Academic Policies ─────────────────────────────────────────────────────
  {
    id: "exam_eligibility",
    text: `Examination Eligibility: To be eligible for end-semester exams, students must: (1) Have at least 75% attendance in all registered subjects. (2) Have submitted all required assignments, lab records, and project reports. (3) Have paid all examination fees before the hall ticket release date. (4) Not have any pending disciplinary action. Hall tickets are issued online through the student portal and on the CampusOne app. No student will be permitted to enter the examination hall without a valid hall ticket.`,
  },
  {
    id: "internal_marks",
    text: `Internal Assessment Marks: Internal marks (25 marks per subject) are awarded based on: Model exam performance (15 marks), Assignment submission (5 marks), and Attendance (5 marks — full marks for ≥90%, proportional below that). Internal marks are finalized 10 days before the semester exam. If you believe there is an error in your internal marks, submit a written appeal to the subject faculty within 5 working days of the marks being published.`,
  },
  {
    id: "arrear_exam",
    text: `Arrear Examinations: Students who fail a subject (score below 50 combined internal + external) will have an arrear in that subject. Arrear exams are conducted twice a year — in November/December and April/May. There is no limit on the number of arrear attempts within the degree program duration. Students must register for arrear exams via the student portal and pay the applicable fee. Arrear exam timetables are published on the CampusOne app under the Timetable section with an "ARREAR" badge.`,
  },

  // ── Campus Life & General ─────────────────────────────────────────────────
  {
    id: "library_hours",
    text: `Library Hours and Rules: The central library is open Monday to Saturday, 8:00 AM to 8:00 PM. Students can borrow up to 3 books at a time for a period of 14 days. Renewals are allowed twice online via the student portal or the CampusOne app. A fine of ₹2 per day is charged for overdue books. The library has a dedicated digital resource section with access to IEEE Xplore, Springer, and other academic databases — accessible on campus or via VPN from home. Silence must be maintained at all times.`,
  },
  {
    id: "leave_application",
    text: `Leave Application Process: Medical Leave: Students must inform the class coordinator via the CampusOne app or phone on the day of absence. A medical certificate from a registered doctor must be submitted within 3 days of returning. On-Duty Leave: For participation in inter-college events, seminars, or competitions, an On-Duty (OD) letter must be obtained from the respective faculty/club advisor before the event. OD letters prevent the missed classes from being counted as absences. Casual Leave: Up to 3 days per semester with prior written approval from the HOD.`,
  },
  {
    id: "clubs_activities",
    text: `Student Clubs and Activities: The college has 15+ student clubs including coding clubs, entrepreneurship cell, drama, music, and sports. Participation in club activities during class hours requires an OD letter approved by the faculty advisor and the HOD. Club events are published on the CampusOne notifications feed. Inter-college event participation can contribute to your CampusOne activity score (coming soon). All club-related announcements are posted by authorized club coordinators through the CampusOne admin portal.`,
  },
  {
    id: "placement_cell",
    text: `Placement Cell and Internships: The college Placement Cell coordinates campus recruitment drives. Students in their 7th semester and above who maintain a minimum CGPA of 6.0 are eligible for campus placements. The CampusOne app will display active placement drives, registration deadlines, and company profiles in the Placements section (coming in Phase 2). Pre-placement offers (PPOs) from internships are also coordinated through the Placement Cell. Resume submission and mock interviews are conducted by the Training & Placement department.`,
  },
  {
    id: "grievance_redressal",
    text: `Grievance Redressal: Students can file academic or non-academic grievances through: (1) The class coordinator for day-to-day issues. (2) The HOD for departmental academic issues. (3) The Student Grievance Cell (SGC) for formal complaints — submissions accepted on the first Monday of every month. (4) The college website's anonymous grievance portal for sensitive matters. Response time is committed to 7 working days for formal complaints. The CampusOne complaint tracking feature (available in the app) allows students to monitor the status of their submitted complaints in real time.`,
  },
  {
    id: "wifi_it_resources",
    text: `Wi-Fi and IT Resources: The campus provides high-speed Wi-Fi across all academic blocks, hostels, and the library. Connect to the SSID "CampusOne_Secure" using your student roll number as the username and your date of birth (DDMMYYYY) as the initial password. Reset your password via the IT help desk. Bandwidth limits: 5 GB per day per student for general use; unlimited for academic databases. Streaming, torrenting, and access to inappropriate content are strictly prohibited and will result in disciplinary action. IT help desk: it-support@campusone.edu.`,
  },
];

module.exports = FAQ_CHUNKS;
