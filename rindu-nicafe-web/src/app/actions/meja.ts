"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMeja() {
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Unauthorized");

  return await prisma.meja.findMany({
    orderBy: { nomor_meja: "asc" }
  });
}

export async function addMeja(nomor_meja: number) {
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Unauthorized");

  const existing = await prisma.meja.findUnique({
    where: { nomor_meja }
  });

  if (existing) {
    return { success: false, error: "Nomor meja sudah digunakan." };
  }

  try {
    const newMeja = await prisma.meja.create({
      data: {
        nomor_meja,
        kode_qr: `meja_${nomor_meja}`, // We generate QR frontend-side based on domain + URL
        status: "kosong"
      }
    });
    
    revalidatePath("/owner/meja");
    return { success: true, data: newMeja };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal menambahkan meja." };
  }
}

export async function deleteMeja(id: number) {
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Unauthorized");

  try {
    // Periksa apakah meja masih terhubung dengan pesanan
    const pesananTerkait = await prisma.pesanan.findFirst({
      where: { meja_id: id }
    });

    if (pesananTerkait) {
      return { 
        success: false, 
        error: "Meja tidak dapat dihapus karena memiliki histori pesanan." 
      };
    }

    await prisma.meja.delete({
      where: { id }
    });
    
    revalidatePath("/owner/meja");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal menghapus meja." };
  }
}
