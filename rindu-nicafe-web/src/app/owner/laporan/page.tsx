"use client";

import { useEffect, useState } from "react";
import styles from "./laporan.module.css";
import { getLaporanData } from "../../actions/laporan";

type LaporanData = {
  totalPendapatan: number;
  totalPesanan: number;
  dailySales: { date: string; amount: number }[];
  topMenus: { nama: string; jumlah: number }[];
};

export default function LaporanPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getLaporanData(days);
        setData(res);
      } catch (error) {
        console.error("Failed to fetch laporan data", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [days]);

  const handleExportCSV = () => {
    if (!data) return;
    
    const headers = ["Tanggal,Pendapatan"];
    const rows = data.dailySales.map(s => `${s.date},${s.amount}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_penjualan_${days}_hari.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !data) {
    return <div className={styles.container}>Loading...</div>;
  }

  const maxAmount = data?.dailySales.reduce((max, s) => Math.max(max, s.amount), 0) || 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard Laporan</h1>
        <div className={styles.actions}>
          <select 
            className={styles.select}
            value={days} 
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>7 Hari Terakhir</option>
            <option value={30}>30 Hari Terakhir</option>
          </select>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleExportCSV}>
            Export CSV
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handlePrintPDF}>
            Print PDF
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Pendapatan</div>
          <div className={styles.statValue}>
            {data ? formatRupiah(data.totalPendapatan) : "-"}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Transaksi</div>
          <div className={styles.statValue}>
            {data ? data.totalPesanan : "-"}
          </div>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <h2>Grafik Penjualan Harian</h2>
        <div className={styles.chart}>
          {data?.dailySales.map((s) => {
            const heightPercent = Math.max((s.amount / maxAmount) * 100, 2); // min 2% so it's visible
            return (
              <div key={s.date} className={styles.barWrapper}>
                <div className={styles.barValue}>{formatRupiah(s.amount)}</div>
                <div 
                  className={styles.bar} 
                  style={{ height: `${heightPercent}%` }}
                ></div>
                <div className={styles.barLabel}>
                  {new Date(s.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.topMenus}>
        <h2>5 Menu Terlaris</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Peringkat</th>
              <th>Nama Menu</th>
              <th>Jumlah Terjual</th>
            </tr>
          </thead>
          <tbody>
            {data?.topMenus.map((m, idx) => (
              <tr key={idx}>
                <td>#{idx + 1}</td>
                <td>{m.nama}</td>
                <td>{m.jumlah}</td>
              </tr>
            ))}
            {(!data || data.topMenus.length === 0) && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center" }}>Belum ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
