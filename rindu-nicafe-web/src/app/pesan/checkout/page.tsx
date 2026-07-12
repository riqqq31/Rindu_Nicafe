"use client";

import { useCart } from "../layout";
import styles from "../pesan.module.css";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCustomerOrder } from "@/app/actions/pesan";

export default function CheckoutPage() {
  const { cart, updateQuantity, totalPrice, mejaId, setMejaId, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);
  };

  const handleCheckout = async () => {
    let finalMejaId = mejaId;
    if (!finalMejaId) {
      const manual = prompt("Anda tidak men-scan QR Code. Untuk simulasi, masukkan nomor meja secara manual:", "1");
      if (!manual) return;
      finalMejaId = Number(manual);
      setMejaId(finalMejaId);
    }
    
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const items = cart.map(c => ({
        menu_id: c.menu_id,
        jumlah: c.jumlah,
        subtotal: c.harga * c.jumlah
      }));

      const res = await createCustomerOrder(finalMejaId, totalPrice, items);
      
      if (res.success && res.data) {
        clearCart();
        router.push(`/pesan/qris/${res.data.id}`);
      } else {
        alert(res.error || "Terjadi kesalahan saat membuat pesanan.");
        if (!mejaId) setMejaId(0);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat membuat pesanan.");
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "4rem", color: "var(--outline-variant)" }}>
          remove_shopping_cart
        </span>
        <h2 style={{ margin: "1rem 0" }}>Keranjang Kosong</h2>
        <button className={styles.primaryButton} onClick={() => router.push("/pesan")}>
          Kembali ke Menu
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Konfirmasi Pesanan</h1>
      
      <div className={styles.checkoutCard}>
        {cart.map(item => (
          <div key={item.menu_id} className={styles.cartItem}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.nama}</div>
              <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.875rem" }}>
                {formatRupiah(item.harga)}
              </div>
            </div>
            
            <div className={styles.qtyControl}>
              <button className={styles.qtyBtn} onClick={() => updateQuantity(item.menu_id, -1)}>-</button>
              <span style={{ width: "1.5rem", textAlign: "center", fontWeight: 600 }}>{item.jumlah}</span>
              <button className={styles.qtyBtn} onClick={() => updateQuantity(item.menu_id, 1)}>+</button>
            </div>
          </div>
        ))}
        
        <div className={styles.checkoutTotal}>
          <span>Total Tagihan</span>
          <span>{formatRupiah(totalPrice)}</span>
        </div>
      </div>

      <button className={styles.secondaryButton} onClick={() => router.push("/pesan")} disabled={isSubmitting}>
        Tambah Menu Lain
      </button>

      <button className={styles.primaryButton} onClick={handleCheckout} disabled={isSubmitting}>
        {isSubmitting ? "Memproses..." : "Pesan & Bayar (QRIS)"}
        {!isSubmitting && <span className="material-symbols-outlined">qr_code_scanner</span>}
      </button>
    </>
  );
}
