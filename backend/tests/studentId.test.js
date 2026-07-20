const request = require("supertest");
const server = require("../src/index");
const StudentCard = require("../src/models/StudentCard");
const WalletTransaction = require("../src/models/WalletTransaction");

describe("Student ID and Wallet API Test Suite", () => {
  let studentToken = "";
  let studentId = "";

  beforeEach(async () => {
    const studentRes = await request(server).post("/api/auth/register").send({
      name: "Wallet Student",
      email: "wallet_stud@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-WALL-1",
      department: "Computer Science",
      semester: 4,
      batch: "2024-2028",
    });
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.profile._id;

    // Initialize student card
    await request(server)
      .get("/api/student-id/card")
      .set("Authorization", `Bearer ${studentToken}`);
  });

  it("should successfully retrieve or lazily initialize student ID card with default ₹500 balance", async () => {
    const res = await request(server)
      .get("/api/student-id/card")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.walletBalance).toBe(500);
    expect(res.body.data.status).toBe("active");
    expect(res.body.data.qrToken).toContain("campusone:id:");
  });

  it("should successfully top up wallet balance and record transaction history", async () => {
    const res = await request(server)
      .post("/api/student-id/wallet/topup")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ amount: 250 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.walletBalance).toBe(750); // Default 500 + 250 top up

    // Verify transaction log
    const tx = await WalletTransaction.findOne({ userId: res.body.data.userId });
    expect(tx).not.toBeNull();
    expect(tx.amount).toBe(250);
    expect(tx.type).toBe("credit");
    expect(tx.description).toContain("top-up");
  });

  it("should successfully deduct payment and record debit transaction", async () => {
    // Pay ₹150 for cafeteria
    const res = await request(server)
      .post("/api/student-id/wallet/pay")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ amount: 150, description: "Lunch meal fee" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.walletBalance).toBe(350); // Default 500 - 150 pay

    // Verify transaction log
    const tx = await WalletTransaction.findOne({ userId: res.body.data.userId, type: "debit" });
    expect(tx).not.toBeNull();
    expect(tx.amount).toBe(150);
    expect(tx.description).toBe("Lunch meal fee");
  });

  it("should block payment deduction if wallet balance is insufficient", async () => {
    // Pay ₹600 (default balance is 500)
    const res = await request(server)
      .post("/api/student-id/wallet/pay")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ amount: 600, description: "Library fine fee" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Insufficient balance");
  });

  it("should successfully retrieve transaction ledger list", async () => {
    // Perform topup
    await request(server)
      .post("/api/student-id/wallet/topup")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ amount: 100 });

    // Perform payment
    await request(server)
      .post("/api/student-id/wallet/pay")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ amount: 50 });

    const res = await request(server)
      .get("/api/student-id/wallet/transactions")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].amount).toBe(50);
    expect(res.body.data[0].type).toBe("debit");
    expect(res.body.data[1].amount).toBe(100);
    expect(res.body.data[1].type).toBe("credit");
  });

  it("should block unauthenticated requests with missing authorization token", async () => {
    const res = await request(server).get("/api/student-id/card");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("not logged in");
  });
});
