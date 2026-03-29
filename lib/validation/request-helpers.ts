import type { ZodSchema } from "zod";

import { invalidRequestError } from "@/lib/validation/api-error";

export async function parseAndValidate<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw invalidRequestError("Invalid JSON body");
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw invalidRequestError("Validation failed", details);
  }

  return parsed.data;
}
