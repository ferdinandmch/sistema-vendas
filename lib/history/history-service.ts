import { prisma } from "@/lib/db/prisma";
import { dealNotFoundError } from "@/lib/validation/api-error";

export async function listStageHistory(dealId: string, ownerId: string) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, ownerId },
  });

  if (!deal) {
    throw dealNotFoundError();
  }

  return prisma.dealStageHistory.findMany({
    where: { dealId },
    orderBy: { changedAt: "asc" },
    include: {
      fromStage: { select: { id: true, name: true } },
      toStage: { select: { id: true, name: true } },
    },
  });
}
