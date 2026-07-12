"use client";

import React, { useEffect, useState } from 'react';
import { getFeedbackStats, getAllFeedback } from '@/app/actions/feedback';
import styles from './feedback.module.css';

type FeedbackStats = {
  averageRating: number;
  totalFeedback: number;
  starsCount: Record<number, number>;
};

type Pesanan = {
  id: number;
  total: number;
  waktu: string | Date;
};

type Feedback = {
  id: number;
  pesanan_id: number;
  rating: number;
  komentar: string;
  tanggal: string | Date;
  pesanan?: Pesanan;
};

export default function FeedbackPage() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, feedbackData] = await Promise.all([
          getFeedbackStats(),
          getAllFeedback()
        ]);
        setStats(statsData as FeedbackStats);
        setFeedbacks(feedbackData as Feedback[]);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data feedback.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className={styles.container}>Memuat data...</div>;
  }

  if (error) {
    return <div className={styles.container}>{error}</div>;
  }

  const renderStars = (rating: number) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={styles.starIcon} style={{ color: star <= rating ? '#fbbf24' : '#e5e7eb' }}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Feedback Pelanggan</h1>
      </div>

      {stats && (
        <div className={styles.statsContainer}>
          <div className={styles.summaryCard}>
            <div className={styles.averageRating}>
              {stats.averageRating.toFixed(1)} <span style={{ fontSize: '24px', color: '#fbbf24' }}>★</span>
            </div>
            <div className={styles.totalReviews}>
              Dari {stats.totalFeedback} ulasan
            </div>
          </div>

          <div className={styles.distributionCard}>
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats.starsCount[star] || 0;
              const percentage = stats.totalFeedback > 0 
                ? (count / stats.totalFeedback) * 100 
                : 0;

              return (
                <div key={star} className={styles.distributionRow}>
                  <div className={styles.starLabel}>
                    {star} <span className={styles.starIcon}>★</span>
                  </div>
                  <div className={styles.barContainer}>
                    <div 
                      className={styles.barFill} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className={styles.countLabel}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.feedbackList}>
        {feedbacks.length === 0 ? (
          <p>Belum ada feedback dari pelanggan.</p>
        ) : (
          feedbacks.map(feedback => (
            <div key={feedback.id} className={styles.feedbackCard}>
              <div className={styles.cardHeader}>
                {renderStars(feedback.rating)}
                <span className={styles.date}>{formatDate(feedback.tanggal)}</span>
              </div>
              
              <div className={styles.orderInfo}>
                Pesanan #{feedback.pesanan_id}
                {feedback.pesanan && ` • ${formatCurrency(feedback.pesanan.total)}`}
              </div>

              <div className={styles.comment}>
                {feedback.komentar || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Tidak ada komentar</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
