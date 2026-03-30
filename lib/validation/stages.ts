import { z } from "zod";

const finalTypeEnum = z.enum(["won", "lost"]);

export const createStageSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    position: z.number().int().positive("Position must be a positive integer"),
    isFinal: z.boolean(),
    finalType: finalTypeEnum.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isFinal && !data.finalType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "finalType is required when isFinal is true (must be 'won' or 'lost')",
        path: ["finalType"],
      });
    }
    if (!data.isFinal && data.finalType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "finalType must be null when isFinal is false",
        path: ["finalType"],
      });
    }
  });

export const updateStageSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").optional(),
    position: z
      .number()
      .int()
      .positive("Position must be a positive integer")
      .optional(),
    isFinal: z.boolean().optional(),
    finalType: finalTypeEnum.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isFinal === true && data.finalType === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "finalType is required when isFinal is true (must be 'won' or 'lost')",
        path: ["finalType"],
      });
    }
    if (data.isFinal === true && data.finalType === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "finalType is required when isFinal is true (must be 'won' or 'lost')",
        path: ["finalType"],
      });
    }
    if (data.isFinal === false && data.finalType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "finalType must be null when isFinal is false",
        path: ["finalType"],
      });
    }
  });

export const reorderStagesSchema = z.object({
  stages: z
    .array(
      z.object({
        id: z.string().min(1),
        position: z.number().int().positive(),
      }),
    )
    .min(1),
});

export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;
