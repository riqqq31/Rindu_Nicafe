import { prisma } from './src/lib/prisma';

async function main() {
  // Hapus detail pesanan yang terkait dengan menu duplikat
  await prisma.detailPesanan.deleteMany({
    where: {
      menu_id: { in: [6, 7, 8, 9, 10] }
    }
  });

  // Hapus menu duplikat
  await prisma.menu.deleteMany({
    where: {
      id: { in: [6, 7, 8, 9, 10] }
    }
  });
  
  // Hapus kategori duplikat
  await prisma.kategori.deleteMany({
    where: {
      id: { in: [4, 5, 6] }
    }
  });

  console.log("Duplikat berhasil dihapus!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
