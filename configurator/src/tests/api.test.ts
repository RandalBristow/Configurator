import "dotenv/config";
import { randomUUID } from "crypto";
import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../api/app";
import { prisma } from "../prisma/client";

const app = createApp();
const apiKey = process.env.API_KEY;

const withApiKey = (req: request.Test) =>
  apiKey ? req.set("x-api-key", apiKey) : req;

describe("API smoke tests", () => {
  const ids = {
    category: "",
    subcategory: "",
    option: "",
    attribute: "",
  };

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("responds to /health", async () => {
    const res = await withApiKey(request(app).get("/health"));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });

  it("creates a category", async () => {
    const res = await withApiKey(request(app).post("/api/categories")).send({
      name: `TestCat-${randomUUID().slice(0, 6)}`,
      description: "Test category",
      order: 99,
    });
    expect(res.status).toBe(201);
    ids.category = res.body.id;
    expect(ids.category).toBeTruthy();
  });

  it("creates a subcategory under the category", async () => {
    const res = await withApiKey(request(app).post("/api/subcategories")).send({
      categoryId: ids.category,
      name: `TestSub-${randomUUID().slice(0, 6)}`,
      description: "Test subcategory",
      sortOrder: 1,
    });
    expect(res.status).toBe(201);
    ids.subcategory = res.body.id;
    expect(ids.subcategory).toBeTruthy();
  });

  it("creates an option under the subcategory", async () => {
    const res = await withApiKey(request(app).post("/api/options")).send({
      subcategoryId: ids.subcategory,
      code: `OPT-${randomUUID().slice(0, 6)}`,
      name: "Test Option",
      description: "Test option",
      sortOrder: 1,
    });
    expect(res.status).toBe(201);
    ids.option = res.body.id;
    expect(ids.option).toBeTruthy();
  });

  it("creates an attribute under the option", async () => {
    const res = await withApiKey(request(app).post("/api/attributes")).send({
      optionId: ids.option,
      key: `attr_${randomUUID().slice(0, 6)}`,
      label: "Test Attr",
      dataType: "string",
      sortOrder: 1,
    });
    expect(res.status).toBe(201);
    ids.attribute = res.body.id;
    expect(ids.attribute).toBeTruthy();
  });

  it("deep-deletes a category", async () => {
    const res = await withApiKey(
      request(app).delete(`/api/categories/${ids.category}`),
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ids.category);

    const cat = await prisma.category.findUnique({ where: { id: ids.category } });
    expect(cat).toBeNull();
    const sub = await prisma.subcategory.findUnique({ where: { id: ids.subcategory } });
    expect(sub).toBeNull();
    const opt = await prisma.option.findUnique({ where: { id: ids.option } });
    expect(opt).toBeNull();
    const attr = await prisma.attribute.findUnique({ where: { id: ids.attribute } });
    expect(attr).toBeNull();
  });
});
