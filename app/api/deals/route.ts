import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { createDeal, listDeals } from "@/lib/deals/deal-service";
import { errorResponse, isAppError } from "@/lib/validation/api-error";
import { parseAndValidate } from "@/lib/validation/request-helpers";
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

    const data = await parseAndValidate(request, createDealSchema);
    const deal = await createDeal(data, user.id);
    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
