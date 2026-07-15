const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Timetable = require("../models/Timetable");
const BusRoute = require("../models/BusRoute");
const BusLocation = require("../models/BusLocation");
const LeaderboardEntry = require("../models/LeaderboardEntry");
const ChatHistory = require("../models/ChatHistory");
const Complaint = require("../models/Complaint");

// Database Connection URI
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/campusone";

const studentsData = [
  {
    rollNumber: "23CS001",
    name: "Aadhisesan P",
    email: "23cs001@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000001",
    parentPhoneNumber: "+918000000001",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "aadhisesan_p_lc",
      codeforces: "aadhisesan_p_cf",
      github: "aadhisesan_p_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 273,
        ranking: 730,
        easyCount: 109,
        mediumCount: 137,
        hardCount: 27,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 35,
        totalStars: 12,
        followers: 18,
      },
    },
    leaderboardScore: 3255,
  },
  {
    rollNumber: "23CS002",
    name: "Abhishek Kunwar",
    email: "23cs002@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000002",
    parentPhoneNumber: "+918000000002",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "abhishek_kunwar_lc",
      codeforces: "abhishek_kunwar_cf",
      github: "abhishek_kunwar_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 0,
        ranking: 0,
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "-",
        maxRank: "-",
      },
      github: {
        publicRepos: 0,
        totalStars: 0,
        followers: 0,
      },
    },
    leaderboardScore: 0,
  },
  {
    rollNumber: "23CS003",
    name: "Abirami T",
    email: "23cs003@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000003",
    parentPhoneNumber: "+918000000003",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "abirami_t_lc",
      codeforces: "abirami_t_cf",
      github: "abirami_t_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 311,
        ranking: 641,
        easyCount: 124,
        mediumCount: 156,
        hardCount: 31,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 24,
        totalStars: 13,
        followers: 12,
      },
    },
    leaderboardScore: 3470,
  },
  {
    rollNumber: "23CS004",
    name: "Aditya V N",
    email: "23cs004@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000004",
    parentPhoneNumber: "+918000000004",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "aditya_v_n_lc",
      codeforces: "aditya_v_n_cf",
      github: "aditya_v_n_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 124,
        ranking: 1600,
        easyCount: 50,
        mediumCount: 62,
        hardCount: 12,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 31,
        totalStars: 13,
        followers: 16,
      },
    },
    leaderboardScore: 1705,
  },
  {
    rollNumber: "23CS005",
    name: "Agadeeshwaran D",
    email: "23cs005@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000005",
    parentPhoneNumber: "+918000000005",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "agadeeshwaran_d_lc",
      codeforces: "agadeeshwaran_d_cf",
      github: "agadeeshwaran_d_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 123,
        ranking: 1613,
        easyCount: 49,
        mediumCount: 62,
        hardCount: 12,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 10,
        totalStars: 3,
        followers: 5,
      },
    },
    leaderboardScore: 1380,
  },
  {
    rollNumber: "23CS006",
    name: "Aishwarya V",
    email: "23cs006@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000006",
    parentPhoneNumber: "+918000000006",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "aishwarya_v_lc",
      codeforces: "aishwarya_v_cf",
      github: "aishwarya_v_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 210,
        ranking: 948,
        easyCount: 84,
        mediumCount: 105,
        hardCount: 21,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 56,
        totalStars: 25,
        followers: 28,
      },
    },
    leaderboardScore: 2940,
  },
  {
    rollNumber: "23CS007",
    name: "Ajay K K",
    email: "23cs007@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000007",
    parentPhoneNumber: "+918000000007",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ajay_k_k_lc",
      codeforces: "ajay_k_k_cf",
      github: "ajay_k_k_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 638,
        ranking: 313,
        easyCount: 255,
        mediumCount: 319,
        hardCount: 64,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 27,
        totalStars: 17,
        followers: 14,
      },
    },
    leaderboardScore: 6785,
  },
  {
    rollNumber: "23CS008",
    name: "Ajayaravind P S",
    email: "23cs008@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000008",
    parentPhoneNumber: "+918000000008",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ajayaravind_p_s_lc",
      codeforces: "ajayaravind_p_s_cf",
      github: "ajayaravind_p_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 109,
        ranking: 1818,
        easyCount: 44,
        mediumCount: 55,
        hardCount: 11,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 16,
        totalStars: 8,
        followers: 8,
      },
    },
    leaderboardScore: 1330,
  },
  {
    rollNumber: "23CS009",
    name: "Akash Krishnan K",
    email: "23cs009@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000009",
    parentPhoneNumber: "+918000000009",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "akash_krishnan_k_lc",
      codeforces: "akash_krishnan_k_cf",
      github: "akash_krishnan_k_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 143,
        ranking: 1389,
        easyCount: 57,
        mediumCount: 72,
        hardCount: 14,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 10,
        totalStars: 6,
        followers: 5,
      },
    },
    leaderboardScore: 1580,
  },
  {
    rollNumber: "23CS010",
    name: "Akhshay T P",
    email: "23cs010@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000010",
    parentPhoneNumber: "+918000000010",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "akhshay_t_p_lc",
      codeforces: "akhshay_t_p_cf",
      github: "akhshay_t_p_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 101,
        ranking: 1961,
        easyCount: 40,
        mediumCount: 51,
        hardCount: 10,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 23,
        totalStars: 27,
        followers: 12,
      },
    },
    leaderboardScore: 1355,
  },
  {
    rollNumber: "23CS011",
    name: "Akshay P",
    email: "23cs011@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000011",
    parentPhoneNumber: "+918000000011",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "akshay_p_lc",
      codeforces: "akshay_p_cf",
      github: "akshay_p_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 147,
        ranking: 1351,
        easyCount: 59,
        mediumCount: 74,
        hardCount: 15,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "-",
        maxRank: "-",
      },
      github: {
        publicRepos: 13,
        totalStars: 4,
        followers: 7,
      },
    },
    leaderboardScore: 1665,
  },
  {
    rollNumber: "23CS012",
    name: "Ananthkishore S",
    email: "23cs012@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000012",
    parentPhoneNumber: "+918000000012",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ananthkishore_s_lc",
      codeforces: "ananthkishore_s_cf",
      github: "ananthkishore_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 129,
        ranking: 1538,
        easyCount: 52,
        mediumCount: 65,
        hardCount: 13,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 27,
        totalStars: 7,
        followers: 14,
      },
    },
    leaderboardScore: 1695,
  },
  {
    rollNumber: "23CS013",
    name: "Aneash K A",
    email: "23cs013@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000013",
    parentPhoneNumber: "+918000000013",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "aneash_k_a_lc",
      codeforces: "aneash_k_a_cf",
      github: "aneash_k_a_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 141,
        ranking: 1408,
        easyCount: 56,
        mediumCount: 71,
        hardCount: 14,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 25,
        totalStars: 9,
        followers: 13,
      },
    },
    leaderboardScore: 1785,
  },
  {
    rollNumber: "23CS014",
    name: "Angu Rakanisa S",
    email: "23cs014@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000014",
    parentPhoneNumber: "+918000000014",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "angu_rakanisa_s_lc",
      codeforces: "angu_rakanisa_s_cf",
      github: "angu_rakanisa_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 177,
        ranking: 1124,
        easyCount: 71,
        mediumCount: 89,
        hardCount: 18,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 27,
        totalStars: 8,
        followers: 14,
      },
    },
    leaderboardScore: 2175,
  },
  {
    rollNumber: "23CS015",
    name: "Aniroodh T V",
    email: "23cs015@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000015",
    parentPhoneNumber: "+918000000015",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "aniroodh_t_v_lc",
      codeforces: "aniroodh_t_v_cf",
      github: "aniroodh_t_v_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 231,
        ranking: 862,
        easyCount: 92,
        mediumCount: 116,
        hardCount: 23,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 29,
        totalStars: 9,
        followers: 15,
      },
    },
    leaderboardScore: 2745,
  },
  {
    rollNumber: "23CS016",
    name: "Anisha Dharshini A",
    email: "23cs016@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000016",
    parentPhoneNumber: "+918000000016",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "anisha_dharshini_a_lc",
      codeforces: "anisha_dharshini_a_cf",
      github: "anisha_dharshini_a_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 266,
        ranking: 749,
        easyCount: 106,
        mediumCount: 133,
        hardCount: 27,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 20,
        totalStars: 7,
        followers: 10,
      },
    },
    leaderboardScore: 2960,
  },
  {
    rollNumber: "23CS017",
    name: "Anto Shreya N",
    email: "23cs017@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000017",
    parentPhoneNumber: "+918000000017",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "anto_shreya_n_lc",
      codeforces: "anto_shreya_n_cf",
      github: "anto_shreya_n_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 149,
        ranking: 1333,
        easyCount: 60,
        mediumCount: 75,
        hardCount: 15,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 43,
        totalStars: 15,
        followers: 22,
      },
    },
    leaderboardScore: 2135,
  },
  {
    rollNumber: "23CS018",
    name: "Anushiya K",
    email: "23cs018@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000018",
    parentPhoneNumber: "+918000000018",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "anushiya_k_lc",
      codeforces: "anushiya_k_cf",
      github: "anushiya_k_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 547,
        ranking: 365,
        easyCount: 219,
        mediumCount: 274,
        hardCount: 55,
      },
      codeforces: {
        rating: 567,
        maxRating: 617,
        rank: "newbie",
        maxRank: "newbie",
      },
      github: {
        publicRepos: 37,
        totalStars: 11,
        followers: 19,
      },
    },
    leaderboardScore: 6705,
  },
  {
    rollNumber: "23CS019",
    name: "Aravinendh R",
    email: "23cs019@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000019",
    parentPhoneNumber: "+918000000019",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "aravinendh_r_lc",
      codeforces: "aravinendh_r_cf",
      github: "aravinendh_r_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 225,
        ranking: 885,
        easyCount: 90,
        mediumCount: 113,
        hardCount: 23,
      },
      codeforces: {
        rating: 646,
        maxRating: 696,
        rank: "newbie",
        maxRank: "newbie",
      },
      github: {
        publicRepos: 28,
        totalStars: 13,
        followers: 14,
      },
    },
    leaderboardScore: 3445,
  },
  {
    rollNumber: "23CS020",
    name: "Aravinthan V",
    email: "23cs020@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000020",
    parentPhoneNumber: "+918000000020",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "aravinthan_v_lc",
      codeforces: "aravinthan_v_cf",
      github: "aravinthan_v_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 109,
        ranking: 1818,
        easyCount: 44,
        mediumCount: 55,
        hardCount: 11,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 24,
        totalStars: 11,
        followers: 12,
      },
    },
    leaderboardScore: 1450,
  },
  {
    rollNumber: "23CS021",
    name: "Arun R",
    email: "23cs021@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000021",
    parentPhoneNumber: "+918000000021",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "arun_r_lc",
      codeforces: "arun_r_cf",
      github: "arun_r_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 193,
        ranking: 1031,
        easyCount: 77,
        mediumCount: 97,
        hardCount: 19,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 22,
        totalStars: 19,
        followers: 11,
      },
    },
    leaderboardScore: 2260,
  },
  {
    rollNumber: "23CS022",
    name: "Asath A",
    email: "23cs022@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000022",
    parentPhoneNumber: "+918000000022",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "asath_a_lc",
      codeforces: "asath_a_cf",
      github: "asath_a_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 70,
        ranking: 2817,
        easyCount: 28,
        mediumCount: 35,
        hardCount: 7,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 21,
        totalStars: 9,
        followers: 11,
      },
    },
    leaderboardScore: 1015,
  },
  {
    rollNumber: "23CS023",
    name: "Ashiq Ahamed N",
    email: "23cs023@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000023",
    parentPhoneNumber: "+918000000023",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ashiq_ahamed_n_lc",
      codeforces: "ashiq_ahamed_n_cf",
      github: "ashiq_ahamed_n_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 342,
        ranking: 583,
        easyCount: 137,
        mediumCount: 171,
        hardCount: 34,
      },
      codeforces: {
        rating: 953,
        maxRating: 1003,
        rank: "newbie",
        maxRank: "newbie",
      },
      github: {
        publicRepos: 79,
        totalStars: 68,
        followers: 40,
      },
    },
    leaderboardScore: 5749,
  },
  {
    rollNumber: "23CS024",
    name: "Ashiya Parveen",
    email: "23cs024@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000024",
    parentPhoneNumber: "+918000000024",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ashiya_parveen_lc",
      codeforces: "ashiya_parveen_cf",
      github: "ashiya_parveen_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 228,
        ranking: 873,
        easyCount: 91,
        mediumCount: 114,
        hardCount: 23,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 31,
        totalStars: 10,
        followers: 16,
      },
    },
    leaderboardScore: 2745,
  },
  {
    rollNumber: "23CS025",
    name: "Ashutosh Jairam S",
    email: "23cs025@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000025",
    parentPhoneNumber: "+918000000025",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ashutosh_jairam_s_lc",
      codeforces: "ashutosh_jairam_s_cf",
      github: "ashutosh_jairam_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 83,
        ranking: 2381,
        easyCount: 33,
        mediumCount: 42,
        hardCount: 8,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 11,
        totalStars: 4,
        followers: 6,
      },
    },
    leaderboardScore: 995,
  },
  {
    rollNumber: "23CS026",
    name: "Ashwin M",
    email: "23cs026@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000026",
    parentPhoneNumber: "+918000000026",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ashwin_m_lc",
      codeforces: "ashwin_m_cf",
      github: "ashwin_m_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 207,
        ranking: 962,
        easyCount: 83,
        mediumCount: 104,
        hardCount: 21,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 19,
        totalStars: 8,
        followers: 10,
      },
    },
    leaderboardScore: 2355,
  },
  {
    rollNumber: "23CS027",
    name: "Aswin Suriya C",
    email: "23cs027@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000027",
    parentPhoneNumber: "+918000000027",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "aswin_suriya_c_lc",
      codeforces: "aswin_suriya_c_cf",
      github: "aswin_suriya_c_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 209,
        ranking: 952,
        easyCount: 84,
        mediumCount: 105,
        hardCount: 21,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 27,
        totalStars: 16,
        followers: 14,
      },
    },
    leaderboardScore: 2495,
  },
  {
    rollNumber: "23CS029",
    name: "Balachandar B",
    email: "23cs029@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000028",
    parentPhoneNumber: "+918000000028",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "balachandar_b_lc",
      codeforces: "balachandar_b_cf",
      github: "balachandar_b_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 545,
        ranking: 366,
        easyCount: 218,
        mediumCount: 273,
        hardCount: 55,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 31,
        totalStars: 9,
        followers: 16,
      },
    },
    leaderboardScore: 5915,
  },
  {
    rollNumber: "23CS030",
    name: "Balasurya D",
    email: "23cs030@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000029",
    parentPhoneNumber: "+918000000029",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "balasurya_d_lc",
      codeforces: "balasurya_d_cf",
      github: "balasurya_d_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 224,
        ranking: 889,
        easyCount: 90,
        mediumCount: 112,
        hardCount: 22,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 34,
        totalStars: 15,
        followers: 17,
      },
    },
    leaderboardScore: 2750,
  },
  {
    rollNumber: "23CS031",
    name: "Barath S",
    email: "23cs031@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000030",
    parentPhoneNumber: "+918000000030",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "barath_s_lc",
      codeforces: "barath_s_cf",
      github: "barath_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 137,
        ranking: 1449,
        easyCount: 55,
        mediumCount: 69,
        hardCount: 14,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 19,
        totalStars: 8,
        followers: 10,
      },
    },
    leaderboardScore: 1655,
  },
  {
    rollNumber: "23CS032",
    name: "Barathkumar R",
    email: "23cs032@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000031",
    parentPhoneNumber: "+918000000031",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "barathkumar_r_lc",
      codeforces: "barathkumar_r_cf",
      github: "barathkumar_r_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 88,
        ranking: 2247,
        easyCount: 35,
        mediumCount: 44,
        hardCount: 9,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 17,
        totalStars: 5,
        followers: 9,
      },
    },
    leaderboardScore: 1135,
  },
  {
    rollNumber: "23CS033",
    name: "Bavanetha M R",
    email: "23cs033@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000032",
    parentPhoneNumber: "+918000000032",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "bavanetha_m_r_lc",
      codeforces: "bavanetha_m_r_cf",
      github: "bavanetha_m_r_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 644,
        ranking: 310,
        easyCount: 258,
        mediumCount: 322,
        hardCount: 64,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 67,
        totalStars: 70,
        followers: 34,
      },
    },
    leaderboardScore: 7445,
  },
  {
    rollNumber: "23CS034",
    name: "Benny Hinn L",
    email: "23cs034@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000033",
    parentPhoneNumber: "+918000000033",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "benny_hinn_l_lc",
      codeforces: "benny_hinn_l_cf",
      github: "benny_hinn_l_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 158,
        ranking: 1258,
        easyCount: 63,
        mediumCount: 79,
        hardCount: 16,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 35,
        totalStars: 19,
        followers: 18,
      },
    },
    leaderboardScore: 2105,
  },
  {
    rollNumber: "23CS035",
    name: "Bharathkumar M",
    email: "23cs035@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000034",
    parentPhoneNumber: "+918000000034",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "bharathkumar_m_lc",
      codeforces: "bharathkumar_m_cf",
      github: "bharathkumar_m_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 530,
        ranking: 377,
        easyCount: 212,
        mediumCount: 265,
        hardCount: 53,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 13,
        totalStars: 10,
        followers: 7,
      },
    },
    leaderboardScore: 5495,
  },
  {
    rollNumber: "23CS036",
    name: "Boobalan R S",
    email: "23cs036@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000035",
    parentPhoneNumber: "+918000000035",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "boobalan_r_s_lc",
      codeforces: "boobalan_r_s_cf",
      github: "boobalan_r_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 107,
        ranking: 1852,
        easyCount: 43,
        mediumCount: 54,
        hardCount: 11,
      },
      codeforces: {
        rating: 370,
        maxRating: 420,
        rank: "newbie",
        maxRank: "newbie",
      },
      github: {
        publicRepos: 15,
        totalStars: 7,
        followers: 8,
      },
    },
    leaderboardScore: 1739,
  },
  {
    rollNumber: "23CS037",
    name: "Boopathi V",
    email: "23cs037@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000036",
    parentPhoneNumber: "+918000000036",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "boopathi_v_lc",
      codeforces: "boopathi_v_cf",
      github: "boopathi_v_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 645,
        ranking: 310,
        easyCount: 258,
        mediumCount: 323,
        hardCount: 65,
      },
      codeforces: {
        rating: 634,
        maxRating: 684,
        rank: "newbie",
        maxRank: "newbie",
      },
      github: {
        publicRepos: 72,
        totalStars: 34,
        followers: 36,
      },
    },
    leaderboardScore: 8291,
  },
  {
    rollNumber: "23CS038",
    name: "Danush Siddarth K",
    email: "23cs038@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000037",
    parentPhoneNumber: "+918000000037",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "danush_siddarth_k_lc",
      codeforces: "danush_siddarth_k_cf",
      github: "danush_siddarth_k_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 90,
        ranking: 2198,
        easyCount: 36,
        mediumCount: 45,
        hardCount: 9,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 4,
        totalStars: 2,
        followers: 2,
      },
    },
    leaderboardScore: 960,
  },
  {
    rollNumber: "23CS039",
    name: "Darsan V",
    email: "23cs039@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000038",
    parentPhoneNumber: "+918000000038",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "darsan_v_lc",
      codeforces: "darsan_v_cf",
      github: "darsan_v_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 58,
        ranking: 3390,
        easyCount: 23,
        mediumCount: 29,
        hardCount: 6,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 28,
        totalStars: 10,
        followers: 14,
      },
    },
    leaderboardScore: 1000,
  },
  {
    rollNumber: "23CS040",
    name: "Deekshitha M",
    email: "23cs040@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000039",
    parentPhoneNumber: "+918000000039",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "deekshitha_m_lc",
      codeforces: "deekshitha_m_cf",
      github: "deekshitha_m_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 255,
        ranking: 781,
        easyCount: 102,
        mediumCount: 128,
        hardCount: 26,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 27,
        totalStars: 11,
        followers: 14,
      },
    },
    leaderboardScore: 2955,
  },
  {
    rollNumber: "23CS041",
    name: "Dharanish A M",
    email: "23cs041@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000040",
    parentPhoneNumber: "+918000000040",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "dharanish_a_m_lc",
      codeforces: "dharanish_a_m_cf",
      github: "dharanish_a_m_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 120,
        ranking: 1653,
        easyCount: 48,
        mediumCount: 60,
        hardCount: 12,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 58,
        totalStars: 99,
        followers: 29,
      },
    },
    leaderboardScore: 2070,
  },
  {
    rollNumber: "23CS042",
    name: "Dharanya S",
    email: "23cs042@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000041",
    parentPhoneNumber: "+918000000041",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "dharanya_s_lc",
      codeforces: "dharanya_s_cf",
      github: "dharanya_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 377,
        ranking: 529,
        easyCount: 151,
        mediumCount: 189,
        hardCount: 38,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 30,
        totalStars: 14,
        followers: 15,
      },
    },
    leaderboardScore: 4220,
  },
  {
    rollNumber: "23CS043",
    name: "Dharshan S M",
    email: "23cs043@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000042",
    parentPhoneNumber: "+918000000042",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "dharshan_s_m_lc",
      codeforces: "dharshan_s_m_cf",
      github: "dharshan_s_m_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 283,
        ranking: 704,
        easyCount: 113,
        mediumCount: 142,
        hardCount: 28,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 11,
        totalStars: 5,
        followers: 6,
      },
    },
    leaderboardScore: 2995,
  },
  {
    rollNumber: "23CS044",
    name: "Dhiviya Lakshime C",
    email: "23cs044@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000043",
    parentPhoneNumber: "+918000000043",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "dhiviya_lakshime_c_lc",
      codeforces: "dhiviya_lakshime_c_cf",
      github: "dhiviya_lakshime_c_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 299,
        ranking: 667,
        easyCount: 120,
        mediumCount: 150,
        hardCount: 30,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 29,
        totalStars: 13,
        followers: 15,
      },
    },
    leaderboardScore: 3425,
  },
  {
    rollNumber: "23CS045",
    name: "Divakar R",
    email: "23cs045@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000044",
    parentPhoneNumber: "+918000000044",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "divakar_r_lc",
      codeforces: "divakar_r_cf",
      github: "divakar_r_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 245,
        ranking: 813,
        easyCount: 98,
        mediumCount: 123,
        hardCount: 25,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 13,
        totalStars: 5,
        followers: 7,
      },
    },
    leaderboardScore: 2645,
  },
  {
    rollNumber: "23CS046",
    name: "Elangovan S",
    email: "23cs046@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000045",
    parentPhoneNumber: "+918000000045",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "elangovan_s_lc",
      codeforces: "elangovan_s_cf",
      github: "elangovan_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 79,
        ranking: 2500,
        easyCount: 32,
        mediumCount: 40,
        hardCount: 8,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 5,
        totalStars: 4,
        followers: 3,
      },
    },
    leaderboardScore: 865,
  },
  {
    rollNumber: "23CS047",
    name: "Elavarasan P",
    email: "23cs047@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000046",
    parentPhoneNumber: "+918000000046",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "elavarasan_p_lc",
      codeforces: "elavarasan_p_cf",
      github: "elavarasan_p_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 116,
        ranking: 1709,
        easyCount: 46,
        mediumCount: 58,
        hardCount: 12,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 23,
        totalStars: 19,
        followers: 12,
      },
    },
    leaderboardScore: 1505,
  },
  {
    rollNumber: "23CS048",
    name: "Ganga Sree M",
    email: "23cs048@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000047",
    parentPhoneNumber: "+918000000047",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ganga_sree_m_lc",
      codeforces: "ganga_sree_m_cf",
      github: "ganga_sree_m_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 148,
        ranking: 1342,
        easyCount: 59,
        mediumCount: 74,
        hardCount: 15,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 42,
        totalStars: 13,
        followers: 21,
      },
    },
    leaderboardScore: 2110,
  },
  {
    rollNumber: "23CS049",
    name: "Geethapriyan S",
    email: "23cs049@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000048",
    parentPhoneNumber: "+918000000048",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "geethapriyan_s_lc",
      codeforces: "geethapriyan_s_cf",
      github: "geethapriyan_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 723,
        ranking: 276,
        easyCount: 289,
        mediumCount: 362,
        hardCount: 72,
      },
      codeforces: {
        rating: 932,
        maxRating: 982,
        rank: "newbie",
        maxRank: "newbie",
      },
      github: {
        publicRepos: 38,
        totalStars: 24,
        followers: 19,
      },
    },
    leaderboardScore: 8918,
  },
  {
    rollNumber: "23CS050",
    name: "Guruvishal M",
    email: "23cs050@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000049",
    parentPhoneNumber: "+918000000049",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "guruvishal_m_lc",
      codeforces: "guruvishal_m_cf",
      github: "guruvishal_m_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 1113,
        ranking: 180,
        easyCount: 445,
        mediumCount: 557,
        hardCount: 111,
      },
      codeforces: {
        rating: 357,
        maxRating: 407,
        rank: "newbie",
        maxRank: "newbie",
      },
      github: {
        publicRepos: 33,
        totalStars: 19,
        followers: 17,
      },
    },
    leaderboardScore: 12053,
  },
  {
    rollNumber: "23CS051",
    name: "Hari Dharsaun R L",
    email: "23cs051@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000050",
    parentPhoneNumber: "+918000000050",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "hari_dharsaun_r_l_lc",
      codeforces: "hari_dharsaun_r_l_cf",
      github: "hari_dharsaun_r_l_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 776,
        ranking: 257,
        easyCount: 310,
        mediumCount: 388,
        hardCount: 78,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 24,
        totalStars: 14,
        followers: 12,
      },
    },
    leaderboardScore: 8120,
  },
  {
    rollNumber: "23CS052",
    name: "Harish Kumar R",
    email: "23cs052@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000051",
    parentPhoneNumber: "+918000000051",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "harish_kumar_r_lc",
      codeforces: "harish_kumar_r_cf",
      github: "harish_kumar_r_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 192,
        ranking: 1036,
        easyCount: 77,
        mediumCount: 96,
        hardCount: 19,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 10,
        totalStars: 3,
        followers: 5,
      },
    },
    leaderboardScore: 2070,
  },
  {
    rollNumber: "23CS053",
    name: "Harshini M",
    email: "23cs053@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000052",
    parentPhoneNumber: "+918000000052",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "harshini_m_lc",
      codeforces: "harshini_m_cf",
      github: "harshini_m_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 178,
        ranking: 1117,
        easyCount: 71,
        mediumCount: 89,
        hardCount: 18,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 14,
        totalStars: 8,
        followers: 7,
      },
    },
    leaderboardScore: 1990,
  },
  {
    rollNumber: "23CS054",
    name: "Hemavarna S",
    email: "23cs054@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000053",
    parentPhoneNumber: "+918000000053",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "hemavarna_s_lc",
      codeforces: "hemavarna_s_cf",
      github: "hemavarna_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 179,
        ranking: 1111,
        easyCount: 72,
        mediumCount: 90,
        hardCount: 18,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 27,
        totalStars: 14,
        followers: 14,
      },
    },
    leaderboardScore: 2195,
  },
  {
    rollNumber: "23CS055",
    name: "Hemavathy J",
    email: "23cs055@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000054",
    parentPhoneNumber: "+918000000054",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "hemavathy_j_lc",
      codeforces: "hemavathy_j_cf",
      github: "hemavathy_j_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 316,
        ranking: 631,
        easyCount: 126,
        mediumCount: 158,
        hardCount: 32,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 23,
        totalStars: 13,
        followers: 12,
      },
    },
    leaderboardScore: 3505,
  },
  {
    rollNumber: "23CS056",
    name: "Hemma Lekha R",
    email: "23cs056@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000055",
    parentPhoneNumber: "+918000000055",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "hemma_lekha_r_lc",
      codeforces: "hemma_lekha_r_cf",
      github: "hemma_lekha_r_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 88,
        ranking: 2247,
        easyCount: 35,
        mediumCount: 44,
        hardCount: 9,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 10,
        totalStars: 3,
        followers: 5,
      },
    },
    leaderboardScore: 1030,
  },
  {
    rollNumber: "23CS057",
    name: "Hitesh Joshi",
    email: "23cs057@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000056",
    parentPhoneNumber: "+918000000056",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "hitesh_joshi_lc",
      codeforces: "hitesh_joshi_cf",
      github: "hitesh_joshi_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 198,
        ranking: 1005,
        easyCount: 79,
        mediumCount: 99,
        hardCount: 20,
      },
      codeforces: {
        rating: 444,
        maxRating: 494,
        rank: "newbie",
        maxRank: "newbie",
      },
      github: {
        publicRepos: 58,
        totalStars: 26,
        followers: 29,
      },
    },
    leaderboardScore: 3383,
  },
  {
    rollNumber: "23CS058",
    name: "Ishan Bahadur Singh",
    email: "23cs058@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000057",
    parentPhoneNumber: "+918000000057",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ishan_bahadur_singh_lc",
      codeforces: "ishan_bahadur_singh_cf",
      github: "ishan_bahadur_singh_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 242,
        ranking: 823,
        easyCount: 97,
        mediumCount: 121,
        hardCount: 24,
      },
      codeforces: {
        rating: 347,
        maxRating: 397,
        rank: "newbie",
        maxRank: "newbie",
      },
      github: {
        publicRepos: 29,
        totalStars: 13,
        followers: 15,
      },
    },
    leaderboardScore: 3271,
  },
  {
    rollNumber: "23CS059",
    name: "Jayasurya M",
    email: "23cs059@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000058",
    parentPhoneNumber: "+918000000058",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "jayasurya_m_lc",
      codeforces: "jayasurya_m_cf",
      github: "jayasurya_m_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 220,
        ranking: 905,
        easyCount: 88,
        mediumCount: 110,
        hardCount: 22,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 22,
        totalStars: 8,
        followers: 11,
      },
    },
    leaderboardScore: 2530,
  },
  {
    rollNumber: "23CS060",
    name: "Jegan Vijay J",
    email: "23cs060@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000059",
    parentPhoneNumber: "+918000000059",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "jegan_vijay_j_lc",
      codeforces: "jegan_vijay_j_cf",
      github: "jegan_vijay_j_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 222,
        ranking: 897,
        easyCount: 89,
        mediumCount: 111,
        hardCount: 22,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 35,
        totalStars: 18,
        followers: 18,
      },
    },
    leaderboardScore: 2745,
  },
  {
    rollNumber: "23CS061",
    name: "Jeyaprakash R",
    email: "23cs061@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000060",
    parentPhoneNumber: "+918000000060",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "jeyaprakash_r_lc",
      codeforces: "jeyaprakash_r_cf",
      github: "jeyaprakash_r_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 102,
        ranking: 1942,
        easyCount: 41,
        mediumCount: 51,
        hardCount: 10,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 32,
        totalStars: 27,
        followers: 16,
      },
    },
    leaderboardScore: 1500,
  },
  {
    rollNumber: "23CS062",
    name: "Joanna Sharon D",
    email: "23cs062@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000061",
    parentPhoneNumber: "+918000000061",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "joanna_sharon_d_lc",
      codeforces: "joanna_sharon_d_cf",
      github: "joanna_sharon_d_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 536,
        ranking: 372,
        easyCount: 214,
        mediumCount: 268,
        hardCount: 54,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 33,
        totalStars: 17,
        followers: 17,
      },
    },
    leaderboardScore: 5855,
  },
  {
    rollNumber: "23CS063",
    name: "Kaarthika A S",
    email: "23cs063@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000062",
    parentPhoneNumber: "+918000000062",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "kaarthika_a_s_lc",
      codeforces: "kaarthika_a_s_cf",
      github: "kaarthika_a_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 160,
        ranking: 1242,
        easyCount: 64,
        mediumCount: 80,
        hardCount: 16,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 55,
        totalStars: 19,
        followers: 28,
      },
    },
    leaderboardScore: 2425,
  },
  {
    rollNumber: "23CS064",
    name: "Kajini Periyasamy Kamaraj",
    email: "23cs064@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000063",
    parentPhoneNumber: "+918000000063",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "kajini_periyasamy_kamaraj_lc",
      codeforces: "kajini_periyasamy_kamaraj_cf",
      github: "kajini_periyasamy_kamaraj_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 128,
        ranking: 1550,
        easyCount: 51,
        mediumCount: 64,
        hardCount: 13,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 10,
        totalStars: 3,
        followers: 5,
      },
    },
    leaderboardScore: 1430,
  },
  {
    rollNumber: "23CS301",
    name: "Ajalesh B",
    email: "23cs301@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000064",
    parentPhoneNumber: "+918000000064",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ajalesh_b_lc",
      codeforces: "ajalesh_b_cf",
      github: "ajalesh_b_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 80,
        ranking: 2469,
        easyCount: 32,
        mediumCount: 40,
        hardCount: 8,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 20,
        totalStars: 12,
        followers: 10,
      },
    },
    leaderboardScore: 1100,
  },
  {
    rollNumber: "23CS302",
    name: "Arjun Jai Shanmugam P V N",
    email: "23cs302@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000065",
    parentPhoneNumber: "+918000000065",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "arjun_jai_shanmugam_p_v_n_lc",
      codeforces: "arjun_jai_shanmugam_p_v_n_cf",
      github: "arjun_jai_shanmugam_p_v_n_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 85,
        ranking: 2326,
        easyCount: 34,
        mediumCount: 43,
        hardCount: 9,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 24,
        totalStars: 8,
        followers: 12,
      },
    },
    leaderboardScore: 1210,
  },
  {
    rollNumber: "23CS303",
    name: "Boobalan K",
    email: "23cs303@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000066",
    parentPhoneNumber: "+918000000066",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "boobalan_k_lc",
      codeforces: "boobalan_k_cf",
      github: "boobalan_k_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 89,
        ranking: 2222,
        easyCount: 36,
        mediumCount: 45,
        hardCount: 9,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 2,
        totalStars: 0,
        followers: 1,
      },
    },
    leaderboardScore: 920,
  },
  {
    rollNumber: "23CS305",
    name: "Guruvel P",
    email: "23cs305@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000067",
    parentPhoneNumber: "+918000000067",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "guruvel_p_lc",
      codeforces: "guruvel_p_cf",
      github: "guruvel_p_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 143,
        ranking: 1389,
        easyCount: 57,
        mediumCount: 72,
        hardCount: 14,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 41,
        totalStars: 25,
        followers: 21,
      },
    },
    leaderboardScore: 2045,
  },
  {
    rollNumber: "23CS306",
    name: "Krishna Prathap G",
    email: "23cs306@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000068",
    parentPhoneNumber: "+918000000068",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "krishna_prathap_g_lc",
      codeforces: "krishna_prathap_g_cf",
      github: "krishna_prathap_g_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 247,
        ranking: 806,
        easyCount: 99,
        mediumCount: 124,
        hardCount: 25,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 18,
        totalStars: 5,
        followers: 9,
      },
    },
    leaderboardScore: 2740,
  },
  {
    rollNumber: "23CS310",
    name: "Ranajay S",
    email: "23cs310@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000069",
    parentPhoneNumber: "+918000000069",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "ranajay_s_lc",
      codeforces: "ranajay_s_cf",
      github: "ranajay_s_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 94,
        ranking: 2105,
        easyCount: 38,
        mediumCount: 47,
        hardCount: 9,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 3,
        totalStars: 1,
        followers: 2,
      },
    },
    leaderboardScore: 985,
  },
  {
    rollNumber: "23CS314",
    name: "Vigneshvar Pandi R",
    email: "23cs314@campusone.edu",
    department: "Computer Science",
    semester: 5,
    batch: "2023-2027",
    phoneNumber: "+919000000070",
    parentPhoneNumber: "+918000000070",
    address: "Coimbatore, Tamil Nadu",
    codingHandles: {
      leetcode: "vigneshvar_pandi_r_lc",
      codeforces: "vigneshvar_pandi_r_cf",
      github: "vigneshvar_pandi_r_gh",
    },
    leaderboardPlatform: {
      leetcode: {
        solved: 58,
        ranking: 3390,
        easyCount: 23,
        mediumCount: 29,
        hardCount: 6,
      },
      codeforces: {
        rating: 0,
        maxRating: 0,
        rank: "unranked",
        maxRank: "unranked",
      },
      github: {
        publicRepos: 13,
        totalStars: 12,
        followers: 7,
      },
    },
    leaderboardScore: 775,
  },
];

const busRoutesData = [
  {
    routeName: "Bharathiyar University - Bus 1",
    routeCode: "BUS-1",
    stops: [
      {
        name: "Bharathiyar University",
        latitude: 10.8322,
        longitude: 77.2644,
      },
      {
        name: "Vadavalli",
        latitude: 10.8322,
        longitude: 77.2304,
      },
      {
        name: "Milk company",
        latitude: 10.8322,
        longitude: 77.1965,
      },
      {
        name: "Gandhipark",
        latitude: 10.8322,
        longitude: 77.1625,
      },
      {
        name: "Ukkadam",
        latitude: 10.8322,
        longitude: 77.1286,
      },
      {
        name: "Sundarapuram",
        latitude: 10.8322,
        longitude: 77.0946,
      },
      {
        name: "Premier mills",
        latitude: 10.8322,
        longitude: 77.0607,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Kottampatti - Pollachi - Bus 2",
    routeCode: "BUS-2",
    stops: [
      {
        name: "Kottampatti",
        latitude: 10.8831,
        longitude: 77.2413,
      },
      {
        name: "Pollachi",
        latitude: 10.8729,
        longitude: 77.1984,
      },
      {
        name: "Vadakipalayam privu",
        latitude: 10.8627,
        longitude: 77.1554,
      },
      {
        name: "Kovilpalayam",
        latitude: 10.8525,
        longitude: 77.1125,
      },
      {
        name: "Thamaraikulam",
        latitude: 10.8424,
        longitude: 77.0696,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Saravanampatti (Via Ramanathapuram & Chettipalayam) - Bus 3",
    routeCode: "BUS-3",
    stops: [
      {
        name: "Saravanampatti",
        latitude: 10.9375,
        longitude: 77.2365,
      },
      {
        name: "Gandhipuram – Thiruvallur bus stand",
        latitude: 10.9244,
        longitude: 77.2102,
      },
      {
        name: "Women’s polytechnic",
        latitude: 10.9112,
        longitude: 77.184,
      },
      {
        name: "Lakshmi mills",
        latitude: 10.898,
        longitude: 77.1578,
      },
      {
        name: "Ramanathapuram",
        latitude: 10.8849,
        longitude: 77.1316,
      },
      {
        name: "Nanjundapuram GD tank",
        latitude: 10.8717,
        longitude: 77.1054,
      },
      {
        name: "Chettipalayam",
        latitude: 10.8585,
        longitude: 77.0791,
      },
      {
        name: "Panapatti pirivu",
        latitude: 10.8454,
        longitude: 77.0529,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Kovai pudur (Via Madukari Market) - Bus 4",
    routeCode: "BUS-4",
    stops: [
      {
        name: "Kovaipudur",
        latitude: 10.9623,
        longitude: 77.1818,
      },
      {
        name: "Sundakamuthur",
        latitude: 10.9479,
        longitude: 77.1645,
      },
      {
        name: "Perur",
        latitude: 10.9334,
        longitude: 77.1473,
      },
      {
        name: "Selvapuram",
        latitude: 10.9189,
        longitude: 77.1301,
      },
      {
        name: "Puttuviki",
        latitude: 10.9045,
        longitude: 77.1128,
      },
      {
        name: "Kuniamuthur High School",
        latitude: 10.89,
        longitude: 77.0956,
      },
      {
        name: "Madukkarai Quary Office",
        latitude: 10.8756,
        longitude: 77.0784,
      },
      {
        name: "Madukkarai market",
        latitude: 10.8611,
        longitude: 77.0612,
      },
      {
        name: "Malumichampatti",
        latitude: 10.8467,
        longitude: 77.0439,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Vadakkipalayam pirivu - Chenniyur (Via sulakkal) - Bus 5",
    routeCode: "BUS-5",
    stops: [
      {
        name: "Vadakipalayam Pirivu",
        latitude: 10.9588,
        longitude: 77.1209,
      },
      {
        name: "Ponnapuram pirivu",
        latitude: 10.9407,
        longitude: 77.1075,
      },
      {
        name: "Vadakipalayam",
        latitude: 10.9226,
        longitude: 77.094,
      },
      {
        name: "Sulakkal",
        latitude: 10.9045,
        longitude: 77.0805,
      },
      {
        name: "Chennaiyur",
        latitude: 10.8864,
        longitude: 77.0671,
      },
      {
        name: "Sulakkal – Roots Company road",
        latitude: 10.8684,
        longitude: 77.0536,
      },
      {
        name: "Thamaraikulam",
        latitude: 10.8503,
        longitude: 77.0402,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Sulur (Via Ramanathapuram) - Bus 6",
    routeCode: "BUS-6",
    stops: [
      {
        name: "Sulur",
        latitude: 10.9844,
        longitude: 77.0924,
      },
      {
        name: "Ondipudur",
        latitude: 10.9627,
        longitude: 77.083,
      },
      {
        name: "Siganallur",
        latitude: 10.9409,
        longitude: 77.0736,
      },
      {
        name: "Sowripalayam",
        latitude: 10.9192,
        longitude: 77.0642,
      },
      {
        name: "Puliyakulam",
        latitude: 10.8974,
        longitude: 77.0548,
      },
      {
        name: "Ramanathapuram",
        latitude: 10.8757,
        longitude: 77.0455,
      },
      {
        name: "Najundapuram",
        latitude: 10.8539,
        longitude: 77.0361,
      },
      {
        name: "Chettipalayam – Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Tirupur - GH (Via Old Bus stand,Mangalam) - Bus 9",
    routeCode: "BUS-9",
    stops: [
      {
        name: "Kovil vazhi Bus stand",
        latitude: 11.0054,
        longitude: 77.0572,
      },
      {
        name: "Old bus Stand",
        latitude: 10.988,
        longitude: 77.0542,
      },
      {
        name: "mangalam",
        latitude: 10.9707,
        longitude: 77.0511,
      },
      {
        name: "63-Velampalayam",
        latitude: 10.9534,
        longitude: 77.0481,
      },
      {
        name: "Palladam GH",
        latitude: 10.9361,
        longitude: 77.045,
      },
      {
        name: "Karaidivavi",
        latitude: 10.9188,
        longitude: 77.042,
      },
      {
        name: "Sellakarachal",
        latitude: 10.9015,
        longitude: 77.0389,
      },
      {
        name: "Lakshiminaiyakanpalayam",
        latitude: 10.8841,
        longitude: 77.0359,
      },
      {
        name: "Panapatti",
        latitude: 10.8668,
        longitude: 77.0328,
      },
      {
        name: "Panapatti pirivu",
        latitude: 10.8495,
        longitude: 77.0298,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Dhali (Via Negamam) - Bus 11",
    routeCode: "BUS-11",
    stops: [
      {
        name: "Kurichikottai",
        latitude: 11.0298,
        longitude: 77.0152,
      },
      {
        name: "Dhali",
        latitude: 11.0118,
        longitude: 77.0162,
      },
      {
        name: "Erichanampaatti",
        latitude: 10.9938,
        longitude: 77.0173,
      },
      {
        name: "Kondigiyam",
        latitude: 10.9759,
        longitude: 77.0183,
      },
      {
        name: "Udukkampalayam",
        latitude: 10.9579,
        longitude: 77.0194,
      },
      {
        name: "Lakshmapuram",
        latitude: 10.94,
        longitude: 77.0204,
      },
      {
        name: "Kedimedu",
        latitude: 10.922,
        longitude: 77.0215,
      },
      {
        name: "Singuvadai",
        latitude: 10.904,
        longitude: 77.0225,
      },
      {
        name: "Poosaripatti",
        latitude: 10.8861,
        longitude: 77.0236,
      },
      {
        name: "Negamam",
        latitude: 10.8681,
        longitude: 77.0246,
      },
      {
        name: "Cheetipudur",
        latitude: 10.8502,
        longitude: 77.0257,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Pollachi (Via Negemam) - Bus 12",
    routeCode: "BUS-12",
    stops: [
      {
        name: "Pollachi Their Nilayam",
        latitude: 11.0027,
        longitude: 76.9757,
      },
      {
        name: "Puliyampatti",
        latitude: 10.9459,
        longitude: 76.9927,
      },
      {
        name: "Negamam",
        latitude: 10.889,
        longitude: 77.0097,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Jallipatti (Via Mandrampalayam) - Bus 14",
    routeCode: "BUS-14",
    stops: [
      {
        name: "Jallipatti",
        latitude: 11.048,
        longitude: 76.9021,
      },
      {
        name: "Senjeriputhur",
        latitude: 11.024,
        longitude: 76.9159,
      },
      {
        name: "Kamalapatti",
        latitude: 11.0001,
        longitude: 76.9298,
      },
      {
        name: "S.Ayyampalayam",
        latitude: 10.9761,
        longitude: 76.9436,
      },
      {
        name: "J.Krishnapuram",
        latitude: 10.9521,
        longitude: 76.9575,
      },
      {
        name: "Pachagoundampalayam",
        latitude: 10.9281,
        longitude: 76.9713,
      },
      {
        name: "Senjerimalai",
        latitude: 10.9041,
        longitude: 76.9852,
      },
      {
        name: "Kattampatti",
        latitude: 10.8802,
        longitude: 76.999,
      },
      {
        name: "Mandrampalayam",
        latitude: 10.8562,
        longitude: 77.0129,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Udumalpet - Pallapalayam (Via Negamam) - Bus 15",
    routeCode: "BUS-15",
    stops: [
      {
        name: "Pallapalayam",
        latitude: 10.9512,
        longitude: 76.9144,
      },
      {
        name: "Bodipatti",
        latitude: 10.9404,
        longitude: 76.9246,
      },
      {
        name: "Udumalpet",
        latitude: 10.9296,
        longitude: 76.9348,
      },
      {
        name: "Kuruncherri",
        latitude: 10.9187,
        longitude: 76.9451,
      },
      {
        name: "Pethampampatti",
        latitude: 10.9079,
        longitude: 76.9553,
      },
      {
        name: "Kongal Nagaram",
        latitude: 10.8971,
        longitude: 76.9655,
      },
      {
        name: "Pudhupalayam",
        latitude: 10.8863,
        longitude: 76.9757,
      },
      {
        name: "Poosaripatti",
        latitude: 10.8755,
        longitude: 76.9859,
      },
      {
        name: "Avalpatti",
        latitude: 10.8647,
        longitude: 76.9961,
      },
      {
        name: "Negamam",
        latitude: 10.8538,
        longitude: 77.0063,
      },
      {
        name: "Kapplangarai",
        latitude: 10.843,
        longitude: 77.0165,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Thirumurugan Poondi (Via Kamanaikanpalayam) - Bus 18",
    routeCode: "BUS-18",
    stops: [
      {
        name: "Thirumurugan Poondi",
        latitude: 10.9283,
        longitude: 76.8805,
      },
      {
        name: "Annuparpalayam",
        latitude: 10.9219,
        longitude: 76.8903,
      },
      {
        name: "Pushpa theatre",
        latitude: 10.9155,
        longitude: 76.9,
      },
      {
        name: "Old bus Stand",
        latitude: 10.9091,
        longitude: 76.9098,
      },
      {
        name: "Thennampalayam",
        latitude: 10.9027,
        longitude: 76.9195,
      },
      {
        name: "Veerapandi",
        latitude: 10.8963,
        longitude: 76.9293,
      },
      {
        name: "Arulpuram",
        latitude: 10.8899,
        longitude: 76.939,
      },
      {
        name: "Palladam",
        latitude: 10.8835,
        longitude: 76.9488,
      },
      {
        name: "Vadugapalayam",
        latitude: 10.8771,
        longitude: 76.9585,
      },
      {
        name: "Venkitapuram",
        latitude: 10.8707,
        longitude: 76.9682,
      },
      {
        name: "Kamanaikkanpalayam",
        latitude: 10.8642,
        longitude: 76.978,
      },
      {
        name: "Sulthanpet",
        latitude: 10.8578,
        longitude: 76.9877,
      },
      {
        name: "Senjeriprivu",
        latitude: 10.8514,
        longitude: 76.9975,
      },
      {
        name: "Poorandam palayam",
        latitude: 10.845,
        longitude: 77.0072,
      },
      {
        name: "Matuvavi",
        latitude: 10.8386,
        longitude: 77.017,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Kalapatti (Via Hope College) - Bus 19",
    routeCode: "BUS-19",
    stops: [
      {
        name: "Kalapatti",
        latitude: 10.8933,
        longitude: 76.8587,
      },
      {
        name: "Nehrunager",
        latitude: 10.8878,
        longitude: 76.874,
      },
      {
        name: "Sitra",
        latitude: 10.8822,
        longitude: 76.8893,
      },
      {
        name: "Hope College",
        latitude: 10.8767,
        longitude: 76.9046,
      },
      {
        name: "Peelamedu",
        latitude: 10.8711,
        longitude: 76.9198,
      },
      {
        name: "Lakshmi Mills",
        latitude: 10.8655,
        longitude: 76.9351,
      },
      {
        name: "Puliyakulam",
        latitude: 10.86,
        longitude: 76.9504,
      },
      {
        name: "Sungam-bye pass",
        latitude: 10.8544,
        longitude: 76.9656,
      },
      {
        name: "Ukkadam",
        latitude: 10.8489,
        longitude: 76.9809,
      },
      {
        name: "Sundarapuram",
        latitude: 10.8433,
        longitude: 76.9962,
      },
      {
        name: "Malumichampatti",
        latitude: 10.8378,
        longitude: 77.0114,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Kottur (Via NM Sungam) - Bus 20",
    routeCode: "BUS-20",
    stops: [
      {
        name: "Angalakurichi",
        latitude: 10.8547,
        longitude: 76.8341,
      },
      {
        name: "Kottur",
        latitude: 10.8519,
        longitude: 76.8581,
      },
      {
        name: "Somanthurai Chitthur",
        latitude: 10.8491,
        longitude: 76.8822,
      },
      {
        name: "NM Sungam",
        latitude: 10.8463,
        longitude: 76.9063,
      },
      {
        name: "samathur",
        latitude: 10.8435,
        longitude: 76.9304,
      },
      {
        name: "Suleeswaran patti",
        latitude: 10.8406,
        longitude: 76.9545,
      },
      {
        name: "Pollachi",
        latitude: 10.8378,
        longitude: 76.9785,
      },
      {
        name: "Kovilpalayam",
        latitude: 10.835,
        longitude: 77.0026,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Kaliyapuram ( Via Pollachi) - Bus 21",
    routeCode: "BUS-21",
    stops: [
      {
        name: "Kaliyapuram",
        latitude: 10.8133,
        longitude: 76.8648,
      },
      {
        name: "Vettaikaranpudur",
        latitude: 10.8156,
        longitude: 76.8851,
      },
      {
        name: "Annaimalai",
        latitude: 10.818,
        longitude: 76.9053,
      },
      {
        name: "Sungam",
        latitude: 10.8204,
        longitude: 76.9255,
      },
      {
        name: "Ambrampalayam",
        latitude: 10.8227,
        longitude: 76.9458,
      },
      {
        name: "Uthukuli",
        latitude: 10.8251,
        longitude: 76.966,
      },
      {
        name: "Pollachi",
        latitude: 10.8275,
        longitude: 76.9862,
      },
      {
        name: "Kovilpalayam",
        latitude: 10.8298,
        longitude: 77.0065,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Vellalore - Bus 22",
    routeCode: "BUS-22",
    stops: [
      {
        name: "Vellalore – LG Nager",
        latitude: 10.7642,
        longitude: 76.84,
      },
      {
        name: "Konavaikkal palayam",
        latitude: 10.7756,
        longitude: 76.8711,
      },
      {
        name: "GD tank",
        latitude: 10.7869,
        longitude: 76.9022,
      },
      {
        name: "Chettipalayam",
        latitude: 10.7982,
        longitude: 76.9333,
      },
      {
        name: "Thekkani",
        latitude: 10.8095,
        longitude: 76.9645,
      },
      {
        name: "Karacheri",
        latitude: 10.8209,
        longitude: 76.9956,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Vallakunda puram - Bus 23",
    routeCode: "BUS-23",
    stops: [
      {
        name: "Vallakundapuram",
        latitude: 10.7221,
        longitude: 76.8593,
      },
      {
        name: "Ramachandrapuram",
        latitude: 10.7321,
        longitude: 76.8745,
      },
      {
        name: "Virigal patti pirivu",
        latitude: 10.7421,
        longitude: 76.8897,
      },
      {
        name: "Udhavipalayam",
        latitude: 10.7521,
        longitude: 76.9049,
      },
      {
        name: "Negamam",
        latitude: 10.7621,
        longitude: 76.9202,
      },
      {
        name: "Chettipudur",
        latitude: 10.7721,
        longitude: 76.9354,
      },
      {
        name: "Kapplangarai",
        latitude: 10.7822,
        longitude: 76.9506,
      },
      {
        name: "Devanampalayam",
        latitude: 10.7922,
        longitude: 76.9658,
      },
      {
        name: "Chettikkapalayam",
        latitude: 10.8022,
        longitude: 76.981,
      },
      {
        name: "Cherripalayam",
        latitude: 10.8122,
        longitude: 76.9963,
      },
      {
        name: "Kurinallipalayam",
        latitude: 10.8222,
        longitude: 77.0115,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Poneri - Udumalpet ( Via Pollachi) - Bus 24",
    routeCode: "BUS-24",
    stops: [
      {
        name: "Poneri",
        latitude: 10.7157,
        longitude: 76.9168,
      },
      {
        name: "Udumalpet",
        latitude: 10.7324,
        longitude: 76.9325,
      },
      {
        name: "Mukkonam",
        latitude: 10.749,
        longitude: 76.9482,
      },
      {
        name: "Komangalam",
        latitude: 10.7656,
        longitude: 76.9639,
      },
      {
        name: "Thippampatti",
        latitude: 10.7823,
        longitude: 76.9796,
      },
      {
        name: "RTO Office",
        latitude: 10.7989,
        longitude: 76.9953,
      },
      {
        name: "Pollachi",
        latitude: 10.8156,
        longitude: 77.011,
      },
      {
        name: "kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Meenachipuram (Via Pollachi) - Bus 25",
    routeCode: "BUS-25",
    stops: [
      {
        name: "Meenachipuram",
        latitude: 10.664,
        longitude: 76.9296,
      },
      {
        name: "Valandhyamaram",
        latitude: 10.6781,
        longitude: 76.9377,
      },
      {
        name: "Kaliyappankavundanpudur pirivu",
        latitude: 10.6921,
        longitude: 76.9458,
      },
      {
        name: "Authu pollachi",
        latitude: 10.7061,
        longitude: 76.9539,
      },
      {
        name: "Ramapattinam pirivu",
        latitude: 10.7201,
        longitude: 76.962,
      },
      {
        name: "Ayyampalayam",
        latitude: 10.7341,
        longitude: 76.9701,
      },
      {
        name: "Nallur",
        latitude: 10.7481,
        longitude: 76.9782,
      },
      {
        name: "NGM College",
        latitude: 10.7621,
        longitude: 76.9862,
      },
      {
        name: "Pollachi",
        latitude: 10.7761,
        longitude: 76.9943,
      },
      {
        name: "Achipatti",
        latitude: 10.7902,
        longitude: 77.0024,
      },
      {
        name: "Kullakapalyam pirivu",
        latitude: 10.8042,
        longitude: 77.0105,
      },
      {
        name: "Kovilpalayam",
        latitude: 10.8182,
        longitude: 77.0186,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "JothiNager ( Via Pollachi) - Bus 27",
    routeCode: "BUS-27",
    stops: [
      {
        name: "Jothinager",
        latitude: 10.6394,
        longitude: 76.969,
      },
      {
        name: "Omprakash Theatre",
        latitude: 10.6779,
        longitude: 76.9805,
      },
      {
        name: "Pollachi",
        latitude: 10.7165,
        longitude: 76.9921,
      },
      {
        name: "Mahalingapuram Arch",
        latitude: 10.7551,
        longitude: 77.0036,
      },
      {
        name: "Nanjaigoundanputhur",
        latitude: 10.7936,
        longitude: 77.0152,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Ramanathapuram (Via Sundarapuram) - Bus 28",
    routeCode: "BUS-28",
    stops: [
      {
        name: "Ramanathapuram",
        latitude: 10.6668,
        longitude: 77.0171,
      },
      {
        name: "Podanur RS",
        latitude: 10.6999,
        longitude: 77.019,
      },
      {
        name: "Saradha mill road",
        latitude: 10.733,
        longitude: 77.0209,
      },
      {
        name: "Sundarapuram",
        latitude: 10.7661,
        longitude: 77.0228,
      },
      {
        name: "Malumichampatti",
        latitude: 10.7991,
        longitude: 77.0248,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Dhansarpatti ( Via Kudimangalam) - Bus 29",
    routeCode: "BUS-29",
    stops: [
      {
        name: "Dhasarpatti",
        latitude: 10.6623,
        longitude: 77.0567,
      },
      {
        name: "Kudimangalam",
        latitude: 10.6793,
        longitude: 77.0537,
      },
      {
        name: "Poolavadi pirivu",
        latitude: 10.6963,
        longitude: 77.0507,
      },
      {
        name: "Periyapatti",
        latitude: 10.7133,
        longitude: 77.0477,
      },
      {
        name: "Munkillthozhuvu pirivu",
        latitude: 10.7303,
        longitude: 77.0447,
      },
      {
        name: "Veethampatti",
        latitude: 10.7473,
        longitude: 77.0417,
      },
      {
        name: "Chandrapuram",
        latitude: 10.7643,
        longitude: 77.0387,
      },
      {
        name: "Sirukanlanthai",
        latitude: 10.7812,
        longitude: 77.0357,
      },
      {
        name: "Guruveygoundampalayam",
        latitude: 10.7982,
        longitude: 77.0327,
      },
      {
        name: "Andipalayam",
        latitude: 10.8152,
        longitude: 77.0297,
      },
      {
        name: "Vadasithur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Edyarpalayam (via Abirami Hospital) - Bus 30",
    routeCode: "BUS-30",
    stops: [
      {
        name: "Edayarpalayam",
        latitude: 10.6046,
        longitude: 77.1249,
      },
      {
        name: "Avila Convent",
        latitude: 10.6299,
        longitude: 77.114,
      },
      {
        name: "S.B.Kovil(MTP Road)",
        latitude: 10.6552,
        longitude: 77.1031,
      },
      {
        name: "Poo Market",
        latitude: 10.6805,
        longitude: 77.0922,
      },
      {
        name: "Marakadai",
        latitude: 10.7058,
        longitude: 77.0812,
      },
      {
        name: "Abirami hospital",
        latitude: 10.731,
        longitude: 77.0703,
      },
      {
        name: "Kamaraj Nager",
        latitude: 10.7563,
        longitude: 77.0594,
      },
      {
        name: "Madukarai Market",
        latitude: 10.7816,
        longitude: 77.0485,
      },
      {
        name: "Malumichampatti",
        latitude: 10.8069,
        longitude: 77.0376,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Periyanaikkanpalayam (Via Ukkadam) - Bus 31",
    routeCode: "BUS-31",
    stops: [
      {
        name: "Periyanaikkan palayam",
        latitude: 10.6483,
        longitude: 77.1636,
      },
      {
        name: "Narasimanaikanpalayam",
        latitude: 10.665,
        longitude: 77.1512,
      },
      {
        name: "Vadamadurai",
        latitude: 10.6817,
        longitude: 77.1387,
      },
      {
        name: "Thudiyalur",
        latitude: 10.6985,
        longitude: 77.1263,
      },
      {
        name: "Kavundampalayam",
        latitude: 10.7152,
        longitude: 77.1138,
      },
      {
        name: "MTP bus stand",
        latitude: 10.7319,
        longitude: 77.1014,
      },
      {
        name: "S.B.Kovil",
        latitude: 10.7486,
        longitude: 77.0889,
      },
      {
        name: "Poomarket",
        latitude: 10.7653,
        longitude: 77.0765,
      },
      {
        name: "Marakadai",
        latitude: 10.782,
        longitude: 77.064,
      },
      {
        name: "Ukkadam",
        latitude: 10.7988,
        longitude: 77.0516,
      },
      {
        name: "Malumichampatti",
        latitude: 10.8155,
        longitude: 77.0391,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Madathukulam (Via Pollachi) - Bus 32",
    routeCode: "BUS-32",
    stops: [
      {
        name: "Madathukulam",
        latitude: 10.6792,
        longitude: 77.2091,
      },
      {
        name: "Palappampatti",
        latitude: 10.6983,
        longitude: 77.1863,
      },
      {
        name: "Udamalpet",
        latitude: 10.7174,
        longitude: 77.1635,
      },
      {
        name: "Mukkonam",
        latitude: 10.7366,
        longitude: 77.1407,
      },
      {
        name: "Komangalam",
        latitude: 10.7557,
        longitude: 77.1179,
      },
      {
        name: "Thippampatti",
        latitude: 10.7748,
        longitude: 77.0951,
      },
      {
        name: "RTO Office",
        latitude: 10.7939,
        longitude: 77.0723,
      },
      {
        name: "Pollachi",
        latitude: 10.8131,
        longitude: 77.0495,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName:
      "Perumanallur - Tirupur Pandiyan nager (Via New bus stand,Veerapandi,Palladam) - Bus 33",
    routeCode: "BUS-33",
    stops: [
      {
        name: "Perumanallur",
        latitude: 10.7548,
        longitude: 77.1808,
      },
      {
        name: "Pandiyan nager",
        latitude: 10.7607,
        longitude: 77.169,
      },
      {
        name: "New Bus stand",
        latitude: 10.7667,
        longitude: 77.1571,
      },
      {
        name: "Veerapandi pirivu",
        latitude: 10.7727,
        longitude: 77.1453,
      },
      {
        name: "Arulpuram",
        latitude: 10.7786,
        longitude: 77.1334,
      },
      {
        name: "Palladam",
        latitude: 10.7846,
        longitude: 77.1216,
      },
      {
        name: "Vadugapalayam",
        latitude: 10.7905,
        longitude: 77.1097,
      },
      {
        name: "Venkitapuram",
        latitude: 10.7965,
        longitude: 77.0978,
      },
      {
        name: "Kamanaikkanpalayam",
        latitude: 10.8024,
        longitude: 77.086,
      },
      {
        name: "Sulthanpet",
        latitude: 10.8084,
        longitude: 77.0741,
      },
      {
        name: "Senjeriprivu",
        latitude: 10.8143,
        longitude: 77.0623,
      },
      {
        name: "Poorandam palayam",
        latitude: 10.8203,
        longitude: 77.0504,
      },
      {
        name: "Matuvavi",
        latitude: 10.8262,
        longitude: 77.0386,
      },
      {
        name: "Vadasitur",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
  {
    routeName: "Sivanandhacolony (Via Nachipalayam) - Bus 34",
    routeCode: "BUS-34",
    stops: [
      {
        name: "Sivanandhacolony",
        latitude: 10.7972,
        longitude: 77.1744,
      },
      {
        name: "Tatabad",
        latitude: 10.7999,
        longitude: 77.163,
      },
      {
        name: "Gandhipark",
        latitude: 10.8026,
        longitude: 77.1516,
      },
      {
        name: "Chokkampudur",
        latitude: 10.8053,
        longitude: 77.1403,
      },
      {
        name: "Sivalaya Theatre",
        latitude: 10.808,
        longitude: 77.1289,
      },
      {
        name: "Puttiviki",
        latitude: 10.8107,
        longitude: 77.1176,
      },
      {
        name: "Kuniamuthur High School",
        latitude: 10.8134,
        longitude: 77.1062,
      },
      {
        name: "Madukkarai -Quary office",
        latitude: 10.816,
        longitude: 77.0948,
      },
      {
        name: "Madukkarai – Nataraj",
        latitude: 10.8187,
        longitude: 77.0835,
      },
      {
        name: "Hospital",
        latitude: 10.8214,
        longitude: 77.0721,
      },
      {
        name: "Nachipalayam",
        latitude: 10.8241,
        longitude: 77.0608,
      },
      {
        name: "Othalkalmandapam",
        latitude: 10.8268,
        longitude: 77.0494,
      },
      {
        name: "Premier mills",
        latitude: 10.8295,
        longitude: 77.0381,
      },
      {
        name: "Kinathukadavu",
        latitude: 10.8322,
        longitude: 77.0267,
      },
    ],
  },
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGO_URI);
    console.log("Database connected successfully.");

    // 1. Clear Existing Data
    console.log("Clearing database collections...");
    await User.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Subject.deleteMany({});
    await Attendance.deleteMany({});
    await Timetable.deleteMany({});
    await BusRoute.deleteMany({});
    await BusLocation.deleteMany({});
    await LeaderboardEntry.deleteMany({});
    await ChatHistory.deleteMany({});
    await Complaint.deleteMany({});
    console.log("All collections cleared successfully.");

    // 2. Create Users
    console.log("Creating users...");

    // Primary Student User
    const studentUser1 = await User.create({
      name: "Alex Rivera",
      email: "student@campusone.edu",
      password: "password123",
      role: "student",
    });

    // Create the Excel Student Users
    const createdUsers = [];
    for (const s of studentsData) {
      const u = await User.create({
        name: s.name,
        email: s.email,
        password: "password123",
        role: "student",
      });
      createdUsers.push({ user: u, studentData: s });
    }

    // Faculty Users
    const facultyUser1 = await User.create({
      name: "Prof. Alan Turing",
      email: "turing@campusone.edu",
      password: "password123",
      role: "faculty",
    });

    const facultyUser2 = await User.create({
      name: "Prof. Grace Hopper",
      email: "hopper@campusone.edu",
      password: "password123",
      role: "faculty",
    });

    // Transport Driver User
    const driverUser = await User.create({
      name: "Bob Miller",
      email: "bob_driver@campusone.edu",
      password: "password123",
      role: "transport_staff",
    });

    // Admin User
    const adminUser = await User.create({
      name: "CampusOne Admin",
      email: "admin@campusone.edu",
      password: "password123",
      role: "admin",
    });

    console.log("Users created successfully.");

    // 3. Create Student & Faculty Profiles
    console.log("Creating Student and Faculty profiles...");

    // Student Profiles
    const alexProfile = await Student.create({
      userId: studentUser1._id,
      rollNumber: "CS-2023-042",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
      phoneNumber: "+15550198420",
      parentPhoneNumber: "+15550198421",
      address: "742 Evergreen Terrace, Campus Hills",
      codingHandles: {
        leetcode: "alex_codes_99",
        codeforces: "alex_cf",
        github: "arivera-dev",
      },
    });

    const createdStudentProfiles = [];
    for (const item of createdUsers) {
      const studentProfile = await Student.create({
        userId: item.user._id,
        rollNumber: item.studentData.rollNumber,
        department: item.studentData.department,
        semester: item.studentData.semester,
        batch: item.studentData.batch,
        phoneNumber: item.studentData.phoneNumber,
        parentPhoneNumber: item.studentData.parentPhoneNumber,
        address: item.studentData.address,
        codingHandles: item.studentData.codingHandles,
      });
      createdStudentProfiles.push({
        profile: studentProfile,
        studentData: item.studentData,
        user: item.user,
      });
    }

    // Faculty Profiles
    const turingProfile = await Faculty.create({
      userId: facultyUser1._id,
      employeeId: "EMP-TURING-101",
      department: "Computer Science",
      designation: "Professor & Chair",
      phoneNumber: "+15550123401",
    });

    const hopperProfile = await Faculty.create({
      userId: facultyUser2._id,
      employeeId: "EMP-HOPPER-102",
      department: "Computer Science",
      designation: "Associate Professor",
      phoneNumber: "+15550123402",
    });

    console.log("Profiles created successfully.");

    // 4. Create Subjects
    console.log("Creating subjects...");
    const mlSubject = await Subject.create({
      name: "Machine Learning",
      code: "CS-301",
      department: "Computer Science",
      credits: 4,
    });

    const osSubject = await Subject.create({
      name: "Operating Systems",
      code: "CS-302",
      department: "Computer Science",
      credits: 4,
    });

    const cnSubject = await Subject.create({
      name: "Computer Networks",
      code: "CS-303",
      department: "Computer Science",
      credits: 3,
    });

    const seSubject = await Subject.create({
      name: "Software Engineering",
      code: "CS-304",
      department: "Computer Science",
      credits: 3,
    });

    const dbSubject = await Subject.create({
      name: "Database Systems",
      code: "CS-305",
      department: "Computer Science",
      credits: 4,
    });

    console.log("Subjects created successfully.");

    // 5. Create Attendance Logs (Rich 3-week weekday logs for Alex)
    console.log("Generating attendance logs for primary student...");

    const subjectsList = [
      { subject: mlSubject, presentRate: 0.93 },
      { subject: osSubject, presentRate: 0.8 },
      { subject: cnSubject, presentRate: 0.6 },
      { subject: seSubject, presentRate: 0.86 },
      { subject: dbSubject, presentRate: 0.73 },
    ];

    const attendanceRecords = [];
    const weekdaysCount = 15;
    let currentDaysBack = 0;
    let checkedDate = new Date();

    while (currentDaysBack < weekdaysCount) {
      checkedDate.setDate(checkedDate.getDate() - 1);
      if (checkedDate.getDay() === 0 || checkedDate.getDay() === 6) {
        continue;
      }

      currentDaysBack++;
      const attendanceDay = new Date(checkedDate);
      attendanceDay.setHours(0, 0, 0, 0);

      for (const item of subjectsList) {
        const isPresent = Math.random() < item.presentRate;
        const status = isPresent
          ? "present"
          : Math.random() < 0.3
            ? "leave"
            : "absent";

        attendanceRecords.push({
          studentId: alexProfile._id,
          subjectId: item.subject._id,
          date: new Date(attendanceDay),
          status: status,
          markedBy: facultyUser1._id,
        });
      }

      // Generate attendance logs for all other students (Excel data)
      for (const studentItem of createdStudentProfiles) {
        for (const item of subjectsList) {
          const isPresent = Math.random() < item.presentRate;
          const status = isPresent
            ? "present"
            : Math.random() < 0.3
              ? "leave"
              : "absent";

          attendanceRecords.push({
            studentId: studentItem.profile._id,
            subjectId: item.subject._id,
            date: new Date(attendanceDay),
            status: status,
            markedBy: facultyUser1._id,
          });
        }
      }
    }

    await Attendance.create(attendanceRecords);
    console.log(
      `Successfully generated ${attendanceRecords.length} attendance logs for all students.`,
    );

    // 6. Create Timetable (Weekly Lecture and Lab Slots)
    console.log("Seeding timetable schedule...");

    // Monday
    await Timetable.create({
      subjectId: mlSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-101",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: osSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-102",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Monday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: seSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-103",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Monday",
      startTime: "11:30",
      endTime: "12:30",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    // Tuesday
    await Timetable.create({
      subjectId: cnSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-201",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Tuesday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: dbSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-202",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Tuesday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: mlSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LAB-3",
      type: "lab",
      isRecurring: true,
      dayOfWeek: "Tuesday",
      startTime: "14:00",
      endTime: "16:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    // Wednesday
    await Timetable.create({
      subjectId: mlSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-101",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Wednesday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: osSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-102",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Wednesday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: cnSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-201",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Wednesday",
      startTime: "11:30",
      endTime: "12:30",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    // Thursday
    await Timetable.create({
      subjectId: dbSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-202",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Thursday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: seSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-103",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Thursday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: osSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LAB-1",
      type: "lab",
      isRecurring: true,
      dayOfWeek: "Thursday",
      startTime: "14:00",
      endTime: "16:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    // Friday
    await Timetable.create({
      subjectId: mlSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-101",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Friday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: osSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-102",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Friday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: dbSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-202",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Friday",
      startTime: "11:30",
      endTime: "12:30",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    console.log("Timetable schedule seeded.");

    // 7. Create Bus Routes & Locations
    console.log("Seeding Bus Routes and Live Location coordinates...");

    const createdRoutes = [];
    for (const r of busRoutesData) {
      const route = await BusRoute.create({
        routeName: r.routeName,
        routeCode: r.routeCode,
        driverId: driverUser._id,
        stops: r.stops,
      });
      createdRoutes.push(route);
    }

    // Seed Active Live Bus Location (Route BUS-1 is currently active)
    const activeRoute = createdRoutes.find((r) => r.routeCode === "BUS-1");
    if (activeRoute && activeRoute.stops.length > 0) {
      const midIndex = Math.floor(activeRoute.stops.length / 2);
      const activeStop = activeRoute.stops[midIndex];
      await BusLocation.create({
        routeId: activeRoute._id,
        latitude: activeStop.latitude,
        longitude: activeStop.longitude,
        occupancy: 28,
        speed: 38,
      });
    }

    console.log("Bus routes and active locations seeded.");

    // 8. Create Leaderboard Entries
    console.log("Seeding Leaderboard Entries for all students...");

    // Alex
    await LeaderboardEntry.create({
      studentId: alexProfile._id,
      userId: studentUser1._id,
      platform: {
        leetcode: {
          solved: 184,
          ranking: 34102,
          easyCount: 80,
          mediumCount: 88,
          hardCount: 16,
        },
        codeforces: {
          rating: 1420,
          maxRating: 1450,
          rank: "specialist",
          maxRank: "specialist",
        },
        github: { publicRepos: 24, totalStars: 12, followers: 8 },
      },
      totalScore: 2540,
      lastSyncedAt: new Date(),
    });

    // Excel Students Leaderboard entries
    for (const item of createdStudentProfiles) {
      await LeaderboardEntry.create({
        studentId: item.profile._id,
        userId: item.user._id,
        platform: item.studentData.leaderboardPlatform,
        totalScore: item.studentData.leaderboardScore,
        lastSyncedAt: new Date(),
      });
    }

    console.log("Leaderboard entries seeded.");

    // 9. Create Complaint Entries
    console.log("Seeding Complaint Entries for student@campusone.edu...");

    await Complaint.create([
      {
        studentId: alexProfile._id,
        title: "Hostel Wi-Fi intermittent connection issues",
        description: "The Wi-Fi in Hostel Block A is dropping connection every 15 minutes, making it impossible to work on coding assignments.",
        category: "infrastructure",
        status: "in_progress",
        assignedTo: hopperProfile._id,
        updates: [
          {
            status: "pending",
            comment: "Complaint filed successfully.",
            updatedBy: studentUser1._id,
            updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
          },
          {
            status: "in_progress",
            comment: "IT department has scheduled router inspection on Block A.",
            updatedBy: adminUser._id,
            updatedAt: new Date(Date.now() - 3600 * 1000 * 24),
          },
        ],
      },
      {
        studentId: alexProfile._id,
        title: "Incorrect mid-semester marks update in portal",
        description: "My Database Management System mid-semester marks are updated as 12 instead of 22 in the portal. I have already verified my paper with the HOD.",
        category: "academic",
        status: "pending",
        updates: [
          {
            status: "pending",
            comment: "Complaint filed successfully.",
            updatedBy: studentUser1._id,
            updatedAt: new Date(Date.now() - 3600 * 1000 * 5),
          },
        ],
      },
      {
        studentId: alexProfile._id,
        title: "Broken window latch in Hostel Room 302",
        description: "The window latch in room 302 hostel is broken and won't lock, causing safety concerns.",
        category: "hostel",
        status: "resolved",
        assignedTo: hopperProfile._id,
        updates: [
          {
            status: "pending",
            comment: "Complaint filed successfully.",
            updatedBy: studentUser1._id,
            updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 4),
          },
          {
            status: "resolved",
            comment: "Maintenance staff has replaced the latch.",
            updatedBy: facultyUser2._id,
            updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
          },
        ],
      },
    ]);

    console.log("Complaint tickets seeded.");
    console.log("----------------------------------------------------");
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("----------------------------------------------------");
    console.log("Primary Test Credentials:");
    console.log("  Email:    student@campusone.edu");
    console.log("  Password: password123");
    console.log("----------------------------------------------------");
  } catch (error) {
    console.error("Seeding encountered an error:", error.message);
  } finally {
    console.log("Closing database connection...");
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

// Run Seeder
seedDatabase();
