"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────
export interface StokFormState {
  error?: string;
  success?: boolean;
  message?: string;
}

// ─── GET: Fetch all bahan baku ───────────────────────────────────────
export async function getStok() {
  const items = await prisma.bahanBaku.findMany({
    orderBy: { id: "asc" },
  });
  return items;
}

// ─── GET: Count items below minimum stock ────────────────────────────
export async function getStokMenipisCount() {
  const items = await prisma.bahanBaku.findMany();
  const count = items.filter((i) => i.jumlah_stok <= i.batas_minimum).length;
  return count;
}

// ─── GET: Items below minimum stock ──────────────────────────────────
export async function getStokMenipis() {
  const items = await prisma.bahanBaku.findMany();
  return items.filter((i) => i.jumlah_stok <= i.batas_minimum);
}

// ─── ADD: Create new bahan baku ──────────────────────────────────────
export async function addStok(
  _prevState: StokFormState,
  formData: FormData
): Promise<StokFormState> {
  const nama = formData.get("nama") as string;
  const jumlah_stok = parseFloat(formData.get("jumlah_stok") as string);
  const satuan = formData.get("satuan") as string;
  const batas_minimum = parseFloat(formData.get("batas_minimum") as string);
  const masa_kedaluwarsa = formData.get("masa_kedaluwarsa") as string;

  if (!nama || isNaN(jumlah_stok) || !satuan || isNaN(batas_minimum)) {
    return { error: "Semua field wajib diisi dengan benar." };
  }

  try {
    const bahan = await prisma.bahanBaku.create({
      data: {
        nama,
        jumlah_stok,
        satuan,
        batas_minimum,
        masa_kedaluwarsa: masa_kedaluwarsa
          ? new Date(masa_kedaluwarsa)
          : null,
      },
    });

    // Auto-create notification if stock is below minimum
    if (bahan.jumlah_stok <= bahan.batas_minimum) {
      await createStokNotifikasi(bahan.id, bahan.nama, bahan.jumlah_stok, bahan.satuan);
    }

    revalidatePath("/owner/stok");
    revalidatePath("/karyawan/stok");
    revalidatePath("/owner");
    return { success: true, message: `${nama} berhasil ditambahkan.` };
  } catch {
    return { error: "Gagal menambahkan bahan baku." };
  }
}

// ─── UPDATE: Edit bahan baku ─────────────────────────────────────────
export async function updateStok(
  _prevState: StokFormState,
  formData: FormData
): Promise<StokFormState> {
  const id = parseInt(formData.get("id") as string);
  const nama = formData.get("nama") as string;
  const jumlah_stok = parseFloat(formData.get("jumlah_stok") as string);
  const satuan = formData.get("satuan") as string;
  const batas_minimum = parseFloat(formData.get("batas_minimum") as string);
  const masa_kedaluwarsa = formData.get("masa_kedaluwarsa") as string;

  if (!id || !nama || isNaN(jumlah_stok) || !satuan || isNaN(batas_minimum)) {
    return { error: "Semua field wajib diisi dengan benar." };
  }

  try {
    const bahan = await prisma.bahanBaku.update({
      where: { id },
      data: {
        nama,
        jumlah_stok,
        satuan,
        batas_minimum,
        masa_kedaluwarsa: masa_kedaluwarsa
          ? new Date(masa_kedaluwarsa)
          : null,
      },
    });

    // Auto-create notification if stock drops below minimum
    if (bahan.jumlah_stok <= bahan.batas_minimum) {
      await createStokNotifikasi(bahan.id, bahan.nama, bahan.jumlah_stok, bahan.satuan);
    }

    revalidatePath("/owner/stok");
    revalidatePath("/karyawan/stok");
    revalidatePath("/owner");
    return { success: true, message: `${nama} berhasil diperbarui.` };
  } catch {
    return { error: "Gagal memperbarui bahan baku." };
  }
}

// ─── UPDATE JUMLAH: Quick stock quantity update ──────────────────────
export async function updateJumlahStok(
  _prevState: StokFormState,
  formData: FormData
): Promise<StokFormState> {
  const id = parseInt(formData.get("id") as string);
  const jumlah_baru = parseFloat(formData.get("jumlah_baru") as string);
  const tipe = formData.get("tipe") as string; // "tambah" or "kurangi"
  const pemasok_id = formData.get("pemasok_id") as string;
  const user_id = parseInt(formData.get("user_id") as string);
  const harga = parseFloat(formData.get("harga") as string);

  if (!id || isNaN(jumlah_baru) || jumlah_baru <= 0) {
    return { error: "Jumlah harus berupa angka positif." };
  }

  try {
    const current = await prisma.bahanBaku.findUnique({ where: { id } });
    if (!current) return { error: "Bahan baku tidak ditemukan." };

    let newJumlah: number;
    if (tipe === "tambah") {
      newJumlah = current.jumlah_stok + jumlah_baru;
    } else {
      newJumlah = Math.max(0, current.jumlah_stok - jumlah_baru);
    }

    const bahan = await prisma.bahanBaku.update({
      where: { id },
      data: { jumlah_stok: newJumlah },
    });

    // Record to PembelianBahan if adding stock and pemasok is provided
    if (tipe === "tambah" && pemasok_id && !isNaN(parseInt(pemasok_id))) {
      await prisma.pembelianBahan.create({
        data: {
          bahan_id: id,
          pemasok_id: parseInt(pemasok_id),
          user_id: user_id || 1,
          jumlah: jumlah_baru,
          harga: isNaN(harga) ? 0 : harga,
        },
      });
    }

    // Auto-create notification if stock drops below minimum
    if (bahan.jumlah_stok <= bahan.batas_minimum) {
      await createStokNotifikasi(bahan.id, bahan.nama, bahan.jumlah_stok, bahan.satuan);
    }

    revalidatePath("/owner/stok");
    revalidatePath("/karyawan/stok");
    revalidatePath("/owner");
    return {
      success: true,
      message: `Stok ${bahan.nama} berhasil di${tipe === "tambah" ? "tambah" : "kurangi"} menjadi ${newJumlah} ${bahan.satuan}.`,
    };
  } catch {
    return { error: "Gagal memperbarui jumlah stok." };
  }
}

// ─── DELETE: Remove bahan baku ───────────────────────────────────────
export async function deleteStok(id: number): Promise<StokFormState> {
  try {
    // Check for related MenuBahan or PembelianBahan records
    const menuBahan = await prisma.menuBahan.findFirst({
      where: { bahan_id: id },
    });
    if (menuBahan) {
      return {
        error:
          "Bahan baku ini masih terhubung dengan menu. Hapus relasi menu terlebih dahulu.",
      };
    }

    await prisma.bahanBaku.delete({ where: { id } });

    revalidatePath("/owner/stok");
    revalidatePath("/karyawan/stok");
    revalidatePath("/owner");
    return { success: true, message: "Bahan baku berhasil dihapus." };
  } catch {
    return { error: "Gagal menghapus bahan baku." };
  }
}

// ─── GET: Fetch all pemasok (for dropdown) ───────────────────────────
export async function getPemasok() {
  return await prisma.pemasok.findMany({ orderBy: { nama: "asc" } });
}

// ─── HELPER: Create stock notification ───────────────────────────────
async function createStokNotifikasi(
  bahanId: number,
  namaBahan: string,
  sisaStok: number,
  satuan: string
) {
  await prisma.notifikasi.create({
    data: {
      tipe: "restock",
      pesan: `Stok ${namaBahan} menipis! Sisa ${sisaStok} ${satuan}. Segera lakukan pemesanan ulang.`,
      tujuan_role: "owner",
      referensi_id: bahanId,
      status: "belum_dibaca",
    },
  });
}
