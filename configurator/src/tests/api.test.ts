import "dotenv/config";
import { randomUUID } from "crypto";
import request from "supertest";
import { describe, it, expect, afterAll } from "vitest";
import { createApp } from "../api/app";
import { prisma } from "../prisma/client";

const app = createApp();
const apiKey = process.env.API_KEY;

const withApiKey = (req: request.Test) =>
  apiKey ? req.set("x-api-key", apiKey) : req;

describe("API smoke tests", () => {
  const ids = {
    option: "",
    variable: "",
  };

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("responds to /health", async () => {
    const res = await withApiKey(request(app).get("/health"));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });

  it("creates an option", async () => {
    const res = await withApiKey(request(app).post("/api/options")).send({
      name: "Test Option",
      description: "Test option",
      isActive: true,
      optionType: "simple",
    });
    expect(res.status).toBe(201);
    ids.option = res.body.id;
    expect(ids.option).toBeTruthy();
  });

  it("creates a variable under the option", async () => {
    const res = await withApiKey(request(app).post("/api/variables")).send({
      optionId: ids.option,
      name: `var_${randomUUID().slice(0, 6)}`,
      description: "Test variable",
      dataType: "string",
      sortOrder: 1,
    });
    expect(res.status).toBe(201);
    ids.variable = res.body.id;
    expect(ids.variable).toBeTruthy();
  });

  it("deactivates an option and its variables", async () => {
    const res = await withApiKey(request(app).delete(`/api/options/${ids.option}`));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ids.option);
    expect(res.body.isActive).toBe(false);

    const opt = await prisma.option.findUnique({ where: { id: ids.option } });
    const variable = await prisma.variable.findUnique({ where: { id: ids.variable } });
    expect(opt?.isActive).toBe(false);
    expect(variable?.isActive).toBe(false);

    if (variable) await prisma.variable.delete({ where: { id: ids.variable } });
    if (opt) await prisma.option.delete({ where: { id: ids.option } });
  });
});
