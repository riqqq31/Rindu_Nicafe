"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getAbsensiHariIni, clockIn, clockOut, getRiwayatAbsensi } from "@/app/actions/absensi";
import styles from "./absensi.module.css";

type Status = "loading" | "belum_clockin" | "sudah_clockin" | "selesai";

export default function AbsensiPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadData();
    startCamera();
    
    return () => stopCamera();
  }, []);

  async function loadData() {
    try {
      const hariIni = await getAbsensiHariIni();
      if (!hariIni) {
        setStatus("belum_clockin");
      } else if (hariIni && !hariIni.clock_out) {
        setStatus("sudah_clockin");
      } else if (hariIni && hariIni.clock_out) {
        setStatus("selesai");
      }
      
      const r = await getRiwayatAbsensi(7);
      setRiwayat(r);
    } catch (e: any) {
      setErrorMsg(e.message || "Gagal memuat data.");
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setErrorMsg("Kamera tidak dapat diakses. Pastikan Anda telah memberikan izin.");
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }

  function capturePhoto(): string | null {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return null;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.8);
      }
    }
    return null;
  }

  function handleClockIn() {
    setErrorMsg("");
    const foto = capturePhoto();
    if (!foto) {
      setErrorMsg("Gagal mengambil foto dari kamera.");
      return;
    }
    
    startTransition(async () => {
      try {
        await clockIn(foto);
        await loadData();
      } catch (e: any) {
        setErrorMsg(e.message || "Gagal melakukan Clock In.");
      }
    });
  }

  function handleClockOut() {
    setErrorMsg("");
    const foto = capturePhoto();
    if (!foto) {
      setErrorMsg("Gagal mengambil foto dari kamera.");
      return;
    }
    
    startTransition(async () => {
      try {
        await clockOut(foto);
        await loadData();
      } catch (e: any) {
        setErrorMsg(e.message || "Gagal melakukan Clock Out.");
      }
    });
  }

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    return date.toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateValue: any) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    return date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Absensi Karyawan</h1>
        
        {status !== "loading" && (
          <div className={`${styles.statusBadge} ${
            status === "belum_clockin" ? styles.statusBelum : 
            status === "sudah_clockin" ? styles.statusSudah : 
            styles.statusSelesai
          }`}>
            {status === "belum_clockin" ? "Belum Clock In" : 
             status === "sudah_clockin" ? "Sudah Clock In" : 
             "Selesai Shift"}
          </div>
        )}

        {errorMsg && (
          <div className={styles.error}>
            {errorMsg}
          </div>
        )}

        <div className={styles.cameraSection}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={styles.video}
          />
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>

        <div className={styles.buttonContainer}>
          <button 
            className={`${styles.btn} ${styles.btnClockIn}`}
            onClick={handleClockIn}
            disabled={status !== "belum_clockin" || isPending}
          >
            {isPending && status === "belum_clockin" ? "Memproses..." : "Clock In"}
          </button>
          
          <button 
            className={`${styles.btn} ${styles.btnClockOut}`}
            onClick={handleClockOut}
            disabled={status !== "sudah_clockin" || isPending}
          >
            {isPending && status === "sudah_clockin" ? "Memproses..." : "Clock Out"}
          </button>
        </div>
      </div>

      <div className={styles.riwayatCard}>
        <h2 className={styles.riwayatTitle}>Riwayat Absensi (7 Hari Terakhir)</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Total Jam</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>Belum ada riwayat absensi.</td>
                </tr>
              ) : (
                riwayat.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.tanggal)}</td>
                    <td>{formatTime(item.clock_in)}</td>
                    <td>{formatTime(item.clock_out)}</td>
                    <td>{item.jam_kerja ? `${item.jam_kerja.toFixed(1)} Jam` : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
