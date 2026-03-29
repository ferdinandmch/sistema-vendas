import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { createStage, listStages } from "@/lib/stages/stage-service";
import { errorResponse, isAppError } from "@/lib/validation/api-error";
import { parseAndValidate } from "@/lib/validation/request-helpers";
import { createStageSchema } from "@/lib/validation/stages";

export async function GET() {
  try {
    await requireAuthenticatedUser();
    const stages = await listStages();
    return NextResponse.json({ stages });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser();

    const data = await parseAndValidate(request, createStageSchema);
    const stage = await createStage(data);
    return NextResponse.json({ stage }, { status: 201 });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
