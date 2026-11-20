import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  compressToWebp,
  extensionForFormat,
  inspectImage,
  makeThumbnail,
  mimeToFormat,
} from "../../src/lib/image.js";

async function png(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 30, g: 120, b: 200 },
    },
  })
    .png()
    .toBuffer();
}

describe("inspectImage", () => {
  it("returns format and dimensions for a valid image", async () => {
    const info = await inspectImage(await png(320, 200));
    expect(info).not.toBeNull();
    expect(info?.format).toBe("png");
    expect(info?.width).toBe(320);
    expect(info?.height).toBe(200);
    expect(info?.size).toBeGreaterThan(0);
  });

  it("returns null for a non-image buffer", async () => {
    const info = await inspectImage(Buffer.from("not an image at all", "utf8"));
    expect(info).toBeNull();
  });

  it("returns null for an empty buffer", async () => {
    expect(await inspectImage(Buffer.alloc(0))).toBeNull();
  });
});

describe("mimeToFormat / extensionForFormat", () => {
  it("maps MIME types to formats and back", () => {
    expect(mimeToFormat("image/png")).toBe("png");
    expect(mimeToFormat("image/jpeg")).toBe("jpeg");
    expect(mimeToFormat("image/webp")).toBe("webp");
    expect(mimeToFormat("image/gif")).toBeUndefined();
    expect(extensionForFormat("jpeg")).toBe("jpg");
    expect(extensionForFormat("png")).toBe("png");
  });
});

describe("compressToWebp", () => {
  it("constrains the longest side to maxDimension without upscaling", async () => {
    const input = await png(2000, 1500);
    const out = await compressToWebp(input, 1000);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(1000);
    expect(meta.width).toBe(1000);
    expect(meta.height).toBe(750);
  });

  it("does not upscale small images", async () => {
    const input = await png(100, 80);
    const out = await compressToWebp(input, 1600);
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(80);
  });
});

describe("makeThumbnail", () => {
  it("produces a square cover thumbnail", async () => {
    const input = await png(640, 480);
    const out = await makeThumbnail(input, 300);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(300);
    expect(meta.height).toBe(300);
  });
});
