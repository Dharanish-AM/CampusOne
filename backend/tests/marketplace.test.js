const request = require("supertest");
const server = require("../src/index");
const Student = require("../src/models/Student");
const MarketplaceProduct = require("../src/models/MarketplaceProduct");

describe("Marketplace API Test Suite", () => {
  let sellerToken = "";
  let sellerStudentId = "";
  let product1Id = "";

  beforeEach(async () => {
    // 1. Create a mock seller student
    const sellerRes = await request(server).post("/api/auth/register").send({
      name: "Seller Student",
      email: "seller_stud@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-SELL-1",
      department: "Information Technology",
      semester: 6,
      batch: "2023-2027",
    });
    sellerToken = sellerRes.body.data.accessToken;
    sellerStudentId = sellerRes.body.data.profile._id;

    // 2. Insert mock product listing
    const product = await MarketplaceProduct.create({
      studentId: sellerStudentId,
      title: "Second Hand Bicycle",
      description: "Hero Ranger cycle in excellent condition, 1 year old.",
      price: 2500,
      category: "cycles",
      status: "available",
    });
    product1Id = product._id;
  });

  it("should successfully retrieve available products catalog", async () => {
    const res = await request(server)
      .get("/api/marketplace/products")
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Second Hand Bicycle");
    expect(res.body.data[0].studentId.userId.name).toBe("Seller Student");
  });

  it("should successfully post a new product listing", async () => {
    const res = await request(server)
      .post("/api/marketplace/product")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        title: "Engineering Physics Textbook",
        description: "Latest edition, completely unused.",
        price: 350,
        category: "textbooks",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.title).toBe("Engineering Physics Textbook");
    expect(res.body.data.price).toBe(350);
    expect(res.body.data.status).toBe("available");

    const checkProduct = await MarketplaceProduct.findById(res.body.data._id);
    expect(checkProduct).not.toBeNull();
    expect(checkProduct.title).toBe("Engineering Physics Textbook");
  });

  it("should successfully retrieve logged-in student listings", async () => {
    const res = await request(server)
      .get("/api/marketplace/my-listings")
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Second Hand Bicycle");
  });

  it("should successfully update product listing status to sold as owner", async () => {
    const res = await request(server)
      .patch(`/api/marketplace/product/${product1Id}/status`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "sold" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.status).toBe("sold");

    const checkProduct = await MarketplaceProduct.findById(product1Id);
    expect(checkProduct.status).toBe("sold");
  });

  it("should block non-owner from updating listing status", async () => {
    // Create another student
    const otherRes = await request(server).post("/api/auth/register").send({
      name: "Other Student",
      email: "other_stud@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-OTHER-1",
      department: "Mechanical Science",
      semester: 4,
      batch: "2024-2028",
    });
    const otherToken = otherRes.body.data.accessToken;

    const res = await request(server)
      .patch(`/api/marketplace/product/${product1Id}/status`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ status: "sold" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Unauthorized to modify");
  });

  it("should block unauthenticated requests with missing authorization token", async () => {
    const res = await request(server).get("/api/marketplace/products");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("not logged in");
  });
});
