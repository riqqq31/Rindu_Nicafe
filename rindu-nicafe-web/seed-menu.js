const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("Menambahkan data dummy Kategori & Menu...");

  // Kategori
  const kat1 = await prisma.kategori.create({
    data: { nama: "Minuman Kopi" }
  });
  
  const kat2 = await prisma.kategori.create({
    data: { nama: "Makanan Utama" }
  });
  
  const kat3 = await prisma.kategori.create({
    data: { nama: "Camilan" }
  });

  // Menu
  await prisma.menu.createMany({
    data: [
      {
        nama: "Kopi Susu Rindu",
        deskripsi: "Es kopi susu gula aren yang menyegarkan",
        harga: 15000,
        kategori_id: kat1.id,
        status_ketersediaan: true
      },
      {
        nama: "Americano Dingin",
        deskripsi: "Kopi hitam dingin murni",
        harga: 12000,
        kategori_id: kat1.id,
        status_ketersediaan: true
      },
      {
        nama: "Nasi Goreng Nicafe",
        deskripsi: "Nasi goreng spesial dengan telur mata sapi",
        harga: 25000,
        kategori_id: kat2.id,
        status_ketersediaan: true
      },
      {
        nama: "Mie Goreng Spesial",
        deskripsi: "Mie goreng telur puyuh",
        harga: 20000,
        kategori_id: kat2.id,
        status_ketersediaan: true
      },
      {
        nama: "Kentang Goreng",
        deskripsi: "French fries renyah",
        harga: 15000,
        kategori_id: kat3.id,
        status_ketersediaan: true
      },
    ]
  });
  
  // Meja (Tambah meja dummy)
  try {
    await prisma.meja.createMany({
      data: [
        { nomor_meja: "01", kapasitas: 4, status: "tersedia", kode_qr: "qr-01" },
        { nomor_meja: "02", kapasitas: 2, status: "tersedia", kode_qr: "qr-02" },
        { nomor_meja: "03", kapasitas: 4, status: "tersedia", kode_qr: "qr-03" },
      ],
      skipDuplicates: true
    });
  } catch (e) {
    console.log("Meja mungkin sudah ada");
  }

  console.log("Data dummy berhasil ditambahkan!");
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
