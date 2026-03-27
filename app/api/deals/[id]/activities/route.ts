import { NextResponse } from "next/server";

import {
  createActivity,
  listActivities,
} from "@/lib/activities/activity-service";
import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import {
  errorResponse,
  invalidRequestError,
  isAppError,
} from "@/lib/validation/api-error";
import { createActivitySchema } from "@/lib/validation/activities";

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

    const parsed = createActivitySchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return errorResponse(invalidRequestError("Validation failed", details));
    }

    const activity = await createActivity(id, parsed.data, user.id);
    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthenticatedUser();
    const { id } = await context.params;

    const activities = await listActivities(id, user.id);
    return NextResponse.json({ activities });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }
    throw error;
  }
}
