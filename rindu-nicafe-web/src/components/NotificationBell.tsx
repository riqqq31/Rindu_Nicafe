"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./NotificationBell.module.css";
import { 
  getNotifikasi, 
  getUnreadNotifikasiCount, 
  markNotifikasiAsRead, 
  markAllNotifikasiAsRead 
} from "@/app/actions/notifikasi";

type Notifikasi = {
  id: number;
  tipe: string;
  pesan: string;
  tujuan_role: string;
  referensi_id: number | null;
  status: string;
  waktu: Date;
};

export default function NotificationBell({ role }: { role: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const isFirstLoad = useRef(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const count = await getUnreadNotifikasiCount(role);
      
      // If count increased and it's not the initial load, show toast
      if (!isFirstLoad.current && count > prevCountRef.current) {
        const notifs = await getNotifikasi(role);
        if (notifs.length > 0) {
          setToastMessage(notifs[0].pesan);
          setTimeout(() => setToastMessage(null), 5000); // Hide after 5s
        }
      }
      isFirstLoad.current = false;
      prevCountRef.current = count;
      setUnreadCount(count);

      if (isOpen) {
        const notifs = await getNotifikasi(role);
        setNotifications(notifs);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [role, isOpen]); // Re-fetch when dropdown opens

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // If opening, fetch list immediately
      try {
        const notifs = await getNotifikasi(role);
        setNotifications(notifs);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    }
  };

  const handleMarkAsRead = async (id: number, currentStatus: string) => {
    if (currentStatus === "belum_dibaca") {
      try {
        await markNotifikasiAsRead(id);
        // Optimistic update
        setUnreadCount(Math.max(0, unreadCount - 1));
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, status: "dibaca" } : n
        ));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllNotifikasiAsRead(role);
      // Optimistic update
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, status: "dibaca" })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString("id-ID", { 
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" 
    });
  };

  return (
    <div className={styles.bellContainer} ref={dropdownRef}>
      <button className={styles.iconButton} onClick={handleToggle}>
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>Notifikasi</h3>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                Tandai semua dibaca
              </button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div className={styles.emptyState}>Belum ada notifikasi</div>
          ) : (
            <ul className={styles.notificationList}>
              {notifications.map((notif) => (
                <li 
                  key={notif.id} 
                  className={`${styles.notificationItem} ${notif.status === "belum_dibaca" ? styles.unread : ""}`}
                  onClick={() => handleMarkAsRead(notif.id, notif.status)}
                >
                  <p className={styles.notificationText}>{notif.pesan}</p>
                  <p className={styles.notificationTime}>{formatTime(notif.waktu)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Toast Pop-up */}
      {toastMessage && (
        <div className={styles.toastPopup}>
          <div className={styles.toastIcon}>
            <span className="material-symbols-outlined">notifications_active</span>
          </div>
          <div className={styles.toastContent}>
            <h4>Notifikasi Baru</h4>
            <p>{toastMessage}</p>
          </div>
          <button className={styles.toastClose} onClick={() => setToastMessage(null)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
