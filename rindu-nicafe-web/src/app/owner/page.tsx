"use client";

import styles from "./owner-dashboard.module.css";
import { useEffect, useState, useCallback } from "react";
import { getDashboardStats } from "@/app/actions/dashboard";
import { getNotifikasi } from "@/app/actions/notifikasi";
import Link from "next/link";

interface Notifikasi {
  id: number;
  tipe: string;
  pesan: string;
  tujuan_role: string;
  referensi_id: number | null;
  status: string;
  waktu: Date;
}

interface ChartDataPoint {
  label: string;
  total: number;
  isActive: boolean;
}

export default function OwnerDashboardPage() {
  const [pendapatanHariIni, setPendapatanHariIni] = useState(0);
  const [jumlahPesanan, setJumlahPesanan] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [stokMenipisCount, setStokMenipisCount] = useState(0);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [notifikasiList, setNotifikasiList] = useState<Notifikasi[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [stats, notifs] = await Promise.all([
        getDashboardStats(),
        getNotifikasi("owner"),
      ]);
      setPendapatanHariIni(stats.pendapatanHariIni);
      setJumlahPesanan(stats.jumlahPesanan);
      setAvgRating(stats.avgRating);
      setStokMenipisCount(stats.stokMenipisCount);
      setChartData(stats.chartData);
      setNotifikasiList(notifs);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unreadCount = notifikasiList.filter((n) => n.status === "belum_dibaca").length;

  const getNotifIcon = (tipe: string) => {
    switch (tipe) {
      case "restock":
        return "warning";
      case "omzet":
        return "trending_down";
      case "sistem":
        return "info";
      default:
        return "notifications";
    }
  };

  const getNotifColor = (tipe: string) => {
    switch (tipe) {
      case "restock":
        return "var(--error)";
      case "omzet":
        return "var(--secondary)";
      default:
        return "var(--on-surface-variant)";
    }
  };

  const getNotifStyle = (tipe: string) => {
    switch (tipe) {
      case "restock":
        return styles.error;
      case "omzet":
        return styles.warning;
      default:
        return styles.info;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(1)}K`;
    return formatCurrency(amount);
  };

  const maxChartValue = Math.max(...chartData.map(d => d.total), 5000000); // Minimum scale of 5M

  return (
    <>
      {/* Stat Cards Grid */}
      <div className={styles.statsGrid}>
        {/* Stat 1 */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statLabel}>Pendapatan Hari Ini</p>
            <span className="material-symbols-outlined text-secondary">
              payments
            </span>
          </div>
          <h3 className={styles.statValue}>{formatCurrency(pendapatanHariIni)}</h3>
          <div className={styles.statTrend}>
            <span className={`material-symbols-outlined ${styles.trendUp}`}>
              trending_up
            </span>
            <span className={styles.trendText}>+0% vs kemarin</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statLabel}>Jumlah Pesanan</p>
            <span className="material-symbols-outlined text-secondary">
              receipt_long
            </span>
          </div>
          <h3 className={styles.statValue}>{jumlahPesanan}</h3>
          <div className={styles.statTrend}>
            <span className={`material-symbols-outlined ${styles.trendUp}`}>
              trending_up
            </span>
            <span className={styles.trendText}>+0% vs kemarin</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statLabel}>Rata-rata Rating</p>
            <span className="material-symbols-outlined text-secondary">
              star_half
            </span>
          </div>
          <h3 className={styles.statValue}>
            {avgRating.toFixed(1)}<span style={{ fontSize: "1.125rem", color: "var(--on-surface-variant)", fontWeight: 400 }}>/5</span>
          </h3>
          <div className={styles.ratingStars}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined">star_half</span>
          </div>
        </div>

        {/* Stat 4 — Dynamic Stok Menipis */}
        <Link href="/owner/stok" style={{ textDecoration: "none" }}>
          <div className={`${styles.statCard} ${stokMenipisCount > 0 ? styles.statCardAlert : ""}`}>
            <div className={styles.statHeader}>
              <p className={styles.statLabel}>Stok Menipis</p>
              <span className={`material-symbols-outlined ${stokMenipisCount > 0 ? styles.alertText : ""}`}>
                {stokMenipisCount > 0 ? "warning" : "inventory_2"}
              </span>
            </div>
            <h3 className={`${styles.statValue} ${stokMenipisCount > 0 ? styles.alertText : ""}`}>
              {stokMenipisCount} Items
            </h3>
            <div className={`${styles.statTrend} ${stokMenipisCount > 0 ? styles.alertText : ""}`}>
              <span className={styles.trendText}>
                {stokMenipisCount > 0 ? "Perlu tindakan segera" : "Semua stok aman"}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Layout Grid */}
      <div className={styles.mainGrid}>
        {/* Chart Area */}
        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Penjualan 7 Hari Terakhir</h3>
            <button className={styles.chartFilter}>
              Minggu Ini <span className="material-symbols-outlined" style={{fontSize: "0.875rem"}}>expand_more</span>
            </button>
          </div>

          <div className={styles.chartBody}>
            {/* Y-axis labels */}
            <div className={styles.yAxis}>
              <span>{formatShortCurrency(maxChartValue)}</span>
              <span>{formatShortCurrency(maxChartValue * 0.8)}</span>
              <span>{formatShortCurrency(maxChartValue * 0.6)}</span>
              <span>{formatShortCurrency(maxChartValue * 0.4)}</span>
              <span>{formatShortCurrency(maxChartValue * 0.2)}</span>
              <span>0</span>
            </div>

            {/* Grid lines */}
            <div className={styles.chartGridLines}>
              <div className={styles.gridLine}></div>
              <div className={styles.gridLine}></div>
              <div className={styles.gridLine}></div>
              <div className={styles.gridLine}></div>
              <div className={styles.gridLine}></div>
            </div>

            {/* Bars */}
            {chartData.map((data, index) => {
              const heightPercent = maxChartValue > 0 ? Math.max((data.total / maxChartValue) * 100, 2) : 2;
              return (
                <div 
                  key={index} 
                  className={`${styles.bar} ${data.isActive ? styles.barActive : styles.barNormal}`} 
                  style={{ height: `${heightPercent}%` }}
                >
                  <div className={styles.tooltip}>{formatCurrency(data.total)}</div>
                  <div className={`${styles.xLabel} ${data.isActive ? styles.xLabelActive : ''}`}>{data.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications Panel — Dynamic */}
        <div className={styles.notificationsPanel}>
          <div className={styles.notificationsHeader}>
            <h3 className={styles.notificationsTitle}>Notifikasi & Peringatan</h3>
            {unreadCount > 0 && (
              <span className={styles.notificationsBadge}>{unreadCount} Baru</span>
            )}
          </div>
          
          <div className={styles.notificationsList}>
            {notifikasiList.length === 0 ? (
              <>
                <div className={`${styles.alertItem} ${styles.info}`}>
                  <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)", marginTop: "0.125rem" }}>check_circle</span>
                  <div>
                    <h4 className={styles.alertTitle}>Semua stok aman</h4>
                    <p className={styles.alertDesc}>Tidak ada peringatan saat ini.</p>
                  </div>
                </div>
              </>
            ) : (
              notifikasiList.slice(0, 8).map((notif) => (
                <div key={notif.id} className={`${styles.alertItem} ${getNotifStyle(notif.tipe)}`}>
                  <span
                    className="material-symbols-outlined"
                    style={{ color: getNotifColor(notif.tipe), marginTop: "0.125rem" }}
                  >
                    {getNotifIcon(notif.tipe)}
                  </span>
                  <div>
                    <h4 className={styles.alertTitle}>
                      {notif.tipe === "restock" ? "Stok Menipis" : notif.tipe === "omzet" ? "Peringatan Omzet" : "Sistem"}
                    </h4>
                    <p className={styles.alertDesc}>{notif.pesan}</p>
                    {notif.tipe === "restock" && (
                      <Link href="/owner/stok" className={`${styles.alertAction} ${styles.error}`}>
                        Kelola Stok
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
