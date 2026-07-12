"use server";

import { prisma } from "@/lib/prisma";

export async function getFeedbackStats() {
  try {
    const feedback = await prisma.feedback.findMany();
    const total = feedback.length;
    
    if (total === 0) {
      return {
        averageRating: 0,
        totalFeedback: 0,
        starsCount: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const starsCount = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    let sum = 0;
    feedback.forEach(f => {
      if (f.rating >= 1 && f.rating <= 5) {
        starsCount[f.rating as keyof typeof starsCount]++;
        sum += f.rating;
      }
    });

    const averageRating = sum / total;

    return {
      averageRating: Number(averageRating.toFixed(1)),
      totalFeedback: total,
      starsCount
    };
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    throw new Error("Gagal mengambil statistik feedback");
  }
}

export async function getAllFeedback() {
  try {
    const feedback = await prisma.feedback.findMany({
      include: {
        pesanan: true,
      },
      orderBy: {
        tanggal: 'desc',
      }
    });
    
    return feedback;
  } catch (error) {
    console.error("Error fetching all feedback:", error);
    throw new Error("Gagal mengambil data feedback");
  }
}
