import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  duplicateStageNameError,
  duplicateStagePositionError,
  stageNotFoundError,
} from "@/lib/validation/api-error";
import type { CreateStageInput, UpdateStageInput } from "@/lib/validation/stages";

export async function listStages() {
  return prisma.pipelineStage.findMany({
    orderBy: { position: "asc" },
  });
}

export async function createStage(data: CreateStageInput) {
  try {
    return await prisma.pipelineStage.create({
      data: {
        name: data.name,
        position: data.position,
        isFinal: data.isFinal,
        finalType: data.isFinal ? data.finalType : null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes("name")) {
          throw duplicateStageNameError();
        }
        if (target?.includes("position")) {
          throw duplicateStagePositionError();
        }
      }
    }
    throw error;
  }
}

export async function updateStage(id: string, data: UpdateStageInput) {
  const existing = await prisma.pipelineStage.findUnique({ where: { id } });
  if (!existing) {
    throw stageNotFoundError();
  }

  const isFinal = data.isFinal ?? existing.isFinal;
  let finalType = data.finalType !== undefined ? data.finalType : existing.finalType;

  if (!isFinal) {
    finalType = null;
  }

  try {
    return await prisma.pipelineStage.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.position !== undefined && { position: data.position }),
        isFinal,
        finalType,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes("name")) {
          throw duplicateStageNameError();
        }
        if (target?.includes("position")) {
          throw duplicateStagePositionError();
        }
      }
    }
    throw error;
  }
}

export async function deleteStage(id: string) {
  const existing = await prisma.pipelineStage.findUnique({ where: { id } });
  if (!existing) {
    throw stageNotFoundError();
  }

  await prisma.pipelineStage.delete({ where: { id } });
}
