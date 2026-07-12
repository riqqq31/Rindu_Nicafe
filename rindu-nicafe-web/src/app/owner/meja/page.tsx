"use client";

import { useEffect, useState } from "react";
import { getMeja, addMeja, deleteMeja } from "@/app/actions/meja";
import QRCode from "react-qr-code";
import styles from "./meja.module.css";

export default function MejaPage() {
  const [mejas, setMejas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomorMeja, setNomorMeja] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [printData, setPrintData] = useState<any>(null);

  const fetchMeja = async () => {
    setLoading(true);
    try {
      const data = await getMeja();
      setMejas(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeja();
    // Get the base URL dynamically for QR code generation
    setAppUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (printData) {
      window.print();
      // Use setTimeout to ensure print dialog fires before resetting
      setTimeout(() => setPrintData(null), 100); 
    }
  }, [printData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorMeja) return;

    const res = await addMeja(parseInt(nomorMeja));
    if (res.success) {
      setIsModalOpen(false);
      setNomorMeja("");
      fetchMeja();
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus meja ini?")) {
      const res = await deleteMeja(id);
      if (res.success) {
        fetchMeja();
      } else {
        alert(res.error);
      }
    }
  };

  const handlePrint = (meja: any) => {
    setPrintData(meja);
  };

  return (
    <div className={styles.container}>
      
      {/* Hidden print area */}
      {printData && (
        <div id="print-area" style={{ textAlign: "center", padding: "2rem" }}>
          <h2>Rindu Nicafe</h2>
          <h3>Meja {printData.nomor_meja}</h3>
          <div style={{ margin: "2rem 0" }}>
            <QRCode value={`${appUrl}/pesan?meja=${printData.nomor_meja}`} size={256} />
          </div>
          <p>Scan untuk Memesan</p>
        </div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.headerRow} style={{ padding: "1.5rem 1.5rem 0 1.5rem", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>Manajemen Meja & QR Code</h2>
          <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined">add</span>
            Tambah Meja
          </button>
        </div>

        {loading ? (
          <p style={{ padding: "1.5rem" }}>Loading...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nomor Meja</th>
                <th>Status</th>
                <th>QR Code</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {mejas.map(m => {
                const qrUrl = `${appUrl}/pesan?meja=${m.nomor_meja}`;
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, fontSize: "1.25rem" }}>Meja {m.nomor_meja}</td>
                    <td>
                      <span style={{ 
                        padding: "0.25rem 0.75rem", 
                        borderRadius: "1rem", 
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        backgroundColor: m.status === "kosong" ? "#e8f5e9" : "#ffebee",
                        color: m.status === "kosong" ? "#2e7d32" : "#c62828"
                      }}>
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className={styles.qrContainer}>
                        <QRCode value={qrUrl} size={80} />
                        <button className={styles.printButton} onClick={() => handlePrint(m)}>
                          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>print</span>
                          Cetak QR
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button className={styles.deleteButton} onClick={() => handleDelete(m.id)} title="Hapus Meja">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {mejas.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "3rem" }}>
                    Belum ada data meja.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Tambah Meja Baru</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nomor Meja</label>
                <input 
                  type="number" 
                  min="1"
                  required 
                  value={nomorMeja}
                  onChange={(e) => setNomorMeja(e.target.value)}
                  placeholder="Contoh: 1, 2, 3..."
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className={styles.saveButton}>
                  Simpan Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
