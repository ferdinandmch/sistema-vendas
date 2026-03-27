import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { createDeal, listDeals } from "@/lib/deals/deal-service";
import {
  errorResponse,
  invalidRequestError,
  isAppError,
} from "@/lib/validation/api-error";
import { createDealSchema } from "@/lib/validation/deals";

export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser();
    const deals = await listDeals(user.id);
    return NextResponse.json({ deals });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthenticatedUser();

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return errorResponse(
        invalidRequestError("Request body must be valid JSON."),
      );
    }

    const parsed = createDealSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return errorResponse(invalidRequestError("Validation failed", details));
    }

    const deal = await createDeal(parsed.data, user.id);
    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
