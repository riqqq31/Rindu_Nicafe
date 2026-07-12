"use client";

import { useEffect, useState } from "react";
import { getPublicMenu } from "@/app/actions/pesan";
import { useCart } from "./layout";
import styles from "./pesan.module.css";
import { useRouter } from "next/navigation";

export default function PesanMenuPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, totalItems, totalPrice } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const data = await getPublicMenu();
      setMenus(data.menus);
      setCategories(data.categories);
      setLoading(false);
    }
    fetchData();
  }, []);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);
  };

  const filteredMenus = activeCategory 
    ? menus.filter(m => m.kategori_id === activeCategory)
    : menus;

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading menu...</div>;

  return (
    <>
      <div className={styles.categoryScroller}>
        <button
          className={`${styles.categoryChip} ${activeCategory === null ? styles.categoryChipActive : ""}`}
          onClick={() => setActiveCategory(null)}
        >
          Semua Menu
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.categoryChip} ${activeCategory === cat.id ? styles.categoryChipActive : ""}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.nama}
          </button>
        ))}
      </div>

      <div className={styles.menuGrid}>
        {filteredMenus.map(menu => {
          const cartItem = cart.find(c => c.menu_id === menu.id);
          return (
            <div key={menu.id} className={styles.menuCard}>
              <div className={styles.menuImagePlace}>
                <span className="material-symbols-outlined" style={{ fontSize: "2.5rem" }}>
                  {menu.kategori.nama.toLowerCase().includes('minuman') ? 'local_cafe' : 'restaurant'}
                </span>
              </div>
              <div className={styles.menuContent}>
                <h3 className={styles.menuName}>{menu.nama}</h3>
                <p className={styles.menuPrice}>{formatRupiah(menu.harga)}</p>
                {menu.deskripsi && (
                  <p className={styles.menuDesc}>{menu.deskripsi}</p>
                )}
                
                <button 
                  className={styles.addButton}
                  onClick={() => addToCart(menu)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>add_shopping_cart</span>
                  {cartItem ? `Tambah (${cartItem.jumlah})` : 'Tambah'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalItems > 0 && (
        <div className={styles.fabCart} onClick={() => router.push("/pesan/checkout")}>
          <div className={styles.fabCartItems}>
            <div className={styles.fabCartBadge}>{totalItems}</div>
            <span>Pesanan Anda</span>
          </div>
          <div className={styles.fabCartTotal}>
            {formatRupiah(totalPrice)}
          </div>
        </div>
      )}
    </>
  );
}
