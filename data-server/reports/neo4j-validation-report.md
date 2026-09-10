# CampusOne Neo4j Graph Validation Report

## Executive Summary
- **Database Status**: `online`
- **Total Nodes**: **63** (ClassSections: **1**)
- **Total Relationships**: **165**
- **Authentication Users**: **3** (Valid Argon2id Hashes: **3**)
- **Missing Password Hashes**: **0**
- **Plaintext Passwords Stored**: **0**
- **Duplicate Domain IDs**: **0**
- **Duplicate Relationships**: **0**
- **Agentic AI Question Coverage**: **43 / 43**
- **Final Status**: **PASS WITH WARNINGS**

## Authentication Security Report
- **Total Login Users**: 3
- **Argon2id Password Hashes**: 3
- **Missing Password Hashes**: 0
- **Invalid Password Hashes**: 0
- **Plaintext Password Properties**: 0
- **Password Properties Outside User**: 0

## ClassSection Specific Statistics
- **ClassSection Nodes**: **1**
- **HAS_SECTION Relationships**: **1**
- **MEMBER_OF Relationships**: **1**
- **HAS_ADVISOR Relationships**: **1**
- **FOR_SECTION Relationships**: **5**

## Node Counts
| Label | Count | Status |
|---|---:|---|
| User | 3 | PASS |
| Role | 3 | PASS |
| Student | 1 | PASS |
| Faculty | 1 | PASS |
| Admin | 1 | PASS |
| TransportStaff | 0 | PASS |
| PlacementOfficer | 0 | PASS |
| ClubCoordinator | 0 | PASS |
| AcademicYear | 1 | PASS |
| Term | 1 | PASS |
| Batch | 1 | PASS |
| ClassSection | 1 | PASS |
| Department | 1 | PASS |
| Course | 5 | PASS |
| AcademicSemester | 1 | PASS |
| Subject | 5 | PASS |
| ExaminationSession | 2 | PASS |
| Examination | 6 | PASS |
| Result | 6 | PASS |
| TimetableEntry | 5 | PASS |
| TimeSlot | 5 | PASS |
| Room | 3 | PASS |
| Assessment | 1 | PASS |
| Question | 3 | PASS |
| Submission | 1 | PASS |
| Skill | 3 | PASS |
| Topic | 3 | PASS |

## Relationship Counts
| Relationship Type | Count |
|---|---:|
| ASSOCIATED_WITH | 12 |
| BELONGS_TO | 2 |
| CONTAINS | 3 |
| CURRENTLY_IN | 1 |
| FOR_ASSESSMENT | 1 |
| FOR_BATCH | 11 |
| FOR_COURSE | 11 |
| FOR_EXAM | 6 |
| FOR_SECTION | 5 |
| FOR_SEMESTER | 14 |
| FOR_SUBJECT | 18 |
| HAS_ADVISOR | 1 |
| HAS_EXAM | 6 |
| HAS_EXAMINATION_SESSION | 2 |
| HAS_PROFILE | 3 |
| HAS_RESULT | 6 |
| HAS_ROLE | 3 |
| HAS_SECTION | 1 |
| HAS_SEMESTER | 2 |
| HAS_SKILL | 1 |
| HAS_SUBJECT | 5 |
| HELD_IN | 11 |
| IN_ACADEMIC_YEAR | 6 |
| IN_TERM | 6 |
| MEASURES | 3 |
| MEMBER_OF | 1 |
| OCCURS_AT | 5 |
| STUDIES | 5 |
| SUBMITTED | 1 |
| TAUGHT_BY | 5 |
| TEACHES | 5 |
| TESTS | 3 |

## Known Synthetic Data Warnings
1. Missing `fac2` reference in synthetic CSV files (`faculty_subjects.csv`, `timetable_entries.csv`).
2. Timetable faculty conflicts (0) due to single faculty ID `fac1` reuse across demo schedules.
3. `ADVISOR_FOR` relationship legacy/skipped.
4. `WEAK_IN` relationship skipped (0 assessment submission scores < 50%).

## Final Status
### PASS WITH WARNINGS
