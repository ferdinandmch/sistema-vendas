import { prisma } from "@/lib/db/prisma";
import { dealNotFoundError } from "@/lib/validation/api-error";
import type { CreateActivityInput } from "@/lib/validation/activities";

export async function createActivity(
  dealId: string,
  data: CreateActivityInput,
  ownerId: string,
) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, ownerId },
  });

  if (!deal) {
    throw dealNotFoundError();
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const activity = await tx.activity.create({
      data: {
        dealId,
        type: data.type,
        content: data.content ?? null,
        createdAt: now,
      },
    });

    await tx.deal.update({
      where: { id: dealId },
      data: { lastTouchAt: now },
    });

    return activity;
  });
}

export async function listActivities(dealId: string, ownerId: string) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, ownerId },
  });

  if (!deal) {
    throw dealNotFoundError();
  }

  return prisma.activity.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  });
}
