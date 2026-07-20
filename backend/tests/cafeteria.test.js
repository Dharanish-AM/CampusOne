const request = require("supertest");
const server = require("../src/index");
const CanteenItem = require("../src/models/CanteenItem");
const CanteenOrder = require("../src/models/CanteenOrder");

describe("Cafeteria API Test Suite", () => {
  let studentToken = "";
  let studentId = "";
  let item1Id = "";
  let item2Id = "";
  let orderId = "";

  beforeEach(async () => {
    // 1. Create a mock student
    const studentRes = await request(server).post("/api/auth/register").send({
      name: "Cafeteria Student",
      email: "canteen_stud@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-CANT-1",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.profile._id;

    // 2. Insert mock Canteen Items
    const item1 = await CanteenItem.create({
      name: "Idly with Sambar",
      price: 30,
      description: "Steamed rice cakes served with hot sambar",
      category: "breakfast",
      isAvailable: true,
      preparationTime: 10,
    });
    item1Id = item1._id;

    const item2 = await CanteenItem.create({
      name: "Masala Dosa",
      price: 50,
      description: "Crispy crepe with spiced potato filling",
      category: "breakfast",
      isAvailable: true,
      preparationTime: 12,
    });
    item2Id = item2._id;
  });

  it("should successfully retrieve canteen menu items", async () => {
    const res = await request(server)
      .get("/api/cafeteria/menu")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].name).toBe("Idly with Sambar");
  });

  it("should successfully place a pre-order", async () => {
    const res = await request(server)
      .post("/api/cafeteria/order")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        items: [
          { itemId: item1Id, quantity: 2 }, // 60
          { itemId: item2Id, quantity: 1 }, // 50
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.totalAmount).toBe(110);
    expect(res.body.data.pickupToken).toBeDefined();
    expect(res.body.data.status).toBe("pending");

    orderId = res.body.data._id;
    const checkOrder = await CanteenOrder.findById(orderId);
    expect(checkOrder).not.toBeNull();
    expect(checkOrder.pickupToken).toBe(res.body.data.pickupToken);
  });

  it("should successfully retrieve student order history", async () => {
    // Populate an order first
    await CanteenOrder.create({
      studentId,
      items: [{ itemId: item1Id, quantity: 1 }],
      totalAmount: 30,
      pickupToken: "C1-HIST",
    });

    const res = await request(server)
      .get("/api/cafeteria/orders/history")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].pickupToken).toBe("C1-HIST");
  });

  it("should successfully update order status as admin", async () => {
    // Generate order
    const order = await CanteenOrder.create({
      studentId,
      items: [{ itemId: item1Id, quantity: 1 }],
      totalAmount: 30,
      pickupToken: "C1-STAT",
    });

    // Create admin user and token
    const adminRes = await request(server).post("/api/auth/register").send({
      name: "Cafeteria Administrator",
      email: "canteen_admin@campusone.edu",
      password: "password123",
      role: "admin",
    });
    const adminToken = adminRes.body.data.accessToken;

    // Transition status to ready
    const res = await request(server)
      .patch(`/api/cafeteria/order/${order._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "ready" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.status).toBe("ready");

    const checkOrder = await CanteenOrder.findById(order._id);
    expect(checkOrder.status).toBe("ready");
  });

  it("should block requests with missing authorization token", async () => {
    const res = await request(server).get("/api/cafeteria/menu");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("not logged in");
  });
});
