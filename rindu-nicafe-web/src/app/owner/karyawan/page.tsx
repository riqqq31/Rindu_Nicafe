"use client";

import { useEffect, useState } from "react";
import { getKaryawanList, createKaryawan, updateKaryawan, deleteKaryawan } from "@/app/actions/karyawan";
import styles from "./karyawan.module.css";

export default function KaryawanPage() {
  const [karyawans, setKaryawans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    nama: "",
    kontak: "",
    jadwal_shift: "Pagi",
    gaji_per_jam: ""
  });

  const fetchKaryawans = async () => {
    setLoading(true);
    try {
      const data = await getKaryawanList();
      setKaryawans(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKaryawans();
  }, []);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);
  };

  const handleOpenModal = (karyawan?: any) => {
    if (karyawan) {
      setEditId(karyawan.id);
      setFormData({
        username: karyawan.username,
        nama: karyawan.nama,
        kontak: karyawan.kontak || "",
        jadwal_shift: karyawan.jadwal_shift || "Pagi",
        gaji_per_jam: karyawan.gaji_per_jam?.toString() || ""
      });
    } else {
      setEditId(null);
      setFormData({
        username: "",
        nama: "",
        kontak: "",
        jadwal_shift: "Pagi",
        gaji_per_jam: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      gaji_per_jam: Number(formData.gaji_per_jam)
    };

    let res;
    if (editId) {
      res = await updateKaryawan(editId, payload);
    } else {
      res = await createKaryawan(payload);
    }

    if (res.success) {
      setIsModalOpen(false);
      fetchKaryawans();
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus karyawan ini?")) {
      const res = await deleteKaryawan(id);
      if (res.success) {
        fetchKaryawans();
      } else {
        alert(res.error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableContainer}>
        <div className={styles.headerRow}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>Daftar Karyawan</h2>
          <button className={styles.addButton} onClick={() => handleOpenModal()}>
            <span className="material-symbols-outlined">person_add</span>
            Tambah Karyawan
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className={styles.tableOverflow}>
            <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kontak</th>
                <th>Shift</th>
                <th>Gaji / Jam</th>
                <th>Jam Kerja (Bln Ini)</th>
                <th>Estimasi Gaji</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {karyawans.map(k => (
                <tr key={k.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{k.nama}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>@{k.username}</div>
                  </td>
                  <td>{k.kontak || "-"}</td>
                  <td>
                    <span className={styles.shiftBadge}>{k.jadwal_shift || "-"}</span>
                  </td>
                  <td>{formatRupiah(k.gaji_per_jam || 0)}</td>
                  <td>{k.totalJamBulanIni?.toFixed(1) || "0"} Jam</td>
                  <td style={{ fontWeight: 600, color: "var(--primary)" }}>{formatRupiah(k.estimasiGaji || 0)}</td>
                  <td>
                    <div className={styles.actionCell}>
                      <button className={styles.editButton} onClick={() => handleOpenModal(k)} title="Edit">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className={styles.deleteButton} onClick={() => handleDelete(k.id)} title="Hapus">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {karyawans.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                    Belum ada data karyawan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>{editId ? "Edit Karyawan" : "Tambah Karyawan"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nama Lengkap</label>
                <input 
                  type="text" 
                  required 
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Username</label>
                <input 
                  type="text" 
                  required 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Kontak (No HP)</label>
                <input 
                  type="text" 
                  value={formData.kontak}
                  onChange={(e) => setFormData({...formData, kontak: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Jadwal Shift</label>
                <select 
                  value={formData.jadwal_shift}
                  onChange={(e) => setFormData({...formData, jadwal_shift: e.target.value})}
                >
                  <option value="Pagi (08:00 - 16:00)">Pagi (08:00 - 16:00)</option>
                  <option value="Sore (16:00 - 00:00)">Sore (16:00 - 00:00)</option>
                  <option value="Malam">Malam</option>
                  <option value="Fleksibel">Fleksibel</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Gaji per Jam (Rp)</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={formData.gaji_per_jam}
                  onChange={(e) => setFormData({...formData, gaji_per_jam: e.target.value})}
                />
              </div>
              
              {!editId && (
                <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginTop: "1rem" }}>
                  *Password default untuk karyawan baru adalah <strong>password123</strong>
                </p>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className={styles.saveButton}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
