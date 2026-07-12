import { prisma } from './src/lib/prisma';

async function main() {
  const menus = await prisma.menu.findMany();
  console.log("Menus:", menus);
}

main().catch(console.error).finally(() => prisma.$disconnect());
