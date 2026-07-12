"use client";

import styles from "./owner-layout.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { useEffect, useState } from "react";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [dateString, setDateString] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDateString(
      now.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return (
    <div className={styles.layoutContainer}>
      {isSidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)}></div>
      )}
      
      {/* SideNavBar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandContainer}>
          <img
            src="/logo.png"
            alt="Rindu Nicafe Logo"
            className={styles.logoImage}
          />
          <div>
            <h1 className={styles.brandTitle}>Rindu Nicafe</h1>
            <p className={styles.brandSubtitle}>Management Suite</p>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <Link
            href="/owner"
            className={`${styles.navItem} ${
              pathname === "/owner" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              dashboard
            </span>
            <span className={styles.navText}>Dashboard</span>
          </Link>
          <Link
            href="/owner/menu"
            className={`${styles.navItem} ${
              pathname === "/owner/menu" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner/menu" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              restaurant_menu
            </span>
            <span className={styles.navText}>Menu</span>
          </Link>
          <Link
            href="/owner/stok"
            className={`${styles.navItem} ${
              pathname === "/owner/stok" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner/stok" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              inventory_2
            </span>
            <span className={styles.navText}>Stok Bahan Baku</span>
          </Link>
          <Link
            href="/owner/meja"
            className={`${styles.navItem} ${
              pathname === "/owner/meja" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner/meja" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              table_restaurant
            </span>
            <span className={styles.navText}>Meja & QR</span>
          </Link>
          <Link
            href="/owner/transaksi"
            className={`${styles.navItem} ${
              pathname === "/owner/transaksi" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner/transaksi" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              receipt_long
            </span>
            <span className={styles.navText}>Pesanan</span>
          </Link>
          <Link
            href="/owner/pos"
            className={`${styles.navItem} ${
              pathname === "/owner/pos" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner/pos" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              point_of_sale
            </span>
            <span className={styles.navText}>Input Pesanan (POS)</span>
          </Link>
          <Link
            href="/owner/karyawan"
            className={`${styles.navItem} ${
              pathname === "/owner/karyawan" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner/karyawan" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              group
            </span>
            <span className={styles.navText}>Karyawan</span>
          </Link>
          <Link
            href="/owner/pemasok"
            className={`${styles.navItem} ${
              pathname === "/owner/pemasok" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner/pemasok" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              local_shipping
            </span>
            <span className={styles.navText}>Pemasok</span>
          </Link>
          <Link
            href="/owner/laporan"
            className={`${styles.navItem} ${
              pathname === "/owner/laporan" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner/laporan" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              analytics
            </span>
            <span className={styles.navText}>Laporan</span>
          </Link>
          <Link
            href="/owner/feedback"
            className={`${styles.navItem} ${
              pathname === "/owner/feedback" ? styles.active : ""
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: pathname === "/owner/feedback" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              feedback
            </span>
            <span className={styles.navText}>Feedback</span>
          </Link>
        </nav>

        <div className={styles.userProfile}>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>A</div>
            <div>
              <p className={styles.userName}>Owner - Ariyo</p>
              <p className={styles.manageAccount}>Manage Account</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className={styles.logoutButton}>
              <span className="material-symbols-outlined">logout</span>
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainArea}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h2 className={styles.pageTitle}>
              {pathname === "/owner" ? "Dashboard" : 
               pathname === "/owner/stok" ? "Stok Bahan Baku" : 
               pathname === "/owner/pemasok" ? "Data Pemasok" : 
               pathname === "/owner/menu" ? "Manajemen Menu" : 
               pathname === "/owner/meja" ? "Manajemen Meja" : 
               pathname === "/owner/transaksi" ? "Riwayat Pesanan" :
               pathname === "/owner/karyawan" ? "Manajemen Karyawan" :
               pathname === "/owner/laporan" ? "Dashboard Laporan" :
               pathname === "/owner/feedback" ? "Feedback Pelanggan" :
               "Dashboard"}
            </h2>
            <p className={styles.dateText}>{dateString}</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconButton}>
              <span className="material-symbols-outlined">notifications</span>
              <span className={styles.badge}></span>
            </button>
            <button 
              className={`${styles.iconButton} ${styles.menuButton}`} 
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <div className={styles.scrollableCanvas}>{children}</div>
      </main>
    </div>
  );
}
