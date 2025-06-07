import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Eye, AlertCircle, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { useAlert, useModal } from '../App';

function Members() {
  const alert = useAlert();
  const modal = useModal();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    email: '',
    birth_date: '',
    membership_type: 'Aylık',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await window.electronAPI.getMembers();
      setMembers(data);
      setLoading(false);
    } catch (error) {
      console.error('Üyeler yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await window.electronAPI.addMember(formData);
      setShowAddModal(false);
      resetForm();
      loadMembers();
      alert.success('Üye başarıyla eklendi!');
    } catch (error) {
      console.error('Üye eklenirken hata:', error);
      alert.error('Üye eklenirken bir hata oluştu!');
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    try {
      await window.electronAPI.updateMember(selectedMember.id, formData);
      setShowEditModal(false);
      resetForm();
      loadMembers();
      alert.success('Üye bilgileri başarıyla güncellendi!');
    } catch (error) {
      console.error('Üye güncellenirken hata:', error);
      alert.error('Üye güncellenirken bir hata oluştu!');
    }
  };

  const handleDeleteMember = async (member) => {
    // Önce şifre kontrolü yap
    const password = await modal.promptPassword(
      'Üye Silme Şifresi',
      'Üye silme işlemi için şifre girin:'
    );
    
    if (!password) return; // Kullanıcı iptal etti
    
    if (password !== 'ns123') {
      alert.error('Hatalı şifre! Silme işlemi iptal edildi.');
      return;
    }

    const isConfirmed = await modal.confirm(
      `${member.name} ${member.surname} adlı üyeyi silmek istediğinizden emin misiniz?`,
      `Bu işlem üyeye ait TÜM antrenman planlarını ve ödeme kayıtlarını da silecektir!`
    );
    
    if (isConfirmed) {
      try {
        const result = await window.electronAPI.deleteMember(member.id);
        if (result.success) {
          alert.success(`${member.name} ${member.surname} ve tüm ilişkili veriler başarıyla silindi!`);
          loadMembers();
        }
      } catch (error) {
        console.error('Üye silinirken hata:', error);
        alert.error('Üye silinirken bir hata oluştu!');
      }
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      name: '',
      surname: '',
      phone: '',
      email: '',
      birth_date: '',
      membership_type: 'Aylık',
      start_date: today,
      end_date: calculateEndDate(today, 'Aylık')
    });
    setSelectedMember(null);
  };

  // Üyelik tipine göre bitiş tarihi hesapla
  const calculateEndDate = (startDate, membershipType) => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    let months = 0;
    
    switch (membershipType) {
      case 'Aylık':
        months = 1;
        break;
      case '3 Aylık':
        months = 3;
        break;
      case '6 Aylık':
        months = 6;
        break;
      case 'Yıllık':
        months = 12;
        break;
      default:
        months = 1;
    }
    
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + months);
    
    return endDate.toISOString().split('T')[0];
  };

  // Üyelik tipi değiştiğinde tarihleri güncelle
  const handleMembershipTypeChange = (newType) => {
    const newEndDate = calculateEndDate(formData.start_date, newType);
    setFormData({
      ...formData, 
      membership_type: newType,
      end_date: newEndDate
    });
  };

  // Başlangıç tarihi değiştiğinde bitiş tarihini güncelle
  const handleStartDateChange = (newStartDate) => {
    const newEndDate = calculateEndDate(newStartDate, formData.membership_type);
    setFormData({
      ...formData,
      start_date: newStartDate,
      end_date: newEndDate
    });
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name || '',
      surname: member.surname || '',
      phone: member.phone || '',
      email: member.email || '',
      birth_date: member.birth_date || '',
      membership_type: member.membership_type || 'Aylık',
      start_date: member.start_date || '',
      end_date: member.end_date || ''
    });
    setShowEditModal(true);
  };

  const filteredMembers = members.filter(member =>
    `${member.name} ${member.surname} ${member.phone} ${member.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Pagination hesaplamaları
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getMembershipStatus = (endDate) => {
    if (!endDate) return { status: 'Belirsiz', color: '#6b7280' };
    
    const end = new Date(endDate);
    const today = new Date();
    
    if (end < today) {
      return { status: 'Süresi Dolmuş', color: '#dc2626' };
    } else if (end <= new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)) {
      return { status: 'Yakında Bitecek', color: '#d97706' };
    } else {
      return { status: 'Aktif', color: '#16a34a' };
    }
  };

  const getRemainingDays = (endDate) => {
    if (!endDate) return { days: 0, text: '-', color: '#6b7280' };
    
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Günün başlangıcına ayarla
    end.setHours(0, 0, 0, 0); // Günün başlangıcına ayarla
    
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        days: Math.abs(diffDays), 
        text: `${Math.abs(diffDays)} gün geçti`, 
        color: '#dc2626' 
      };
    } else if (diffDays === 0) {
      return { 
        days: 0, 
        text: 'Bugün bitiyor', 
        color: '#d97706' 
      };
    } else if (diffDays <= 5) {
      return { 
        days: diffDays, 
        text: `${diffDays} gün kaldı`, 
        color: '#d97706' 
      };
    } else {
      return { 
        days: diffDays, 
        text: `${diffDays} gün kaldı`, 
        color: '#16a34a' 
      };
    }
  };

  // PDF Export Functions with Turkish character support
  const setupPDFFont = (doc) => {
    // Set encoding for Turkish characters
    doc.setCharSpace(0.2);
    doc.setR2L(false);
  };

  const safePDFText = (text, maxLength = 50) => {
    if (!text) return 'Belirtilmemiş';
    // Replace Turkish characters for better PDF compatibility
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

  const exportSingleMemberPDF = async (member) => {
    try {
      const doc = new jsPDF();
      setupPDFFont(doc);
      
      // Colors matching our app theme
      const orangeColor = [255, 107, 0]; // #ff6b00
      const darkColor = [30, 30, 30]; // #1e1e1e
      const lightGray = [200, 200, 200]; // #c8c8c8
      const darkGray = [100, 100, 100]; // #646464
      
      // Header Background
      doc.setFillColor(...orangeColor);
      doc.rect(0, 0, 210, 45, 'F');
      
      // Header Text
      doc.setTextColor(255, 255, 255); // White
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('GymDesk', 20, 25);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Uye Bilgi Raporu', 20, 35);
      
      // Date in header
      doc.setFontSize(10);
      doc.text(`Rapor: ${new Date().toLocaleDateString('tr-TR')}`, 140, 25);
      
      // Reset text color for body
      doc.setTextColor(...darkColor);
      
      // Member Info Section
      let yPos = 60;
      
      // Section Header with Orange Accent
      doc.setFillColor(...orangeColor);
      doc.rect(15, yPos - 8, 180, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('UYE BILGILERI', 20, yPos - 1);
      
      yPos += 15;
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'normal');
      
      // Member Details with better formatting
      const remainingDays = getRemainingDays(member.end_date);
      const memberInfo = [
        ['Ad Soyad:', `${safePDFText(member.name)} ${safePDFText(member.surname)}`],
        ['Telefon:', safePDFText(member.phone)],
        ['E-posta:', safePDFText(member.email)],
        ['Dogum Tarihi:', formatDate(member.birth_date)],
        ['Uyelik Tipi:', safePDFText(member.membership_type)],
        ['Baslangic:', formatDate(member.start_date)],
        ['Bitis:', formatDate(member.end_date)],
        ['Kalan Gun:', safePDFText(remainingDays.text)]
      ];
      
      doc.setFontSize(11);
      memberInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...orangeColor);
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkColor);
        doc.text(value, 65, yPos);
        yPos += 10;
      });
      
      // Status with color coding
      const status = getMembershipStatus(member.end_date);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...orangeColor);
      doc.text('Durum:', 20, yPos);
      
      // Status color
      let statusColor = [22, 163, 74]; // Green for active
      if (status.status === 'Süresi Dolmuş') statusColor = [220, 38, 38]; // Red
      else if (status.status === 'Yakında Bitecek') statusColor = [217, 119, 6]; // Yellow
      
      doc.setTextColor(...statusColor);
      doc.text(safePDFText(status.status), 65, yPos);
      yPos += 25;

      // Get member's payments and workout data
      const [payments, workoutPlans] = await Promise.all([
        window.electronAPI.getPayments(),
        window.electronAPI.getWorkoutPlans(member.id)
      ]);

      const memberPayments = payments.filter(p => p.member_id === member.id);
      const memberPlans = workoutPlans.filter(p => p.member_id === member.id);

      // Payment History Section
      if (memberPayments.length > 0) {
        // Section Header
        doc.setFillColor(...orangeColor);
        doc.rect(15, yPos - 8, 180, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ODEME GECMISI', 20, yPos - 1);
        
        yPos += 15;
        
        // Table Headers
        doc.setFillColor(...lightGray);
        doc.rect(15, yPos - 5, 180, 8, 'F');
        doc.setTextColor(...darkColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Tarih', 20, yPos);
        doc.text('Tutar', 70, yPos);
        doc.text('Odeme Yontemi', 120, yPos);
        yPos += 10;
        
        // Payment rows
        doc.setFont('helvetica', 'normal');
        memberPayments.slice(0, 8).forEach((payment, index) => {
          if (index % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(15, yPos - 3, 180, 8, 'F');
          }
          doc.setTextColor(...darkColor);
          doc.text(formatDate(payment.payment_date), 20, yPos);
          doc.setTextColor(...orangeColor);
          doc.setFont('helvetica', 'bold');
          doc.text(`TL${payment.amount}`, 70, yPos);
          doc.setTextColor(...darkColor);
          doc.setFont('helvetica', 'normal');
          doc.text(safePDFText(payment.payment_method), 120, yPos);
          yPos += 8;
        });
        
        // Total
        const totalPayments = memberPayments.reduce((sum, p) => sum + p.amount, 0);
        yPos += 5;
        doc.setFillColor(...orangeColor);
        doc.rect(15, yPos - 3, 180, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Toplam Odeme: TL${totalPayments}`, 20, yPos + 3);
        yPos += 20;
      }

      // Workout Plans Section
      if (memberPlans.length > 0 && yPos < 230) {
        // Section Header
        doc.setFillColor(...orangeColor);
        doc.rect(15, yPos - 8, 180, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ANTRENMAN PLANLARI', 20, yPos - 1);
        
        yPos += 15;
        doc.setTextColor(...darkColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        memberPlans.slice(0, 5).forEach((plan, index) => {
          doc.setTextColor(...orangeColor);
          doc.text('*', 20, yPos);
          doc.setTextColor(...darkColor);
          doc.setFont('helvetica', 'bold');
          doc.text(safePDFText(plan.title, 30), 25, yPos);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...darkGray);
          doc.text(`(${formatDate(plan.date)})`, 120, yPos);
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
      
      // Download
      const fileName = `${safePDFText(member.name)}_${safePDFText(member.surname)}_Bilgi_Raporu.pdf`;
      doc.save(fileName);
      
      // Success notification
      alert.success(`${member.name} ${member.surname} bilgi raporu indirildi!`, 'PDF İndirildi');
      
    } catch (error) {
      console.error('PDF oluşturulurken hata:', error);
      alert.error('PDF oluşturulurken bir hata oluştu!');
    }
  };

  const exportAllMembersPDF = () => {
    try {
      const doc = new jsPDF();
      setupPDFFont(doc);
      
      // Colors matching our app theme
      const orangeColor = [255, 107, 0]; // #ff6b00
      const darkColor = [30, 30, 30]; // #1e1e1e
      const lightGray = [240, 240, 240]; // #f0f0f0
      const darkGray = [100, 100, 100]; // #646464
      
      // Header Background
      doc.setFillColor(...orangeColor);
      doc.rect(0, 0, 210, 50, 'F');
      
      // Header Text
      doc.setTextColor(255, 255, 255); // White
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('GymDesk', 20, 25);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Tum Uyeler Listesi', 20, 35);
      
      // Date and stats in header
      doc.setFontSize(10);
      doc.text(`Rapor: ${new Date().toLocaleDateString('tr-TR')}`, 140, 25);
      doc.text(`Toplam Üye: ${filteredMembers.length}`, 140, 35);
      
      let yPos = 65;
      
      // Section Header
      doc.setFillColor(...orangeColor);
      doc.rect(15, yPos - 8, 180, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('UYE LISTESI', 20, yPos - 1);
      yPos += 15;
      
      // Table headers
      doc.setFillColor(...lightGray);
      doc.rect(15, yPos - 5, 180, 10, 'F');
      doc.setTextColor(...darkColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Ad Soyad', 20, yPos + 2);
      doc.text('Telefon', 60, yPos + 2);
      doc.text('Uyelik', 95, yPos + 2);
      doc.text('Kalan Gun', 125, yPos + 2);
      doc.text('Durum', 160, yPos + 2);
      yPos += 12;
      
      // Members data
      filteredMembers.forEach((member, index) => {
        if (yPos > 270) {
          doc.addPage();
          
          // Add header on new page
          doc.setFillColor(...orangeColor);
          doc.rect(0, 0, 210, 30, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('GymDesk - Uye Listesi (devam)', 20, 20);
          
          yPos = 45;
          
          // Headers again
          doc.setFillColor(...lightGray);
          doc.rect(15, yPos - 5, 180, 10, 'F');
          doc.setTextColor(...darkColor);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Ad Soyad', 20, yPos + 2);
          doc.text('Telefon', 60, yPos + 2);
          doc.text('Uyelik', 95, yPos + 2);
          doc.text('Kalan Gun', 125, yPos + 2);
          doc.text('Durum', 160, yPos + 2);
          yPos += 12;
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(15, yPos - 3, 180, 8, 'F');
        }
        
        const status = getMembershipStatus(member.end_date);
        const remainingDays = getRemainingDays(member.end_date);
        
        // Member data
        doc.setTextColor(...darkColor);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(safePDFText(`${member.name} ${member.surname}`, 18), 20, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.text(safePDFText(member.phone, 12) || '-', 60, yPos);
        doc.text(safePDFText(member.membership_type, 10) || '-', 95, yPos);
        
        // Remaining days with color
        let remainingColor = [22, 163, 74]; // Green for more than 5 days
        if (remainingDays.text.includes('geçti')) remainingColor = [220, 38, 38]; // Red for expired
        else if (remainingDays.text.includes('Bugün') || remainingDays.days <= 5) remainingColor = [217, 119, 6]; // Yellow for soon
        
        doc.setTextColor(...remainingColor);
        doc.setFont('helvetica', 'bold');
        doc.text(safePDFText(remainingDays.text, 12), 125, yPos);
        
        // Status with color
        let statusColor = [22, 163, 74]; // Green for active
        if (status.status === 'Süresi Dolmuş') statusColor = [220, 38, 38]; // Red
        else if (status.status === 'Yakında Bitecek') statusColor = [217, 119, 6]; // Yellow
        
        doc.setTextColor(...statusColor);
        doc.setFont('helvetica', 'bold');
        doc.text(safePDFText(status.status, 12), 160, yPos);
        
        yPos += 8;
      });
      
      // Statistics Summary
      if (yPos < 240) {
        yPos += 10;
        
        // Stats section
        doc.setFillColor(...orangeColor);
        doc.rect(15, yPos - 8, 180, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ISTATISTIKLER', 20, yPos - 1);
        yPos += 15;
        
        // Calculate statistics
        const activeMembers = filteredMembers.filter(m => getMembershipStatus(m.end_date).status === 'Aktif').length;
        const expiringMembers = filteredMembers.filter(m => getMembershipStatus(m.end_date).status === 'Yakında Bitecek').length;
        const expiredMembers = filteredMembers.filter(m => getMembershipStatus(m.end_date).status === 'Süresi Dolmuş').length;
        
        doc.setTextColor(...darkColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.setTextColor(...orangeColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Aktif Uyeler:', 20, yPos);
        doc.setTextColor(22, 163, 74);
        doc.text(`${activeMembers}`, 65, yPos);
        
        doc.setTextColor(...orangeColor);
        doc.text('Yakinda Bitecek:', 100, yPos);
        doc.setTextColor(217, 119, 6);
        doc.text(`${expiringMembers}`, 150, yPos);
        
        yPos += 8;
        doc.setTextColor(...orangeColor);
        doc.text('Suresi Dolmus:', 20, yPos);
        doc.setTextColor(220, 38, 38);
        doc.text(`${expiredMembers}`, 65, yPos);
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
      
      // Download
      const fileName = `GymDesk_Tum_Uyeler_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Success notification
      alert.success('Tüm üyeler listesi PDF olarak indirildi!', 'Üye Listesi');
      
    } catch (error) {
      console.error('PDF oluşturulurken hata:', error);
      alert.error('PDF oluşturulurken bir hata oluştu!');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <Users size={24} />
        <span>Üyeler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Üye Yönetimi
          </h1>
          <p style={{ color: '#6b7280' }}>
            Toplam {members.length} üye kayıtlı
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={exportAllMembersPDF}
            disabled={filteredMembers.length === 0}
          >
            <FileText size={20} />
            Tüm Üyeleri PDF'e Aktar
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={20} />
            Yeni Üye Ekle
          </button>
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
              placeholder="Üye ara (ad, soyad, telefon, e-posta)"
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

        {/* Members Table */}
        {currentMembers.length > 0 ? (
          <div className="table-container">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '200px', width: '200px' }}>Ad Soyad</th>
                  <th style={{ minWidth: '140px', width: '140px' }}>Telefon</th>
                  <th style={{ minWidth: '200px', width: '200px' }}>E-posta</th>
                  <th style={{ minWidth: '120px', width: '120px' }}>Üyelik Tipi</th>
                  <th style={{ minWidth: '110px', width: '110px' }}>Başlangıç</th>
                  <th style={{ minWidth: '110px', width: '110px' }}>Bitiş</th>
                  <th style={{ minWidth: '130px', width: '130px' }}>Kalan Gün</th>
                  <th style={{ minWidth: '140px', width: '140px' }}>Durum</th>
                  <th style={{ minWidth: '180px', width: '180px' }}>İşlemler</th>
                </tr>
              </thead>
            <tbody>
              {currentMembers.map(member => {
                const status = getMembershipStatus(member.end_date);
                const remainingDays = getRemainingDays(member.end_date);
                return (
                  <tr key={member.id}>
                    <td style={{ 
                      fontWeight: '500',
                      minWidth: '200px', 
                      width: '200px',
                      maxWidth: '200px'
                    }}>
                      <div style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {member.name} {member.surname}
                      </div>
                    </td>
                    <td style={{ minWidth: '140px', width: '140px', maxWidth: '140px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.phone || '-'}
                      </div>
                    </td>
                    <td style={{ minWidth: '200px', width: '200px', maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.email || '-'}
                      </div>
                    </td>
                    <td style={{ minWidth: '120px', width: '120px', maxWidth: '120px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.membership_type || '-'}
                      </div>
                    </td>
                    <td style={{ minWidth: '110px', width: '110px', maxWidth: '110px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatDate(member.start_date)}
                      </div>
                    </td>
                    <td style={{ minWidth: '110px', width: '110px', maxWidth: '110px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatDate(member.end_date)}
                      </div>
                    </td>
                    <td style={{ minWidth: '130px', width: '130px', maxWidth: '130px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          color: remainingDays.color, 
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {remainingDays.text}
                        </span>
                      </div>
                    </td>
                    <td style={{ minWidth: '140px', width: '140px', maxWidth: '140px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          color: status.color, 
                          fontWeight: '500',
                          fontSize: '14px'
                        }}>
                          {status.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ minWidth: '180px', width: '180px', maxWidth: '180px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 12px' }}
                          onClick={() => exportSingleMemberPDF(member)}
                          title="PDF İndir"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px' }}
                          onClick={() => openEditModal(member)}
                          title="Düzenle"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px' }}
                          onClick={() => handleDeleteMember(member)}
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>
              {searchTerm ? 'Arama kriterinize uygun üye bulunamadı' : 'Henüz üye kaydı yok'}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredMembers.length > 0 && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ color: '#c4c4c4', fontSize: '14px' }}>
              {startIndex + 1}-{Math.min(endIndex, filteredMembers.length)} / {filteredMembers.length} üye gösteriliyor
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

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yeni Üye Ekle</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ad *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Soyad *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.surname}
                    onChange={(e) => setFormData({...formData, surname: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Doğum Tarihi</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Üyelik Tipi</label>
                  <select
                    className="form-input"
                    value={formData.membership_type}
                    onChange={(e) => handleMembershipTypeChange(e.target.value)}
                  >
                    <option value="Aylık">Aylık (1 ay)</option>
                    <option value="3 Aylık">3 Aylık (3 ay)</option>
                    <option value="6 Aylık">6 Aylık (6 ay)</option>
                    <option value="Yıllık">Yıllık (12 ay)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bitiş Tarihi 
                    <small style={{ color: '#6b7280', fontWeight: 'normal' }}> (otomatik hesaplandı)</small>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    style={{ 
                      backgroundColor: 'rgba(255, 107, 0, 0.1)',
                      border: '2px solid rgba(255, 107, 0, 0.3)',
                      color: '#ffffff'
                    }}
                  />
                </div>
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
                  Üye Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Üye Düzenle</h2>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditMember}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ad *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Soyad *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.surname}
                    onChange={(e) => setFormData({...formData, surname: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Doğum Tarihi</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Üyelik Tipi</label>
                  <select
                    className="form-input"
                    value={formData.membership_type}
                    onChange={(e) => handleMembershipTypeChange(e.target.value)}
                  >
                    <option value="Aylık">Aylık (1 ay)</option>
                    <option value="3 Aylık">3 Aylık (3 ay)</option>
                    <option value="6 Aylık">6 Aylık (6 ay)</option>
                    <option value="Yıllık">Yıllık (12 ay)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bitiş Tarihi 
                    <small style={{ color: '#6b7280', fontWeight: 'normal' }}> (otomatik hesaplandı)</small>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    style={{ 
                      backgroundColor: 'rgba(255, 107, 0, 0.1)',
                      border: '2px solid rgba(255, 107, 0, 0.3)',
                      color: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Edit2 size={20} />
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members; 