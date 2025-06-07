import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Target, Award, Calendar,
  Activity, Clock, Star, Trophy, Plus, Eye, Edit, Filter
} from 'lucide-react';
import { useAlert } from '../App';

function Progress() {
  const alert = useAlert();
  const [loading, setLoading] = useState(true);
  const [gymAnalytics, setGymAnalytics] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [memberGoals, setMemberGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState({
    member_id: '',
    title: '',
    description: '',
    target_value: '',
    target_date: '',
    goal_type: 'Antrenman Sayısı'
  });

  const goalTypes = [
    'Antrenman Sayısı', 'Kilo Kaybı', 'Kas Kütlesi', 'Kardiyo Süresi', 
    'Güç Artışı', 'Esneklik', 'Genel Fitness'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      loadMemberData(selectedMember.id);
    }
  }, [selectedMember]);

  const loadData = async () => {
    try {
      const [analyticsData, membersData] = await Promise.all([
        window.electronAPI.getGymAnalytics(),
        window.electronAPI.getMembers()
      ]);
      setGymAnalytics(analyticsData);
      setMembers(membersData);
      if (membersData.length > 0) {
        setSelectedMember(membersData[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const loadMemberData = async (memberId) => {
    try {
      const [statsData, goalsData] = await Promise.all([
        window.electronAPI.getMemberStats(memberId),
        window.electronAPI.getMemberGoals(memberId)
      ]);
      setMemberStats(statsData);
      setMemberGoals(goalsData);
    } catch (error) {
      console.error('Üye verileri yüklenirken hata:', error);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await window.electronAPI.addMemberGoal({
        ...goalData,
        target_value: parseFloat(goalData.target_value)
      });
      setShowGoalModal(false);
      setGoalData({
        member_id: selectedMember?.id || '',
        title: '',
        description: '',
        target_value: '',
        target_date: '',
        goal_type: 'Antrenman Sayısı'
      });
      if (selectedMember) {
        loadMemberData(selectedMember.id);
      }
      alert.success('Hedef başarıyla eklendi!');
    } catch (error) {
      console.error('Hedef eklenirken hata:', error);
      alert.error('Hedef eklenirken bir hata oluştu!');
    }
  };

  const updateGoalProgress = async (goalId, newValue) => {
    try {
      await window.electronAPI.updateGoalProgress(goalId, parseFloat(newValue));
      if (selectedMember) {
        loadMemberData(selectedMember.id);
      }
      alert.success('Hedef progress güncellendi!');
    } catch (error) {
      console.error('Hedef güncellenirken hata:', error);
      alert.error('Hedef güncellenirken bir hata oluştu!');
    }
  };

  const getProgressPercentage = (current, target) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="loading">
        <BarChart3 size={24} />
        <span>Progress verileri yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            📊 Progress & Analytics
          </h1>
          <p style={{ color: '#9ca3af' }}>
            Gym performans analizi ve üye progress takibi
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setGoalData({...goalData, member_id: selectedMember?.id || ''});
            setShowGoalModal(true);
          }}
          disabled={!selectedMember}
        >
          <Target size={20} />
          Hedef Ekle
        </button>
      </div>

      {/* Gym Analytics */}
      {gymAnalytics && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            🏋️ Gym İstatistikleri (Son 30 Gün)
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}>
                <Users size={24} color="#6366f1" />
              </div>
              <div className="stat-content">
                <h3>{gymAnalytics.activeMembers}</h3>
                <p>Aktif Üye</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 107, 0, 0.2)' }}>
                <Activity size={24} color="#ff6b00" />
              </div>
              <div className="stat-content">
                <h3>{gymAnalytics.totalSessions}</h3>
                <p>Toplam Antrenman</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                <Clock size={24} color="#10b981" />
              </div>
              <div className="stat-content">
                <h3>{gymAnalytics.avgDuration} dk</h3>
                <p>Ortalama Süre</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                <Star size={24} color="#f59e0b" />
              </div>
              <div className="stat-content">
                <h3>{gymAnalytics.avgRating}/5</h3>
                <p>Ortalama Puan</p>
              </div>
            </div>
          </div>

          {/* En Aktif Üyeler */}
          <div className="card" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} />
              En Aktif Üyeler
            </h3>
            
            {gymAnalytics.topMembers && gymAnalytics.topMembers.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {gymAnalytics.topMembers.slice(0, 5).map((member, index) => (
                  <div key={member.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 107, 0, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: index < 3 ? '#ff6b00' : 'rgba(255, 107, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#ffffff' }}>
                          {member.name} {member.surname}
                        </div>
                        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                          Ortalama {Math.round(member.avg_duration)} dk/antrenman
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff6b00' }}>
                        {member.workout_count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        antrenman
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                Henüz antrenman verisi yok
              </p>
            )}
          </div>
        </div>
      )}

      {/* Üye Seçimi */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '20px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} />
          Üye Progress Analizi
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">Üye Seçin:</label>
          <select
            className="form-input"
            value={selectedMember?.id || ''}
            onChange={(e) => {
              const member = members.find(m => m.id === parseInt(e.target.value));
              setSelectedMember(member);
            }}
            style={{ maxWidth: '400px' }}
          >
            <option value="">Üye seçiniz...</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} {member.surname}
              </option>
            ))}
          </select>
        </div>

        {/* Üye İstatistikleri */}
        {selectedMember && memberStats && (
          <div>
            <h4 style={{ color: '#ff6b00', marginBottom: '16px' }}>
              📈 {selectedMember.name} {selectedMember.surname} - İstatistikler
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 107, 0, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b00' }}>
                  {memberStats.totalWorkouts}
                </div>
                <div style={{ color: '#ffffff' }}>Toplam Antrenman</div>
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 107, 0, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b00' }}>
                  {memberStats.monthlyWorkouts}
                </div>
                <div style={{ color: '#ffffff' }}>Bu Ay</div>
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 107, 0, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b00' }}>
                  {memberStats.weeklyWorkouts}
                </div>
                <div style={{ color: '#ffffff' }}>Son 7 Gün</div>
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 107, 0, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b00' }}>
                  {memberStats.avgDuration} dk
                </div>
                <div style={{ color: '#ffffff' }}>Ortalama Süre</div>
              </div>
            </div>

            {/* Kategori Dağılımı */}
            {memberStats.categoryBreakdown && memberStats.categoryBreakdown.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h5 style={{ color: '#ffffff', marginBottom: '16px' }}>Kategori Dağılımı:</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {memberStats.categoryBreakdown.map(category => (
                    <div key={category.category} style={{
                      padding: '12px',
                      background: 'rgba(255, 107, 0, 0.1)',
                      border: '1px solid rgba(255, 107, 0, 0.3)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff6b00' }}>
                        {category.count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#ffffff' }}>
                        {category.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Üye Hedefleri */}
        {selectedMember && (
          <div>
            <h4 style={{ color: '#ff6b00', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} />
              Hedefler ({memberGoals.length})
            </h4>
            
            {memberGoals.length > 0 ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {memberGoals.map(goal => {
                  const progress = getProgressPercentage(goal.current_value, goal.target_value);
                  const isCompleted = goal.status === 'Tamamlandi';
                  
                  return (
                    <div key={goal.id} style={{
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 107, 0, 0.3)'}`,
                      borderRadius: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h5 style={{ color: isCompleted ? '#10b981' : '#ff6b00', margin: '0 0 4px 0' }}>
                            {goal.title}
                          </h5>
                          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>
                            {goal.description}
                          </p>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            📅 {formatDate(goal.target_date)} • 🎯 {goal.goal_type}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: isCompleted ? '#10b981' : '#ff6b00' }}>
                            {progress}%
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {goal.current_value}/{goal.target_value}
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          backgroundColor: isCompleted ? '#10b981' : '#ff6b00',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      
                      {/* Progress Update */}
                      {!isCompleted && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="number"
                            placeholder="Yeni değer"
                            style={{
                              padding: '8px 12px',
                              border: '1px solid rgba(255, 107, 0, 0.3)',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: '#ffffff',
                              fontSize: '14px',
                              width: '120px'
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateGoalProgress(goal.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '8px 12px', fontSize: '12px' }}
                            onClick={(e) => {
                              const input = e.target.parentElement.querySelector('input');
                              if (input.value) {
                                updateGoalProgress(goal.id, input.value);
                                input.value = '';
                              }
                            }}
                          >
                            Güncelle
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <Target size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Bu üye için henüz hedef belirlenmemiş</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yeni Hedef Belirle</h2>
              <button 
                className="close-btn"
                onClick={() => setShowGoalModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddGoal}>
              <div className="form-group">
                <label className="form-label">Hedef Başlığı *</label>
                <input
                  type="text"
                  className="form-input"
                  value={goalData.title}
                  onChange={(e) => setGoalData({...goalData, title: e.target.value})}
                  placeholder="Örn: Aylık 12 Antrenman"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={goalData.description}
                  onChange={(e) => setGoalData({...goalData, description: e.target.value})}
                  placeholder="Hedef hakkında detaylı bilgi..."
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Hedef Tipi</label>
                  <select
                    className="form-input"
                    value={goalData.goal_type}
                    onChange={(e) => setGoalData({...goalData, goal_type: e.target.value})}
                  >
                    {goalTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hedef Değer *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={goalData.target_value}
                    onChange={(e) => setGoalData({...goalData, target_value: e.target.value})}
                    placeholder="Örn: 12"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hedef Tarihi</label>
                <input
                  type="date"
                  className="form-input"
                  value={goalData.target_date}
                  onChange={(e) => setGoalData({...goalData, target_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowGoalModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Target size={20} />
                  Hedef Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Progress;
