"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── GET: Fetch notifications by role ────────────────────────────────
export async function getNotifikasi(role: string) {
  return await prisma.notifikasi.findMany({
    where: { tujuan_role: role },
    orderBy: { waktu: "desc" },
    take: 20,
  });
}

// ─── GET: Count unread notifications ─────────────────────────────────
export async function getUnreadNotifikasiCount(role: string) {
  return await prisma.notifikasi.count({
    where: {
      tujuan_role: role,
      status: "belum_dibaca",
    },
  });
}

// ─── UPDATE: Mark notification as read ───────────────────────────────
export async function markNotifikasiAsRead(id: number) {
  await prisma.notifikasi.update({
    where: { id },
    data: { status: "dibaca" },
  });
  revalidatePath("/owner");
  revalidatePath("/karyawan");
}

// ─── UPDATE: Mark all notifications as read ──────────────────────────
export async function markAllNotifikasiAsRead(role: string) {
  await prisma.notifikasi.updateMany({
    where: {
      tujuan_role: role,
      status: "belum_dibaca",
    },
    data: { status: "dibaca" },
  });
  revalidatePath("/owner");
  revalidatePath("/karyawan");
}
