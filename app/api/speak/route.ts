// architecture placeholder — implementation: Kiro spec `ghost-narrator`. Contract: lib/api/contracts.ts.
// Node.js is the default runtime. Do NOT add `export const runtime` — it is rejected while `cacheComponents` is on.
import type { ApiError } from "@/lib/api/contracts";

export async function POST(): Promise<Response> {
  const body: ApiError = { error: "NotImplemented", message: "/api/speak is not implemented yet" };
  return Response.json(body, { status: 501 });
}
