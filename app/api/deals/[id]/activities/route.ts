import { NextResponse } from "next/server";

import {
  createActivity,
  listActivities,
} from "@/lib/activities/activity-service";
import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { errorResponse, isAppError } from "@/lib/validation/api-error";
import { parseAndValidate } from "@/lib/validation/request-helpers";
import { createActivitySchema } from "@/lib/validation/activities";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthenticatedUser();
    const { id } = await context.params;

    const data = await parseAndValidate(request, createActivitySchema);
    const activity = await createActivity(id, data, user.id);
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
