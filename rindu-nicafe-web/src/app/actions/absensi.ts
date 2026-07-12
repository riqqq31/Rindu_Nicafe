"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getAbsensiHariIni() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const absensi = await prisma.absensi.findFirst({
    where: {
      user_id: session.userId,
      tanggal: {
        gte: startOfDay,
        lte: endOfDay,
      }
    }
  });

  return absensi;
}

export async function clockIn(fotoBase64: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const existing = await prisma.absensi.findFirst({
    where: {
      user_id: session.userId,
      tanggal: {
        gte: startOfDay,
        lte: endOfDay,
      }
    }
  });
  
  if (existing) {
    throw new Error("Sudah clock in hari ini.");
  }

  const absensi = await prisma.absensi.create({
    data: {
      user_id: session.userId,
      tanggal: startOfDay,
      clock_in: now,
      foto_in: fotoBase64,
    }
  });
  
  return absensi;
}

export async function clockOut(fotoBase64: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const existing = await prisma.absensi.findFirst({
    where: {
      user_id: session.userId,
      tanggal: {
        gte: startOfDay,
        lte: endOfDay,
      }
    }
  });
  
  if (!existing || !existing.clock_in) {
    throw new Error("Belum clock in.");
  }
  
  if (existing.clock_out) {
      throw new Error("Sudah clock out.");
  }

  const jamKerja = (now.getTime() - existing.clock_in.getTime()) / (1000 * 60 * 60);

  const absensi = await prisma.absensi.update({
    where: { id: existing.id },
    data: {
      clock_out: now,
      foto_out: fotoBase64,
      jam_kerja: jamKerja
    }
  });
  
  return absensi;
}

export async function getRiwayatAbsensi(limit = 7) {
  const session = await getSession();
  if (!session) return [];
  
  const riwayat = await prisma.absensi.findMany({
    where: { user_id: session.userId },
    orderBy: { tanggal: 'desc' },
    take: limit,
  });
  
  return riwayat;
}
