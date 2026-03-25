import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { deleteStage, updateStage } from "@/lib/stages/stage-service";
import {
  errorResponse,
  invalidRequestError,
  isAppError,
} from "@/lib/validation/api-error";
import { updateStageSchema } from "@/lib/validation/stages";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { id } = await params;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return errorResponse(
        invalidRequestError("Request body must be valid JSON."),
      );
    }

    const parsed = updateStageSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return errorResponse(invalidRequestError("Validation failed", details));
    }

    const stage = await updateStage(id, parsed.data);
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
