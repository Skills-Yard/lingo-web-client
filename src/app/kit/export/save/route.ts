import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Writes one module's data file (development only; the exporter page calls it). */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not available", { status: 404 });
  const { id, data } = (await request.json()) as { id?: unknown; data?: unknown };
  if (typeof id !== "string" || !/^[a-z]+$/.test(id) || typeof data !== "object" || data === null) return new Response("Bad request", { status: 400 });
  const directory = path.join(process.cwd(), "src", "data", "modules");
  await mkdir(directory, { recursive: true });
  const text = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(path.join(directory, `${id}.json`), text, "utf8");
  return Response.json({ bytes: Buffer.byteLength(text) });
}
