"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import styles from "../../pesan.module.css";
import { getOrderStatus, simulateQrisPayment } from "@/app/actions/pesan";

export default function QrisPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      const data = await getOrderStatus(id);
      if (data) {
        setOrder(data);
        if (data.status !== "menunggu") {
          // If already paid, go to status page
          router.replace(`/pesan/status/${id}`);
        }
      }
      setLoading(false);
    }
    fetchOrder();

    // Polling every 5 seconds (simulating waiting for real webhook)
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id, router]);

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      await simulateQrisPayment(id);
      router.replace(`/pesan/status/${id}`);
    } catch (e) {
      console.error(e);
      alert("Gagal memproses pembayaran");
      setIsSimulating(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem" }}>Loading...</div>;
  if (!order) return <div style={{ textAlign: "center", padding: "3rem" }}>Pesanan tidak ditemukan</div>;

  return (
    <div className={styles.qrisContainer}>
      <h2 style={{ color: "var(--primary)" }}>Pembayaran QRIS</h2>
      <p style={{ color: "var(--on-surface-variant)" }}>Scan kode QR di bawah menggunakan aplikasi m-banking atau e-wallet Anda.</p>
      
      <div className={styles.qrisBox}>
        <div className={styles.qrisPlaceholder}>
          <QRCode value={`qris://payment?id=${order.id}&amount=${order.total}`} size={200} />
        </div>
      </div>

      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.25rem" }}>
        {formatRupiah(order.total)}
      </div>
      <div style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem", marginBottom: "2rem" }}>
        ID Pesanan: #{order.id}
      </div>

      <div style={{ width: "100%", maxWidth: "400px", padding: "1rem", backgroundColor: "var(--surface-container-low)", borderRadius: "var(--border-radius)", marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginBottom: "0.5rem" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1rem", verticalAlign: "middle", marginRight: "0.25rem" }}>info</span>
          Halaman ini akan otomatis refresh ketika pembayaran berhasil.
        </p>
      </div>

      <button 
        className={styles.primaryButton} 
        style={{ maxWidth: "400px", backgroundColor: "#2e7d32" }}
        onClick={handleSimulatePayment}
        disabled={isSimulating}
      >
        <span className="material-symbols-outlined">payments</span>
        {isSimulating ? "Memproses..." : "Simulasi Sukses Bayar (Demo)"}
      </button>
    </div>
  );
}
