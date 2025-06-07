import React, { useState, useEffect } from 'react';
import { Users, CreditCard, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
    expiringMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [expiringMembers, setExpiringMembers] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      const [members, payments] = await Promise.all([
        window.electronAPI.getMembers(),
        window.electronAPI.getPayments()
      ]);

      // İstatistikleri hesapla
      const totalMembers = members.length;
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Aktif üyeler (başlangıç tarihi olup bitiş tarihi olmayan VEYA bitiş tarihi bugünden sonra olanlar)
      const activeMembers = members.filter(member => {
        // Başlangıç tarihi yoksa aktif değil
        if (!member.start_date) return false;
        
        // Bitiş tarihi yoksa aktif (süresiz üyelik)
        if (!member.end_date) return true;
        
        // Bitiş tarihi varsa bugünden sonra olmalı
        const endDate = new Date(member.end_date);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return endDate > todayStart;
      }).length;

      // Bu ayki gelir
      const monthlyRevenue = payments
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          return paymentDate.getMonth() + 1 === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((total, payment) => total + payment.amount, 0);

      // Süresi biten üyeler (5 gün içinde)
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(today.getDate() + 5);

      const expiring = members.filter(member => {
        if (!member.end_date) return false;
        
        // Tarih string'ini parse et
        const endDate = new Date(member.end_date);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const fiveDaysEnd = new Date();
        fiveDaysEnd.setDate(fiveDaysEnd.getDate() + 5);
        fiveDaysEnd.setHours(23, 59, 59, 999);
        
        // Bugün dahil, 5 gün sonrasına kadar (geçmiş tarihleri dahil etme)
        return endDate >= todayStart && endDate <= fiveDaysEnd;
      });

      setStats({
        totalMembers,
        activeMembers,
        monthlyRevenue,
        expiringMembers: expiring.length
      });

      setExpiringMembers(expiring);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard verisi yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="loading">
        <Users size={24} />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Dashboard
        </h1>
        <p style={{ color: '#c4c4c4', fontSize: '16px' }}>
          Spor salonu genel durumu ve önemli bilgiler
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <Users size={24} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.totalMembers}</h3>
            <p>Toplam Üye</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <TrendingUp size={24} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.activeMembers}</h3>
            <p>Aktif Üye</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ff6b00 0%, #ff4500 100%)' }}>
            <DollarSign size={24} color="white" />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.monthlyRevenue)}</h3>
            <p>Bu Ayki Gelir</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <AlertTriangle size={24} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.expiringMembers}</h3>
            <p>Süresi Biten Üye</p>
          </div>
        </div>
      </div>

      {/* Süresi Biten Üyeler Uyarısı */}
      {expiringMembers.length > 0 && (
        <div className="card">
          <div className="alert alert-warning">
            <AlertTriangle size={20} />
            <span>
              <strong>{expiringMembers.length} üyenin</strong> üyelik süresi 5 gün içinde sona eriyor!
            </span>
          </div>

          <h3 style={{ marginBottom: '16px', color: '#ffffff' }}>
            Süresi Yaklaşan Üyeler
          </h3>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ minWidth: '150px' }}>Ad Soyad</th>
                  <th style={{ minWidth: '120px' }}>Telefon</th>
                  <th style={{ minWidth: '120px' }}>Bitiş Tarihi</th>
                  <th style={{ minWidth: '100px' }}>Kalan Gün</th>
                </tr>
              </thead>
              <tbody>
                {expiringMembers.map(member => {
                  const endDate = new Date(member.end_date);
                  const today = new Date();
                  const diffTime = endDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={member.id}>
                      <td style={{ minWidth: '150px' }}>{member.name} {member.surname}</td>
                      <td style={{ minWidth: '120px' }}>{member.phone}</td>
                      <td style={{ minWidth: '120px' }}>{formatDate(member.end_date)}</td>
                      <td style={{ minWidth: '100px' }}>
                        <span style={{ 
                          color: diffDays <= 2 ? '#dc2626' : '#d97706',
                          fontWeight: 'bold'
                        }}>
                          {diffDays} gün
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hoş Geldiniz Mesajı */}
      {expiringMembers.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Users size={48} color="#ff6b00" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px', color: '#ffffff' }}>
            Harika! Tüm üyelikler güncel 👍
          </h3>
          <p style={{ color: '#c4c4c4' }}>
            Şu anda süresi yaklaşan üye bulunmuyor. Sistemin diğer bölümlerini kullanarak 
            üye yönetimi yapabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 