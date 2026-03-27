import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { moveDeal } from "@/lib/deals/deal-service";
import {
  errorResponse,
  invalidRequestError,
  isAppError,
} from "@/lib/validation/api-error";
import { moveDealSchema } from "@/lib/validation/deals";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthenticatedUser();
    const { id } = await context.params;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return errorResponse(
        invalidRequestError("Request body must be valid JSON."),
      );
    }

    const parsed = moveDealSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return errorResponse(invalidRequestError("Validation failed", details));
    }

    const deal = await moveDeal(id, parsed.data.toStageId, user.id);
    return NextResponse.json({ deal });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
