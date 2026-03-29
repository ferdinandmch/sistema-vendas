import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { getDeal, updateDeal } from "@/lib/deals/deal-service";
import { errorResponse, isAppError } from "@/lib/validation/api-error";
import { parseAndValidate } from "@/lib/validation/request-helpers";
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

    const data = await parseAndValidate(request, updateDealSchema);
    const deal = await updateDeal(id, data, user.id);
    return NextResponse.json({ deal });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
