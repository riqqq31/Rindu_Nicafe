"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import styles from "./pesan.module.css";
import { useSearchParams } from "next/navigation";

export type CartItem = {
  menu_id: number;
  nama: string;
  harga: number;
  jumlah: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (menu: any) => void;
  updateQuantity: (menu_id: number, delta: number) => void;
  clearCart: () => void;
  mejaId: number | null;
  setMejaId: (id: number) => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

export default function PesanLayout({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mejaId, setMejaId] = useState<number | null>(null);
  
  // We cannot use useSearchParams directly in layout easily if it's not wrapped in Suspense,
  // but in Next.js 13+ App Router, layouts don't get searchParams.
  // Instead, we will extract it from window.location on mount or pass it via child pages.
  // Actually, extracting it on client mount is fine for this context.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const meja = params.get("meja");
    if (meja) {
      setMejaId(Number(meja));
    }
  }, []);

  const addToCart = (menu: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.menu_id === menu.id);
      if (existing) {
        return prev.map(item => 
          item.menu_id === menu.id 
            ? { ...item, jumlah: item.jumlah + 1 }
            : item
        );
      }
      return [...prev, { 
        menu_id: menu.id, 
        nama: menu.nama, 
        harga: menu.harga, 
        jumlah: 1 
      }];
    });
  };

  const updateQuantity = (menu_id: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.menu_id === menu_id) {
          const newJumlah = Math.max(0, item.jumlah + delta);
          return { ...item, jumlah: newJumlah };
        }
        return item;
      }).filter(item => item.jumlah > 0);
    });
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.jumlah, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.harga * item.jumlah), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, clearCart, mejaId, setMejaId, totalItems, totalPrice }}>
      <div className={styles.layoutContainer}>
        <header className={styles.topNav}>
          <div className={styles.brand}>
            <span className="material-symbols-outlined">coffee</span>
            Rindu Nicafe
          </div>
          {mejaId && (
            <div className={styles.mejaBadge}>Meja {mejaId}</div>
          )}
        </header>
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </CartContext.Provider>
  );
}
