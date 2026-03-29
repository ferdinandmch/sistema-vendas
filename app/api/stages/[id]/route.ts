import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { deleteStage, updateStage } from "@/lib/stages/stage-service";
import { errorResponse, isAppError } from "@/lib/validation/api-error";
import { parseAndValidate } from "@/lib/validation/request-helpers";
import { updateStageSchema } from "@/lib/validation/stages";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { id } = await params;

    const data = await parseAndValidate(request, updateStageSchema);
    const stage = await updateStage(id, data);
    return NextResponse.json({ stage });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { id } = await params;

    await deleteStage(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
