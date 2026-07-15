"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../pesan.module.css";
import { getOrderStatus, submitCustomerFeedback } from "@/app/actions/pesan";
import StrukDigital from "@/components/StrukDigital";

export default function StatusPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStruk, setShowStruk] = useState(false);
  
  // Feedback state
  const [rating, setRating] = useState(0);
  const [komentar, setKomentar] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      const data = await getOrderStatus(id);
      if (data) {
        setOrder(data);
      }
      setLoading(false);
    }
    fetchOrder();

    const interval = setInterval(fetchOrder, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [id]);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert("Silakan berikan rating bintang terlebih dahulu.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await submitCustomerFeedback(id, rating, komentar);
      // Refresh order to show it has feedback now
      const data = await getOrderStatus(id);
      if (data) setOrder(data);
      
      // Redirect to menu page after a short delay so they can see the thank you message
      setTimeout(() => {
        router.push("/pesan");
      }, 2000);
    } catch (e) {
      console.error(e);
      alert("Gagal mengirim feedback.");
    }
    setIsSubmitting(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem" }}>Loading...</div>;
  if (!order) return <div style={{ textAlign: "center", padding: "3rem" }}>Pesanan tidak ditemukan</div>;

  let icon = "schedule";
  let statusTitle = "Menunggu";
  let statusDesc = "Pesanan Anda sedang diproses.";
  let isSuccess = false;

  if (order.status === "dibayar") {
    icon = "check_circle";
    statusTitle = "Pembayaran Berhasil";
    statusDesc = "Pesanan Anda telah diterima dan akan segera disiapkan.";
    isSuccess = true;
  } else if (order.status === "diproses") {
    icon = "soup_kitchen";
    statusTitle = "Sedang Disiapkan";
    statusDesc = "Pesanan Anda sedang dimasak oleh tim kami.";
    isSuccess = true;
  } else if (order.status === "selesai") {
    icon = "done_all";
    statusTitle = "Selesai";
    statusDesc = "Pesanan Anda telah diantar/siap diambil. Selamat menikmati!";
    isSuccess = true;
  }

  return (
    <div className={styles.statusContainer}>
      <span className={`material-symbols-outlined ${styles.statusIcon} ${isSuccess ? styles.success : ''}`}>
        {icon}
      </span>
      
      <h1 className={styles.statusText}>{statusTitle}</h1>
      <p className={styles.statusSub}>{statusDesc}</p>

      <div style={{ backgroundColor: "var(--surface-container-lowest)", padding: "1rem", borderRadius: "var(--border-radius)", border: "1px solid var(--outline-variant)", width: "100%", maxWidth: "400px", textAlign: "left", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem" }}>No. Pesanan</span>
          <span style={{ fontWeight: 600 }}>#{order.id}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem" }}>Meja</span>
          <span style={{ fontWeight: 600 }}>{order.meja?.nomor_meja || "-"}</span>
        </div>
      </div>

      {isSuccess && (
        <button 
          onClick={() => setShowStruk(true)}
          style={{ width: "100%", maxWidth: "400px", padding: "12px", backgroundColor: "var(--surface-container)", color: "var(--on-surface)", border: "1px solid var(--outline)", borderRadius: "8px", fontWeight: "bold", marginBottom: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}
        >
          <span className="material-symbols-outlined">receipt_long</span>
          Lihat Struk Digital
        </button>
      )}

      {/* Feedback Section if status is selesai */}
      {order.status === "selesai" && !order.feedback && (
        <div className={styles.feedbackBox}>
          <h3 style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>Bagaimana pesanan Anda?</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>Bantu kami menjadi lebih baik dengan memberikan penilaian.</p>
          
          <div className={styles.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star}
                className={`${styles.starBtn} ${rating >= star ? styles.active : ''}`}
                onClick={() => setRating(star)}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}>
                  star
                </span>
              </button>
            ))}
          </div>

          <textarea 
            className={styles.textArea} 
            placeholder="Tuliskan komentar Anda (opsional)..."
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
          />

          <button 
            className={styles.primaryButton}
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? "Mengirim..." : "Kirim Penilaian"}
          </button>
        </div>
      )}

      {order.feedback && (
        <div className={styles.feedbackBox} style={{ backgroundColor: "var(--secondary-container)", borderColor: "var(--secondary-container)" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--on-secondary-container)", fontSize: "2rem", marginBottom: "0.5rem" }}>favorite</span>
          <h3 style={{ color: "var(--on-secondary-container)", marginBottom: "0.25rem" }}>Terima Kasih!</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--on-secondary-container)" }}>Penilaian Anda telah kami terima.</p>
        </div>
      )}

      {/* Modal Struk Digital */}
      {showStruk && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "16px" }} onClick={() => setShowStruk(false)}>
          <div style={{ backgroundColor: "transparent", position: "relative", width: "100%", maxWidth: "350px" }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowStruk(false)}
              style={{ position: "absolute", top: "-40px", right: "0", background: "none", border: "none", color: "white", cursor: "pointer" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>close</span>
            </button>
            <StrukDigital pesanan={order} />
          </div>
        </div>
      )}
    </div>
  );
}
