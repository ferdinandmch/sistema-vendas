import { ZodTypeAny } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { invalidRequestError } from "@/lib/validation/api-error";

export async function validateAuthenticatedJson<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const auth = await requireAuthenticatedUser();

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    throw invalidRequestError("Request body must be valid JSON.");
  }

  const parsedBody = schema.safeParse(rawBody);

  if (!parsedBody.success) {
    throw invalidRequestError(parsedBody.error.message);
  }

  return {
    auth,
    data: parsedBody.data,
  };
}

