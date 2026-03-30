import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { reorderStages } from "@/lib/stages/stage-service";
import { errorResponse, isAppError } from "@/lib/validation/api-error";
import { parseAndValidate } from "@/lib/validation/request-helpers";
import { reorderStagesSchema } from "@/lib/validation/stages";

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser();

    const data = await parseAndValidate(request, reorderStagesSchema);
    const stages = await reorderStages(data);
    return NextResponse.json({ stages });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
