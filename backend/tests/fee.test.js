const request = require("supertest");
const server = require("../src/index");
const FeeStructure = require("../src/models/FeeStructure");
const FeeInvoice = require("../src/models/FeeInvoice");
const TransactionLog = require("../src/models/TransactionLog");

describe("Fees API Test Suite", () => {
  let studentToken = "";
  let studentId = "";
  let feeStructureId = "";
  let invoiceId = "";

  beforeEach(async () => {
    // 1. Create a mock student
    const studentRes = await request(server).post("/api/auth/register").send({
      name: "Billing Student",
      email: "billing_stud@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-BILL-1",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.profile._id;

    // 2. Insert mock FeeStructure
    const feeStructure = await FeeStructure.create({
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
      tuitionFee: 60000,
      hostelFee: 15000,
      labFee: 5000,
      examFee: 2000,
      otherDues: 1000,
    });
    feeStructureId = feeStructure._id;

    // 3. Insert mock FeeInvoice
    const feeInvoice = await FeeInvoice.create({
      studentId,
      feeStructureId,
      title: "Semester 5 Tuition Dues",
      amountDue: feeStructure.totalAmount, // 83000
      amountPaid: 0,
      status: "pending",
      dueDate: new Date(Date.now() + 3600 * 1000 * 24 * 30), // 30 days due
    });
    invoiceId = feeInvoice._id;
  });

  it("should successfully retrieve invoices for the student", async () => {
    const res = await request(server)
      .get("/api/fees/invoices")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Semester 5 Tuition Dues");
    expect(res.body.data[0].feeStructureId._id.toString()).toBe(feeStructureId.toString());
  });

  it("should successfully initiate checkout payment", async () => {
    const res = await request(server)
      .post(`/api/fees/pay/${invoiceId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ paymentMethod: "UPI" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.amount).toBe(83000);
    expect(res.body.data.gatewayReference).toBeDefined();

    const checkLog = await TransactionLog.findOne({ invoiceId });
    expect(checkLog).not.toBeNull();
    expect(checkLog.status).toBe("pending");
  });

  it("should successfully capture payment webhook and resolve invoice", async () => {
    // Initiate payment to generate gateway reference
    const payRes = await request(server)
      .post(`/api/fees/pay/${invoiceId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ paymentMethod: "Card" });

    const gatewayReference = payRes.body.data.gatewayReference;

    // Trigger webhook callback
    const hookRes = await request(server)
      .post("/api/fees/webhook")
      .send({ gatewayReference, status: "success" });

    expect(hookRes.status).toBe(200);
    expect(hookRes.body.status).toBe("success");
    expect(hookRes.body.data.status).toBe("success");

    // Verify invoice status updated
    const updatedInvoice = await FeeInvoice.findById(invoiceId);
    expect(updatedInvoice.status).toBe("paid");
    expect(updatedInvoice.amountPaid).toBe(83000);
    expect(updatedInvoice.paymentDate).toBeDefined();
  });

  it("should block requests with missing authorization token", async () => {
    const res = await request(server).get("/api/fees/invoices");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("not logged in");
  });
});
