import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-auth";
import { errorResponse, isAppError } from "@/lib/validation/api-error";

export async function GET() {
  try {
    const authContext = await requireAuthenticatedUser();

    return NextResponse.json({
      user: {
        id: authContext.user.id,
        clerkUserId: authContext.clerkUserId,
        email: authContext.user.email,
        name: authContext.user.name,
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }

    return errorResponse({
      code: "SYNC_FAILED",
      message: "Unable to resolve authenticated user context.",
      status: 500,
    });
  }
}

