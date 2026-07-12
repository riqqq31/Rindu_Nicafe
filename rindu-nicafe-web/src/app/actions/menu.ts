"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export interface MenuFormState {
  success?: boolean;
  error?: string;
  message?: string;
}

// ─── Read ────────────────────────────────────────────────────────────
export async function getMenus() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.menu.findMany({
    include: { kategori: true, menu_bahan: { include: { bahan: true } } },
    orderBy: { id: "asc" },
  });
}

export async function getKategoris() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.kategori.findMany({ orderBy: { nama: "asc" } });
}

export async function getBahanBakuList() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.bahanBaku.findMany({ orderBy: { nama: "asc" } });
}

// ─── Create Menu ─────────────────────────────────────────────────────
export async function addMenu(
  _prevState: MenuFormState,
  formData: FormData
): Promise<MenuFormState> {
  const session = await getSession();
  if (!session || session.role !== "owner")
    return { error: "Akses ditolak. Hanya owner yang dapat menambah menu." };

  const nama = formData.get("nama") as string;
  const harga = parseFloat(formData.get("harga") as string);
  const kategori_id = parseInt(formData.get("kategori_id") as string);
  const deskripsi = (formData.get("deskripsi") as string) || null;
  const gambar = (formData.get("gambar") as string) || null;
  const status_ketersediaan = formData.get("status_ketersediaan") === "true";

  if (!nama || isNaN(harga) || isNaN(kategori_id)) {
    return { error: "Nama, harga, dan kategori wajib diisi." };
  }

  try {
    await prisma.menu.create({
      data: {
        nama,
        harga,
        kategori_id,
        deskripsi,
        gambar,
        status_ketersediaan,
      },
    });
    return { success: true, message: `Menu "${nama}" berhasil ditambahkan!` };
  } catch (err) {
    console.error(err);
    return { error: "Gagal menambahkan menu." };
  }
}

// ─── Update Menu ─────────────────────────────────────────────────────
export async function updateMenu(
  _prevState: MenuFormState,
  formData: FormData
): Promise<MenuFormState> {
  const session = await getSession();
  if (!session || session.role !== "owner")
    return { error: "Akses ditolak." };

  const id = parseInt(formData.get("id") as string);
  const nama = formData.get("nama") as string;
  const harga = parseFloat(formData.get("harga") as string);
  const kategori_id = parseInt(formData.get("kategori_id") as string);
  const deskripsi = (formData.get("deskripsi") as string) || null;
  const gambar = (formData.get("gambar") as string) || null;
  const status_ketersediaan = formData.get("status_ketersediaan") === "true";

  if (!id || !nama || isNaN(harga) || isNaN(kategori_id)) {
    return { error: "Data tidak lengkap." };
  }

  try {
    await prisma.menu.update({
      where: { id },
      data: { nama, harga, kategori_id, deskripsi, gambar, status_ketersediaan },
    });
    return { success: true, message: `Menu "${nama}" berhasil diperbarui!` };
  } catch (err) {
    console.error(err);
    return { error: "Gagal memperbarui menu." };
  }
}

// ─── Delete Menu ─────────────────────────────────────────────────────
export async function deleteMenu(id: number): Promise<MenuFormState> {
  const session = await getSession();
  if (!session || session.role !== "owner")
    return { error: "Akses ditolak." };

  try {
    // Check if menu has orders
    const orderCount = await prisma.detailPesanan.count({ where: { menu_id: id } });
    if (orderCount > 0) {
      return { error: "Menu tidak bisa dihapus karena sudah memiliki riwayat pesanan. Nonaktifkan saja status ketersediaannya." };
    }

    // Delete related MenuBahan first
    await prisma.menuBahan.deleteMany({ where: { menu_id: id } });
    await prisma.menu.delete({ where: { id } });
    return { success: true, message: "Menu berhasil dihapus!" };
  } catch (err) {
    console.error(err);
    return { error: "Gagal menghapus menu." };
  }
}

// ─── Toggle Availability ─────────────────────────────────────────────
export async function toggleMenuAvailability(
  id: number,
  currentStatus: boolean
): Promise<MenuFormState> {
  const session = await getSession();
  if (!session || session.role !== "owner")
    return { error: "Akses ditolak." };

  try {
    await prisma.menu.update({
      where: { id },
      data: { status_ketersediaan: !currentStatus },
    });
    return {
      success: true,
      message: `Status menu diubah menjadi ${!currentStatus ? "Tersedia" : "Tidak Tersedia"}.`,
    };
  } catch (err) {
    console.error(err);
    return { error: "Gagal mengubah status." };
  }
}

// ─── Kategori CRUD ───────────────────────────────────────────────────
export async function addKategori(
  _prevState: MenuFormState,
  formData: FormData
): Promise<MenuFormState> {
  const session = await getSession();
  if (!session || session.role !== "owner")
    return { error: "Akses ditolak." };

  const nama = formData.get("nama") as string;
  if (!nama) return { error: "Nama kategori wajib diisi." };

  try {
    await prisma.kategori.create({ data: { nama } });
    return { success: true, message: `Kategori "${nama}" berhasil ditambahkan!` };
  } catch (err) {
    console.error(err);
    return { error: "Gagal menambahkan kategori." };
  }
}

export async function deleteKategori(id: number): Promise<MenuFormState> {
  const session = await getSession();
  if (!session || session.role !== "owner")
    return { error: "Akses ditolak." };

  try {
    const menuCount = await prisma.menu.count({ where: { kategori_id: id } });
    if (menuCount > 0) {
      return { error: "Kategori tidak bisa dihapus karena masih digunakan oleh menu." };
    }
    await prisma.kategori.delete({ where: { id } });
    return { success: true, message: "Kategori berhasil dihapus!" };
  } catch (err) {
    console.error(err);
    return { error: "Gagal menghapus kategori." };
  }
}

// ─── Menu Bahan (Recipe) ─────────────────────────────────────────────
export async function updateMenuBahan(
  menuId: number,
  recipes: { bahan_id: number; jumlah_dipakai: number }[]
): Promise<MenuFormState> {
  const session = await getSession();
  if (!session || session.role !== "owner")
    return { error: "Akses ditolak." };

  try {
    // Delete existing recipes
    await prisma.menuBahan.deleteMany({ where: { menu_id: menuId } });
    // Create new ones
    if (recipes.length > 0) {
      await prisma.menuBahan.createMany({
        data: recipes.map((r) => ({
          menu_id: menuId,
          bahan_id: r.bahan_id,
          jumlah_dipakai: r.jumlah_dipakai,
        })),
      });
    }
    return { success: true, message: "Resep berhasil diperbarui!" };
  } catch (err) {
    console.error(err);
    return { error: "Gagal memperbarui resep." };
  }
}
