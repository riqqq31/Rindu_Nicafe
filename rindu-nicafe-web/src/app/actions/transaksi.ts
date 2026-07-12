"use server";

import { prisma } from "@/lib/prisma";

export async function getAllTransaksi() {
  try {
    const transaksi = await prisma.pesanan.findMany({
      orderBy: {
        waktu: "desc",
      },
      include: {
        detail_pesanan: {
          include: {
            menu: true,
          },
        },
        pembayaran: true,
      },
    });
    return { success: true, data: transaksi };
  } catch (error) {
    console.error("Error in getAllTransaksi:", error);
    return { success: false, error: "Gagal mengambil data transaksi" };
  }
}

export async function getTransaksiHarian() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transaksi = await prisma.pesanan.findMany({
      where: {
        waktu: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        waktu: "desc",
      },
      include: {
        detail_pesanan: {
          include: {
            menu: true,
          },
        },
        pembayaran: true,
      },
    });
    return { success: true, data: transaksi };
  } catch (error) {
    console.error("Error in getTransaksiHarian:", error);
    return { success: false, error: "Gagal mengambil data transaksi harian" };
  }
}

export async function updateStatusPesanan(id: number, status: string) {
  try {
    const pesanan = await prisma.pesanan.update({
      where: { id },
      data: { status }
    });

    // Synchronize Meja status
    if (pesanan.meja_id) {
      if (status === "selesai") {
        await prisma.meja.update({
          where: { id: pesanan.meja_id },
          data: { status: "kosong" }
        });
      } else if (status === "diproses" || status === "dibayar") {
        await prisma.meja.update({
          where: { id: pesanan.meja_id },
          data: { status: "terisi" }
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateStatusPesanan:", error);
    return { success: false, error: "Gagal update status pesanan" };
  }
}
