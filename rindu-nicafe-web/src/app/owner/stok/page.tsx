"use client";

import styles from "./stok.module.css";
import { useEffect, useState, useActionState, useCallback } from "react";
import {
  getStok,
  addStok,
  updateStok,
  deleteStok,
  updateJumlahStok,
  getPemasok,
  type StokFormState,
} from "@/app/actions/stok";

interface BahanBaku {
  id: number;
  nama: string;
  jumlah_stok: number;
  satuan: string;
  batas_minimum: number;
  masa_kedaluwarsa: Date | null;
}

interface Pemasok {
  id: number;
  nama: string;
  kontak: string | null;
  alamat: string | null;
}

type ModalMode = "add" | "edit" | "update_qty" | null;
type FilterType = "semua" | "aman" | "menipis" | "habis";

export default function OwnerStokPage() {
  const [items, setItems] = useState<BahanBaku[]>([]);
  const [pemasokList, setPemasokList] = useState<Pemasok[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("semua");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<BahanBaku | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BahanBaku | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [qtyType, setQtyType] = useState<"tambah" | "kurangi">("tambah");

  // Action states
  const [addState, addAction, isAddPending] = useActionState<StokFormState, FormData>(addStok, {});
  const [editState, editAction, isEditPending] = useActionState<StokFormState, FormData>(updateStok, {});
  const [qtyState, qtyAction, isQtyPending] = useActionState<StokFormState, FormData>(updateJumlahStok, {});

  const fetchData = useCallback(async () => {
    const [stokData, pemasokData] = await Promise.all([getStok(), getPemasok()]);
    setItems(stokData);
    setPemasokList(pemasokData);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle action results
  useEffect(() => {
    if (addState.success) {
      setModalMode(null);
      setToast({ type: "success", message: addState.message || "Berhasil ditambahkan!" });
      fetchData();
    } else if (addState.error) {
      setToast({ type: "error", message: addState.error });
    }
  }, [addState, fetchData]);

  useEffect(() => {
    if (editState.success) {
      setModalMode(null);
      setEditItem(null);
      setToast({ type: "success", message: editState.message || "Berhasil diperbarui!" });
      fetchData();
    } else if (editState.error) {
      setToast({ type: "error", message: editState.error });
    }
  }, [editState, fetchData]);

  useEffect(() => {
    if (qtyState.success) {
      setModalMode(null);
      setEditItem(null);
      setToast({ type: "success", message: qtyState.message || "Stok berhasil diperbarui!" });
      fetchData();
    } else if (qtyState.error) {
      setToast({ type: "error", message: qtyState.error });
    }
  }, [qtyState, fetchData]);

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
    const result = await deleteStok(deleteTarget.id);
    if (result.success) {
      setToast({ type: "success", message: result.message || "Berhasil dihapus!" });
      fetchData();
    } else {
      setToast({ type: "error", message: result.error || "Gagal menghapus." });
    }
    setDeleteTarget(null);
  };

  // Determine stock status
  const getStatus = (item: BahanBaku) => {
    if (item.jumlah_stok <= 0) return "habis";
    if (item.jumlah_stok <= item.batas_minimum) return "menipis";
    return "aman";
  };

  // Calculate stock percentage (capped at 100%)
  const getStockPercent = (item: BahanBaku) => {
    if (item.batas_minimum <= 0) return 100;
    const ratio = (item.jumlah_stok / (item.batas_minimum * 3)) * 100;
    return Math.min(100, Math.max(0, ratio));
  };

  // Filter & search
  const filtered = items.filter((item) => {
    const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase());
    if (filter === "semua") return matchSearch;
    return matchSearch && getStatus(item) === filter;
  });

  // Summary counts
  const totalItems = items.length;
  const menipisCount = items.filter((i) => getStatus(i) === "menipis").length;
  const habisCount = items.filter((i) => getStatus(i) === "habis").length;

  return (
    <>
      {/* Toast Notification */}
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
          <h2>Stok Bahan Baku</h2>
          <p>Kelola inventaris bahan baku kafe Anda</p>
        </div>
        <button className={styles.addButton} onClick={() => { setModalMode("add"); setEditItem(null); }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>add</span>
          Tambah Bahan
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIconCircle} ${styles.summaryIconGreen}`}>
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <p className={styles.summaryLabel}>Total Bahan</p>
            <p className={styles.summaryValue}>{totalItems}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIconCircle} ${styles.summaryIconYellow}`}>
            <span className="material-symbols-outlined">trending_down</span>
          </div>
          <div>
            <p className={styles.summaryLabel}>Menipis</p>
            <p className={styles.summaryValue}>{menipisCount}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIconCircle} ${styles.summaryIconRed}`}>
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <p className={styles.summaryLabel}>Habis</p>
            <p className={styles.summaryValue}>{habisCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Cari bahan baku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterButtons}>
          {(["semua", "aman", "menipis", "habis"] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableOverflow}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>inventory_2</span>
              <p className={styles.emptyTitle}>Tidak ada data</p>
              <p className={styles.emptyDesc}>
                {search ? "Tidak ditemukan bahan baku yang sesuai." : "Belum ada bahan baku. Tambahkan yang pertama!"}
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama Bahan</th>
                  <th>Stok</th>
                  <th>Level Stok</th>
                  <th>Status</th>
                  <th>Kedaluwarsa</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const status = getStatus(item);
                  const percent = getStockPercent(item);
                  const expDate = item.masa_kedaluwarsa ? new Date(item.masa_kedaluwarsa) : null;
                  const now = new Date();
                  const daysToExpiry = expDate ? Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <tr key={item.id}>
                      <td className={styles.tdMuted}>{idx + 1}</td>
                      <td>
                        <span className={styles.tdBold}>{item.nama}</span>
                      </td>
                      <td>
                        <span className={styles.tdBold}>{item.jumlah_stok}</span>{" "}
                        <span className={styles.tdMuted}>{item.satuan}</span>
                      </td>
                      <td>
                        <div className={styles.stockBar}>
                          <div className={styles.stockBarTrack}>
                            <div
                              className={`${styles.stockBarFill} ${
                                status === "aman"
                                  ? styles.stockBarFillGreen
                                  : status === "menipis"
                                  ? styles.stockBarFillYellow
                                  : styles.stockBarFillRed
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className={styles.stockBarText}>
                            min: {item.batas_minimum} {item.satuan}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            status === "aman"
                              ? styles.badgeAman
                              : status === "menipis"
                              ? styles.badgeMenipis
                              : styles.badgeHabis
                          }
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>
                            {status === "aman" ? "check_circle" : status === "menipis" ? "warning" : "error"}
                          </span>
                          {status === "aman" ? "Aman" : status === "menipis" ? "Menipis" : "Habis"}
                        </span>
                      </td>
                      <td>
                        {expDate ? (
                          <span
                            className={`${styles.expiryBadge} ${
                              daysToExpiry !== null && daysToExpiry <= 0
                                ? styles.expiryExpired
                                : daysToExpiry !== null && daysToExpiry <= 7
                                ? styles.expirySoon
                                : styles.expiryOk
                            }`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>
                              {daysToExpiry !== null && daysToExpiry <= 0 ? "event_busy" : "calendar_today"}
                            </span>
                            {daysToExpiry !== null && daysToExpiry <= 0
                              ? "Kedaluwarsa"
                              : expDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        ) : (
                          <span className={styles.tdMuted}>—</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.actionBtn}
                            title="Update Jumlah"
                            onClick={() => {
                              setEditItem(item);
                              setQtyType("tambah");
                              setModalMode("update_qty");
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>
                              swap_vert
                            </span>
                          </button>
                          <button
                            className={styles.actionBtn}
                            title="Edit"
                            onClick={() => {
                              setEditItem(item);
                              setModalMode("edit");
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>
                              edit
                            </span>
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            title="Hapus"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ═══ Add / Edit Modal ═══ */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className={styles.modalOverlay} onClick={() => { setModalMode(null); setEditItem(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === "add" ? "Tambah Bahan Baku" : "Edit Bahan Baku"}
              </h3>
              <button className={styles.closeBtn} onClick={() => { setModalMode(null); setEditItem(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form action={modalMode === "add" ? addAction : editAction}>
              <div className={styles.modalBody}>
                {modalMode === "edit" && editItem && (
                  <input type="hidden" name="id" value={editItem.id} />
                )}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nama Bahan</label>
                  <input
                    className={styles.formInput}
                    name="nama"
                    type="text"
                    placeholder="Contoh: Biji Kopi Gayo"
                    defaultValue={editItem?.nama || ""}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Jumlah Stok</label>
                    <input
                      className={styles.formInput}
                      name="jumlah_stok"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      defaultValue={editItem?.jumlah_stok || ""}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Satuan</label>
                    <input
                      className={styles.formInput}
                      name="satuan"
                      type="text"
                      placeholder="Contoh: kg, liter, pcs"
                      defaultValue={editItem?.satuan || ""}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Batas Minimum</label>
                    <input
                      className={styles.formInput}
                      name="batas_minimum"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      defaultValue={editItem?.batas_minimum || ""}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Kedaluwarsa</label>
                    <input
                      className={styles.formInput}
                      name="masa_kedaluwarsa"
                      type="date"
                      defaultValue={
                        editItem?.masa_kedaluwarsa
                          ? new Date(editItem.masa_kedaluwarsa).toISOString().split("T")[0]
                          : ""
                      }
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => { setModalMode(null); setEditItem(null); }}>
                  Batal
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={modalMode === "add" ? isAddPending : isEditPending}>
                  {(modalMode === "add" ? isAddPending : isEditPending) ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Update Quantity Modal ═══ */}
      {modalMode === "update_qty" && editItem && (
        <div className={styles.modalOverlay} onClick={() => { setModalMode(null); setEditItem(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Update Stok: {editItem.nama}</h3>
              <button className={styles.closeBtn} onClick={() => { setModalMode(null); setEditItem(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form action={qtyAction}>
              <div className={styles.modalBody}>
                <input type="hidden" name="id" value={editItem.id} />
                <input type="hidden" name="user_id" value="1" />

                <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)", marginBottom: "1rem" }}>
                  Stok saat ini: <strong>{editItem.jumlah_stok} {editItem.satuan}</strong>
                </p>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tipe</label>
                  <div className={styles.filterButtons}>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${qtyType === "tambah" ? styles.filterBtnActive : ""}`}
                      onClick={() => setQtyType("tambah")}
                    >
                      + Tambah Stok
                    </button>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${qtyType === "kurangi" ? styles.filterBtnActive : ""}`}
                      onClick={() => setQtyType("kurangi")}
                    >
                      − Kurangi Stok
                    </button>
                  </div>
                  <input type="hidden" name="tipe" value={qtyType} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Jumlah ({editItem.satuan})</label>
                  <input
                    className={styles.formInput}
                    name="jumlah_baru"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0"
                    required
                  />
                </div>

                {qtyType === "tambah" && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Pemasok (opsional)</label>
                      <select className={styles.formSelect} name="pemasok_id">
                        <option value="">— Pilih Pemasok —</option>
                        {pemasokList.map((p) => (
                          <option key={p.id} value={p.id}>{p.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Harga Pembelian (opsional)</label>
                      <input
                        className={styles.formInput}
                        name="harga"
                        type="number"
                        step="100"
                        min="0"
                        placeholder="Rp 0"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => { setModalMode(null); setEditItem(null); }}>
                  Batal
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={isQtyPending}>
                  {isQtyPending ? "Memproses..." : "Update Stok"}
                </button>
              </div>
            </form>
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
            <h3 className={styles.confirmTitle}>Hapus Bahan Baku?</h3>
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
