"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────
export interface PemasokFormState {
  error?: string;
  success?: boolean;
  message?: string;
}

// ─── GET: Fetch all pemasok ──────────────────────────────────────────
export async function getPemasok() {
  const items = await prisma.pemasok.findMany({
    orderBy: { nama: "asc" },
  });
  return items;
}

// ─── ADD: Create new pemasok ─────────────────────────────────────────
export async function addPemasok(
  _prevState: PemasokFormState,
  formData: FormData
): Promise<PemasokFormState> {
  const nama = formData.get("nama") as string;
  const kontak = formData.get("kontak") as string;
  const alamat = formData.get("alamat") as string;

  if (!nama) {
    return { error: "Nama pemasok wajib diisi." };
  }

  try {
    await prisma.pemasok.create({
      data: {
        nama,
        kontak: kontak || null,
        alamat: alamat || null,
      },
    });

    revalidatePath("/owner/pemasok");
    return { success: true, message: `${nama} berhasil ditambahkan.` };
  } catch {
    return { error: "Gagal menambahkan pemasok." };
  }
}

// ─── UPDATE: Edit pemasok ────────────────────────────────────────────
export async function updatePemasok(
  _prevState: PemasokFormState,
  formData: FormData
): Promise<PemasokFormState> {
  const id = parseInt(formData.get("id") as string);
  const nama = formData.get("nama") as string;
  const kontak = formData.get("kontak") as string;
  const alamat = formData.get("alamat") as string;

  if (!id || !nama) {
    return { error: "Nama pemasok wajib diisi." };
  }

  try {
    await prisma.pemasok.update({
      where: { id },
      data: {
        nama,
        kontak: kontak || null,
        alamat: alamat || null,
      },
    });

    revalidatePath("/owner/pemasok");
    return { success: true, message: `${nama} berhasil diperbarui.` };
  } catch {
    return { error: "Gagal memperbarui pemasok." };
  }
}

// ─── DELETE: Remove pemasok ──────────────────────────────────────────
export async function deletePemasok(id: number): Promise<PemasokFormState> {
  try {
    // Check for related PembelianBahan records to prevent deletion of active suppliers
    const riwayatPembelian = await prisma.pembelianBahan.findFirst({
      where: { pemasok_id: id },
    });
    
    if (riwayatPembelian) {
      return {
        error:
          "Pemasok ini tidak dapat dihapus karena memiliki riwayat transaksi pembelian bahan. Anda dapat mengedit detailnya jika perlu.",
      };
    }

    await prisma.pemasok.delete({ where: { id } });

    revalidatePath("/owner/pemasok");
    return { success: true, message: "Pemasok berhasil dihapus." };
  } catch {
    return { error: "Gagal menghapus pemasok." };
  }
}
