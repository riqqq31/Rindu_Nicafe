"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./karyawan-dashboard.module.css";
import { getAllTransaksi, updateStatusPesanan } from "@/app/actions/transaksi";

export default function KaryawanDashboardPage() {
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");
  const [pesanan, setPesanan] = useState<any[]>([]);
  const [loadingPesanan, setLoadingPesanan] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      
      setDateString(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateTime(); // Initial call
    const intervalId = setInterval(updateTime, 1000);

    const fetchPesanan = async () => {
      const res = await getAllTransaksi();
      if (res.success && res.data) {
        setPesanan(res.data.slice(0, 5)); // Ambil 5 pesanan terbaru
      }
      setLoadingPesanan(false);
    };
    fetchPesanan();

    return () => clearInterval(intervalId);
  }, []);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const res = await updateStatusPesanan(id, newStatus);
    if (res.success) {
      setPesanan(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } else {
      alert("Gagal update status");
    }
  };

  const getStatusSelect = (item: any) => {
    let selectClass = styles.statusBadgeAntre;
    if (item.status === "dimasak" || item.status === "diproses") selectClass = styles.statusBadgeDimasak;
    if (item.status === "selesai" || item.status === "dibayar") selectClass = styles.statusBadgeSelesai;

    return (
      <select 
        className={`${styles.statusSelect} ${selectClass}`}
        value={item.status}
        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="menunggu">Menunggu</option>
        <option value="dibayar">Dibayar</option>
        <option value="diproses">Diproses</option>
        <option value="selesai">Selesai</option>
      </select>
    );
  };

  return (
    <>
      {/* Dashboard Header */}
      <div className={styles.header}>
        <h1 className={styles.greeting}>Halo, Andi</h1>
        <p className={styles.dateText}>{dateString}</p>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Absensi Card (Large) */}
        <div className={`${styles.card} ${styles.absensiCard}`}>
          <div>
            <div className={styles.cardTitleFlex}>
              <span className="material-symbols-outlined text-secondary">
                schedule
              </span>
              <h2 className={styles.cardTitle}>Status Absensi Hari Ini</h2>
            </div>
            <div className={styles.timeContainer}>
              <div className={styles.clockDisplay}>{timeString || "00.00"}</div>
              <div className={styles.statusBadge}>Belum Clock In</div>
            </div>
          </div>
          <Link href="/karyawan/absensi" style={{ textDecoration: 'none' }}>
            <button className={styles.clockInBtn}>Clock In Sekarang</button>
          </Link>
        </div>

        {/* Quick Actions Container */}
        <div className={styles.actionsGrid}>
          {/* Input Pesanan Card */}
          <Link href="/karyawan/pos" className={`${styles.card} ${styles.actionCard}`} style={{ textDecoration: 'none' }}>
            <div className={styles.actionIconCircle}>
              <span className={`material-symbols-outlined ${styles.actionIcon}`}>
                add
              </span>
            </div>
            <span className={styles.actionText}>Input Pesanan</span>
          </Link>

          {/* Cek Stok Card */}
          <Link href="/karyawan/stok" className={`${styles.card} ${styles.actionCard}`} style={{ textDecoration: 'none' }}>
            <div className={styles.actionIconCircle}>
              <span className={`material-symbols-outlined ${styles.actionIcon}`}>
                inventory_2
              </span>
            </div>
            <span className={styles.actionText}>Cek Stok</span>
          </Link>
        </div>
      </div>

      {/* Data Table: Pesanan Terbaru */}
      <div className={styles.tableContainerWrapper}>
        <div className={`${styles.card} ${styles.tableContainer}`}>
          <div className={styles.tableHeader}>
            <h2 className={styles.cardTitle}>Pesanan Terbaru</h2>
            <span className={styles.seeAllLink}>Lihat Semua</span>
          </div>
          
          <div className={styles.tableOverflow}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Meja</th>
                  <th>Total</th>
                  <th className={styles.textRight}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingPesanan ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>Memuat data...</td>
                  </tr>
                ) : pesanan.length > 0 ? (
                  pesanan.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.tdId}>#{item.id}</td>
                      <td className={styles.tdBold}>
                        {item.tipe_pesanan === "takeaway" ? "Takeaway" : `Meja ${item.meja_id?.toString().padStart(2, '0')}`}
                      </td>
                      <td>{formatRupiah(item.total)}</td>
                      <td className={styles.tdRight}>
                        {getStatusSelect(item)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>Belum ada pesanan hari ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
