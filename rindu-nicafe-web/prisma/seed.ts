import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Hash passwords
  const ownerPassword = await bcrypt.hash("owner123", 10);
  const karyawanPassword = await bcrypt.hash("karyawan123", 10);

  // Create Owner
  const owner = await prisma.user.upsert({
    where: { username: "ariyo" },
    update: {},
    create: {
      username: "ariyo",
      password: ownerPassword,
      nama: "Ariyo",
      role: "owner",
      kontak: "081234567890",
    },
  });

  // Create Karyawan 1
  const karyawan1 = await prisma.user.upsert({
    where: { username: "andi" },
    update: {},
    create: {
      username: "andi",
      password: karyawanPassword,
      nama: "Andi",
      role: "karyawan",
      kontak: "081298765432",
      jadwal_shift: "17:00 - 00:00",
      gaji_per_jam: 20000,
    },
  });

  // Create Karyawan 2
  const karyawan2 = await prisma.user.upsert({
    where: { username: "budi" },
    update: {},
    create: {
      username: "budi",
      password: karyawanPassword,
      nama: "Budi",
      role: "karyawan",
      kontak: "081256781234",
      jadwal_shift: "17:00 - 00:00",
      gaji_per_jam: 20000,
    },
  });

  // Create Karyawan 3
  const karyawan3 = await prisma.user.upsert({
    where: { username: "citra" },
    update: {},
    create: {
      username: "citra",
      password: karyawanPassword,
      nama: "Citra",
      role: "karyawan",
      kontak: "081211223344",
      jadwal_shift: "17:00 - 00:00",
      gaji_per_jam: 20000,
    },
  });

  console.log("✅ Users created:");
  console.log(`   Owner  : ${owner.username} (password: owner123)`);
  console.log(`   Staff  : ${karyawan1.username} (password: karyawan123)`);
  console.log(`   Staff  : ${karyawan2.username} (password: karyawan123)`);
  console.log(`   Staff  : ${karyawan3.username} (password: karyawan123)`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
