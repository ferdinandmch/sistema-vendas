import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { getDeal, updateDeal } from "@/lib/deals/deal-service";
import {
  errorResponse,
  invalidRequestError,
  isAppError,
} from "@/lib/validation/api-error";
import { updateDealSchema } from "@/lib/validation/deals";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthenticatedUser();
    const { id } = await context.params;

    const deal = await getDeal(id, user.id);
    return NextResponse.json({ deal });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}

export async function PUT(request: Request, context: RouteContext) {
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

    const parsed = updateDealSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return errorResponse(invalidRequestError("Validation failed", details));
    }

    const deal = await updateDeal(id, parsed.data, user.id);
    return NextResponse.json({ deal });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
