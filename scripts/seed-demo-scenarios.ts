import { createDemoScenarios, DEMO_IDS } from "../src/lib/demo-scenarios";
import { prisma } from "../src/lib/prisma";

export { DEMO_IDS, createDemoScenarios };

createDemoScenarios()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
