import { NextResponse } from "next/server";

import { listStageHistory } from "@/lib/history/history-service";
import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { errorResponse, isAppError } from "@/lib/validation/api-error";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthenticatedUser();
    const { id } = await context.params;

    const history = await listStageHistory(id, user.id);
    return NextResponse.json({ history });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
