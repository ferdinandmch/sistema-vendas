import { describe, expect, it } from "vitest";

import { syncFailedError } from "@/lib/validation/api-error";

describe("sync failure blocks domain access", () => {
  it("returns a sync failure error instead of continuing silently", () => {
    const error = syncFailedError("Unable to synchronize authenticated user.");

    expect(error.code).toBe("SYNC_FAILED");
    expect(error.status).toBe(500);
  });
});
