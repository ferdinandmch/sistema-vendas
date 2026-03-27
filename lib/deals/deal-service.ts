import { prisma } from "@/lib/db/prisma";
import {
  AppError,
  dealAlreadyClosedError,
  dealNotFoundError,
  sameStageError,
  stageNotFoundForMoveError,
} from "@/lib/validation/api-error";
import type { CreateDealInput, UpdateDealInput } from "@/lib/validation/deals";

const stageSelect = { id: true, name: true, position: true };

export async function listDeals(ownerId: string) {
  return prisma.deal.findMany({
    where: { ownerId },
    include: { stage: { select: stageSelect } },
  });
}

export async function getDeal(id: string, ownerId: string) {
  const deal = await prisma.deal.findFirst({
    where: { id, ownerId },
    include: { stage: { select: stageSelect } },
  });

  if (!deal) {
    throw dealNotFoundError();
  }

  return deal;
}

export async function createDeal(data: CreateDealInput, ownerId: string) {
  const stage = await prisma.pipelineStage.findUnique({
    where: { id: data.stageId },
  });

  if (!stage) {
    throw new AppError("STAGE_NOT_FOUND", "Stage not found", 400);
  }

  return prisma.deal.create({
    data: {
      companyName: data.companyName,
      contactName: data.contactName ?? null,
      contactDetails: data.contactDetails ?? null,
      source: data.source ?? null,
      experiment: data.experiment ?? null,
      notes: data.notes ?? null,
      icp: data.icp ?? false,
      nextAction: data.nextAction ?? null,
      stageId: data.stageId,
      stageUpdatedAt: new Date(),
      status: "active",
      lastTouchAt: null,
      ownerId,
    },
    include: { stage: { select: stageSelect } },
  });
}

export async function updateDeal(
  id: string,
  data: UpdateDealInput,
  ownerId: string,
) {
  const existing = await prisma.deal.findFirst({
    where: { id, ownerId },
  });

  if (!existing) {
    throw dealNotFoundError();
  }

  return prisma.deal.update({
    where: { id },
    data,
    include: { stage: { select: stageSelect } },
  });
}

export async function moveDeal(
  id: string,
  toStageId: string,
  ownerId: string,
) {
  const deal = await prisma.deal.findFirst({
    where: { id, ownerId },
  });

  if (!deal) {
    throw dealNotFoundError();
  }

  if (deal.status === "won" || deal.status === "lost") {
    throw dealAlreadyClosedError();
  }

  if (deal.stageId === toStageId) {
    throw sameStageError();
  }

  const targetStage = await prisma.pipelineStage.findUnique({
    where: { id: toStageId },
  });

  if (!targetStage) {
    throw stageNotFoundForMoveError();
  }

  const now = new Date();
  const newStatus = targetStage.isFinal && targetStage.finalType
    ? targetStage.finalType
    : "active";

  return prisma.$transaction(async (tx) => {
    const updatedDeal = await tx.deal.update({
      where: { id },
      data: {
        stageId: toStageId,
        stageUpdatedAt: now,
        status: newStatus,
      },
      include: { stage: { select: stageSelect } },
    });

    await tx.dealStageHistory.create({
      data: {
        dealId: id,
        fromStageId: deal.stageId,
        toStageId,
        changedAt: now,
      },
    });

    return updatedDeal;
  });
}
