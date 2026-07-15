"use client";

import { useEffect, useState } from "react";
import { getTransaksiHarian, updateStatusPesanan } from "@/app/actions/transaksi";
import styles from "./transaksi.module.css";
import StrukDigital from "@/components/StrukDigital";

export default function TransaksiPage() {
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  useEffect(() => {
    async function fetchTransaksi() {
      const res = await getTransaksiHarian();
      if (res.success) {
        setTransaksi(res.data || []);
      }
      setLoading(false);
    }
    fetchTransaksi();
  }, []);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTx) return;
    const res = await updateStatusPesanan(selectedTx.id, status);
    if (res.success) {
      // update local state
      setTransaksi(prev => prev.map(tx => tx.id === selectedTx.id ? { ...tx, status } : tx));
      setSelectedTx({ ...selectedTx, status });
    } else {
      alert("Gagal update status");
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "menunggu": return styles.statusMenunggu;
      case "dibayar": return styles.statusDibayar;
      case "diproses": return styles.statusDiproses;
      case "selesai": return styles.statusSelesai;
      default: return "";
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR"
    }).format(number);
  };

  const formatTanggal = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Riwayat Transaksi Harian</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID Pesanan</th>
                <th>Waktu</th>
                <th>Tipe Pesanan</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transaksi.map((tx) => (
                <tr key={tx.id} onClick={() => setSelectedTx(tx)}>
                  <td>#{tx.id}</td>
                  <td>{formatTanggal(tx.waktu)}</td>
                  <td style={{ textTransform: "capitalize" }}>{tx.tipe_pesanan.replace("_", " ")}</td>
                  <td>{formatRupiah(tx.total)}</td>
                  <td>
                    <span className={`${styles.status} ${getStatusClass(tx.status)}`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transaksi.length === 0 && (
            <p style={{ padding: "16px", textAlign: "center" }}>Belum ada transaksi hari ini.</p>
          )}
        </div>
      )}

      {selectedTx && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTx(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Struk Digital - #{selectedTx.id}</h2>
              <button className={styles.closeButton} onClick={() => setSelectedTx(null)}>&times;</button>
            </div>
            <div>
              <StrukDigital pesanan={selectedTx} />

              <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                {selectedTx.status === "dibayar" && (
                  <button onClick={() => handleUpdateStatus("diproses")} style={{ flex: 1, padding: "10px", backgroundColor: "var(--primary)", color: "white", borderRadius: "8px", fontWeight: "bold" }}>
                    Tandai Diproses
                  </button>
                )}
                {selectedTx.status === "diproses" && (
                  <button onClick={() => handleUpdateStatus("selesai")} style={{ flex: 1, padding: "10px", backgroundColor: "#2e7d32", color: "white", borderRadius: "8px", fontWeight: "bold" }}>
                    Tandai Selesai
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
