"use client";

import { useState, useEffect } from "react";
import styles from "./pos.module.css";
import { getPOSData, createOrder, OrderItemData } from "@/app/actions/pos";
import Image from "next/image";

type Menu = {
  id: number;
  nama: string;
  harga: number;
  kategori_id: number;
  gambar: string | null;
  kategori: { id: number; nama: string };
};

type Kategori = {
  id: number;
  nama: string;
};

type Meja = {
  id: number;
  nomor_meja: number;
};

type CartItem = {
  menu: Menu;
  quantity: number;
};

export default function POSPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [tables, setTables] = useState<Meja[]>([]);
  
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPOSData();
        setMenus(data.menus as Menu[]);
        setCategories(data.categories);
        setTables(data.tables);
        if (data.tables.length > 0) {
          setSelectedTable(data.tables[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch POS data", err);
      }
    };
    fetchData();
  }, []);

  const filteredMenus = menus.filter((menu) => {
    const matchesCategory = activeCategory === null || menu.kategori_id === activeCategory;
    const matchesSearch = menu.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (menu: Menu) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menu.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.menu.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { menu, quantity: 1 }];
    });
  };

  const updateQuantity = (menuId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.menu.id === menuId) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const total = cart.reduce((sum, item) => sum + item.menu.harga * item.quantity, 0);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setPaymentAmount(total.toString());
    setIsCheckoutModalOpen(true);
  };

  const confirmPayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const items: OrderItemData[] = cart.map(item => ({
        menu_id: item.menu.id,
        jumlah: item.quantity,
        subtotal: item.menu.harga * item.quantity
      }));
      
      await createOrder(
        orderType,
        selectedTable,
        total,
        items,
        Number(paymentAmount)
      );
      
      alert("Pesanan berhasil dibuat!");
      setCart([]);
      setIsCheckoutModalOpen(false);
      
      // Refresh tables if table was used
      if (orderType === "dine_in") {
         const data = await getPOSData();
         setTables(data.tables);
      }

    } catch (err) {
      console.error(err);
      alert("Gagal membuat pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.posContainer}>
      {/* Left Panel - Menu Selection */}
      <div className={styles.leftPanel}>
        <div className={styles.header}>
          <div className={styles.title}>Menu Utama</div>
          <div className={styles.searchBar}>
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.categoryList}>
          <button
            className={`${styles.categoryChip} ${activeCategory === null ? styles.active : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            Semua Menu
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.categoryChip} ${activeCategory === cat.id ? styles.active : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.nama}
            </button>
          ))}
        </div>

        <div className={styles.menuGrid}>
          {filteredMenus.map((menu) => (
            <div key={menu.id} className={styles.menuCard} onClick={() => addToCart(menu)}>
              {menu.gambar ? (
                <div style={{ position: "relative", height: "120px", minHeight: "120px", width: "100%", flexShrink: 0 }}>
                  <Image src={menu.gambar} alt={menu.nama} fill style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <div className={styles.menuImagePlaceholder}>
                  <span className="material-symbols-outlined" style={{ fontSize: "3rem", opacity: 0.5 }}>
                    restaurant_menu
                  </span>
                </div>
              )}
              <div className={styles.menuInfo}>
                <div className={styles.menuName}>{menu.nama}</div>
                <div className={styles.menuPrice}>{formatRupiah(menu.harga)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className={styles.rightPanel}>
        <div className={styles.cartHeader}>
          <div className={styles.cartTitle}>Pesanan Saat Ini</div>
          <div className={styles.orderTypeToggle}>
            <button
              className={`${styles.orderTypeBtn} ${orderType === "dine_in" ? styles.active : ""}`}
              onClick={() => setOrderType("dine_in")}
            >
              Dine In
            </button>
            <button
              className={`${styles.orderTypeBtn} ${orderType === "takeaway" ? styles.active : ""}`}
              onClick={() => setOrderType("takeaway")}
            >
              Takeaway
            </button>
          </div>
          {orderType === "dine_in" && (
            <select
              className={styles.tableSelect}
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(Number(e.target.value))}
            >
              <option value="" disabled>Pilih Meja</option>
              {tables.map((meja) => (
                <option key={meja.id} value={meja.id}>
                  Meja {meja.nomor_meja}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.cartItemList}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--on-surface-variant)", marginTop: "2rem" }}>
              Keranjang masih kosong
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.menu.id} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemName}>{item.menu.nama}</div>
                  <div className={styles.cartItemPrice}>{formatRupiah(item.menu.harga)}</div>
                </div>
                <div className={styles.qtyControl}>
                  <button className={styles.qtyBtn} onClick={() => updateQuantity(item.menu.id, -1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>remove</span>
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button className={styles.qtyBtn} onClick={() => updateQuantity(item.menu.id, 1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>add</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.cartFooter}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatRupiah(total)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>
          <button
            className={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={cart.length === 0 || (orderType === "dine_in" && !selectedTable)}
          >
            <span className="material-symbols-outlined">point_of_sale</span>
            Bayar Sekarang
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Pembayaran (QRIS)</div>
              <button className={styles.closeBtn} onClick={() => setIsCheckoutModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className={styles.paymentDetails}>
              <div className={styles.paymentRow}>
                <span>Total Tagihan:</span>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{formatRupiah(total)}</span>
              </div>
              
              <div className={styles.qrisBox}>
                <div className={styles.qrisPlaceholder}>QRIS CODE</div>
                <div style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)", textAlign: "center" }}>
                  Minta pelanggan untuk memindai kode QR ini
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--on-surface-variant)", display: "block", marginBottom: "0.5rem" }}>
                  Jumlah yang dibayar (Opsional konfirmasi)
                </label>
                <div className={styles.amountInputContainer}>
                  <div className={styles.currencySymbol}>Rp</div>
                  <input
                    type="number"
                    className={styles.amountInput}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              className={styles.confirmBtn}
              onClick={confirmPayment}
              disabled={isSubmitting || Number(paymentAmount) < total}
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi Pembayaran"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
