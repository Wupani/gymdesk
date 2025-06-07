import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Download,
  FileText,
  PieChart,
  BarChart3,
  Users,
  CreditCard,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAlert, useModal } from '../App';

function Reports() {
  const alert = useAlert();
  const modal = useModal();
  
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, membersData] = await Promise.all([
        window.electronAPI.getPayments(),
        window.electronAPI.getMembers()
      ]);
      setPayments(paymentsData || []);
      setMembers(membersData || []);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      alert.error('Veriler yüklenirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // Tarih filtreleme fonksiyonları
  const getFilteredPayments = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      
      switch (selectedPeriod) {
        case 'today':
          return paymentDate.toDateString() === now.toDateString();
        case 'thisWeek':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          return paymentDate >= weekStart && paymentDate <= now;
        case 'thisMonth':
          return paymentDate.getFullYear() === currentYear && 
                 paymentDate.getMonth() === currentMonth;
        case 'lastMonth':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return paymentDate.getFullYear() === lastMonthYear && 
                 paymentDate.getMonth() === lastMonth;
        case 'thisYear':
          return paymentDate.getFullYear() === selectedYear;
        case 'all':
        default:
          return true;
      }
    });
  };

  // İstatistik hesaplama fonksiyonları
  const calculateStats = () => {
    const filteredPayments = getFilteredPayments();
    
    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPayments = filteredPayments.length;
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
    
    // Ödeme yöntemlerine göre dağılım
    const paymentMethods = {};
    filteredPayments.forEach(payment => {
      paymentMethods[payment.payment_method] = (paymentMethods[payment.payment_method] || 0) + payment.amount;
    });

    // Üyelik tipine göre gelir
    const membershipRevenue = {};
    filteredPayments.forEach(payment => {
      const member = members.find(m => m.id === payment.member_id);
      if (member) {
        const type = member.membership_type || 'Bilinmiyor';
        membershipRevenue[type] = (membershipRevenue[type] || 0) + payment.amount;
      }
    });

    // Aylık gelir trendi (son 12 ay)
    const monthlyRevenue = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = 0;
    }
    
    payments.forEach(payment => {
      const paymentDate = new Date(payment.payment_date);
      const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevenue.hasOwnProperty(monthKey)) {
        monthlyRevenue[monthKey] += payment.amount;
      }
    });

    return {
      totalRevenue,
      totalPayments,
      averagePayment,
      paymentMethods,
      membershipRevenue,
      monthlyRevenue
    };
  };

  const stats = calculateStats();

  // PDF Export fonksiyonları
  const setupPDFFont = (doc) => {
    doc.setCharSpace(0.2);
    doc.setR2L(false);
  };

  const safePDFText = (text, maxLength = 50) => {
    if (!text) return 'Belirtilmemiş';
    const turkishMap = {
      'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U', 'ş': 's', 'Ş': 'S',
      'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    };
    let cleanText = text.toString();
    Object.keys(turkishMap).forEach(key => {
      cleanText = cleanText.replace(new RegExp(key, 'g'), turkishMap[key]);
    });
    return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
  };

  const exportFinancialReport = () => {
    try {
      const doc = new jsPDF();
      setupPDFFont(doc);
      
      const orangeColor = [255, 107, 0];
      const darkColor = [30, 30, 30];
      const lightGray = [240, 240, 240];
      
      // Header
      doc.setFillColor(...orangeColor);
      doc.rect(0, 0, 210, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('GymDesk', 20, 25);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Mali Rapor', 20, 35);
      
      doc.setFontSize(10);
      doc.text(`Rapor: ${new Date().toLocaleDateString('tr-TR')}`, 140, 25);
      doc.text(`Donem: ${getPeriodText()}`, 140, 35);
      
      let yPos = 65;
      
      // Genel İstatistikler
      doc.setFillColor(...orangeColor);
      doc.rect(15, yPos - 8, 180, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GENEL ISTATISTIKLER', 20, yPos - 1);
      
      yPos += 15;
      doc.setTextColor(...darkColor);
      doc.setFontSize(11);
      
      const generalStats = [
        ['Toplam Gelir:', `TL${stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`],
        ['Odeme Sayisi:', stats.totalPayments.toString()],
        ['Ortalama Odeme:', `TL${stats.averagePayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`],
        ['Toplam Uye:', members.length.toString()]
      ];
      
      generalStats.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...orangeColor);
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkColor);
        doc.text(value, 80, yPos);
        yPos += 10;
      });
      
      yPos += 10;
      
      // Ödeme Yöntemleri
      doc.setFillColor(...orangeColor);
      doc.rect(15, yPos - 8, 180, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ODEME YONTEMLERI', 20, yPos - 1);
      
      yPos += 15;
      Object.entries(stats.paymentMethods).forEach(([method, amount]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...orangeColor);
        doc.text(`${safePDFText(method)}:`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkColor);
        doc.text(`TL${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 80, yPos);
        yPos += 8;
      });
      
      yPos += 10;
      
      // Üyelik Tipi Gelirleri
      if (yPos < 200) {
        doc.setFillColor(...orangeColor);
        doc.rect(15, yPos - 8, 180, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('UYELIK TIPI GELIRLERI', 20, yPos - 1);
        
        yPos += 15;
        Object.entries(stats.membershipRevenue).forEach(([type, amount]) => {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...orangeColor);
          doc.text(`${safePDFText(type)}:`, 20, yPos);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...darkColor);
          doc.text(`TL${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 80, yPos);
          yPos += 8;
        });
      }
      
      // Footer
      yPos = 280;
      doc.setFillColor(...darkColor);
      doc.rect(0, yPos - 5, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Bu rapor GymDesk uygulamasi tarafindan otomatik olusturulmustur.', 20, yPos + 2);
      doc.setTextColor(...orangeColor);
      doc.text('www.gymdesk.app', 150, yPos + 2);
      
      const fileName = `GymDesk_Mali_Rapor_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      alert.success('Mali rapor PDF olarak indirildi!', 'Rapor İndirildi');
      
    } catch (error) {
      console.error('PDF oluşturulurken hata:', error);
      alert.error('PDF oluşturulurken bir hata oluştu!');
    }
  };

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'today': return 'Bugün';
      case 'thisWeek': return 'Bu Hafta';
      case 'thisMonth': return 'Bu Ay';
      case 'lastMonth': return 'Geçen Ay';
      case 'thisYear': return `${selectedYear} Yılı`;
      case 'all': return 'Tüm Zamanlar';
      default: return 'Bilinmiyor';
    }
  };

  const formatCurrency = (amount) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <BarChart3 size={24} />
        <span>Raporlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Mali Raporlar
          </h1>
          <p style={{ color: '#c4c4c4' }}>
            {getPeriodText()} - Toplam Gelir: {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={20} />
            Yenile
          </button>
          <button 
            className="btn btn-primary"
            onClick={exportFinancialReport}
            disabled={loading}
          >
            <Download size={20} />
            Raporu İndir
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={20} color="#ff6b00" />
            <span style={{ fontWeight: '600', color: '#ffffff' }}>Dönem:</span>
          </div>
          
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '150px' }}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="today">Bugün</option>
            <option value="thisWeek">Bu Hafta</option>
            <option value="thisMonth">Bu Ay</option>
            <option value="lastMonth">Geçen Ay</option>
            <option value="thisYear">Bu Yıl</option>
            <option value="all">Tüm Zamanlar</option>
          </select>

          {selectedPeriod === 'thisYear' && (
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '100px' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Ana İstatistikler */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
            <DollarSign size={32} color="#10b981" />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Toplam Gelir</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
            <CreditCard size={32} color="#3b82f6" />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPayments}</h3>
            <p>Toplam Ödeme</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
            <TrendingUp size={32} color="#f59e0b" />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.averagePayment)}</h3>
            <p>Ortalama Ödeme</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
            <Users size={32} color="#8b5cf6" />
          </div>
          <div className="stat-content">
            <h3>{members.length}</h3>
            <p>Toplam Üye</p>
          </div>
        </div>
      </div>

      {/* Detaylı Raporlar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* Ödeme Yöntemleri */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <PieChart size={24} color="#ff6b00" />
            <h3 style={{ margin: 0, color: '#ffffff' }}>Ödeme Yöntemleri</h3>
          </div>
          
          {Object.entries(stats.paymentMethods).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(stats.paymentMethods)
                .sort(([,a], [,b]) => b - a)
                .map(([method, amount]) => {
                  const percentage = stats.totalRevenue > 0 ? ((amount / stats.totalRevenue) * 100).toFixed(1) : '0';
                  return (
                    <div key={method} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 107, 0, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 107, 0, 0.2)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#ffffff' }}>{method}</div>
                        <div style={{ fontSize: '14px', color: '#c4c4c4' }}>%{percentage}</div>
                      </div>
                      <div style={{ fontWeight: '700', color: '#ff6b00' }}>
                        {formatCurrency(amount)}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Bu dönemde ödeme bulunamadı</p>
            </div>
          )}
        </div>

        {/* Üyelik Tipi Gelirleri */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <BarChart3 size={24} color="#ff6b00" />
            <h3 style={{ margin: 0, color: '#ffffff' }}>Üyelik Tipi Gelirleri</h3>
          </div>
          
          {Object.entries(stats.membershipRevenue).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(stats.membershipRevenue)
                .sort(([,a], [,b]) => b - a)
                .map(([type, amount]) => {
                  const percentage = stats.totalRevenue > 0 ? ((amount / stats.totalRevenue) * 100).toFixed(1) : '0';
                  return (
                    <div key={type} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#ffffff' }}>{type}</div>
                        <div style={{ fontSize: '14px', color: '#c4c4c4' }}>%{percentage}</div>
                      </div>
                      <div style={{ fontWeight: '700', color: '#3b82f6' }}>
                        {formatCurrency(amount)}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Bu dönemde üyelik geliri bulunamadı</p>
            </div>
          )}
        </div>
      </div>

      {/* Aylık Trend */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <TrendingUp size={24} color="#ff6b00" />
          <h3 style={{ margin: 0, color: '#ffffff' }}>Son 12 Ay Gelir Trendi</h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
          gap: '16px',
          marginTop: '20px'
        }}>
          {Object.entries(stats.monthlyRevenue).map(([month, amount]) => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('tr-TR', { 
              month: 'short',
              year: '2-digit'
            });
            const maxAmount = Math.max(...Object.values(stats.monthlyRevenue));
            const height = maxAmount > 0 ? Math.max((amount / maxAmount) * 100, 5) : 5;
            
            return (
              <div key={month} style={{ textAlign: 'center' }}>
                <div style={{
                  height: '120px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '40px',
                    height: `${height}%`,
                    backgroundColor: amount > 0 ? '#ff6b00' : 'rgba(255, 107, 0, 0.3)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#c4c4c4', marginBottom: '4px' }}>
                  {monthName}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#ffffff' }}>
                  {amount > 0 ? `₺${amount.toLocaleString('tr-TR')}` : '₺0'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Reports; 