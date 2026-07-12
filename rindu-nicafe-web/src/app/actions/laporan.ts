"use server";

import { prisma } from "@/lib/prisma";

export async function getLaporanData(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const pesanan = await prisma.pesanan.findMany({
    where: {
      waktu: { gte: startDate },
      status: { in: ["dibayar", "selesai"] }
    },
    include: {
      detail_pesanan: {
        include: {
          menu: true
        }
      }
    }
  });

  const totalPendapatan = pesanan.reduce((sum, p) => sum + p.total, 0);
  const totalPesanan = pesanan.length;

  // Group daily sales
  const dailySalesMap: Record<string, number> = {};
  
  // Initialize with 0 for all days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
    dailySalesMap[dateStr] = 0;
  }

  pesanan.forEach(p => {
    const dateStr = [
      p.waktu.getFullYear(),
      String(p.waktu.getMonth() + 1).padStart(2, '0'),
      String(p.waktu.getDate()).padStart(2, '0')
    ].join('-');
    
    if (dailySalesMap[dateStr] !== undefined) {
      dailySalesMap[dateStr] += p.total;
    } else {
      dailySalesMap[dateStr] = p.total;
    }
  });

  const dailySales = Object.entries(dailySalesMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({
      date,
      amount
    }));

  // Top menus
  const menuCountMap: Record<number, { nama: string, jumlah: number }> = {};
  pesanan.forEach(p => {
    p.detail_pesanan.forEach(dp => {
      if (!menuCountMap[dp.menu_id]) {
        menuCountMap[dp.menu_id] = { nama: dp.menu.nama, jumlah: 0 };
      }
      menuCountMap[dp.menu_id].jumlah += dp.jumlah;
    });
  });

  const topMenus = Object.values(menuCountMap)
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 5);

  return {
    totalPendapatan,
    totalPesanan,
    dailySales,
    topMenus
  };
}
