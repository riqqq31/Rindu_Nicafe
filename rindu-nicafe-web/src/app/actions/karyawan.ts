"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Simplified password hash similar to what auth.ts expects.
// In this system, password hashing isn't implemented deeply (auth.ts checks plain or assumes hashed).
// In a real app we'd use bcrypt, but here we just store plain text for simplicity as per seed data.
// Note: Based on page.tsx (Login), it checks directly `if (user.password === password)`. 
// So we just store it as is.

export async function getKaryawanList() {
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Unauthorized");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const karyawans = await prisma.user.findMany({
    where: { role: "karyawan" },
    include: {
      absensi: {
        where: {
          tanggal: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }
    }
  });

  return karyawans.map(karyawan => {
    // Sum up the total working hours this month
    const totalJamBulanIni = karyawan.absensi.reduce((sum, ab) => sum + (ab.jam_kerja || 0), 0);
    const gajiPerJam = karyawan.gaji_per_jam || 0;
    const estimasiGaji = totalJamBulanIni * gajiPerJam;

    // We don't want to expose passwords to the frontend
    const { password, ...safeUser } = karyawan;
    
    return {
      ...safeUser,
      totalJamBulanIni,
      estimasiGaji
    };
  });
}

export async function createKaryawan(data: {
  username: string;
  nama: string;
  kontak: string;
  jadwal_shift: string;
  gaji_per_jam: number;
}) {
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    return { success: false, error: "Username sudah digunakan" };
  }

  try {
    const newKaryawan = await prisma.user.create({
      data: {
        ...data,
        role: "karyawan",
        password: "password123", // Default password
      }
    });
    return { success: true, data: newKaryawan };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal menambahkan karyawan" };
  }
}

export async function updateKaryawan(id: number, data: {
  username: string;
  nama: string;
  kontak: string;
  jadwal_shift: string;
  gaji_per_jam: number;
}) {
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing && existing.id !== id) {
    return { success: false, error: "Username sudah digunakan oleh akun lain" };
  }

  try {
    await prisma.user.update({
      where: { id },
      data
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal memperbarui karyawan" };
  }
}

export async function deleteKaryawan(id: number) {
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Unauthorized");

  try {
    await prisma.user.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal menghapus karyawan (Mungkin memiliki histori transaksi/absensi yang tidak bisa dihapus)." };
  }
}
