import { env } from "cloudflare:workers";
import {
  checkDraft, getFields, getProductFields, isCategory, MAX_TOTAL_BYTES, parseProducts, uuidPattern,
  type Picture, type Receipt, type StoredPicture,
} from "@/lib/submissions";

export const dynamic = "force-dynamic";
const response = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

type Row = {
  id: string;
  category: string;
  title: string;
  fields: string;
  images: string;
  created_at: string;
};

export async function GET(request: Request) {
  if (!env.DB) return response({ message: "暂时无法读取稿件，请稍后重试。" }, 503);
  const page = Number(new URL(request.url).searchParams.get("page") ?? 1);
  if (!Number.isSafeInteger(page) || page < 1) return response({ message: "页码无效。" }, 400);
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, category, title, json_remove(fields, '$.contact') AS fields, images, created_at
       FROM submissions ORDER BY created_at DESC, id DESC LIMIT 21 OFFSET ?`
    ).bind((page - 1) * 20).all<Row>();
    const submissions = results.slice(0, 20).map((row) => ({
      id: row.id, category: row.category, title: row.title,
      fields: JSON.parse(row.fields),
      images: (JSON.parse(row.images) as StoredPicture[]).map(({ name, caption, type, size, source, permission }) => ({ name, caption, type, size, source, permission })),
      createdAt: row.created_at,
    }));
    return response({ submissions, hasMore: results.length > 20 });
  } catch {
    return response({ message: "暂时无法读取稿件，请稍后重试。" }, 503);
  }
}

function matchesMagic(type: string, bytes: Uint8Array) {
  const has = (start: number, signature: number[]) => signature.every((value, index) => bytes[start + index] === value);
  if (type === "image/png") return has(0, [137, 80, 78, 71, 13, 10, 26, 10]);
  if (type === "image/jpeg") return has(0, [255, 216, 255]);
  return type === "image/webp" && has(0, [82, 73, 70, 70]) && has(8, [87, 69, 66, 80]);
}

export async function POST(request: Request) {
  // Hosted access to this editor desk and its API is restricted by the private Site.
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  const forwardedOrigin = request.headers.get("x-forwarded-host")
    ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host")}`
    : requestOrigin;
  if (origin && origin !== requestOrigin && origin !== forwardedOrigin) {
    return response({ message: "请从供稿页面提交。" }, 403);
  }
  if (!env.DB || !env.BUCKET) return response({ message: "暂时无法保存稿件，请保留页面并稍后重试。" }, 503);
  if (Number(request.headers.get("content-length")) > MAX_TOTAL_BYTES + 512 * 1024) {
    return response({ message: "全部图片合计须在 24 MB 以内。" }, 413);
  }
  const form = await request.formData().catch(() => null);
  if (!form) return response({ message: "稿件格式有误，请返回检查。" }, 400);
  const category = form.get("category");
  const id = form.get("id");
  if (!isCategory(category) || typeof id !== "string" || !uuidPattern.test(id)) {
    return response({ message: "投稿标识无效，请重新进入表单。" }, 400);
  }

  const find = async () => {
    const row = await env.DB!.prepare("SELECT id, category, title, created_at FROM submissions WHERE id = ?")
      .bind(id).first<Pick<Row, "id" | "category" | "title" | "created_at">>();
    if (!row) return null;
    const receipt = { id: row.id, category: row.category, title: row.title, createdAt: row.created_at };
    return receipt as Receipt;
  };
  const fields = Object.fromEntries(getFields(category).map(({ key }) => {
    const value = form.get(key);
    return [key, typeof value === "string" ? value.trim() : ""];
  }));
  const products = form.get("products");
  fields.products = JSON.stringify(
    parseProducts(typeof products === "string" ? products : undefined).map((product) =>
      Object.fromEntries(getProductFields(category).map(({ key }) => [key, product[key]?.trim() ?? ""]))
    )
  );
  const files = form.getAll("image");
  const noPhotos = form.get("noPhotos");
  if (!files.length && typeof noPhotos === "string") fields.noPhotos = noPhotos.trim();
  const captions = form.getAll("caption");
  const sources = form.getAll("source");
  const permissions = form.getAll("permission");
  if (files.some((file) => typeof file === "string") || files.length !== captions.length) {
    return response({ message: "图片资料格式有误，请返回检查。" }, 400);
  }
  const uploads = files as File[];
  const images: Picture[] = uploads.map((file, index) => ({
    name: file.name.slice(0, 180), type: file.type, size: file.size,
    caption: typeof captions[index] === "string" ? captions[index].trim() : "",
    source: typeof sources[index] === "string" ? sources[index].trim() : "",
    permission: typeof permissions[index] === "string" ? permissions[index] : "",
  }));
  const errors = checkDraft(category, fields, images, form.get("confirmed") === "yes");
  if (Object.keys(errors).length) return response({ message: "请补齐表单中的项目。", errors }, 422);
  for (const [index, file] of uploads.entries()) {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!matchesMagic(file.type, bytes)) {
      return response({
        message: "有图片无法识别，请返回更换。",
        errors: { [`image-${index}`]: "图片内容与文件格式不符，请更换。" },
      }, 422);
    }
  }

  const prefix = `submissions/${id}/${crypto.randomUUID()}`;
  const uploadedKeys: string[] = [];
  const storedImages: StoredPicture[] = [];
  const cleanup = () => uploadedKeys.length
    ? env.BUCKET!.delete(uploadedKeys).catch(() => undefined)
    : Promise.resolve();
  let insertStarted = false;

  try {
    const existing = await find();
    if (existing) return response({ receipt: existing });
    for (const [index, file] of uploads.entries()) {
      const key = `${prefix}/${index}`;
      uploadedKeys.push(key);
      await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
      storedImages.push({ ...images[index], key });
    }
    const createdAt = new Date().toISOString();
    insertStarted = true;
    const saved = await env.DB.prepare(
      "INSERT INTO submissions (id, category, title, fields, images, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING"
    ).bind(id, category, fields.title, JSON.stringify(fields), JSON.stringify(storedImages), createdAt).run();

    if (saved.meta.changes === 0) {
      await cleanup();
      const receipt = await find();
      if (receipt) return response({ receipt });
      throw new Error("Existing submission unavailable");
    }
    return response({ receipt: { id, category, title: fields.title, createdAt } }, 201);
  } catch (error) {
    console.error("Submission storage error", error instanceof Error ? error.message : "unknown");
    if (!insertStarted) await cleanup();
    else {
      try {
        const saved = await env.DB.prepare("SELECT images FROM submissions WHERE id = ?")
          .bind(id).first<Pick<Row, "images">>();
        if (saved) {
          if (!(JSON.parse(saved.images) as StoredPicture[]).some(({ key }) => key.startsWith(prefix + "/"))) await cleanup();
          const receipt = await find();
          if (receipt) return response({ receipt });
        }
        // Keep uploads when commit status is uncertain so a saved record retains its images.
      } catch {}
    }
    return response({ message: "暂时无法保存稿件，请保留页面并稍后重试。" }, 503);
  }
}
