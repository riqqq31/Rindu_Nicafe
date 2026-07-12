"use server";

import { prisma } from "@/lib/prisma";

export async function getPublicMenu() {
  const [menus, categories, meja] = await Promise.all([
    prisma.menu.findMany({
      where: { status_ketersediaan: true },
      include: { kategori: true }
    }),
    prisma.kategori.findMany(),
    prisma.meja.findMany()
  ]);

  return { menus, categories, meja };
}

export type OrderItemData = {
  menu_id: number;
  jumlah: number;
  subtotal: number;
};

export async function createCustomerOrder(
  nomor_meja: number,
  total: number,
  items: OrderItemData[]
) {
  try {
    let meja_id: number | null = null;
    if (nomor_meja) {
      const meja = await prisma.meja.findUnique({
        where: { nomor_meja }
      });
      if (!meja) {
        return { success: false, error: "Nomor meja tidak ditemukan dalam sistem." };
      }
      meja_id = meja.id;
    }

    const pesanan = await prisma.$transaction(async (tx) => {
      // 1. Create Pesanan
      const p = await tx.pesanan.create({
        data: {
          tipe_pesanan: "dine_in",
          meja_id: meja_id,
          status: "menunggu", // Menunggu pembayaran
          total,
          detail_pesanan: {
            create: items.map(item => ({
              menu_id: item.menu_id,
              jumlah: item.jumlah,
              subtotal: item.subtotal
            }))
          }
        }
      });

      // 2. Create Pembayaran Pending
      await tx.pembayaran.create({
        data: {
          pesanan_id: p.id,
          metode: "QRIS",
          status: "pending",
          jumlah: total,
        }
      });

      return p;
    });

    return { success: true, data: pesanan };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal membuat pesanan." };
  }
}

export async function simulateQrisPayment(pesanan_id: number) {
  return prisma.$transaction(async (tx) => {
    // 1. Update Pembayaran
    await tx.pembayaran.update({
      where: { pesanan_id },
      data: { status: "berhasil" }
    });

    // 2. Update Pesanan Status to "dibayar"
    const pesanan = await tx.pesanan.update({
      where: { id: pesanan_id },
      data: { status: "dibayar" },
      include: { detail_pesanan: true }
    });

    // 3. Update Meja Status
    if (pesanan.meja_id) {
      await tx.meja.update({
        where: { id: pesanan.meja_id },
        data: { status: "terisi" }
      });
    }

    // 4. Deduct Stock and create notifications
    for (const item of pesanan.detail_pesanan) {
      const recipes = await tx.menuBahan.findMany({
        where: { menu_id: item.menu_id },
        include: { bahan: true }
      });

      for (const recipe of recipes) {
        const totalDeduction = recipe.jumlah_dipakai * item.jumlah;
        
        const updatedBahan = await tx.bahanBaku.update({
          where: { id: recipe.bahan_id },
          data: {
            jumlah_stok: { decrement: totalDeduction }
          }
        });

        if (updatedBahan.jumlah_stok <= updatedBahan.batas_minimum) {
          await tx.notifikasi.create({
            data: {
              tipe: "restock",
              pesan: `Stok ${updatedBahan.nama} menipis! Sisa ${updatedBahan.jumlah_stok} ${updatedBahan.satuan}. Segera restock.`,
              tujuan_role: "owner",
              referensi_id: updatedBahan.id,
              status: "belum_dibaca"
            }
          });
        }
      }
    }

    return pesanan;
  });
}

export async function getOrderStatus(pesanan_id: number) {
  return prisma.pesanan.findUnique({
    where: { id: pesanan_id },
    include: {
      pembayaran: true,
      meja: true,
      detail_pesanan: {
        include: { menu: true }
      },
      feedback: true
    }
  });
}

export async function submitCustomerFeedback(pesanan_id: number, rating: number, komentar: string) {
  return prisma.feedback.create({
    data: {
      pesanan_id,
      rating,
      komentar
    }
  });
}
