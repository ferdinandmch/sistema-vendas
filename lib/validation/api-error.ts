import { NextResponse } from "next/server";

export type AppErrorCode =
  | "UNAUTHORIZED"
  | "SYNC_FAILED"
  | "INVALID_REQUEST"
  | "STAGE_NOT_FOUND"
  | "DUPLICATE_STAGE_NAME"
  | "DUPLICATE_STAGE_POSITION"
  | "INVALID_FINAL_TYPE"
  | "STAGE_HAS_DEALS";

export type FieldError = {
  field: string;
  message: string;
};

export type AppErrorLike = {
  code: AppErrorCode;
  message: string;
  status: number;
  details?: FieldError[];
};

export class AppError extends Error implements AppErrorLike {
  code: AppErrorCode;
  status: number;
  details?: FieldError[];

  constructor(
    code: AppErrorCode,
    message: string,
    status: number,
    details?: FieldError[],
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function unauthorizedError() {
  return new AppError(
    "UNAUTHORIZED",
    "Authentication is required for this resource.",
    401,
  );
}

export function syncFailedError(message = "Unable to synchronize authenticated user.") {
  return new AppError("SYNC_FAILED", message, 500);
}

export function invalidRequestError(message: string, details?: FieldError[]) {
  return new AppError("INVALID_REQUEST", message, 400, details);
}

export function stageNotFoundError() {
  return new AppError("STAGE_NOT_FOUND", "Stage not found", 404);
}

export function duplicateStageNameError() {
  return new AppError(
    "DUPLICATE_STAGE_NAME",
    "A stage with this name already exists",
    409,
  );
}

export function duplicateStagePositionError() {
  return new AppError(
    "DUPLICATE_STAGE_POSITION",
    "A stage with this position already exists",
    409,
  );
}

export function invalidFinalTypeError() {
  return new AppError(
    "INVALID_FINAL_TYPE",
    "final_type is required when is_final is true, and must be null when is_final is false",
    400,
  );
}

export function stageHasDealsError() {
  return new AppError(
    "STAGE_HAS_DEALS",
    "Cannot delete stage with associated deals",
    409,
  );
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function errorResponse(error: AppErrorLike) {
  const body: Record<string, unknown> = {
    code: error.code,
    message: error.message,
  };

  if (error.details && error.details.length > 0) {
    body.details = error.details;
  }

  return NextResponse.json({ error: body }, { status: error.status });
}

