import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Search, Edit2, Trash2, User, Calendar, Scale } from 'lucide-react';
import { useAlert, useModal } from '../App';

function BodyMeasurements() {
  const alert = useAlert();
  const modal = useModal();
  const [measurements, setMeasurements] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    member_id: '',
    height: '',
    weight: '',
    body_fat_percentage: '',
    muscle_mass: '',
    chest: '',
    waist: '',
    hips: '',
    bicep: '',
    thigh: '',
    notes: '',
    measurement_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [measurementsData, membersData] = await Promise.all([
        window.electronAPI.getAllBodyMeasurements(),
        window.electronAPI.getMembers()
      ]);
      setMeasurements(measurementsData);
      setMembers(membersData);
      setLoading(false);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    try {
      await window.electronAPI.addBodyMeasurement(formData);
      setShowAddModal(false);
      resetForm();
      loadData();
      alert.success('Vücut ölçüleri başarıyla eklendi!');
    } catch (error) {
      console.error('Ölçü eklenirken hata:', error);
      alert.error('Ölçü eklenirken bir hata oluştu!');
    }
  };

  const handleEditMeasurement = async (e) => {
    e.preventDefault();
    try {
      await window.electronAPI.updateBodyMeasurement(selectedMeasurement.id, formData);
      setShowEditModal(false);
      resetForm();
      loadData();
      alert.success('Vücut ölçüleri başarıyla güncellendi!');
    } catch (error) {
      console.error('Ölçü güncellenirken hata:', error);
      alert.error('Ölçü güncellenirken bir hata oluştu!');
    }
  };

  const handleDeleteMeasurement = async (measurement) => {
    const memberName = `${measurement.name} ${measurement.surname}`;
    const isConfirmed = await modal.confirm(
      `${memberName} için ${formatDate(measurement.measurement_date)} tarihli ölçüyü silmek istediğinizden emin misiniz?`,
      'Bu işlem geri alınamaz!'
    );
    
    if (isConfirmed) {
      try {
        await window.electronAPI.deleteBodyMeasurement(measurement.id);
        alert.success('Vücut ölçüsü başarıyla silindi!');
        loadData();
      } catch (error) {
        console.error('Ölçü silinirken hata:', error);
        alert.error('Ölçü silinirken bir hata oluştu!');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: '',
      height: '',
      weight: '',
      body_fat_percentage: '',
      muscle_mass: '',
      chest: '',
      waist: '',
      hips: '',
      bicep: '',
      thigh: '',
      notes: '',
      measurement_date: new Date().toISOString().split('T')[0]
    });
    setSelectedMeasurement(null);
  };

  const openEditModal = (measurement) => {
    setSelectedMeasurement(measurement);
    setFormData({
      member_id: measurement.member_id,
      height: measurement.height || '',
      weight: measurement.weight || '',
      body_fat_percentage: measurement.body_fat_percentage || '',
      muscle_mass: measurement.muscle_mass || '',
      chest: measurement.chest || '',
      waist: measurement.waist || '',
      hips: measurement.hips || '',
      bicep: measurement.bicep || '',
      thigh: measurement.thigh || '',
      notes: measurement.notes || '',
      measurement_date: measurement.measurement_date || ''
    });
    setShowEditModal(true);
  };

  const filteredMeasurements = measurements.filter(measurement => {
    const memberName = `${measurement.name} ${measurement.surname}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const memberMatch = selectedMember === '' || measurement.member_id.toString() === selectedMember;
    const textMatch = memberName.includes(searchLower);
    return memberMatch && textMatch;
  });

  // Sayfalandırma hesaplamaları
  const totalItems = filteredMeasurements.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMeasurements = filteredMeasurements.slice(startIndex, endIndex);

  // Sayfa değişikliklerinde currentPage'i sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMember]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatMeasurement = (value, unit) => {
    if (!value || value === '') return '-';
    return `${parseFloat(value).toFixed(1)} ${unit}`;
  };

  const getBMI = (height, weight) => {
    if (!height || !weight) return '-';
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    return bmi.toFixed(1);
  };

  const getBMIStatus = (bmi) => {
    if (bmi === '-') return { text: '-', color: '#6b7280' };
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { text: 'Zayıf', color: '#3b82f6' };
    if (bmiValue < 25) return { text: 'Normal', color: '#16a34a' };
    if (bmiValue < 30) return { text: 'Fazla Kilolu', color: '#d97706' };
    return { text: 'Obez', color: '#dc2626' };
  };

  if (loading) {
    return (
      <div className="loading">
        <Ruler size={24} />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Vücut Ölçüleri
        </h1>
        <p style={{ color: '#c4c4c4', fontSize: '16px' }}>
          Üyelerin vücut ölçüleri ve gelişim takibi
        </p>
      </div>

      {/* Filtreler ve Ekle Butonu */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Arama */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '16px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#c4c4c4' 
            }} />
            <input
              type="text"
              placeholder="Üye ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{
                width: '100%',
                padding: '16px 20px 16px 48px',
                border: '2px solid rgba(60, 60, 60, 0.6)',
                borderRadius: '12px',
                fontSize: '16px',
                background: 'rgba(40, 40, 40, 0.9)',
                color: '#ffffff',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff6b00';
                e.target.style.boxShadow = '0 0 0 4px rgba(255, 107, 0, 0.25)';
                e.target.style.background = 'rgba(30, 30, 30, 0.95)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(60, 60, 60, 0.6)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'rgba(40, 40, 40, 0.9)';
              }}
            />
          </div>

          {/* Üye Filtresi */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="form-input"
            style={{
              padding: '16px 20px',
              border: '2px solid rgba(60, 60, 60, 0.6)',
              borderRadius: '12px',
              fontSize: '16px',
              minWidth: '180px',
              background: 'rgba(40, 40, 40, 0.9)',
              color: '#ffffff',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#ff6b00';
              e.target.style.boxShadow = '0 0 0 4px rgba(255, 107, 0, 0.25)';
              e.target.style.background = 'rgba(30, 30, 30, 0.95)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(60, 60, 60, 0.6)';
              e.target.style.boxShadow = 'none';
              e.target.style.background = 'rgba(40, 40, 40, 0.9)';
            }}
          >
            <option value="">Tüm Üyeler</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} {member.surname}
              </option>
            ))}
          </select>

          {/* Ekle Butonu */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff4500 100%)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontSize: '16px',
              boxShadow: '0 4px 15px rgba(255, 107, 0, 0.4)',
              minWidth: 'auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 0, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 0, 0.4)';
            }}
          >
            <Plus size={20} />
            Yeni Ölçü Ekle
          </button>
        </div>
      </div>

      {/* Ölçüler Tablosu */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Üye</th>
                <th>Tarih</th>
                <th>Boy (cm)</th>
                <th>Kilo (kg)</th>
                <th>BMI</th>
                <th>Yağ Oranı (%)</th>
                <th>Kas Kütlesi (kg)</th>
                <th>Göğüs (cm)</th>
                <th>Bel (cm)</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMeasurements.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <Ruler size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
                    {searchTerm || selectedMember ? 
                      'Arama kriterlerine uygun ölçü bulunamadı' : 
                      'Henüz vücut ölçüsü eklenmemiş'}
                  </td>
                </tr>
              ) : (
                paginatedMeasurements.map(measurement => {
                  const bmi = getBMI(measurement.height, measurement.weight);
                  const bmiStatus = getBMIStatus(bmi);
                  
                  return (
                    <tr key={measurement.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={16} color="#6b7280" />
                          <span>{measurement.name} {measurement.surname}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} color="#6b7280" />
                          <span>{formatDate(measurement.measurement_date)}</span>
                        </div>
                      </td>
                      <td>{formatMeasurement(measurement.height, 'cm')}</td>
                      <td>{formatMeasurement(measurement.weight, 'kg')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: bmiStatus.color, fontWeight: 'bold' }}>
                            {bmi}
                          </span>
                          {bmi !== '-' && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: bmiStatus.color,
                              fontWeight: 'bold'
                            }}>
                              ({bmiStatus.text})
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{formatMeasurement(measurement.body_fat_percentage, '%')}</td>
                      <td>{formatMeasurement(measurement.muscle_mass, 'kg')}</td>
                      <td>{formatMeasurement(measurement.chest, 'cm')}</td>
                      <td>{formatMeasurement(measurement.waist, 'cm')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(measurement)}
                            style={{ 
                              padding: '8px',
                              minWidth: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid rgba(255, 107, 0, 0.6)',
                              borderRadius: '8px',
                              background: 'rgba(255, 107, 0, 0.1)',
                              color: '#ff6b00',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(255, 107, 0, 0.2)';
                              e.target.style.borderColor = '#ff6b00';
                              e.target.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(255, 107, 0, 0.1)';
                              e.target.style.borderColor = 'rgba(255, 107, 0, 0.6)';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteMeasurement(measurement)}
                            style={{ 
                              padding: '8px',
                              minWidth: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid rgba(239, 68, 68, 0.6)',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                              e.target.style.borderColor = '#ef4444';
                              e.target.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                              e.target.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalandırma */}
        {totalItems > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '20px',
            padding: '16px 0',
            borderTop: '1px solid rgba(255, 107, 0, 0.2)'
          }}>
            {/* Sayfa başına kayıt sayısı */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#c4c4c4', fontSize: '14px' }}>Sayfa başına:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '2px solid rgba(60, 60, 60, 0.6)',
                  borderRadius: '8px',
                  background: 'rgba(40, 40, 40, 0.9)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span style={{ color: '#c4c4c4', fontSize: '14px' }}>
                {startIndex + 1}-{Math.min(endIndex, totalItems)} / {totalItems} kayıt
              </span>
            </div>

            {/* Sayfa numaraları */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* İlk sayfa */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid rgba(60, 60, 60, 0.6)',
                    borderRadius: '8px',
                    background: currentPage === 1 ? 'rgba(60, 60, 60, 0.3)' : 'rgba(40, 40, 40, 0.9)',
                    color: currentPage === 1 ? '#6b7280' : '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ««
                </button>

                {/* Önceki sayfa */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid rgba(60, 60, 60, 0.6)',
                    borderRadius: '8px',
                    background: currentPage === 1 ? 'rgba(60, 60, 60, 0.3)' : 'rgba(40, 40, 40, 0.9)',
                    color: currentPage === 1 ? '#6b7280' : '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  «
                </button>

                {/* Sayfa numaraları */}
                {(() => {
                  const pageNumbers = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                  
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        style={{
                          padding: '8px 12px',
                          border: '2px solid ' + (i === currentPage ? '#ff6b00' : 'rgba(60, 60, 60, 0.6)'),
                          borderRadius: '8px',
                          background: i === currentPage 
                            ? 'linear-gradient(135deg, #ff6b00 0%, #ff4500 100%)' 
                            : 'rgba(40, 40, 40, 0.9)',
                          color: i === currentPage ? '#ffffff' : '#c4c4c4',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: i === currentPage ? '600' : '400',
                          transition: 'all 0.3s ease',
                          minWidth: '40px'
                        }}
                        onMouseEnter={(e) => {
                          if (i !== currentPage) {
                            e.target.style.borderColor = '#ff6b00';
                            e.target.style.color = '#ffffff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (i !== currentPage) {
                            e.target.style.borderColor = 'rgba(60, 60, 60, 0.6)';
                            e.target.style.color = '#c4c4c4';
                          }
                        }}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pageNumbers;
                })()}

                {/* Sonraki sayfa */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid rgba(60, 60, 60, 0.6)',
                    borderRadius: '8px',
                    background: currentPage === totalPages ? 'rgba(60, 60, 60, 0.3)' : 'rgba(40, 40, 40, 0.9)',
                    color: currentPage === totalPages ? '#6b7280' : '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  »
                </button>

                {/* Son sayfa */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid rgba(60, 60, 60, 0.6)',
                    borderRadius: '8px',
                    background: currentPage === totalPages ? 'rgba(60, 60, 60, 0.3)' : 'rgba(40, 40, 40, 0.9)',
                    color: currentPage === totalPages ? '#6b7280' : '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  »»
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ölçü Ekleme Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ 
            maxWidth: '800px',
            background: 'rgba(25, 25, 25, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 107, 0, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 8px 24px rgba(255, 107, 0, 0.2)'
          }}>
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff4500 100%)',
              color: 'white',
              borderRadius: '20px 20px 0 0',
              padding: '24px 28px',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ruler size={24} />
                </div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '22px', 
                  fontWeight: '700',
                  letterSpacing: '0.3px'
                }}>
                  Yeni Vücut Ölçüsü Ekle
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="close-btn"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddMeasurement}>
              <div className="modal-body" style={{ 
                padding: '28px',
                background: 'rgba(25, 25, 25, 0.98)',
                borderRadius: '0 0 20px 20px'
              }}>
                {/* Temel Bilgiler */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid rgba(255, 107, 0, 0.3)'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #ff6b00 0%, #ff4500 100%)',
                      borderRadius: '10px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <User size={16} color="white" />
                    </div>
                    <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: '700' }}>
                      Temel Bilgiler
                    </h4>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '16px' 
                  }}>
                    {/* Üye Seçimi */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '10px'
                      }}>
                        <User size={16} />
                        Üye Seçin *
                      </label>
                      <select
                        value={formData.member_id}
                        onChange={(e) => setFormData({...formData, member_id: e.target.value})}
                        required
                        className="form-input"
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '2px solid rgba(60, 60, 60, 0.6)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          background: 'rgba(40, 40, 40, 0.9)',
                          color: '#ffffff',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#ff6b00';
                          e.target.style.boxShadow = '0 0 0 4px rgba(255, 107, 0, 0.25)';
                          e.target.style.background = 'rgba(30, 30, 30, 0.95)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(60, 60, 60, 0.6)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.background = 'rgba(40, 40, 40, 0.9)';
                        }}
                      >
                        <option value="">👤 Üye seçin</option>
                        {members.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} {member.surname}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ölçüm Tarihi */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '10px'
                      }}>
                        <Calendar size={16} />
                        Ölçüm Tarihi *
                      </label>
                      <input
                        type="date"
                        value={formData.measurement_date}
                        onChange={(e) => setFormData({...formData, measurement_date: e.target.value})}
                        required
                        className="form-input"
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '2px solid rgba(60, 60, 60, 0.6)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          background: 'rgba(40, 40, 40, 0.9)',
                          color: '#ffffff',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#ff6b00';
                          e.target.style.boxShadow = '0 0 0 4px rgba(255, 107, 0, 0.25)';
                          e.target.style.background = 'rgba(30, 30, 30, 0.95)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(60, 60, 60, 0.6)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.background = 'rgba(40, 40, 40, 0.9)';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Temel Ölçümler */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '10px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Scale size={16} color="white" />
                    </div>
                    <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: '700' }}>
                      Temel Ölçümler
                    </h4>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px' 
                  }}>
                    {/* Boy */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        📏 Boy (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="250"
                        placeholder="170.5"
                        value={formData.height}
                        onChange={(e) => setFormData({...formData, height: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Kilo */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        ⚖️ Kilo (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="300"
                        placeholder="70.5"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Yağ Oranı */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        🔥 Yağ Oranı (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        placeholder="15.5"
                        value={formData.body_fat_percentage}
                        onChange={(e) => setFormData({...formData, body_fat_percentage: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Kas Kütlesi */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        💪 Kas Kütlesi (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="45.2"
                        value={formData.muscle_mass}
                        onChange={(e) => setFormData({...formData, muscle_mass: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>
                </div>

                {/* Çevre Ölçüleri */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #f3f4f6'
                  }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      borderRadius: '50%',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Search size={14} color="white" />
                    </div>
                    <h4 style={{ margin: 0, color: '#374151', fontSize: '16px', fontWeight: '600' }}>
                      Çevre Ölçüleri (cm)
                    </h4>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                    gap: '16px' 
                  }}>
                    {/* Göğüs */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        🫁 Göğüs
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="200"
                        placeholder="95.5"
                        value={formData.chest}
                        onChange={(e) => setFormData({...formData, chest: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Bel */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        ⚡ Bel
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="200"
                        placeholder="80.5"
                        value={formData.waist}
                        onChange={(e) => setFormData({...formData, waist: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Kalça */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        🍑 Kalça
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="200"
                        placeholder="92.5"
                        value={formData.hips}
                        onChange={(e) => setFormData({...formData, hips: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Bicep */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        💪 Bicep
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="35.5"
                        value={formData.bicep}
                        onChange={(e) => setFormData({...formData, bicep: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Uyluk */}
                    <div className="form-group">
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        🦵 Uyluk
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="55.5"
                        value={formData.thigh}
                        onChange={(e) => setFormData({...formData, thigh: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>
                </div>

                {/* Notlar */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #f3f4f6'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      borderRadius: '10px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Edit2 size={16} color="white" />
                    </div>
                    <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: '700' }}>
                      Ek Notlar
                    </h4>
                  </div>
                  
                  <div className="form-group">
                    <textarea
                      placeholder="📝 Ölçüm notları, hedefler veya özel durumlar..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows="4"
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ 
                padding: '24px 28px',
                borderTop: '1px solid rgba(255, 107, 0, 0.3)',
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                background: 'rgba(25, 25, 25, 0.98)',
                borderRadius: '0 0 20px 20px'
              }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '15px',
                    boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ❌ İptal
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ff6b00 0%, #ff4500 100%)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '15px',
                    boxShadow: '0 4px 15px rgba(255, 107, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ✅ Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ölçü Düzenleme Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ 
            maxWidth: '800px',
            background: 'rgba(25, 25, 25, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 107, 0, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 8px 24px rgba(255, 107, 0, 0.2)'
          }}>
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff4500 100%)',
              color: 'white',
              borderRadius: '20px 20px 0 0',
              padding: '24px 28px',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Edit2 size={24} />
                </div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '22px', 
                  fontWeight: '700',
                  letterSpacing: '0.3px'
                }}>
                  Vücut Ölçüsü Düzenle
                </h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="close-btn"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEditMeasurement}>
              <div className="modal-body" style={{ 
                padding: '28px',
                background: 'rgba(25, 25, 25, 0.98)',
                borderRadius: '0 0 20px 20px'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px' 
                }}>
                  {/* Üye Seçimi */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      👤 Üye *
                    </label>
                    <select
                      value={formData.member_id}
                      onChange={(e) => setFormData({...formData, member_id: e.target.value})}
                      required
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    >
                      <option value="">Üye seçin</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} {member.surname}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ölçüm Tarihi */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      📅 Ölçüm Tarihi *
                    </label>
                    <input
                      type="date"
                      value={formData.measurement_date}
                      onChange={(e) => setFormData({...formData, measurement_date: e.target.value})}
                      required
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Boy */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      📏 Boy (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="170.5"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Kilo */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      ⚖️ Kilo (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Yağ Oranı */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      🔥 Yağ Oranı (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="15.5"
                      value={formData.body_fat_percentage}
                      onChange={(e) => setFormData({...formData, body_fat_percentage: e.target.value})}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Kas Kütlesi */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      💪 Kas Kütlesi (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="45.2"
                      value={formData.muscle_mass}
                      onChange={(e) => setFormData({...formData, muscle_mass: e.target.value})}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Göğüs */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      🫁 Göğüs (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="95.5"
                      value={formData.chest}
                      onChange={(e) => setFormData({...formData, chest: e.target.value})}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Bel */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      ⚡ Bel (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="80.5"
                      value={formData.waist}
                      onChange={(e) => setFormData({...formData, waist: e.target.value})}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Kalça */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      🍑 Kalça (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="92.5"
                      value={formData.hips}
                      onChange={(e) => setFormData({...formData, hips: e.target.value})}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Bicep */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      💪 Bicep (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="35.5"
                      value={formData.bicep}
                      onChange={(e) => setFormData({...formData, bicep: e.target.value})}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Uyluk */}
                  <div className="form-group">
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      🦵 Uyluk (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="55.5"
                      value={formData.thigh}
                      onChange={(e) => setFormData({...formData, thigh: e.target.value})}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Notlar */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '10px',
                      fontSize: '15px'
                    }}>
                      📝 Notlar
                    </label>
                    <textarea
                      placeholder="Ek notlar..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows="3"
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid rgba(60, 60, 60, 0.6)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        color: '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ 
                padding: '24px 28px',
                borderTop: '1px solid rgba(255, 107, 0, 0.3)',
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                background: 'rgba(25, 25, 25, 0.98)',
                borderRadius: '0 0 20px 20px'
              }}>
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '15px',
                    boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ❌ İptal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ff6b00 0%, #ff4500 100%)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '15px',
                    boxShadow: '0 4px 15px rgba(255, 107, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ✅ Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BodyMeasurements; 