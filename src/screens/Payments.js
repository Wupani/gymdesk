import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, Calendar, DollarSign } from 'lucide-react';
import { useAlert } from '../App';

function Payments() {
  const alert = useAlert();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Nakit'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, membersData] = await Promise.all([
        window.electronAPI.getPayments(),
        window.electronAPI.getMembers()
      ]);
      setPayments(paymentsData);
      setMembers(membersData);
      setLoading(false);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await window.electronAPI.addPayment({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setShowAddModal(false);
      resetForm();
      loadData();
      alert.success('Ödeme başarıyla eklendi!');
    } catch (error) {
      console.error('Ödeme eklenirken hata:', error);
      alert.error('Ödeme eklenirken bir hata oluştu!');
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Nakit'
    });
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

  const filteredPayments = payments.filter(payment =>
    `${payment.name} ${payment.surname} ${payment.payment_method}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Pagination hesaplamaları
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Sayfa değiştiğinde yumuşak scroll
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Tabloyu viewport'a getir
    setTimeout(() => {
      const tableElement = document.querySelector('.card');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Filtre değiştiğinde sayfa 1'e dön
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Aylık gelir hesaplama
  const calculateMonthlyStats = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const thisMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      return paymentDate.getMonth() + 1 === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });

    const monthlyTotal = thisMonthPayments.reduce((total, payment) => total + payment.amount, 0);
    const monthlyCount = thisMonthPayments.length;

    return { monthlyTotal, monthlyCount };
  };

  const stats = calculateMonthlyStats();

  if (loading) {
    return (
      <div className="loading">
        <CreditCard size={24} />
        <span>Ödemeler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Ödeme Yönetimi
          </h1>
          <p style={{ color: '#6b7280' }}>
            Toplam {payments.length} ödeme kaydı
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          Yeni Ödeme Ekle
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}>
            <DollarSign size={24} color="#18a34a" />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.monthlyTotal)}</h3>
            <p>Bu Ayki Toplam Gelir</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
            <CreditCard size={24} color="#3b82f6" />
          </div>
          <div className="stat-content">
            <h3>{stats.monthlyCount}</h3>
            <p>Bu Ayki Ödeme Sayısı</p>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Search and Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ position: 'relative', maxWidth: '400px', flex: '1' }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#6b7280' 
            }} />
            <input
              type="text"
              placeholder="Ödeme ara (üye adı, ödeme yöntemi)"
              className="search-input"
              style={{ paddingLeft: '44px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#c4c4c4', fontSize: '14px' }}>Sayfa başına:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 107, 0, 0.3)',
                background: 'rgba(30, 30, 30, 0.8)',
                color: '#ffffff',
                fontSize: '14px'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        {currentPayments.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ minWidth: '140px' }}>Üye</th>
                  <th style={{ minWidth: '120px' }}>Tutar</th>
                  <th style={{ minWidth: '120px' }}>Ödeme Tarihi</th>
                  <th style={{ minWidth: '130px' }}>Ödeme Yöntemi</th>
                  <th style={{ minWidth: '120px' }}>Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {currentPayments.map(payment => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: '500', minWidth: '140px' }}>
                      {payment.name && payment.surname 
                        ? `${payment.name} ${payment.surname}`
                        : 'Bilinmeyen Üye'
                      }
                    </td>
                    <td style={{ fontWeight: '600', color: '#16a34a', minWidth: '120px' }}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td style={{ minWidth: '120px' }}>{formatDate(payment.payment_date)}</td>
                    <td style={{ minWidth: '130px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: payment.payment_method === 'Nakit' ? '#fef3c7' : '#dbeafe',
                        color: payment.payment_method === 'Nakit' ? '#d97706' : '#3b82f6'
                      }}>
                        {payment.payment_method}
                      </span>
                    </td>
                    <td style={{ minWidth: '120px' }}>{formatDate(payment.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <CreditCard size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>
              {searchTerm ? 'Arama kriterinize uygun ödeme bulunamadı' : 'Henüz ödeme kaydı yok'}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredPayments.length > 0 && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ color: '#c4c4c4', fontSize: '14px' }}>
              {startIndex + 1}-{Math.min(endIndex, filteredPayments.length)} / {filteredPayments.length} ödeme gösteriliyor
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 107, 0, 0.3)',
                  background: currentPage === 1 ? 'rgba(60, 60, 60, 0.5)' : 'rgba(255, 107, 0, 0.1)',
                  color: currentPage === 1 ? '#666' : '#ff6b00',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                ← Önceki
              </button>

              {/* Sayfa numaraları */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 107, 0, 0.3)',
                        background: currentPage === pageNum 
                          ? 'rgba(255, 107, 0, 0.8)' 
                          : 'rgba(255, 107, 0, 0.1)',
                        color: currentPage === pageNum ? '#ffffff' : '#ff6b00',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: currentPage === pageNum ? '600' : '400',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 107, 0, 0.3)',
                  background: currentPage === totalPages ? 'rgba(60, 60, 60, 0.5)' : 'rgba(255, 107, 0, 0.1)',
                  color: currentPage === totalPages ? '#666' : '#ff6b00',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                Sonraki →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yeni Ödeme Ekle</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddPayment}>
              <div className="form-group">
                <label className="form-label">Üye Seçin *</label>
                <select
                  className="form-input"
                  value={formData.member_id}
                  onChange={(e) => setFormData({...formData, member_id: e.target.value})}
                  required
                >
                  <option value="">Üye seçiniz...</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.surname}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tutar (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ödeme Yöntemi</label>
                  <select
                    className="form-input"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  >
                    <option value="Nakit">Nakit</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Banka Transferi">Banka Transferi</option>
                    <option value="EFT">EFT</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ödeme Tarihi</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={20} />
                  Ödeme Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments; 