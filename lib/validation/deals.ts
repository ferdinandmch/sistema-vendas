import { z } from "zod";

export const createDealSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  stageId: z.string().min(1, "Stage ID is required"),
  contactName: z.string().optional(),
  contactDetails: z.string().optional(),
  source: z.string().optional(),
  experiment: z.string().optional(),
  notes: z.string().optional(),
  icp: z.boolean().optional().default(false),
  nextAction: z.string().optional(),
});

export const updateDealSchema = z.object({
  companyName: z.string().min(1, "Company name must not be empty").optional(),
  contactName: z.string().nullable().optional(),
  contactDetails: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  experiment: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  icp: z.boolean().optional(),
  nextAction: z.string().nullable().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
