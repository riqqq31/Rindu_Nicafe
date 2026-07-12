"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getPOSData() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const [menus, categories, tables] = await Promise.all([
    prisma.menu.findMany({
      where: { status_ketersediaan: true },
      include: { kategori: true }
    }),
    prisma.kategori.findMany(),
    prisma.meja.findMany({
      where: { status: "kosong" }
    })
  ]);

  return { menus, categories, tables };
}

export type OrderItemData = {
  menu_id: number;
  jumlah: number;
  subtotal: number;
};

export async function createOrder(
  tipe_pesanan: "dine_in" | "takeaway",
  meja_id: number | null,
  total: number,
  items: OrderItemData[],
  paymentAmount: number
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    // Create Pesanan
    const pesanan = await tx.pesanan.create({
      data: {
        kasir_id: session.userId,
        tipe_pesanan,
        meja_id: tipe_pesanan === "dine_in" ? meja_id : null,
        status: "dibayar",
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

    // Create Pembayaran (Only QRIS per user request)
    await tx.pembayaran.create({
      data: {
        pesanan_id: pesanan.id,
        metode: "QRIS",
        status: "berhasil",
        jumlah: paymentAmount,
      }
    });

    // Update Meja status if Dine in
    if (tipe_pesanan === "dine_in" && meja_id) {
      await tx.meja.update({
        where: { id: meja_id },
        data: { status: "terisi" }
      });
    }

    // Deduct Ingredients and check minimum thresholds
    for (const item of items) {
      // Find recipe (MenuBahan) for this menu
      const recipes = await tx.menuBahan.findMany({
        where: { menu_id: item.menu_id },
        include: { bahan: true }
      });

      for (const recipe of recipes) {
        const totalDeduction = recipe.jumlah_dipakai * item.jumlah;
        
        // Decrement stock
        const updatedBahan = await tx.bahanBaku.update({
          where: { id: recipe.bahan_id },
          data: {
            jumlah_stok: { decrement: totalDeduction }
          }
        });

        // Check if stock falls below batas_minimum
        if (updatedBahan.jumlah_stok <= updatedBahan.batas_minimum) {
          // Create Notification for owner
          await tx.notifikasi.create({
            data: {
              tipe: "restock",
              pesan: `Stok ${updatedBahan.nama} menipis! Sisa ${updatedBahan.jumlah_stok} ${updatedBahan.satuan}, di bawah batas minimum (${updatedBahan.batas_minimum}). Segera restock.`,
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
