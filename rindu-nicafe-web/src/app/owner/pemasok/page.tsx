"use client";

import styles from "./pemasok.module.css";
import { useEffect, useState, useActionState, useCallback } from "react";
import {
  getPemasok,
  addPemasok,
  updatePemasok,
  deletePemasok,
  type PemasokFormState,
} from "@/app/actions/pemasok";

interface Pemasok {
  id: number;
  nama: string;
  kontak: string | null;
  alamat: string | null;
}

type ModalMode = "add" | "edit" | null;

export default function OwnerPemasokPage() {
  const [items, setItems] = useState<Pemasok[]>([]);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<Pemasok | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pemasok | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Action states
  const [addState, addAction, isAddPending] = useActionState<PemasokFormState, FormData>(addPemasok, {});
  const [editState, editAction, isEditPending] = useActionState<PemasokFormState, FormData>(updatePemasok, {});

  const fetchData = useCallback(async () => {
    const data = await getPemasok();
    setItems(data);
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
    const result = await deletePemasok(deleteTarget.id);
    if (result.success) {
      setToast({ type: "success", message: result.message || "Berhasil dihapus!" });
      fetchData();
    } else {
      setToast({ type: "error", message: result.error || "Gagal menghapus." });
    }
    setDeleteTarget(null);
  };

  // Filter & search
  const filtered = items.filter((item) =>
    item.nama.toLowerCase().includes(search.toLowerCase())
  );

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
          <h2>Data Pemasok</h2>
          <p>Kelola data mitra dan pemasok bahan baku kafe Anda</p>
        </div>
        <button className={styles.addButton} onClick={() => { setModalMode("add"); setEditItem(null); }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>add</span>
          Tambah Pemasok
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIconCircle} ${styles.summaryIconGreen}`}>
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div>
            <p className={styles.summaryLabel}>Total Pemasok</p>
            <p className={styles.summaryValue}>{items.length}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIconCircle} ${styles.summaryIconPrimary}`}>
            <span className="material-symbols-outlined">handshake</span>
          </div>
          <div>
            <p className={styles.summaryLabel}>Mitra Aktif</p>
            <p className={styles.summaryValue}>{items.length}</p>
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
            placeholder="Cari nama pemasok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableOverflow}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>local_shipping</span>
              <p className={styles.emptyTitle}>Tidak ada data</p>
              <p className={styles.emptyDesc}>
                {search ? "Tidak ditemukan pemasok yang sesuai pencarian." : "Belum ada pemasok. Tambahkan yang pertama!"}
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama Pemasok</th>
                  <th>Kontak</th>
                  <th>Alamat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td className={styles.tdMuted}>{idx + 1}</td>
                    <td>
                      <span className={styles.tdBold}>{item.nama}</span>
                    </td>
                    <td>
                      {item.kontak ? (
                        <div className={styles.contactInfo}>
                          <span className={`material-symbols-outlined ${styles.contactIcon}`}>call</span>
                          <span>{item.kontak}</span>
                        </div>
                      ) : (
                        <span className={styles.tdMuted}>—</span>
                      )}
                    </td>
                    <td>
                      {item.alamat ? (
                        <div className={styles.contactInfo}>
                          <span className={`material-symbols-outlined ${styles.contactIcon}`}>location_on</span>
                          <span style={{ maxWidth: "20rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.alamat}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.tdMuted}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
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
                ))}
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
                {modalMode === "add" ? "Tambah Pemasok" : "Edit Pemasok"}
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
                  <label className={styles.formLabel}>Nama Pemasok *</label>
                  <input
                    className={styles.formInput}
                    name="nama"
                    type="text"
                    placeholder="Contoh: PT. Biji Kopi Nusantara"
                    defaultValue={editItem?.nama || ""}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kontak (No. HP / Email)</label>
                  <input
                    className={styles.formInput}
                    name="kontak"
                    type="text"
                    placeholder="Contoh: 0812-3456-7890"
                    defaultValue={editItem?.kontak || ""}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Alamat</label>
                  <textarea
                    className={`${styles.formInput} ${styles.formTextarea}`}
                    name="alamat"
                    placeholder="Detail alamat pemasok..."
                    defaultValue={editItem?.alamat || ""}
                  />
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

      {/* ═══ Delete Confirmation ═══ */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>delete_forever</span>
            </div>
            <h3 className={styles.confirmTitle}>Hapus Pemasok?</h3>
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
