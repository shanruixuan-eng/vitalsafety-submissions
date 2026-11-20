import { env } from "cloudflare:workers";
import { IMAGE_TYPES, uuidPattern, type StoredPicture } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; image: string }> }) {
  const { id, image } = await params;
  if (!uuidPattern.test(id) || !/^[0-4]$/.test(image)) return new Response(null, { status: 404 });
  if (!env.DB || !env.BUCKET) return new Response(null, { status: 503 });
  const row = await env.DB.prepare("SELECT images FROM submissions WHERE id = ?").bind(id).first<{ images: string }>();
  if (!row) return new Response(null, { status: 404 });
  const file = (JSON.parse(row.images) as StoredPicture[])[Number(image)];
  if (!file || !IMAGE_TYPES.includes(file.type)) return new Response(null, { status: 404 });
  const object = await env.BUCKET.get(file.key);
  if (!object) return new Response(null, { status: 404 });
  const extension = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[file.type];
  const filename = file.name.toWellFormed().replace(/[!'()*]/g, "_");
  return new Response(object.body, { headers: {
    "Content-Type": file.type,
    "Content-Length": String(object.size),
    "Cache-Control": "private, no-store",
    "Content-Disposition": `inline; filename="photo.${extension}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "X-Content-Type-Options": "nosniff",
  } });
}
