import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Search, User, Clock, Dumbbell, Target, 
  Star, Filter, Eye, Edit, Trash2, Play, CheckCircle, 
  BarChart3, TrendingUp, Award, Timer, Download, FileText 
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAlert, useModal } from '../App';

function WorkoutPlans() {
  const alert = useAlert();
  const modal = useModal();
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTemplateDetailModal, setShowTemplateDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [planExercises, setPlanExercises] = useState([]);
  const [templateExercises, setTemplateExercises] = useState([]);
  
  const [formData, setFormData] = useState({
    member_id: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Genel',
    duration: 60,
    difficulty: 'Orta',
    status: 'Planlandi',
    template_id: null
  });

  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: 'Genel',
    difficulty: 'Orta',
    duration: 60
  });

  const [exerciseData, setExerciseData] = useState({
    name: '',
    muscle_group: 'Göğüs',
    equipment: 'Barbell',
    instructions: ''
  });

  const [showAddTemplateExerciseModal, setShowAddTemplateExerciseModal] = useState(false);
  const [templateExerciseData, setTemplateExerciseData] = useState({
    exercise_id: '',
    sets: 3,
    reps: 10,
    weight: 0,
    rest_seconds: 60,
    notes: '',
    order_index: 1
  });

  const categories = ['Genel', 'Güç', 'Kardiyo', 'Esneklik', 'Fonksiyonel', 'Rehabilitasyon'];
  const difficulties = ['Kolay', 'Orta', 'Zor', 'Uzman'];
  const statuses = ['Planlandi', 'Devam Ediyor', 'Tamamlandi', 'İptal Edildi'];
  const muscleGroups = ['Göğüs', 'Sırt', 'Omuz', 'Kol', 'Bacak', 'Karın', 'Kalça', 'Genel'];
  const equipments = ['Barbell', 'Dumbbell', 'Makine', 'Kablo', 'Vücut Ağırlığı', 'Kettlebell', 'TRX'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansData, membersData, templatesData, exercisesData] = await Promise.all([
        window.electronAPI.getWorkoutPlans(),
        window.electronAPI.getMembers(),
        window.electronAPI.getWorkoutTemplates(),
        window.electronAPI.getExercises()
      ]);
      setWorkoutPlans(plansData);
      setMembers(membersData);
      setTemplates(templatesData);
      setExercises(exercisesData);
      setLoading(false);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const loadPlanExercises = async (planId) => {
    try {
      const exercises = await window.electronAPI.getPlanExercises(planId);
      setPlanExercises(exercises);
    } catch (error) {
      console.error('Plan egzersizleri yüklenirken hata:', error);
    }
  };

  const loadTemplateExercises = async (templateId) => {
    try {
      const exercises = await window.electronAPI.getTemplateExercises(templateId);
      setTemplateExercises(exercises);
    } catch (error) {
      console.error('Şablon egzersizleri yüklenirken hata:', error);
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    try {
      const result = await window.electronAPI.addWorkoutPlan(formData);
      setShowAddModal(false);
      resetForm();
      loadData();
      
      // Başarı mesajı göster
      if (result.exercisesCopied > 0) {
        alert.success(result.message);
      } else {
        alert.success('Antrenman planı başarıyla oluşturuldu!');
      }
    } catch (error) {
      console.error('Antrenman planı eklenirken hata:', error);
      alert.error('Antrenman planı eklenirken bir hata oluştu!');
    }
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    try {
      await window.electronAPI.addWorkoutTemplate(templateData);
      setShowTemplateModal(false);
      setTemplateData({
        name: '',
        description: '',
        category: 'Genel',
        difficulty: 'Orta',
        duration: 60
      });
      loadData();
      alert.success('Şablon başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Şablon eklenirken hata:', error);
      alert.error('Şablon eklenirken bir hata oluştu!');
    }
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    try {
      await window.electronAPI.addExercise(exerciseData);
      setShowExerciseModal(false);
      setExerciseData({
        name: '',
        muscle_group: 'Göğüs',
        equipment: 'Barbell',
        instructions: ''
      });
      loadData();
      alert.success(`"${exerciseData.name}" egzersizi başarıyla eklendi! Artık şablonlarda kullanabilirsiniz.`);
    } catch (error) {
      console.error('Egzersiz eklenirken hata:', error);
      alert.error('Egzersiz eklenirken bir hata oluştu!');
    }
  };

  const handleAddTemplateExercise = async (e) => {
    e.preventDefault();
    try {
      const exerciseToAdd = {
        template_id: selectedTemplate.id,
        exercise_id: parseInt(templateExerciseData.exercise_id),
        sets: templateExerciseData.sets,
        reps: templateExerciseData.reps,
        weight: templateExerciseData.weight,
        rest_seconds: templateExerciseData.rest_seconds,
        notes: templateExerciseData.notes,
        order_index: templateExercises.length + 1
      };
      
      await window.electronAPI.addTemplateExercise(exerciseToAdd);
      setShowAddTemplateExerciseModal(false);
      setTemplateExerciseData({
        exercise_id: '',
        sets: 3,
        reps: 10,
        weight: 0,
        rest_seconds: 60,
        notes: '',
        order_index: 1
      });
      
      // Şablon egzersizlerini yeniden yükle
      loadTemplateExercises(selectedTemplate.id);
      
      const selectedExercise = exercises.find(ex => ex.id === parseInt(templateExerciseData.exercise_id));
      alert.success(`"${selectedExercise?.name}" egzersizi şablona başarıyla eklendi!`);
    } catch (error) {
      console.error('Şablon egzersizi eklenirken hata:', error);
      alert.error('Şablon egzersizi eklenirken bir hata oluştu!');
    }
  };

  const handleDeleteTemplateExercise = async (exerciseId, exerciseName) => {
    const isConfirmed = await modal.confirm(
      'Egzersizi Şablondan Sil',
      `"${exerciseName}" egzersizini şablondan silmek istediğinizden emin misiniz?`
    );
    
    if (isConfirmed) {
      try {
        await window.electronAPI.deleteTemplateExercise(exerciseId);
        
        // Şablon egzersizlerini yeniden yükle
        loadTemplateExercises(selectedTemplate.id);
        
        alert.success(`"${exerciseName}" egzersizi şablondan başarıyla silindi!`);
      } catch (error) {
        console.error('Şablon egzersizi silinirken hata:', error);
        alert.error('Şablon egzersizi silinirken bir hata oluştu!');
      }
    }
  };

  const handleDeleteExercise = async (exerciseId, exerciseName) => {
    const isConfirmed = await modal.confirm(
      'Egzersizi Sistemden Sil',
      `"${exerciseName}" egzersizini sistemden tamamen silmek istediğinizden emin misiniz?\n\nDikkat: Bu egzersiz şablonlarda veya planlarda kullanılıyorsa silinemez.`
    );
    
    if (isConfirmed) {
      try {
        await window.electronAPI.deleteExercise(exerciseId);
        
        // Egzersizleri yeniden yükle
        loadData();
        
        alert.success(`"${exerciseName}" egzersizi başarıyla silindi!`);
      } catch (error) {
        console.error('Egzersiz silinirken hata:', error);
        alert.error(error.message || 'Egzersiz silinirken bir hata oluştu!');
      }
    }
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    const isConfirmed = await modal.confirm(
      'Şablonu Sil',
      `"${templateName}" şablonunu silmek istediğinizden emin misiniz?\n\nDikkat: Bu şablon antrenman planlarında kullanılıyorsa silinemez.`
    );
    
    if (isConfirmed) {
      try {
        await window.electronAPI.deleteWorkoutTemplate(templateId);
        
        // Şablonları yeniden yükle
        loadData();
        
        alert.success(`"${templateName}" şablonu başarıyla silindi!`);
      } catch (error) {
        console.error('Şablon silinirken hata:', error);
        alert.error(error.message || 'Şablon silinirken bir hata oluştu!');
      }
    }
  };

  const handleDeletePlanExercise = async (exerciseId, exerciseName) => {
    const isConfirmed = await modal.confirm(
      'Egzersizi Plandan Sil',
      `"${exerciseName}" egzersizini bu plandan silmek istediğinizden emin misiniz?`
    );
    
    if (isConfirmed) {
      try {
        await window.electronAPI.deletePlanExercise(exerciseId);
        
        // Plan egzersizlerini yeniden yükle
        loadPlanExercises(selectedPlan.id);
        
        alert.success(`"${exerciseName}" egzersizi plandan başarıyla silindi!`);
      } catch (error) {
        console.error('Plan egzersizi silinirken hata:', error);
        alert.error('Plan egzersizi silinirken bir hata oluştu!');
      }
    }
  };

  const handleCompleteWorkout = async (plan) => {
    const isConfirmed = await modal.confirm(
      'Antrenmanı Tamamla',
      `${plan.title} antrenmanını tamamlandı olarak işaretlemek istediğinizden emin misiniz?`
    );
    
    if (isConfirmed) {
      try {
        const sessionData = {
          workout_plan_id: plan.id,
          member_id: plan.member_id,
          completed_at: new Date().toISOString(),
          duration: plan.duration || 60,
          notes: '',
          rating: 5
        };
        await window.electronAPI.completeWorkout(sessionData);
        loadData();
        alert.success('Antrenman tamamlandı olarak işaretlendi!');
      } catch (error) {
        console.error('Antrenman tamamlanırken hata:', error);
        alert.error('Antrenman tamamlanırken bir hata oluştu!');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: '',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Genel',
      duration: 60,
      difficulty: 'Orta',
      status: 'Planlandi',
      template_id: null
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Genel': '#6b7280',
      'Güç': '#dc2626',
      'Kardiyo': '#ea580c',
      'Esneklik': '#16a34a',
      'Fonksiyonel': '#2563eb',
      'Rehabilitasyon': '#7c3aed'
    };
    return colors[category] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planlandi': '#3b82f6',
      'Devam Ediyor': '#f59e0b',
      'Tamamlandi': '#10b981',
      'İptal Edildi': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getDifficultyIcon = (difficulty) => {
    const count = { 'Kolay': 1, 'Orta': 2, 'Zor': 3, 'Uzman': 4 }[difficulty] || 2;
    return Array(count).fill(0).map((_, i) => (
      <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
    ));
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

  const exportAllWorkoutPlansPDF = () => {
    try {
      const doc = new jsPDF();
      setupPDFFont(doc);
      
      // Colors matching our app theme
      const orangeColor = [255, 107, 0]; // #ff6b00
      const darkColor = [30, 30, 30]; // #1e1e1e
      const lightGray = [240, 240, 240]; // #f0f0f0
      
      // Header Background
      doc.setFillColor(...orangeColor);
      doc.rect(0, 0, 210, 50, 'F');
      
      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('GymDesk', 20, 25);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Antrenman Planlari Listesi', 20, 35);
      
      // Date and stats in header
      doc.setFontSize(10);
      doc.text(`Rapor: ${new Date().toLocaleDateString('tr-TR')}`, 140, 25);
      doc.text(`Toplam Plan: ${filteredPlans.length}`, 140, 35);
      
      let yPos = 65;
      
      // Section Header
      doc.setFillColor(...orangeColor);
      doc.rect(15, yPos - 8, 180, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ANTRENMAN PLANLARI', 20, yPos - 1);
      yPos += 15;
      
      // Table headers
      doc.setFillColor(...lightGray);
      doc.rect(15, yPos - 5, 180, 10, 'F');
      doc.setTextColor(...darkColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Uye', 20, yPos + 2);
      doc.text('Plan', 50, yPos + 2);
      doc.text('Kategori', 90, yPos + 2);
      doc.text('Zorluk', 120, yPos + 2);
      doc.text('Sure', 140, yPos + 2);
      doc.text('Durum', 160, yPos + 2);
      yPos += 12;
      
      // Plans data
      filteredPlans.forEach((plan, index) => {
        if (yPos > 270) {
          doc.addPage();
          setupPDFFont(doc);
          
          // Add header on new page
          doc.setFillColor(...orangeColor);
          doc.rect(0, 0, 210, 30, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('GymDesk - Antrenman Planlari (devam)', 20, 20);
          
          yPos = 45;
          
          // Headers again
          doc.setFillColor(...lightGray);
          doc.rect(15, yPos - 5, 180, 10, 'F');
          doc.setTextColor(...darkColor);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Uye', 20, yPos + 2);
          doc.text('Plan', 50, yPos + 2);
          doc.text('Kategori', 90, yPos + 2);
          doc.text('Zorluk', 120, yPos + 2);
          doc.text('Sure', 140, yPos + 2);
          doc.text('Durum', 160, yPos + 2);
          yPos += 12;
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(15, yPos - 3, 180, 8, 'F');
        }
        
        // Plan data
        doc.setTextColor(...darkColor);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        const memberName = plan.name && plan.surname 
          ? `${safePDFText(plan.name)} ${safePDFText(plan.surname)}`
          : 'Bilinmeyen';
        doc.text(memberName, 20, yPos);
        doc.text(safePDFText(plan.title, 20), 50, yPos);
        doc.text(safePDFText(plan.category), 90, yPos);
        doc.text(safePDFText(plan.difficulty), 120, yPos);
        doc.text(`${plan.duration} dk`, 140, yPos);
        doc.text(safePDFText(plan.status), 160, yPos);
        
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
        const completedPlans = filteredPlans.filter(p => p.status === 'Tamamlandi').length;
        const activePlans = filteredPlans.filter(p => p.status === 'Devam Ediyor').length;
        const plannedPlans = filteredPlans.filter(p => p.status === 'Planlandi').length;
        
        doc.setTextColor(...darkColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.setTextColor(...orangeColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Tamamlanan:', 20, yPos);
        doc.setTextColor(22, 163, 74);
        doc.text(`${completedPlans}`, 65, yPos);
        
        doc.setTextColor(...orangeColor);
        doc.text('Devam Eden:', 100, yPos);
        doc.setTextColor(217, 119, 6);
        doc.text(`${activePlans}`, 140, yPos);
        
        yPos += 8;
        doc.setTextColor(...orangeColor);
        doc.text('Planlanan:', 20, yPos);
        doc.setTextColor(59, 130, 246);
        doc.text(`${plannedPlans}`, 65, yPos);
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
      const fileName = `GymDesk_Antrenman_Planlari_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Success notification
      alert.success('PDF başarıyla indirildi!', 'Antrenman Planları');
      
    } catch (error) {
      console.error('PDF oluşturulurken hata:', error);
      alert.error('PDF oluşturulurken bir hata oluştu!');
    }
  };

  const exportSingleWorkoutPlanPDF = async (plan) => {
    try {
      const doc = new jsPDF();
      setupPDFFont(doc);
      
      // Colors matching our app theme
      const orangeColor = [255, 107, 0];
      const darkColor = [30, 30, 30];
      const lightGray = [200, 200, 200];
      const darkGray = [100, 100, 100];
      
      // Header Background
      doc.setFillColor(...orangeColor);
      doc.rect(0, 0, 210, 45, 'F');
      
      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('GymDesk', 20, 25);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Antrenman Plani Raporu', 20, 35);
      
      // Date in header
      doc.setFontSize(10);
      doc.text(`Rapor: ${new Date().toLocaleDateString('tr-TR')}`, 140, 25);
      
      // Reset text color for body
      doc.setTextColor(...darkColor);
      
      // Plan Info Section
      let yPos = 60;
      
      // Section Header with Orange Accent
      doc.setFillColor(...orangeColor);
      doc.rect(15, yPos - 8, 180, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PLAN BILGILERI', 20, yPos - 1);
      
      yPos += 15;
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'normal');
      
      // Plan Details
      const planInfo = [
        ['Plan Adi:', safePDFText(plan.title)],
        ['Uye:', plan.name && plan.surname ? `${safePDFText(plan.name)} ${safePDFText(plan.surname)}` : 'Bilinmeyen'],
        ['Kategori:', safePDFText(plan.category)],
        ['Zorluk:', safePDFText(plan.difficulty)],
        ['Sure:', `${plan.duration} dakika`],
        ['Durum:', safePDFText(plan.status)],
        ['Plan Tarihi:', formatDate(plan.date)],
        ['Sablon:', plan.template_name ? safePDFText(plan.template_name) : 'Ozel Plan']
      ];
      
      doc.setFontSize(11);
      planInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...orangeColor);
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkColor);
        doc.text(value, 75, yPos);
        yPos += 10;
      });
      
      yPos += 10;

      // Get plan exercises
      const exercises = await window.electronAPI.getPlanExercises(plan.id);

      // Exercises Section
      if (exercises.length > 0) {
        // Section Header
        doc.setFillColor(...orangeColor);
        doc.rect(15, yPos - 8, 180, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('EGZERSIZLER', 20, yPos - 1);
        
        yPos += 15;
        
        // Exercise Headers
        doc.setFillColor(...lightGray);
        doc.rect(15, yPos - 5, 180, 8, 'F');
        doc.setTextColor(...darkColor);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Egzersiz', 20, yPos);
        doc.text('Kas Grubu', 70, yPos);
        doc.text('Set', 110, yPos);
        doc.text('Tekrar', 130, yPos);
        doc.text('Agirlik', 150, yPos);
        doc.text('Dinlenme', 170, yPos);
        yPos += 10;
        
        // Exercise rows
        doc.setFont('helvetica', 'normal');
        exercises.forEach((exercise, index) => {
          if (yPos > 260) {
            doc.addPage();
            setupPDFFont(doc);
            yPos = 30;
          }
          
          if (index % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(15, yPos - 3, 180, 8, 'F');
          }
          
          doc.setTextColor(...darkColor);
          doc.setFontSize(8);
          doc.text(safePDFText(exercise.name, 25), 20, yPos);
          doc.text(safePDFText(exercise.muscle_group, 15), 70, yPos);
          doc.text(`${exercise.sets}`, 110, yPos);
          doc.text(`${exercise.reps}`, 130, yPos);
          doc.text(`${exercise.weight} kg`, 150, yPos);
          doc.text(`${exercise.rest_seconds}s`, 170, yPos);
          yPos += 8;
        });
        
        yPos += 10;
      }
      
      // Description section
      if (plan.description && yPos < 250) {
        doc.setFillColor(...orangeColor);
        doc.rect(15, yPos - 8, 180, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ACIKLAMA', 20, yPos - 1);
        
        yPos += 15;
        doc.setTextColor(...darkColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Split long description into lines
        const descLines = doc.splitTextToSize(safePDFText(plan.description, 200), 170);
        descLines.forEach(line => {
          if (yPos > 270) return;
          doc.text(line, 20, yPos);
          yPos += 6;
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
      const memberName = plan.name && plan.surname 
        ? `${safePDFText(plan.name)}_${safePDFText(plan.surname)}`
        : 'Bilinmeyen_Uye';
      const fileName = `${memberName}_${safePDFText(plan.title)}_Plan.pdf`;
      doc.save(fileName);
      
      // Success notification
      alert.success(`${plan.title} planı PDF olarak indirildi!`, 'Plan İndirildi');
      
    } catch (error) {
      console.error('PDF oluşturulurken hata:', error);
      alert.error('PDF oluşturulurken bir hata oluştu!');
    }
  };

  const filteredPlans = workoutPlans.filter(plan => {
    const matchesSearch = `${plan.name} ${plan.surname} ${plan.title} ${plan.description}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || plan.category === filterCategory;
    const matchesStatus = !filterStatus || plan.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination hesaplamaları
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlans = filteredPlans.slice(startIndex, endIndex);

  // Sayfa değiştiğinde yumuşak scroll
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Tablo kartını viewport'a getir
    setTimeout(() => {
      const tableElement = document.getElementById('workout-plans-table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Filtre değiştiğinde sayfa 1'e dön
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus, itemsPerPage]);

  // İstatistikler - TÜM verileri kullan, sadece sayfalanmış veriyi değil
  const stats = {
    total: workoutPlans.length,
    completed: workoutPlans.filter(p => p.status === 'Tamamlandı').length,
    active: workoutPlans.filter(p => p.status === 'Devam Ediyor').length,
    members: new Set(workoutPlans.map(p => p.member_id)).size
  };

  if (loading) {
    return (
      <div className="loading">
        <Dumbbell size={24} />
        <span>Antrenman planları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dumbbell size={24} />
            Antrenman Planları Yönetimi
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-success"
              onClick={exportAllWorkoutPlansPDF}
              disabled={filteredPlans.length === 0}
            >
              <FileText size={20} />
              Tüm Planları PDF'e Aktar
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={20} />
              Yeni Plan Oluştur
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowTemplateModal(true)}
            >
              <Target size={20} />
              Şablon Oluştur
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowExerciseModal(true)}
            >
              <Dumbbell size={20} />
              Egzersiz Ekle
            </button>
          </div>
        </div>

        {/* Bilgilendirme Kartı */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, rgba(255, 107, 0, 0.05) 100%)',
          border: '1px solid rgba(255, 107, 0, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#ff6b00', margin: '0 0 12px 0', fontSize: '16px' }}>
            📚 Nasıl Çalışır?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', fontSize: '14px' }}>
            <div>
              <strong style={{ color: '#ffffff' }}>1. Egzersiz Ekle</strong>
              <p style={{ color: '#9ca3af', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                Önce sisteme yeni egzersizler ekleyin (Bench Press, Squat, vb.)
              </p>
            </div>
            <div>
              <strong style={{ color: '#ffffff' }}>2. Şablon Oluştur</strong>
              <p style={{ color: '#9ca3af', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                Egzersizleri gruplandırarak şablonlar oluşturun
              </p>
            </div>
            <div>
              <strong style={{ color: '#ffffff' }}>3. Plan Oluştur</strong>
              <p style={{ color: '#9ca3af', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                Şablon seçerek veya manuel olarak üyelere plan atayın
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Genel İstatistikler
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 107, 0, 0.2)' }}>
              <Calendar size={24} color="#ff6b00" />
            </div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Toplam Plan</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle size={24} color="#10b981" />
            </div>
            <div className="stat-content">
              <h3>{stats.completed}</h3>
              <p>Tamamlanan</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
              <Timer size={24} color="#f59e0b" />
            </div>
            <div className="stat-content">
              <h3>{stats.active}</h3>
              <p>Aktif Plan</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}>
              <User size={24} color="#6366f1" />
            </div>
            <div className="stat-content">
              <h3>{stats.members}</h3>
              <p>Planı Olan Üye</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card" id="workout-plans-table">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            📋 Mevcut Antrenman Planları ({filteredPlans.length})
          </h3>
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
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#6b7280' 
            }} />
            <input
              type="text"
              placeholder="Plan ara (üye adı, plan başlığı, açıklama)"
              className="search-input"
              style={{ paddingLeft: '44px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="form-input"
            style={{ minWidth: '150px' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ minWidth: '150px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tüm Durumlar</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Plans Table */}
        {currentPlans.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ minWidth: '140px' }}>Üye</th>
                  <th style={{ minWidth: '200px' }}>Plan Başlığı</th>
                  <th style={{ minWidth: '100px' }}>Kategori</th>
                  <th style={{ minWidth: '80px' }}>Zorluk</th>
                  <th style={{ minWidth: '70px' }}>Süre</th>
                  <th style={{ minWidth: '100px' }}>Durum</th>
                  <th style={{ minWidth: '100px' }}>Plan Tarihi</th>
                  <th style={{ minWidth: '160px' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {currentPlans.map(plan => (
                  <tr key={plan.id}>
                    <td style={{ fontWeight: '500', minWidth: '140px' }}>
                      {plan.name && plan.surname 
                        ? `${plan.name} ${plan.surname}`
                        : 'Bilinmeyen Üye'
                      }
                    </td>
                    <td style={{ minWidth: '200px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#ff6b00', marginBottom: '4px' }}>
                          {plan.title}
                        </div>
                        {plan.template_name && (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            📋 {plan.template_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ minWidth: '100px' }}>
                      <span style={{ 
                        backgroundColor: getCategoryColor(plan.category) + '20',
                        color: getCategoryColor(plan.category),
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {plan.category}
                      </span>
                    </td>
                    <td style={{ minWidth: '80px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {getDifficultyIcon(plan.difficulty)}
                      </div>
                    </td>
                    <td style={{ minWidth: '70px' }}>{plan.duration} dk</td>
                    <td style={{ minWidth: '100px' }}>
                      <span style={{ 
                        backgroundColor: getStatusColor(plan.status) + '20',
                        color: getStatusColor(plan.status),
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {plan.status}
                      </span>
                    </td>
                    <td style={{ minWidth: '100px' }}>{formatDate(plan.date)}</td>
                    <td style={{ minWidth: '160px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 8px' }}
                          onClick={() => exportSingleWorkoutPlanPDF(plan)}
                          title="PDF İndir"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 8px' }}
                          onClick={() => {
                            setSelectedPlan(plan);
                            loadPlanExercises(plan.id);
                            setShowDetailModal(true);
                          }}
                          title="Detayları Gör"
                        >
                          <Eye size={14} />
                        </button>
                        {plan.status === 'Planlandi' && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '6px 8px' }}
                            onClick={() => handleCompleteWorkout(plan)}
                            title="Tamamlandı Olarak İşaretle"
                          >
                            <Play size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <Dumbbell size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>
              {searchTerm || filterCategory || filterStatus 
                ? 'Arama kriterinize uygun plan bulunamadı' 
                : 'Henüz antrenman planı yok'
              }
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredPlans.length > 0 && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ color: '#c4c4c4', fontSize: '14px' }}>
              {startIndex + 1}-{Math.min(endIndex, filteredPlans.length)} / {filteredPlans.length} plan gösteriliyor
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

      {/* Templates Section */}
      {templates.length > 0 && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} />
            Antrenman Şablonları ({templates.length})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {templates.map(template => (
              <div key={template.id} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 107, 0, 0.3)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{ color: '#ff6b00', fontWeight: '600', margin: 0 }}>{template.name}</h4>
                  <span style={{ 
                    backgroundColor: getCategoryColor(template.category) + '20',
                    color: getCategoryColor(template.category),
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}>
                    {template.category}
                  </span>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>
                  {template.description || 'Açıklama yok'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                      ⏱️ {template.duration} dk
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                      🏋️ {template.exercise_count || 0} egzersiz
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => {
                        setSelectedTemplate(template);
                        loadTemplateExercises(template.id);
                        setShowTemplateDetailModal(true);
                      }}
                      title="Şablon detaylarını görüntüle"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '11px',
                        backgroundColor: '#ef4444',
                        borderColor: '#ef4444',
                        minWidth: 'auto'
                      }}
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      title="Şablonu sil"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getDifficultyIcon(template.difficulty)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercises Section */}
      <div className="card" style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dumbbell size={20} />
            Mevcut Egzersizler ({exercises.length})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {exercises.map(exercise => (
              <div key={exercise.id} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{ color: '#6366f1', fontWeight: '600', margin: 0 }}>{exercise.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      backgroundColor: '#6366f1' + '20',
                      color: '#6366f1',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: '500'
                    }}>
                      {exercise.muscle_group}
                    </span>
                    <button
                      className="btn btn-danger"
                      style={{ 
                        padding: '2px 6px', 
                        fontSize: '10px',
                        backgroundColor: '#ef4444',
                        borderColor: '#ef4444',
                        minWidth: 'auto',
                        opacity: 0.8
                      }}
                      onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
                      title="Egzersizi sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    🏋️ {exercise.equipment}
                  </span>
                </div>
                
                {exercise.instructions && (
                  <p style={{ 
                    color: '#9ca3af', 
                    fontSize: '12px', 
                    marginBottom: '0',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {exercise.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {exercises.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <Dumbbell size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Henüz egzersiz yok</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                "Egzersiz Ekle" butonuna tıklayarak yeni egzersizler ekleyebilirsiniz
              </p>
            </div>
                     )}
        </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yeni Antrenman Planı</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddPlan}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎯 Antrenman Şablonu (Opsiyonel)
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'normal' }}>
                      Şablon seçilirse egzersizler otomatik eklenir
                    </span>
                  </label>
                  <select
                    className="form-input"
                    value={formData.template_id || ''}
                    onChange={(e) => setFormData({...formData, template_id: e.target.value || null})}
                    style={{ 
                      background: formData.template_id ? 'rgba(255, 107, 0, 0.1)' : undefined,
                      borderColor: formData.template_id ? '#ff6b00' : undefined
                    }}
                  >
                    <option value="">⚡ Şablon seçiniz (önerilen)</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        📋 {template.name} ({template.category} - {template.difficulty})
                      </option>
                    ))}
                  </select>
                  {formData.template_id && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px 12px', 
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#10b981'
                    }}>
                      ✅ Şablon seçildi! Plan oluşturulduğunda egzersizler otomatik kopyalanacak.
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Plan Başlığı *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Örn: Göğüs ve Kol Antrenmanı"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Plan Açıklaması</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Antrenman detaylarını buraya yazın..."
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Zorluk</label>
                  <select
                    className="form-input"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  >
                    {difficulties.map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Süre (dakika)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    min="15"
                    max="180"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Plan Tarihi</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
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
                  Plan Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yeni Antrenman Şablonu</h2>
              <button 
                className="close-btn"
                onClick={() => setShowTemplateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddTemplate}>
              <div className="form-group">
                <label className="form-label">Şablon Adı *</label>
                <input
                  type="text"
                  className="form-input"
                  value={templateData.name}
                  onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                  placeholder="Örn: Üst Vücut Güç Antrenmanı"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={templateData.description}
                  onChange={(e) => setTemplateData({...templateData, description: e.target.value})}
                  placeholder="Şablon hakkında bilgi..."
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-input"
                    value={templateData.category}
                    onChange={(e) => setTemplateData({...templateData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Zorluk</label>
                  <select
                    className="form-input"
                    value={templateData.difficulty}
                    onChange={(e) => setTemplateData({...templateData, difficulty: e.target.value})}
                  >
                    {difficulties.map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Süre (dakika)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={templateData.duration}
                    onChange={(e) => setTemplateData({...templateData, duration: parseInt(e.target.value)})}
                    min="15"
                    max="180"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTemplateModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Target size={20} />
                  Şablon Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {showExerciseModal && (
        <div className="modal-overlay" onClick={() => setShowExerciseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yeni Egzersiz Ekle</h2>
              <button 
                className="close-btn"
                onClick={() => setShowExerciseModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddExercise}>
              <div className="form-group">
                <label className="form-label">Egzersiz Adı *</label>
                <input
                  type="text"
                  className="form-input"
                  value={exerciseData.name}
                  onChange={(e) => setExerciseData({...exerciseData, name: e.target.value})}
                  placeholder="Örn: Bench Press"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Kas Grubu</label>
                  <select
                    className="form-input"
                    value={exerciseData.muscle_group}
                    onChange={(e) => setExerciseData({...exerciseData, muscle_group: e.target.value})}
                  >
                    {muscleGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ekipman</label>
                  <select
                    className="form-input"
                    value={exerciseData.equipment}
                    onChange={(e) => setExerciseData({...exerciseData, equipment: e.target.value})}
                  >
                    {equipments.map(eq => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Talimatlar</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={exerciseData.instructions}
                  onChange={(e) => setExerciseData({...exerciseData, instructions: e.target.value})}
                  placeholder="Egzersizin nasıl yapılacağını açıklayın..."
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowExerciseModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Dumbbell size={20} />
                  Egzersiz Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Detail Modal */}
      {showDetailModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📋 {selectedPlan.title}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              {/* Plan Bilgileri */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Üye:</strong> 
                    <span style={{ marginLeft: '8px', color: '#ffffff' }}>
                      {selectedPlan.name} {selectedPlan.surname}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Kategori:</strong> 
                    <span style={{ 
                      marginLeft: '8px',
                      backgroundColor: getCategoryColor(selectedPlan.category) + '20',
                      color: getCategoryColor(selectedPlan.category),
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      {selectedPlan.category}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Süre:</strong> 
                    <span style={{ marginLeft: '8px', color: '#ffffff' }}>
                      {selectedPlan.duration} dakika
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Zorluk:</strong> 
                    <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {getDifficultyIcon(selectedPlan.difficulty)}
                    </span>
                  </div>
                </div>
                
                {selectedPlan.description && (
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Açıklama:</strong>
                    <p style={{ marginTop: '8px', color: '#9ca3af', lineHeight: '1.5' }}>
                      {selectedPlan.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Plan Egzersizleri */}
              <div>
                <h3 style={{ color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Dumbbell size={20} />
                  Egzersizler ({planExercises.length})
                </h3>
                
                {planExercises.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {planExercises.map((exercise, index) => (
                      <div key={exercise.id} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 107, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ color: '#ff6b00', margin: '0 0 8px 0' }}>
                              {index + 1}. {exercise.name}
                            </h4>
                            <div style={{ display: 'flex', gap: '16px', color: '#9ca3af', fontSize: '14px' }}>
                              <span>💪 {exercise.muscle_group}</span>
                              <span>🏋️ {exercise.equipment}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right', color: '#ffffff' }}>
                              <div>{exercise.sets} set × {exercise.reps} tekrar</div>
                              {exercise.weight > 0 && (
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{exercise.weight} kg</div>
                              )}
                              {exercise.rest_seconds > 0 && (
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                  ⏱️ {exercise.rest_seconds}s dinlenme
                                </div>
                              )}
                            </div>
                            <button
                              className="btn btn-danger"
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '12px',
                                backgroundColor: '#ef4444',
                                borderColor: '#ef4444',
                                minWidth: 'auto'
                              }}
                              onClick={() => handleDeletePlanExercise(exercise.id, exercise.name)}
                              title="Egzersizi plandan sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {exercise.notes && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                            💬 {exercise.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <Dumbbell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>Bu plana henüz egzersiz eklenmemiş</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Kapat
              </button>
              {selectedPlan.status === 'Planlandi' && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCompleteWorkout(selectedPlan);
                  }}
                >
                  <CheckCircle size={20} />
                  Tamamlandı İşaretle
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Detail Modal */}
      {showTemplateDetailModal && selectedTemplate && (
        <div className="modal-overlay" onClick={() => setShowTemplateDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🎯 {selectedTemplate.name} - Şablon Detayı</h2>
              <button 
                className="close-btn"
                onClick={() => setShowTemplateDetailModal(false)}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              {/* Şablon Bilgileri */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Kategori:</strong> 
                    <span style={{ 
                      marginLeft: '8px',
                      backgroundColor: getCategoryColor(selectedTemplate.category) + '20',
                      color: getCategoryColor(selectedTemplate.category),
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      {selectedTemplate.category}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Süre:</strong> 
                    <span style={{ marginLeft: '8px', color: '#ffffff' }}>
                      {selectedTemplate.duration} dakika
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Zorluk:</strong> 
                    <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {getDifficultyIcon(selectedTemplate.difficulty)}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Egzersiz Sayısı:</strong> 
                    <span style={{ marginLeft: '8px', color: '#ffffff' }}>
                      {templateExercises.length}
                    </span>
                  </div>
                </div>
                
                {selectedTemplate.description && (
                  <div>
                    <strong style={{ color: '#ff6b00' }}>Açıklama:</strong>
                    <p style={{ marginTop: '8px', color: '#9ca3af', lineHeight: '1.5' }}>
                      {selectedTemplate.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Şablon Egzersizleri */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Dumbbell size={20} />
                    Şablon Egzersizleri ({templateExercises.length})
                  </h3>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                    onClick={() => setShowAddTemplateExerciseModal(true)}
                  >
                    <Plus size={16} />
                    Egzersiz Ekle
                  </button>
                </div>
                
                {templateExercises.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {templateExercises.map((exercise, index) => (
                      <div key={exercise.id} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 107, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ color: '#ff6b00', margin: '0 0 8px 0' }}>
                              {index + 1}. {exercise.name}
                            </h4>
                            <div style={{ display: 'flex', gap: '16px', color: '#9ca3af', fontSize: '14px' }}>
                              <span>💪 {exercise.muscle_group}</span>
                              <span>🏋️ {exercise.equipment}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right', color: '#ffffff' }}>
                              <div>{exercise.sets} set × {exercise.reps} tekrar</div>
                              {exercise.weight > 0 && (
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{exercise.weight} kg</div>
                              )}
                              {exercise.rest_seconds > 0 && (
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                  ⏱️ {exercise.rest_seconds}s dinlenme
                                </div>
                              )}
                            </div>
                            <button
                              className="btn btn-danger"
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '12px',
                                backgroundColor: '#ef4444',
                                borderColor: '#ef4444',
                                minWidth: 'auto'
                              }}
                              onClick={() => handleDeleteTemplateExercise(exercise.id, exercise.name)}
                              title="Egzersizi şablondan sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {exercise.notes && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                            💬 {exercise.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <Dumbbell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>Bu şablona henüz egzersiz eklenmemiş</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      Şablonu kullanarak plan oluşturduğunuzda egzersizler otomatik kopyalanacak
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowTemplateDetailModal(false)}
              >
                Kapat
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  setShowTemplateDetailModal(false);
                  setFormData({...formData, template_id: selectedTemplate.id});
                  setShowAddModal(true);
                }}
              >
                <Plus size={20} />
                Bu Şablonla Plan Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Template Exercise Modal */}
      {showAddTemplateExerciseModal && selectedTemplate && (
        <div className="modal-overlay" onClick={() => setShowAddTemplateExerciseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🏋️ Şablona Egzersiz Ekle - {selectedTemplate.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddTemplateExerciseModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddTemplateExercise}>
              <div className="form-group">
                <label className="form-label">Egzersiz Seçin *</label>
                <select
                  className="form-input"
                  value={templateExerciseData.exercise_id}
                  onChange={(e) => setTemplateExerciseData({...templateExerciseData, exercise_id: e.target.value})}
                  required
                >
                  <option value="">Egzersiz seçiniz...</option>
                  {exercises.map(exercise => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name} ({exercise.muscle_group} - {exercise.equipment})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Set Sayısı</label>
                  <input
                    type="number"
                    className="form-input"
                    value={templateExerciseData.sets}
                    onChange={(e) => setTemplateExerciseData({...templateExerciseData, sets: parseInt(e.target.value)})}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tekrar Sayısı</label>
                  <input
                    type="number"
                    className="form-input"
                    value={templateExerciseData.reps}
                    onChange={(e) => setTemplateExerciseData({...templateExerciseData, reps: parseInt(e.target.value)})}
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ağırlık (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={templateExerciseData.weight}
                    onChange={(e) => setTemplateExerciseData({...templateExerciseData, weight: parseFloat(e.target.value)})}
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dinlenme (saniye)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={templateExerciseData.rest_seconds}
                    onChange={(e) => setTemplateExerciseData({...templateExerciseData, rest_seconds: parseInt(e.target.value)})}
                    min="0"
                    step="15"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notlar</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={templateExerciseData.notes}
                  onChange={(e) => setTemplateExerciseData({...templateExerciseData, notes: e.target.value})}
                  placeholder="Egzersiz ile ilgili özel notlar..."
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddTemplateExerciseModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={20} />
                  Şablona Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutPlans; 