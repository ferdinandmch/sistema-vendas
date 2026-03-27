import { z } from "zod";

export const createActivitySchema = z.object({
  type: z.enum(["note", "call", "meeting", "followup"], {
    required_error: "Activity type is required",
    invalid_type_error: "Activity type must be one of: note, call, meeting, followup",
  }),
  content: z.string().min(1, "Content must not be empty").nullable().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
