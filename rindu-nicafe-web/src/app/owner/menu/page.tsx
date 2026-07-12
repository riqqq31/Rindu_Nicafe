"use client";

import styles from "./menu.module.css";
import { useEffect, useState, useActionState, useCallback } from "react";
import {
  getMenus,
  getKategoris,
  getBahanBakuList,
  addMenu,
  updateMenu,
  deleteMenu,
  toggleMenuAvailability,
  addKategori,
  deleteKategori,
  updateMenuBahan,
  type MenuFormState,
} from "@/app/actions/menu";

interface Kategori {
  id: number;
  nama: string;
}

interface BahanBaku {
  id: number;
  nama: string;
  satuan: string;
}

interface MenuBahanItem {
  id: number;
  bahan_id: number;
  jumlah_dipakai: number;
  bahan: BahanBaku;
}

interface MenuItem {
  id: number;
  nama: string;
  harga: number;
  kategori_id: number;
  deskripsi: string | null;
  gambar: string | null;
  status_ketersediaan: boolean;
  kategori: Kategori;
  menu_bahan: MenuBahanItem[];
}

type ModalMode = "add_menu" | "edit_menu" | "manage_kategori" | "edit_recipe" | null;
type FilterType = "semua" | "tersedia" | "tidak_tersedia";

// Recipe row for local editing
interface RecipeRow {
  bahan_id: number;
  jumlah_dipakai: number;
}

export default function OwnerMenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [bahanList, setBahanList] = useState<BahanBaku[]>([]);

  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterType>("semua");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Recipe editor state
  const [recipeMenuId, setRecipeMenuId] = useState<number | null>(null);
  const [recipeMenuName, setRecipeMenuName] = useState("");
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);

  // Action states
  const [addState, addAction, isAddPending] = useActionState<MenuFormState, FormData>(addMenu, {});
  const [editState, editAction, isEditPending] = useActionState<MenuFormState, FormData>(updateMenu, {});
  const [kategoriState, kategoriAction, isKategoriPending] = useActionState<MenuFormState, FormData>(addKategori, {});

  const fetchData = useCallback(async () => {
    const [menuData, kategoriData, bahanData] = await Promise.all([
      getMenus(),
      getKategoris(),
      getBahanBakuList(),
    ]);
    setMenus(menuData as MenuItem[]);
    setKategoris(kategoriData);
    setBahanList(bahanData as BahanBaku[]);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle action results
  useEffect(() => {
    if (addState.success) {
      setModalMode(null);
      setToast({ type: "success", message: addState.message || "Berhasil!" });
      fetchData();
    } else if (addState.error) {
      setToast({ type: "error", message: addState.error });
    }
  }, [addState, fetchData]);

  useEffect(() => {
    if (editState.success) {
      setModalMode(null);
      setEditItem(null);
      setToast({ type: "success", message: editState.message || "Berhasil!" });
      fetchData();
    } else if (editState.error) {
      setToast({ type: "error", message: editState.error });
    }
  }, [editState, fetchData]);

  useEffect(() => {
    if (kategoriState.success) {
      setToast({ type: "success", message: kategoriState.message || "Berhasil!" });
      fetchData();
    } else if (kategoriState.error) {
      setToast({ type: "error", message: kategoriState.error });
    }
  }, [kategoriState, fetchData]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteMenu(deleteTarget.id);
    if (result.success) {
      setToast({ type: "success", message: result.message || "Berhasil dihapus!" });
      fetchData();
    } else {
      setToast({ type: "error", message: result.error || "Gagal menghapus." });
    }
    setDeleteTarget(null);
  };

  // Handle toggle availability
  const handleToggle = async (menu: MenuItem) => {
    const result = await toggleMenuAvailability(menu.id, menu.status_ketersediaan);
    if (result.success) {
      setToast({ type: "success", message: result.message || "Status diubah!" });
      fetchData();
    } else {
      setToast({ type: "error", message: result.error || "Gagal mengubah status." });
    }
  };

  // Handle kategori delete
  const handleDeleteKategori = async (id: number) => {
    const result = await deleteKategori(id);
    if (result.success) {
      setToast({ type: "success", message: result.message || "Berhasil!" });
      fetchData();
    } else {
      setToast({ type: "error", message: result.error || "Gagal." });
    }
  };

  // Handle recipe save
  const handleSaveRecipes = async () => {
    if (recipeMenuId === null) return;
    const validRecipes = recipes.filter((r) => r.bahan_id > 0 && r.jumlah_dipakai > 0);
    const result = await updateMenuBahan(recipeMenuId, validRecipes);
    if (result.success) {
      setToast({ type: "success", message: result.message || "Resep diperbarui!" });
      setModalMode(null);
      setRecipeMenuId(null);
      fetchData();
    } else {
      setToast({ type: "error", message: result.error || "Gagal." });
    }
  };

  // Open recipe editor
  const openRecipeEditor = (menu: MenuItem) => {
    setRecipeMenuId(menu.id);
    setRecipeMenuName(menu.nama);
    setRecipes(
      menu.menu_bahan.map((mb) => ({
        bahan_id: mb.bahan_id,
        jumlah_dipakai: mb.jumlah_dipakai,
      }))
    );
    setModalMode("edit_recipe");
  };

  // Format Rupiah
  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  // Filtering
  const filtered = menus.filter((menu) => {
    const matchSearch = menu.nama.toLowerCase().includes(search.toLowerCase());
    const matchKategori = filterKategori === null || menu.kategori_id === filterKategori;
    const matchStatus =
      filterStatus === "semua" ||
      (filterStatus === "tersedia" && menu.status_ketersediaan) ||
      (filterStatus === "tidak_tersedia" && !menu.status_ketersediaan);
    return matchSearch && matchKategori && matchStatus;
  });

  // Summary counts
  const totalMenus = menus.length;
  const tersediaCount = menus.filter((m) => m.status_ketersediaan).length;
  const tidakTersediaCount = menus.filter((m) => !m.status_ketersediaan).length;
  const withRecipeCount = menus.filter((m) => m.menu_bahan.length > 0).length;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className={styles.toastText}>{toast.message}</span>
          <button className={styles.toastClose} onClick={() => setToast(null)}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>close</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h2>Kelola Menu</h2>
          <p>Atur daftar menu, harga, kategori, dan resep bahan baku</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addButtonSecondary} onClick={() => setModalMode("manage_kategori")}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>category</span>
            Kategori
          </button>
          <button className={styles.addButton} onClick={() => { setModalMode("add_menu"); setEditItem(null); }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>add</span>
            Tambah Menu
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIconCircle} ${styles.summaryIconPrimary}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>restaurant_menu</span>
          </div>
          <p className={styles.summaryValue}>{totalMenus}</p>
          <p className={styles.summaryLabel}>Total Menu</p>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIconCircle} ${styles.summaryIconGreen}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>check_circle</span>
          </div>
          <p className={styles.summaryValue}>{tersediaCount}</p>
          <p className={styles.summaryLabel}>Tersedia</p>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIconCircle} ${styles.summaryIconRed}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>cancel</span>
          </div>
          <p className={styles.summaryValue}>{tidakTersediaCount}</p>
          <p className={styles.summaryLabel}>Tidak Tersedia</p>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIconCircle} ${styles.summaryIconYellow}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>science</span>
          </div>
          <p className={styles.summaryValue}>{withRecipeCount}</p>
          <p className={styles.summaryLabel}>Ada Resep</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Cari menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterBtn} ${filterKategori === null ? styles.filterBtnActive : ""}`}
            onClick={() => setFilterKategori(null)}
          >
            Semua
          </button>
          {kategoris.map((k) => (
            <button
              key={k.id}
              className={`${styles.filterBtn} ${filterKategori === k.id ? styles.filterBtnActive : ""}`}
              onClick={() => setFilterKategori(k.id)}
            >
              {k.nama}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className={styles.toolbar} style={{ marginTop: "-0.5rem" }}>
        <div className={styles.filterButtons}>
          {(["semua", "tersedia", "tidak_tersedia"] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filterStatus === f ? styles.filterBtnActive : ""}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === "semua" ? "Semua Status" : f === "tersedia" ? "Tersedia" : "Tidak Tersedia"}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className={styles.menuGridContainer}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={`material-symbols-outlined ${styles.emptyIcon}`}>restaurant_menu</span>
            <p className={styles.emptyTitle}>Tidak ada menu ditemukan</p>
            <p className={styles.emptyDesc}>
              {search ? "Tidak ditemukan menu yang sesuai." : "Belum ada menu terdaftar. Tambahkan menu pertama Anda."}
            </p>
          </div>
        ) : (
          <div className={styles.menuGrid}>
            {filtered.map((menu) => (
              <div key={menu.id} className={`${styles.menuCard} ${!menu.status_ketersediaan ? styles.menuCardDisabled : ""}`}>
                {/* Image */}
                <div className={styles.menuImageContainer}>
                  {menu.gambar ? (
                    <img src={menu.gambar} alt={menu.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className={`material-symbols-outlined ${styles.menuImagePlaceholder}`} style={{ fontSize: "3rem" }}>
                      restaurant_menu
                    </span>
                  )}
                  <div className={styles.menuBadgeOverlay}>
                    <span className={menu.status_ketersediaan ? styles.badgeTersedia : styles.badgeTidakTersedia}>
                      {menu.status_ketersediaan ? "Tersedia" : "Habis"}
                    </span>
                    {menu.menu_bahan.length > 0 && (
                      <span className={styles.recipeBadge}>
                        <span className="material-symbols-outlined" style={{ fontSize: "0.75rem" }}>science</span>
                        {menu.menu_bahan.length} bahan
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className={styles.menuCardBody}>
                  <span className={styles.menuCardCategory}>{menu.kategori.nama}</span>
                  <h3 className={styles.menuCardName}>{menu.nama}</h3>
                  {menu.deskripsi && <p className={styles.menuCardDesc}>{menu.deskripsi}</p>}
                </div>

                {/* Footer */}
                <div className={styles.menuCardFooter}>
                  <span className={styles.menuCardPrice}>{formatRupiah(menu.harga)}</span>
                  <div className={styles.menuCardActions}>
                    <label className={styles.toggleSwitch} title="Toggle ketersediaan">
                      <input
                        type="checkbox"
                        checked={menu.status_ketersediaan}
                        onChange={() => handleToggle(menu)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                    <button className={styles.actionBtn} title="Edit Resep" onClick={() => openRecipeEditor(menu)}>
                      <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>science</span>
                    </button>
                    <button
                      className={styles.actionBtn}
                      title="Edit Menu"
                      onClick={() => { setEditItem(menu); setModalMode("edit_menu"); }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>edit</span>
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      title="Hapus Menu"
                      onClick={() => setDeleteTarget(menu)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Add / Edit Menu Modal ═══ */}
      {(modalMode === "add_menu" || modalMode === "edit_menu") && (
        <div className={styles.modalOverlay} onClick={() => { setModalMode(null); setEditItem(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === "add_menu" ? "Tambah Menu Baru" : "Edit Menu"}
              </h3>
              <button className={styles.closeBtn} onClick={() => { setModalMode(null); setEditItem(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form action={modalMode === "add_menu" ? addAction : editAction}>
              <div className={styles.modalBody}>
                {modalMode === "edit_menu" && editItem && (
                  <input type="hidden" name="id" value={editItem.id} />
                )}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nama Menu</label>
                  <input
                    className={styles.formInput}
                    name="nama"
                    type="text"
                    placeholder="Contoh: Kopi Susu Gula Aren"
                    defaultValue={editItem?.nama || ""}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Harga (Rp)</label>
                    <input
                      className={styles.formInput}
                      name="harga"
                      type="number"
                      step="500"
                      min="0"
                      placeholder="15000"
                      defaultValue={editItem?.harga || ""}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Kategori</label>
                    <select
                      className={styles.formSelect}
                      name="kategori_id"
                      defaultValue={editItem?.kategori_id || ""}
                      required
                    >
                      <option value="" disabled>— Pilih Kategori —</option>
                      {kategoris.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Deskripsi (opsional)</label>
                  <textarea
                    className={styles.formTextarea}
                    name="deskripsi"
                    placeholder="Deskripsi singkat menu..."
                    defaultValue={editItem?.deskripsi || ""}
                    rows={2}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL Gambar (opsional)</label>
                  <input
                    className={styles.formInput}
                    name="gambar"
                    type="text"
                    placeholder="https://example.com/gambar.jpg"
                    defaultValue={editItem?.gambar || ""}
                  />
                </div>
                <div className={styles.formGroup}>
                  <div className={styles.formCheckboxRow}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        name="status_ketersediaan_checkbox"
                        defaultChecked={editItem?.status_ketersediaan ?? true}
                        onChange={(e) => {
                          const hidden = e.target.closest("form")?.querySelector<HTMLInputElement>(
                            'input[name="status_ketersediaan"]'
                          );
                          if (hidden) hidden.value = e.target.checked ? "true" : "false";
                        }}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                    <span className={styles.formCheckboxLabel}>Menu Tersedia</span>
                    <input
                      type="hidden"
                      name="status_ketersediaan"
                      defaultValue={editItem?.status_ketersediaan !== false ? "true" : "false"}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => { setModalMode(null); setEditItem(null); }}>
                  Batal
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={modalMode === "add_menu" ? isAddPending : isEditPending}>
                  {(modalMode === "add_menu" ? isAddPending : isEditPending) ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Manage Kategori Modal ═══ */}
      {modalMode === "manage_kategori" && (
        <div className={styles.modalOverlay} onClick={() => setModalMode(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Kelola Kategori</h3>
              <button className={styles.closeBtn} onClick={() => setModalMode(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Existing Categories */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Kategori yang Ada</label>
                {kategoris.length === 0 ? (
                  <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>Belum ada kategori.</p>
                ) : (
                  <div className={styles.kategoriChipList}>
                    {kategoris.map((k) => (
                      <span key={k.id} className={styles.kategoriChip}>
                        {k.nama}
                        <button
                          className={styles.kategoriChipDelete}
                          onClick={() => handleDeleteKategori(k.id)}
                          title="Hapus kategori"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Add new kategori */}
              <form action={kategoriAction}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tambah Kategori Baru</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      className={styles.formInput}
                      name="nama"
                      type="text"
                      placeholder="Nama kategori baru..."
                      required
                    />
                    <button type="submit" className={styles.btnSubmit} disabled={isKategoriPending} style={{ whiteSpace: "nowrap" }}>
                      {isKategoriPending ? "..." : "Tambah"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={() => setModalMode(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Recipe Editor Modal ═══ */}
      {modalMode === "edit_recipe" && recipeMenuId !== null && (
        <div className={styles.modalOverlay} onClick={() => { setModalMode(null); setRecipeMenuId(null); }}>
          <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Resep: {recipeMenuName}</h3>
              <button className={styles.closeBtn} onClick={() => { setModalMode(null); setRecipeMenuId(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)", marginBottom: "1rem" }}>
                Tentukan bahan baku dan takaran yang digunakan untuk membuat satu porsi menu ini.
              </p>

              <div className={styles.recipeList}>
                {recipes.map((recipe, idx) => (
                  <div key={idx} className={styles.recipeRow}>
                    <select
                      className={styles.formSelect}
                      value={recipe.bahan_id}
                      onChange={(e) => {
                        const updated = [...recipes];
                        updated[idx].bahan_id = Number(e.target.value);
                        setRecipes(updated);
                      }}
                      style={{ flex: 2 }}
                    >
                      <option value={0} disabled>Pilih bahan</option>
                      {bahanList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nama} ({b.satuan})
                        </option>
                      ))}
                    </select>
                    <input
                      className={styles.formInput}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Jumlah"
                      value={recipe.jumlah_dipakai}
                      onChange={(e) => {
                        const updated = [...recipes];
                        updated[idx].jumlah_dipakai = Number(e.target.value);
                        setRecipes(updated);
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      className={styles.recipeRemoveBtn}
                      onClick={() => setRecipes(recipes.filter((_, i) => i !== idx))}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>close</span>
                    </button>
                  </div>
                ))}
              </div>

              <button
                className={styles.addRecipeBtn}
                onClick={() => setRecipes([...recipes, { bahan_id: 0, jumlah_dipakai: 0 }])}
                style={{ marginTop: "0.75rem" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>add</span>
                Tambah Bahan
              </button>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={() => { setModalMode(null); setRecipeMenuId(null); }}>
                Batal
              </button>
              <button className={styles.btnSubmit} onClick={handleSaveRecipes}>
                Simpan Resep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation ═══ */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>delete_forever</span>
            </div>
            <h3 className={styles.confirmTitle}>Hapus Menu?</h3>
            <p className={styles.confirmDesc}>
              Apakah Anda yakin ingin menghapus <strong>{deleteTarget.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.btnCancel} onClick={() => setDeleteTarget(null)}>
                Batal
              </button>
              <button className={styles.btnDelete} onClick={handleDelete}>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
