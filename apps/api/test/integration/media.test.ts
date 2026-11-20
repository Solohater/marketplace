import { mkdir, rm } from "node:fs/promises";
import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { sql } from "../../src/db/client.js";
import {
  extractTokenFromEmailText,
  lastEmail,
  resetMessages,
  truncateAll,
} from "../helpers.js";

let app: Express;
let pngBuffer: Buffer;

beforeAll(async () => {
  await rm(env.LOCAL_STORAGE_BASE_DIR, { recursive: true, force: true });
  await mkdir(env.LOCAL_STORAGE_BASE_DIR, { recursive: true });
  app = await createApp();
  pngBuffer = await sharp({
    create: { width: 320, height: 240, channels: 3, background: { r: 200, g: 40, b: 40 } },
  })
    .png()
    .toBuffer();
});

beforeEach(async () => {
  await truncateAll();
  resetMessages();
  await rm(env.LOCAL_STORAGE_BASE_DIR, { recursive: true, force: true });
  await mkdir(env.LOCAL_STORAGE_BASE_DIR, { recursive: true });
});

afterAll(async () => {
  await sql.end();
});

async function registerAndLogin(name: string, email: string): Promise<request.Agent> {
  await request(app).post("/api/auth/register").send({
    fullName: name,
    email,
    password: "secret123",
  });
  const emailText = lastEmail()?.text ?? "";
  const token = extractTokenFromEmailText(emailText);
  const verify = await request(app).get(`/api/auth/verify-email?token=${token}`);
  expect(verify.status).toBe(200);
  const agent = request.agent(app);
  const login = await agent.post("/api/auth/login").send({ identifier: email, password: "secret123" });
  expect(login.status).toBe(200);
  return agent;
}

interface PresignResult {
  uploadUrl: string;
  key: string;
}

function firstPresignItem(res: request.Response): PresignResult {
  const item = (res.body.data.items as PresignResult[])[0];
  if (!item) throw new Error("Presign returned no items");
  return item;
}

async function presignUploadAndConfirm(
  agent: request.Agent,
  body: Buffer = pngBuffer
): Promise<{ id: string; url: string; thumbnailUrl: string | null }> {
  const presign = await agent
    .post("/api/media/presign")
    .send({ purpose: "listing", files: [{ mimeType: "image/png", size: body.length }] });
  expect(presign.status).toBe(200);
  const item = firstPresignItem(presign);

  const upload = await request(app)
    .put(item.uploadUrl)
    .set("Content-Type", "image/png")
    .send(body);
  expect(upload.status).toBe(200);

  const confirm = await agent.post("/api/media/confirm").send({ key: item.key, position: 0 });
  expect(confirm.status).toBe(201);
  return {
    id: confirm.body.data.media.id,
    url: confirm.body.data.media.url,
    thumbnailUrl: confirm.body.data.media.thumbnailUrl,
  };
}

describe("media API (local provider)", () => {
  it("rejects unauthenticated access", async () => {
    const res = await request(app).get("/api/media");
    expect(res.status).toBe(401);
  });

  it("presign validates allowed mime types", async () => {
    const agent = await registerAndLogin("User A Test", "a@example.com");
    const res = await agent
      .post("/api/media/presign")
      .send({ purpose: "listing", files: [{ mimeType: "image/gif", size: 100 }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("presign enforces the 10-image batch limit", async () => {
    const agent = await registerAndLogin("User B Test", "b@example.com");
    const files = Array.from({ length: 11 }, () => ({ mimeType: "image/png" as const, size: 100 }));
    const res = await agent.post("/api/media/presign").send({ purpose: "chat", files });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("presign rejects a file declared over the size limit", async () => {
    const agent = await registerAndLogin("User C Test", "c@example.com");
    const res = await agent
      .post("/api/media/presign")
      .send({ purpose: "avatar", files: [{ mimeType: "image/png", size: 11 * 1024 * 1024 }] });
    expect(res.status).toBe(400);
  });

  it("rejects an upload with a forged signature", async () => {
    const agent = await registerAndLogin("User D Test", "d@example.com");
    const presign = await agent
      .post("/api/media/presign")
      .send({ purpose: "listing", files: [{ mimeType: "image/png", size: pngBuffer.length }] });
    const item = firstPresignItem(presign);
    const url = new URL(item.uploadUrl, "http://localhost");
    const res = await request(app)
      .put(`/api/media/upload/${encodeURIComponent(item.key)}?expires=${url.searchParams.get("expires")}&token=deadbeef`)
      .send(pngBuffer);
    expect(res.status).toBe(403);
  });

  it("rejects an upload whose body exceeds the size limit", async () => {
    const agent = await registerAndLogin("User E Test", "e@example.com");
    const presign = await agent
      .post("/api/media/presign")
      .send({ purpose: "listing", files: [{ mimeType: "image/png", size: 100 }] });
    const item = firstPresignItem(presign);
    const res = await request(app)
      .put(item.uploadUrl)
      .set("Content-Type", "image/png")
      .send(Buffer.alloc(10 * 1024 * 1024 + 1, 0x61));
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("MEDIA_FILE_TOO_LARGE");
  });

  it("confirms an uploaded image and serves it raw with a thumbnail", async () => {
    const agent = await registerAndLogin("User F Test", "f@example.com");
    const media = await presignUploadAndConfirm(agent);

    const raw = await request(app).get(media.url);
    expect(raw.status).toBe(200);
    expect(raw.headers["content-type"]).toContain("image/webp");

    const thumb = await request(app).get(media.thumbnailUrl ?? "");
    expect(thumb.status).toBe(200);
    const meta = await sharp(thumb.body).metadata();
    expect(meta.width).toBe(env.THUMBNAIL_SIZE);
  });

  it("rejects confirm for a non-image upload", async () => {
    const agent = await registerAndLogin("User G Test", "g@example.com");
    const presign = await agent
      .post("/api/media/presign")
      .send({ purpose: "listing", files: [{ mimeType: "image/png", size: 100 }] });
    const item = firstPresignItem(presign);
    await request(app).put(item.uploadUrl).set("Content-Type", "image/png").send("hello world");
    const res = await agent.post("/api/media/confirm").send({ key: item.key });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("MEDIA_INVALID_TYPE");
  });

  it("forbids confirming another user's key", async () => {
    const a = await registerAndLogin("User H Test", "h@example.com");
    const b = await registerAndLogin("User I Test", "i@example.com");
    const presign = await a
      .post("/api/media/presign")
      .send({ purpose: "listing", files: [{ mimeType: "image/png", size: pngBuffer.length }] });
    const item = firstPresignItem(presign);
    await request(app).put(item.uploadUrl).set("Content-Type", "image/png").send(pngBuffer);
    const res = await b.post("/api/media/confirm").send({ key: item.key });
    expect(res.status).toBe(403);
  });

  it("lists media with pagination and deletes it", async () => {
    const agent = await registerAndLogin("User J Test", "j@example.com");
    const first = await presignUploadAndConfirm(agent);
    const second = await presignUploadAndConfirm(agent);

    const page1 = await agent.get("/api/media?page=1&pageSize=1");
    expect(page1.status).toBe(200);
    expect(page1.body.data.items).toHaveLength(1);
    expect(page1.body.data.total).toBe(2);
    expect(page1.body.data.totalPages).toBe(2);

    const listed = await agent.get("/api/media?purpose=listing");
    expect(listed.body.data.items).toHaveLength(2);

    const del = await agent.delete(`/api/media/${first.id}`);
    expect(del.status).toBe(200);
    expect(del.body.data.deleted).toBe(true);

    const gone = await request(app).get(first.url);
    expect(gone.status).toBe(404);

    const after = await agent.get("/api/media");
    expect(after.body.data.total).toBe(1);
    expect(after.body.data.items[0].id).toBe(second.id);
  });

  it("returns 404 when deleting a non-existent media row", async () => {
    const agent = await registerAndLogin("User K Test", "k@example.com");
    const res = await agent.delete("/api/media/00000000-0000-4000-8000-000000000000");
    expect(res.status).toBe(404);
  });
});
