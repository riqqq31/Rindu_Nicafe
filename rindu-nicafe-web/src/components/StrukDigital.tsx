"use client";

import styles from "./StrukDigital.module.css";
import { useEffect } from "react";

type StrukProps = {
  pesanan: any; // Using any for simplicity or properly type it if preferred
};

export default function StrukDigital({ pesanan }: StrukProps) {
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);
  };

  const formatDate = (dateString: string | Date) => {
    const d = new Date(dateString);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!pesanan) return null;

  return (
    <div className={styles.strukContainer}>
      <div className={styles.header}>
        <h2 className={styles.brandName}>RINDU NICAFE</h2>
        <p className={styles.brandAddress}>Jl. Kopi Kenangan No. 123</p>
        <p className={styles.brandAddress}>Telp: 0812-3456-7890</p>
      </div>

      <div className={styles.infoSection}>
        <div className={styles.infoRow}>
          <span>No. Pesanan:</span>
          <span>#{pesanan.id}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Tanggal:</span>
          <span>{formatDate(pesanan.waktu || new Date())}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Kasir:</span>
          <span>{pesanan.kasir ? pesanan.kasir.nama : "Mandiri (QRIS)"}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Tipe:</span>
          <span>{pesanan.tipe_pesanan === "dine_in" ? `Dine In (Meja ${pesanan.meja?.nomor_meja || "-"})` : "Takeaway"}</span>
        </div>
      </div>

      <div className={styles.itemsSection}>
        {pesanan.detail_pesanan?.map((item: any, index: number) => (
          <div key={index} className={styles.itemRow}>
            <div style={{ flex: 1 }}>
              <div className={styles.itemName}>{item.menu?.nama || "Item"}</div>
              <div className={styles.itemDetails}>
                <span>{item.jumlah} x {formatRupiah(item.subtotal / item.jumlah)}</span>
                <span>{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summarySection}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>{formatRupiah(pesanan.total)}</span>
        </div>
        {/* If there's tax or discount, add them here */}
        <div className={styles.totalRow}>
          <span>TOTAL</span>
          <span>{formatRupiah(pesanan.total)}</span>
        </div>
      </div>

      <div className={styles.infoSection} style={{ borderBottom: 'none' }}>
        <div className={styles.infoRow}>
          <span>Pembayaran:</span>
          <span>{pesanan.pembayaran?.metode || "-"}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Status:</span>
          <span>{pesanan.pembayaran?.status === "berhasil" ? "LUNAS" : pesanan.pembayaran?.status?.toUpperCase() || "PENDING"}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <p>Terima kasih atas kunjungannya!</p>
        <p>Silakan datang kembali</p>
      </div>

      <button className={styles.printButton} onClick={handlePrint}>
        <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px' }}>print</span>
        Cetak Struk
      </button>
    </div>
  );
}
