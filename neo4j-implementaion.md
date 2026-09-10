You are implementing the database layer for a completely new CampusOne project branch.

This is a FRESH Neo4j-FIRST implementation.

Do not migrate the old MongoDB architecture.
Do not create MongoDB.
Do not create Redis.
Do not create Kafka.
Do not create microservices.
Do not create vector databases yet.
Do not implement GraphRAG or Agentic AI yet.

The current goal is to build a clean, extensible CampusOne Knowledge Graph in Neo4j and expose it through the existing Node.js + Express backend.

============================================================
PROJECT ARCHITECTURE
============================================================

Frontend:
- React Native
- React

Backend:
- Node.js
- Express.js

Database:
- Neo4j

Neo4j driver:
- neo4j-driver

Environment:
- dotenv

Development:
- nodemon

The database must be designed as a true graph.

Do NOT simply reproduce relational tables as isolated nodes.

Relationships are a first-class part of the design.

The graph must support traversal from any relevant entity:
Student -> Batch -> Course -> Semester -> Subject -> Faculty
Faculty -> Subject -> Students
Department -> Course -> Batch -> Students
Batch -> Timetable -> Subject -> Faculty
Batch -> Examination -> Subject -> Result -> Student
Student -> Result -> Examination -> Subject
Room -> TimetableEntry -> Faculty / Subject / Batch

The graph will later support GraphRAG and Agentic AI.

Therefore:
- use meaningful relationships
- avoid unnecessary duplication
- maintain historical academic context
- keep assessment functionality extensible
- keep role/profile separation
- design for future graph traversal

============================================================
1. NODE MODEL
============================================================

Implement the following node labels.

--------------------------------
IDENTITY
--------------------------------

User
Role

Student
Faculty
Admin
TransportStaff
PlacementOfficer
ClubCoordinator

--------------------------------
ACADEMIC
--------------------------------

AcademicYear
Term
Batch
Department
Course
AcademicSemester
Subject

--------------------------------
EXAMINATION
--------------------------------

ExaminationSession
Examination
Result

--------------------------------
TIMETABLE
--------------------------------

TimetableEntry
TimeSlot
Room

--------------------------------
FUTURE-READY ASSESSMENT
--------------------------------

Assessment
Question
Submission
Skill
Topic

IMPORTANT:

Assessment, Question, Submission, Skill and Topic are future-ready entities.

Create their schema only if the implementation is structured so that they do not interfere with the current academic implementation.

Do not implement AI assessment logic yet.

============================================================
2. USER NODE
============================================================

Every person in the institution must have exactly one User identity node.

User contains information common to all institutional users.

Recommended properties:

User
{
    userId,
    username,
    firstName,
    middleName,
    lastName,
    fullName,
    dateOfBirth,
    gender,
    bloodGroup,

    email,
    phone,
    alternatePhone,

    profilePhoto,

    addressLine1,
    addressLine2,
    city,
    district,
    state,
    country,
    postalCode,

    emergencyContactName,
    emergencyContactRelation,
    emergencyContactPhone,

    passwordHash,

    isActive,
    status,

    createdAt,
    updatedAt,
    lastLoginAt
}

Rules:

- userId must be unique.
- email should be unique where institutional policy requires it.
- password must NEVER be stored in plaintext.
- User must not contain role-specific academic fields such as registerNumber or employeeId.
- User is the common identity node.
- Role/profile information is represented through relationships.

Do not store duplicate student/faculty data on User.

============================================================
3. ROLE NODE
============================================================

Role
{
    roleId,
    name,
    description
}

Expected roles:

STUDENT
FACULTY
ADMIN
TRANSPORT_STAFF
PLACEMENT_OFFICER
CLUB_COORDINATOR

A user can have multiple roles.

Relationship:

(User)-[:HAS_ROLE]->(Role)

Example:

(User)-[:HAS_ROLE]->(Role {name: "FACULTY"})

A faculty member may also be:

(User)-[:HAS_ROLE]->(Role {name: "PLACEMENT_OFFICER"})

Do not assume one User = one Role.

============================================================
4. PROFILE NODES
============================================================

A User may have one or more institutional profiles.

Relationships:

(User)-[:HAS_PROFILE]->(Student)
(User)-[:HAS_PROFILE]->(Faculty)
(User)-[:HAS_PROFILE]->(Admin)
(User)-[:HAS_PROFILE]->(TransportStaff)
(User)-[:HAS_PROFILE]->(PlacementOfficer)
(User)-[:HAS_PROFILE]->(ClubCoordinator)

The profile contains role-specific information.

============================================================
5. STUDENT NODE
============================================================

Student
{
    studentId,

    registerNumber,
    rollNumber,
    admissionNumber,

    admissionDate,
    admissionCategory,
    studentType,

    currentCGPA,
    currentArrears,

    graduationYear,

    status,

    createdAt,
    updatedAt
}

Possible studentType values:

REGULAR
LATERAL_ENTRY
TRANSFER
EXCHANGE

Do not store department, batch, course or semester as authoritative properties here.

Those must be relationships.

Student relationships:

(Student)-[:BELONGS_TO]->(Batch)
(Student)-[:BELONGS_TO]->(Department)
(Student)-[:ENROLLED_IN]->(Course)
(Student)-[:CURRENTLY_IN]->(AcademicSemester)
(Student)-[:STUDIES]->(Subject)

Only create direct Student -> Subject relationships when they represent an actual academic association.

============================================================
6. FACULTY NODE
============================================================

Faculty
{
    facultyId,
    employeeId,

    designation,
    qualification,
    specialization,

    joiningDate,
    employmentType,

    experienceYears,

    status,

    createdAt,
    updatedAt
}

Faculty relationships:

(Faculty)-[:BELONGS_TO]->(Department)

(Faculty)-[:TEACHES]->(Subject)

(Faculty)-[:ASSOCIATED_WITH]->(Course)

Do not store department or subject names as properties.

Use graph relationships.

============================================================
7. ADMIN / OTHER STAFF PROFILES
============================================================

Admin
{
    adminId,
    employeeId,
    designation,
    joiningDate,
    status
}

TransportStaff
{
    staffId,
    employeeId,
    designation,
    joiningDate,
    status
}

PlacementOfficer
{
    officerId,
    employeeId,
    designation,
    joiningDate,
    status
}

ClubCoordinator
{
    coordinatorId,
    employeeId,
    designation,
    joiningDate,
    status
}

These profiles may later receive additional domain-specific relationships.

Do not invent unnecessary properties.

============================================================
8. ACADEMIC YEAR
============================================================

AcademicYear
{
    academicYearId,
    label,
    startYear,
    endYear,
    startDate,
    endDate,
    status
}

Example:

{
    academicYearId: "AY2026",
    label: "2026-27",
    startYear: 2026,
    endYear: 2027
}

Relationship:

(AcademicYear)-[:HAS_TERM]->(Term)

============================================================
9. TERM
============================================================

Term represents the odd/even academic period.

Term
{
    termId,
    name,
    type,
    startDate,
    endDate,
    status
}

Allowed type values:

ODD
EVEN

Relationships:

(AcademicYear)-[:HAS_TERM]->(Term)

(Term)-[:FOR_BATCH]->(Batch)

Do not store ODD/EVEN only as a property on Batch.

It is an academic period.

============================================================
10. BATCH
============================================================

Batch is a major graph anchor.

Batch
{
    batchId,
    batchName,
    admissionYear,
    graduationYear,
    startYear,
    endYear,
    status
}

Example:

{
    batchId: "CSE-2023",
    batchName: "2023-2027",
    admissionYear: 2023,
    graduationYear: 2027
}

Relationships:

(Student)-[:BELONGS_TO]->(Batch)

(Term)-[:FOR_BATCH]->(Batch)

(Batch)-[:ASSOCIATED_WITH]->(Department)

(Batch)-[:FOR_COURSE]->(Course)

(Batch)-[:HAS_SEMESTER]->(AcademicSemester)

(Batch)-[:HAS_EXAMINATION_SESSION]->(ExaminationSession)

The exact use of ASSOCIATED_WITH / FOR_COURSE may be refined during implementation if a more precise relationship is required.

Do not duplicate batch information inside Student.

============================================================
11. DEPARTMENT
============================================================

Department
{
    departmentId,
    code,
    name,
    shortName,
    description,

    hodName,

    officeEmail,
    officePhone,
    location,

    status,

    createdAt,
    updatedAt
}

Relationships:

(Student)-[:BELONGS_TO]->(Department)

(Faculty)-[:BELONGS_TO]->(Department)

(Department)-[:OFFERS]->(Course)

(Department)-[:HAS_BATCH]->(Batch)

Do not store student lists or faculty lists as properties.

============================================================
12. COURSE
============================================================

Course represents the academic programme.

Course
{
    courseId,
    courseCode,
    courseName,
    degree,
    durationYears,
    totalSemesters,
    description,
    status
}

Example:

{
    courseCode: "BE-CSE",
    courseName: "Computer Science and Engineering",
    degree: "B.E."
}

Relationships:

(Department)-[:OFFERS]->(Course)

(Student)-[:ENROLLED_IN]->(Course)

(Faculty)-[:ASSOCIATED_WITH]->(Course)

(Batch)-[:FOR_COURSE]->(Course)

(Course)-[:HAS_SEMESTER]->(AcademicSemester)

============================================================
13. ACADEMIC SEMESTER
============================================================

Use AcademicSemester rather than a generic Semester node.

Reason:

"Semester 7" is a curriculum concept.

"Semester 7, Odd Term, Academic Year 2026-27" is an actual academic occurrence.

AcademicSemester
{
    academicSemesterId,
    semesterNumber,
    name,
    startDate,
    endDate,
    status
}

Example:

{
    academicSemesterId: "AY2026-27-ODD-CSE-SEM7",
    semesterNumber: 7,
    name: "Semester 7"
}

Relationships:

(Course)-[:HAS_SEMESTER]->(AcademicSemester)

(Batch)-[:HAS_SEMESTER]->(AcademicSemester)

(Student)-[:CURRENTLY_IN]->(AcademicSemester)

(AcademicSemester)-[:HAS_SUBJECT]->(Subject)

(AcademicSemester)-[:HAS_EXAMINATION_SESSION]->(ExaminationSession)

(AcademicSemester)-[:HAS_TIMETABLE_ENTRY]->(TimetableEntry)

AcademicSemester should be associated with the relevant AcademicYear and Term.

Use:

(AcademicSemester)-[:IN_ACADEMIC_YEAR]->(AcademicYear)

(AcademicSemester)-[:IN_TERM]->(Term)

This makes historical academic traversal explicit.

============================================================
14. SUBJECT
============================================================

Subject
{
    subjectId,
    subjectCode,
    name,
    shortName,
    credits,
    type,
    category,
    maxMarks,
    description,
    status
}

Possible type values:

THEORY
LAB
PROJECT
ELECTIVE
AUDIT
VALUE_ADDED

Relationships:

(AcademicSemester)-[:HAS_SUBJECT]->(Subject)

(Faculty)-[:TEACHES]->(Subject)

(Student)-[:STUDIES]->(Subject)

(Examination)-[:FOR_SUBJECT]->(Subject)

(Result)-[:FOR_SUBJECT]->(Subject)

(TimetableEntry)-[:FOR_SUBJECT]->(Subject)

============================================================
15. EXAMINATION SESSION
============================================================

ExaminationSession represents a group/session such as:

Internal 1
Internal 2
Model Exam
End Semester
Supplementary

ExaminationSession
{
    examSessionId,
    name,
    examType,
    startDate,
    endDate,
    status
}

Allowed examType examples:

INTERNAL
MODEL
END_SEMESTER
SUPPLEMENTARY
OTHER

Relationships:

(Batch)-[:HAS_EXAMINATION_SESSION]->(ExaminationSession)

(AcademicSemester)-[:HAS_EXAMINATION_SESSION]->(ExaminationSession)

(ExaminationSession)-[:HAS_EXAM]->(Examination)

============================================================
16. EXAMINATION
============================================================

Examination represents a specific subject examination.

Examination
{
    examId,
    examName,
    examType,
    examDate,
    startTime,
    endTime,
    maxMarks,
    durationMinutes,
    status
}

Relationships:

(ExaminationSession)-[:HAS_EXAM]->(Examination)

(Examination)-[:FOR_SUBJECT]->(Subject)

(Examination)-[:FOR_BATCH]->(Batch)

(Examination)-[:HELD_IN]->(Room)

Potential future:

(Examination)-[:CONDUCTED_BY]->(Faculty)

Do not add CONDUCTED_BY unless actual data requires it.

============================================================
17. RESULT
============================================================

Result is the student's result for a particular examination/subject.

Result
{
    resultId,

    marks,
    maxMarks,
    percentage,

    grade,
    gradePoint,

    status,

    attemptNumber,

    publishedAt,

    createdAt,
    updatedAt
}

Relationships:

(Student)-[:HAS_RESULT]->(Result)

(Result)-[:FOR_EXAM]->(Examination)

(Result)-[:FOR_SUBJECT]->(Subject)

Result must NOT be stored as properties directly on Student.

Result must NOT be stored as properties directly on Subject.

This allows multiple students and multiple examinations for the same subject.

============================================================
18. EXISTING -1 MARK CONVENTION
============================================================

The current source data uses -1 to represent marks that are unavailable/not entered/not applicable.

Preserve this convention during initial data ingestion.

Example:

Result {
    marks: -1
}

means the mark is currently unavailable.

Do not reinterpret -1 as zero.

Do not convert -1 to null during the initial migration unless explicitly instructed.

The graph structure must still identify which examination the result belongs to.

Therefore:

Student
  -> HAS_RESULT
  -> Result { marks: -1 }
  -> FOR_EXAM
  -> Internal 2 Examination
  -> FOR_SUBJECT
  -> AI

This is preferred over:

Student -> Subject { internal2: -1 }

============================================================
19. TIMETABLE
============================================================

Timetable is a first-class graph domain.

Do NOT create a separate disconnected timetable structure.

It must connect to existing academic nodes.

Main nodes:

TimetableEntry
TimeSlot
Room

============================================================
20. TIMETABLE ENTRY
============================================================

TimetableEntry represents one scheduled class.

TimetableEntry
{
    timetableEntryId,

    dayOfWeek,
    periodNumber,

    startTime,
    endTime,

    classType,

    effectiveFrom,
    effectiveTo,

    status,

    createdAt,
    updatedAt
}

Possible classType values:

THEORY
LAB
TUTORIAL
PROJECT
SEMINAR
OTHER

Relationships:

(TimetableEntry)-[:FOR_BATCH]->(Batch)

(TimetableEntry)-[:FOR_COURSE]->(Course)

(TimetableEntry)-[:FOR_SEMESTER]->(AcademicSemester)

(TimetableEntry)-[:FOR_SUBJECT]->(Subject)

(TimetableEntry)-[:TAUGHT_BY]->(Faculty)

(TimetableEntry)-[:OCCURS_AT]->(TimeSlot)

(TimetableEntry)-[:HELD_IN]->(Room)

(TimetableEntry)-[:IN_ACADEMIC_YEAR]->(AcademicYear)

(TimetableEntry)-[:IN_TERM]->(Term)

These direct contextual relationships are intentional.

Do not assume the system must traverse Course -> Semester -> Subject every time a timetable query is made.

============================================================
21. TIME SLOT
============================================================

TimeSlot
{
    timeSlotId,
    periodNumber,
    name,
    startTime,
    endTime,
    durationMinutes,
    status
}

Example:

{
    periodNumber: 3,
    startTime: "10:15",
    endTime: "11:05"
}

Relationship:

(TimetableEntry)-[:OCCURS_AT]->(TimeSlot)

============================================================
22. ROOM
============================================================

Room
{
    roomId,
    roomNumber,
    building,
    floor,
    roomType,
    capacity,
    location,
    status
}

Possible roomType:

CLASSROOM
LAB
SEMINAR_HALL
AUDITORIUM
OTHER

Relationship:

(TimetableEntry)-[:HELD_IN]->(Room)

============================================================
23. TIMETABLE QUERY REQUIREMENTS
============================================================

The graph must support:

1. Student -> today's timetable

Traversal:

Student
 -> Batch
 -> TimetableEntry
 -> TimeSlot
 -> Subject
 -> Faculty
 -> Room

2. Faculty -> today's timetable

Faculty
 -> TimetableEntry
 -> Subject
 -> Batch
 -> Room
 -> TimeSlot

3. Batch -> timetable

Batch
 -> TimetableEntry
 -> Subject
 -> Faculty
 -> Room
 -> TimeSlot

4. Room -> timetable

Room
 -> TimetableEntry
 -> Subject
 -> Faculty
 -> Batch

5. Subject -> timetable

Subject
 -> TimetableEntry
 -> Faculty
 -> Batch
 -> Room
 -> TimeSlot

6. Department -> faculty timetable

Department
 -> Faculty
 -> TimetableEntry

============================================================
24. FUTURE ASSESSMENT MODEL
============================================================

Design future-ready nodes:

Assessment
Question
Submission
Skill
Topic

Do not implement complex AI assessment logic now.

Potential future relationships:

(Assessment)-[:FOR_SUBJECT]->(Subject)

(Assessment)-[:FOR_SEMESTER]->(AcademicSemester)

(Assessment)-[:CONTAINS]->(Question)

(Question)-[:TESTS]->(Topic)

(Question)-[:MEASURES]->(Skill)

(Student)-[:ATTEMPTED]->(Assessment)

(Student)-[:SUBMITTED]->(Submission)

(Submission)-[:FOR_ASSESSMENT]->(Assessment)

(Submission)-[:ANSWERS]->(Question)

(Student)-[:HAS_SKILL]->(Skill)

(Student)-[:WEAK_IN]->(Topic)

These relationships will support later GraphRAG/Agentic AI.

============================================================
25. SKILL AND TOPIC
============================================================

Skill
{
    skillId,
    name,
    category,
    description
}

Topic
{
    topicId,
    name,
    description
}

Future relationships may include:

(Subject)-[:COVERS]->(Topic)

(Topic)-[:REQUIRES]->(Topic)

(Question)-[:TESTS]->(Topic)

(Question)-[:MEASURES]->(Skill)

(Student)-[:HAS_SKILL]->(Skill)

Do not create arbitrary skill relationships now without source data.

============================================================
26. IMPORTANT RELATIONSHIP DESIGN PRINCIPLE
============================================================

Do not create both directions of the same relationship unless there is a specific technical reason.

For example, use:

(Student)-[:BELONGS_TO]->(Batch)

Do not additionally create:

(Batch)-[:HAS_STUDENT]->(Student)

Neo4j can traverse relationships in either direction.

Similarly:

(Faculty)-[:TEACHES]->(Subject)

can be traversed backwards:

Subject <-[:TEACHES]- Faculty

This avoids duplicated relationships.

============================================================
27. GRAPH SOURCE OF TRUTH
============================================================

Use relationships as the source of truth for academic associations.

Avoid duplicated properties such as:

Student {
    department: "CSE",
    course: "B.E. CSE",
    batch: "2023",
    semester: 7
}

Instead:

Student
  -> BELONGS_TO -> Department
  -> BELONGS_TO -> Batch
  -> ENROLLED_IN -> Course
  -> CURRENTLY_IN -> AcademicSemester

The Student properties should contain only student-specific information.

============================================================
28. NODE IDENTIFIERS
============================================================

Every major node must have a stable domain identifier.

Recommended:

User.userId
Role.roleId

Student.studentId
Faculty.facultyId
Admin.adminId
TransportStaff.staffId
PlacementOfficer.officerId
ClubCoordinator.coordinatorId

AcademicYear.academicYearId
Term.termId
Batch.batchId
Department.departmentId
Course.courseId
AcademicSemester.academicSemesterId
Subject.subjectId

ExaminationSession.examSessionId
Examination.examId
Result.resultId

TimetableEntry.timetableEntryId
TimeSlot.timeSlotId
Room.roomId

Assessment.assessmentId
Question.questionId
Submission.submissionId
Skill.skillId
Topic.topicId

Never rely only on Neo4j internal element IDs as application identifiers.

============================================================
29. NEO4J CONSTRAINTS
============================================================

Create uniqueness constraints for all stable domain identifiers.

At minimum:

User.userId
Role.roleId

Student.studentId
Faculty.facultyId
Admin.adminId
TransportStaff.staffId
PlacementOfficer.officerId
ClubCoordinator.coordinatorId

AcademicYear.academicYearId
Term.termId
Batch.batchId
Department.departmentId
Course.courseId
AcademicSemester.academicSemesterId
Subject.subjectId

ExaminationSession.examSessionId
Examination.examId
Result.resultId

TimetableEntry.timetableEntryId
TimeSlot.timeSlotId
Room.roomId

Assessment.assessmentId
Question.questionId
Submission.submissionId
Skill.skillId
Topic.topicId

Also create an appropriate uniqueness constraint for User.email if institutional requirements guarantee uniqueness.

Do not blindly assume optional email values are always present.

============================================================
30. INDEXES
============================================================

Create indexes for frequently queried fields.

Recommended:

Student.registerNumber
Student.rollNumber
Student.admissionNumber

Faculty.employeeId

Department.code
Department.name

Course.courseCode
Course.courseName

Subject.subjectCode
Subject.name

Batch.batchName
Batch.admissionYear

AcademicSemester.semesterNumber

TimetableEntry.dayOfWeek
TimetableEntry.periodNumber

Room.roomNumber

Examination.examDate
Examination.examType

Result.status

Use Neo4j-supported index syntax appropriate to the installed Neo4j version.

Do not create indexes for every property.

============================================================
31. SEED / REFERENCE DATA
============================================================

Create a controlled seed process for reference data.

Seed:

Roles:

STUDENT
FACULTY
ADMIN
TRANSPORT_STAFF
PLACEMENT_OFFICER
CLUB_COORDINATOR

Do NOT create fake students, faculty, marks, departments or courses unless explicitly instructed.

The project will later receive real/source data.

============================================================
32. SEED SCRIPT DESIGN
============================================================

Create a script structure such as:

scripts/
    seed/
    migration/
    validation/

The first seed script should only create reference data and optionally a small development dataset if explicitly enabled.

Never mix test data with production data.

============================================================
33. DATA IMPORT PRINCIPLES
============================================================

When actual student/institution data is provided later:

1. Normalize the source data.
2. Create/reuse User nodes.
3. Create profile nodes.
4. Create academic nodes.
5. Create relationships.
6. Create examination entities.
7. Create results.
8. Create timetable entities.
9. Validate relationship consistency.
10. Never create duplicate nodes for the same domain identifier.

Use MERGE carefully.

Do not use MERGE on huge composite patterns if it could unintentionally create partial duplicate structures.

Prefer:

MATCH/MERGE individual entities
then CREATE/MERGE relationships.

============================================================
34. DUPLICATE PREVENTION
============================================================

The migration/import layer must be idempotent.

Running the same seed/import twice must NOT create:

- duplicate users
- duplicate students
- duplicate faculty
- duplicate departments
- duplicate courses
- duplicate subjects
- duplicate batches
- duplicate semesters
- duplicate timetable entries
- duplicate examinations
- duplicate results

Use stable identifiers and uniqueness constraints.

============================================================
35. HISTORICAL DATA
============================================================

The graph must support multiple academic years.

Do not overwrite old semester information when a new academic year begins.

Example:

2025-26
  -> ODD
  -> EVEN

2026-27
  -> ODD
  -> EVEN

Students can have historical AcademicSemester relationships.

Current semester is represented by:

(Student)-[:CURRENTLY_IN]->(AcademicSemester)

Historical academic relationships should remain available.

Do not delete old academic records simply because they are no longer current.

============================================================
36. CURRENT VS HISTORICAL
============================================================

Use relationships/status to distinguish current data.

For example:

(Student)-[:CURRENTLY_IN]->(AcademicSemester)

For historical results:

(Student)-[:HAS_RESULT]->(Result)

The Result identifies its Examination and Subject.

For timetable:

TimetableEntry.effectiveFrom
TimetableEntry.effectiveTo
TimetableEntry.status

This allows timetable changes without destroying historical records.

============================================================
37. TIMETABLE CONSISTENCY RULES
============================================================

The application should validate:

- A timetable entry must have a batch.
- A timetable entry must have a subject.
- A timetable entry must have a faculty member.
- A timetable entry must have a time slot.
- A timetable entry should have a room where applicable.
- The subject must belong to the relevant academic semester/course.
- Faculty should be associated with the relevant subject.
- The timetable must belong to an academic year and term.

Do not rely only on Neo4j constraints for these business rules.

Validate them in the service layer.

============================================================
38. EXAMINATION CONSISTENCY RULES
============================================================

Validate:

- Examination belongs to an ExaminationSession.
- Examination belongs to a Subject.
- Examination belongs to a Batch.
- Examination belongs to the appropriate academic semester.
- Result belongs to a Student.
- Result belongs to an Examination.
- Result belongs to a Subject.
- Result marks must not be interpreted as zero when value = -1.

============================================================
39. GRAPH EXAMPLES THAT MUST WORK
============================================================

After implementation, create validation queries for:

A. Get student academic profile.

Student
 -> User
 -> Batch
 -> Department
 -> Course
 -> AcademicSemester
 -> Subjects

B. Get student's current timetable.

Student
 -> Batch
 -> today's TimetableEntry
 -> Subject
 -> Faculty
 -> Room
 -> TimeSlot

C. Get faculty timetable.

Faculty
 -> TimetableEntry
 -> Subject
 -> Batch
 -> Room
 -> TimeSlot

D. Get all students in a batch.

Batch
 <- BELONGS_TO - Student

E. Get all faculty teaching a subject.

Subject
 <- TEACHES - Faculty

F. Get all subjects in a semester.

AcademicSemester
 -> HAS_SUBJECT
 -> Subject

G. Get examination results for a student.

Student
 -> HAS_RESULT
 -> Result
 -> Examination
 -> Subject

H. Get Internal 2 results for a batch.

Batch
 -> HAS_EXAMINATION_SESSION
 -> ExaminationSession
 -> HAS_EXAM
 -> Examination
 <- FOR_EXAM
 <- Result
 <- HAS_RESULT
 <- Student

I. Get top students.

Filter students by batch/department/subject/examination,
aggregate Result.marks,
sort descending,
limit results.

The aggregation must happen in Neo4j, not inside the LLM.

============================================================
40. GRAPH DESIGN FOR FUTURE AI
============================================================

The graph will eventually become the knowledge layer for Agentic AI.

Future agent queries may include:

"Who are the top 10 students in CSE?"

"Which students have not completed Internal 2?"

"Which students are weak in DSA?"

"Who teaches the subject I have tomorrow?"

"Which faculty teach students in this batch?"

"Which students are eligible for a placement based on skills?"

"Why is this student's performance declining?"

"Generate an assessment for students weak in Topic X."

The database must therefore preserve meaningful relationships between:

Users
Students
Faculty
Departments
Courses
Batches
Semesters
Subjects
Timetables
Examinations
Results

============================================================
41. DO NOT ADD AI LOGIC NOW
============================================================

Do NOT install:

LangChain
LangGraph
OpenAI SDK
Ollama
Qdrant
Pinecone
embedding libraries

unless explicitly instructed.

The first implementation is a graph/database foundation.

The AI layer will be built later.

============================================================
42. NODE.JS REPOSITORY ARCHITECTURE
============================================================

The backend must follow:

Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Neo4j

Repositories contain Cypher.

Services contain business logic.

Controllers handle HTTP.

Routes define endpoints.

Do not put Cypher directly into route files.

Do not expose Neo4j directly to the frontend.

============================================================
43. RECOMMENDED REPOSITORIES
============================================================

Initially create:

user.repository.js
student.repository.js
faculty.repository.js
academic.repository.js
timetable.repository.js
examination.repository.js
result.repository.js

Do not create repositories for unused future modules.

============================================================
44. DATABASE TRANSACTION RULE
============================================================

When creating connected academic data that must succeed together, use Neo4j transactions.

For example:

Creating a timetable entry may involve:

TimetableEntry
Batch
Course
AcademicSemester
Subject
Faculty
TimeSlot
Room

Do not leave the graph half-created if a required operation fails.

============================================================
45. VALIDATION
============================================================

Create a database validation script.

It should verify:

- required constraints exist
- required indexes exist
- reference roles exist
- no duplicate domain IDs
- students have profiles
- faculty have profiles
- students have batches
- students have courses
- academic semesters belong to academic years/terms
- timetable entries have required relationships
- results have required relationships

Output a clear validation report.

============================================================
46. DATABASE RESET
============================================================

Create a DEVELOPMENT-ONLY database reset mechanism.

It must require an explicit environment flag such as:

ALLOW_DATABASE_RESET=true

Never allow accidental production deletion.

Do not create an unrestricted DELETE-all endpoint.

============================================================
47. DOCUMENTATION
============================================================

Create:

docs/
    graph-model.md
    relationships.md
    constraints-and-indexes.md
    data-import.md
    query-examples.md

graph-model.md must contain the node model.

relationships.md must contain all canonical relationships.

constraints-and-indexes.md must document every constraint and index.

data-import.md must describe how real institutional data should be imported.

query-examples.md must contain representative Cypher queries.

============================================================
48. FINAL GRAPH MODEL
============================================================

The final initial graph should conceptually look like:

                          User
                           │
                    ┌──────┴───────┐
                    │              │
              HAS_PROFILE       HAS_ROLE
                    │              │
          ┌─────────┼───────┐      ▼
          ▼         ▼       ▼     Role
       Student   Faculty   Admin
          │         │
          │         ├──────────────→ Department
          │         │
          │         └──────────────→ Subject
          │
          ├────────────→ Batch
          ├────────────→ Department
          ├────────────→ Course
          ├────────────→ AcademicSemester
          ├────────────→ Subject
          └────────────→ Result
                              │
                         ┌────┴─────┐
                         ▼          ▼
                   Examination   Subject


AcademicYear
      │
   HAS_TERM
      ▼
     Term
      │
   FOR_BATCH
      ▼
     Batch
      │
      ├────────────→ Course
      │                 │
      │                 ▼
      │          AcademicSemester
      │                 │
      │                 ▼
      │              Subject
      │
      ├────────────→ ExaminationSession
      │                 │
      │                 ▼
      │             Examination
      │
      └────────────→ TimetableEntry
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
         Subject        Faculty         Room
                           │
                         TEACHES
                           │
                           ▼
                        Subject

TimetableEntry
      │
      └── OCCURS_AT → TimeSlot


Future:

Student
   │
   └── ATTEMPTED → Assessment
                       │
                       ├── CONTAINS → Question
                       ├── FOR_SUBJECT → Subject
                       └── ...
============================================================
49. IMPLEMENTATION ORDER

Implement in this order:

PHASE 1
Neo4j connection and configuration

PHASE 2
Constraints and indexes

PHASE 3
User + Role + Profiles

PHASE 4
AcademicYear + Term + Batch

PHASE 5
Department + Course

PHASE 6
AcademicSemester + Subject

PHASE 7
Student/Faculty academic relationships

PHASE 8
ExaminationSession + Examination + Result

PHASE 9
TimeSlot + Room + TimetableEntry

PHASE 10
Validation queries

PHASE 11
Seed/reference data

PHASE 12
Documentation

Do not proceed to AI/GraphRAG.

============================================================
50. ACCEPTANCE CRITERIA

The implementation is accepted only if:

Neo4j starts and connects successfully.
All required uniqueness constraints exist.
Required indexes exist.
Reference roles can be seeded.
User and profile nodes can be created.
Student can connect to Batch, Department, Course and AcademicSemester.
Faculty can connect to Department, Course and Subject.
AcademicYear -> Term -> Batch structure works.
Course -> AcademicSemester -> Subject structure works.
ExaminationSession -> Examination -> Subject structure works.
Student -> Result -> Examination -> Subject works.
-1 marks are preserved correctly.
TimetableEntry connects Batch, Course, Semester, Subject, Faculty, TimeSlot and Room.
Student timetable traversal works.
Faculty timetable traversal works.
Batch timetable traversal works.
Examination result traversal works.
Historical academic years can coexist.
Running seed/import repeatedly does not duplicate entities.
No MongoDB/Redis/Kafka/vector DB/AI infrastructure is introduced.
The database is ready for future GraphRAG and Agentic AI.
All Cypher queries are kept in repository/database layers.
The graph remains the source of truth for academic relationships.
============================================================
IMPORTANT FINAL RULE

Do not invent missing institutional requirements.

If a field is not known from the supplied data/domain requirements, make it optional or leave it out.

Do not create fake production data.

Do not silently change the meaning of existing fields.

Do not convert -1 marks to zero.

Do not flatten graph relationships into redundant properties.

Do not implement future AI functionality until explicitly instructed.

Build the Neo4j foundation first.


## One architectural decision I would keep

The most important part of this design is that we're **not making `Student` the center of the entire database**.

We're building a campus graph where every important entity can become an entry point:

```text
Student
Faculty
Department
Batch
Course
Semester
Subject
Timetable
Room
Examination
Result

For example:

Student
   ↕
Batch
   ↕
TimetableEntry
   ↕
Subject
   ↕
Faculty

and:

Batch
   ↕
Examination
   ↕
Result
   ↕
Student

This is exactly what will make the later AI layer useful: an agent can start from whatever entity is relevant and traverse the graph rather than retrieving an enormous collection of unrelated student records.