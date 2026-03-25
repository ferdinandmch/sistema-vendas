import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  { name: "Cold", position: 1, isFinal: false, finalType: null },
  { name: "Warm", position: 2, isFinal: false, finalType: null },
  { name: "Initial Call", position: 3, isFinal: false, finalType: null },
  { name: "Qualified", position: 4, isFinal: false, finalType: null },
  { name: "Demo", position: 5, isFinal: false, finalType: null },
  { name: "Negotiation", position: 6, isFinal: false, finalType: null },
  { name: "Won", position: 7, isFinal: true, finalType: "won" as const },
  { name: "Lost", position: 8, isFinal: true, finalType: "lost" as const },
];

async function main() {
  for (const stage of DEFAULT_STAGES) {
    await prisma.pipelineStage.upsert({
      where: { name: stage.name },
      update: {},
      create: {
        name: stage.name,
        position: stage.position,
        isFinal: stage.isFinal,
        finalType: stage.finalType,
      },
    });
  }

  console.log(`Seeded ${DEFAULT_STAGES.length} default pipeline stages.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
