"use client";

import styles from "./karyawan-layout.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { useState, useEffect } from "react";
import NotificationBell from "@/components/NotificationBell";

export default function KaryawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [dateString, setDateString] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    setDateString(date.toLocaleDateString('id-ID', options));
  }, []);

  return (
    <div className={styles.layoutContainer}>
      {isSidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)}></div>
      )}
      {/* TopNavBar (Mobile Only) */}
      <header className={styles.mobileTopNav}>
        <div className={styles.mobileTopNavBrand}>
          <span className="material-symbols-outlined text-primary">coffee</span>
          <span className="text-primary font-bold" style={{ fontSize: "1.5rem" }}>
            Rindu Nicafe
          </span>
        </div>
        <div className={styles.headerActions}>
          <NotificationBell role="karyawan" />
          <button 
            className={`${styles.iconButton} ${styles.menuButton}`} 
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* SideNavBar (Desktop Only) */}
      <nav className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brandFlex}>
            <span className={`material-symbols-outlined ${styles.brandIcon}`}>
              coffee_maker
            </span>
            <span className={styles.brandTitle}>Rindu Nicafe</span>
          </div>
          <span className={styles.brandSubtitle}>Staff Dashboard</span>
        </div>

        <div className={styles.navMenu}>
          <Link
            href="/karyawan"
            className={`${styles.navItem} ${
              pathname === "/karyawan" ? styles.active : ""
            }`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className={styles.navText}>Dashboard</span>
          </Link>
          <Link
            href="/karyawan/pos"
            className={`${styles.navItem} ${
              pathname === "/karyawan/pos" ? styles.active : ""
            }`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className={`${styles.navText} ${styles.navTextNormal}`}>
              Input Pesanan
            </span>
          </Link>
          <Link
            href="/karyawan/absensi"
            className={`${styles.navItem} ${
              pathname === "/karyawan/absensi" ? styles.active : ""
            }`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">how_to_reg</span>
            <span className={`${styles.navText} ${styles.navTextNormal}`}>
              Absensi
            </span>
          </Link>
          <Link
            href="/karyawan/stok"
            className={`${styles.navItem} ${
              pathname === "/karyawan/stok" ? styles.active : ""
            }`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/karyawan/stok" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              inventory_2
            </span>
            <span className={`${styles.navText} ${styles.navTextNormal}`}>
              Stok Bahan Baku
            </span>
          </Link>
          <Link
            href="/karyawan/transaksi"
            className={`${styles.navItem} ${
              pathname === "/karyawan/transaksi" ? styles.active : ""
            }`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">history</span>
            <span className={`${styles.navText} ${styles.navTextNormal}`}>
              Riwayat Transaksi
            </span>
          </Link>
        </div>

        <div className={styles.userProfile}>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>A</div>
            <div>
              <div className={styles.userName}>Karyawan - Andi</div>
              <p className={styles.dateText}>{dateString}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className={styles.logoutButton}>
              <span className="material-symbols-outlined">logout</span>
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className={styles.mainArea}>{children}</main>
    </div>
  );
}
