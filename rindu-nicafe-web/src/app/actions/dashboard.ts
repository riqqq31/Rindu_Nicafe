"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pesananHariIni, feedbackStats, stokMenipis] = await Promise.all([
    prisma.pesanan.findMany({
      where: {
        waktu: { gte: today },
        status: { in: ["dibayar", "selesai"] }
      }
    }),
    prisma.feedback.aggregate({
      _avg: { rating: true },
      _count: { rating: true }
    }),
    prisma.bahanBaku.count({
      where: {
        jumlah_stok: {
          lte: prisma.bahanBaku.fields.batas_minimum
        }
      }
    })
  ]);

  const pendapatanHariIni = pesananHariIni.reduce((sum, p) => sum + p.total, 0);
  const jumlahPesanan = pesananHariIni.length;
  
  const avgRating = feedbackStats._avg.rating ? Number(feedbackStats._avg.rating.toFixed(1)) : 0;

  // Real chart data for the last 7 days
  const chartData = [];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const pesanan = await prisma.pesanan.findMany({
      where: {
        waktu: { gte: d, lt: nextD },
        status: { in: ["dibayar", "selesai"] }
      }
    });

    const total = pesanan.reduce((sum, p) => sum + p.total, 0);
    chartData.push({
      label: dayNames[d.getDay()],
      total,
      isActive: i === 0 // Today is active
    });
  }

  return {
    pendapatanHariIni,
    jumlahPesanan,
    avgRating,
    stokMenipisCount: stokMenipis,
    chartData
  };
}
