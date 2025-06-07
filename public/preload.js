const { contextBridge, ipcRenderer } = require('electron');

// React uygulaması için API'leri güvenli şekilde sağla
contextBridge.exposeInMainWorld('electronAPI', {
  // Üye işlemleri
  getMembers: () => ipcRenderer.invoke('get-members'),
  addMember: (member) => ipcRenderer.invoke('add-member', member),
  updateMember: (id, member) => ipcRenderer.invoke('update-member', id, member),
  deleteMember: (id) => ipcRenderer.invoke('delete-member', id),
  
  // Ödeme işlemleri
  getPayments: () => ipcRenderer.invoke('get-payments'),
  addPayment: (payment) => ipcRenderer.invoke('add-payment', payment),
  
  // Antrenman planı işlemleri
  getWorkoutPlans: (memberId) => ipcRenderer.invoke('get-workout-plans', memberId),
  addWorkoutPlan: (plan) => ipcRenderer.invoke('add-workout-plan', plan),
  
  // Şablon işlemleri
  getWorkoutTemplates: () => ipcRenderer.invoke('get-workout-templates'),
  addWorkoutTemplate: (template) => ipcRenderer.invoke('add-workout-template', template),
  deleteWorkoutTemplate: (templateId) => ipcRenderer.invoke('delete-workout-template', templateId),
  getTemplateExercises: (templateId) => ipcRenderer.invoke('get-template-exercises', templateId),
  addTemplateExercise: (templateExercise) => ipcRenderer.invoke('add-template-exercise', templateExercise),
  deleteTemplateExercise: (exerciseId) => ipcRenderer.invoke('delete-template-exercise', exerciseId),
  
  // Egzersiz işlemleri
  getExercises: () => ipcRenderer.invoke('get-exercises'),
  addExercise: (exercise) => ipcRenderer.invoke('add-exercise', exercise),
  deleteExercise: (exerciseId) => ipcRenderer.invoke('delete-exercise', exerciseId),
  
  // Plan egzersizleri
  getPlanExercises: (planId) => ipcRenderer.invoke('get-plan-exercises', planId),
  addPlanExercise: (planExercise) => ipcRenderer.invoke('add-plan-exercise', planExercise),
  deletePlanExercise: (exerciseId) => ipcRenderer.invoke('delete-plan-exercise', exerciseId),
  
  // Progress tracking
  completeWorkout: (sessionData) => ipcRenderer.invoke('complete-workout', sessionData),
  getWorkoutProgress: (memberId) => ipcRenderer.invoke('get-workout-progress', memberId),
  getMemberStats: (memberId) => ipcRenderer.invoke('get-member-stats', memberId),
  getGymAnalytics: () => ipcRenderer.invoke('get-gym-analytics'),
  
  // Hedef sistemi
  addMemberGoal: (goal) => ipcRenderer.invoke('add-member-goal', goal),
  getMemberGoals: (memberId) => ipcRenderer.invoke('get-member-goals', memberId),
  updateGoalProgress: (goalId, currentValue) => ipcRenderer.invoke('update-goal-progress', goalId, currentValue),
  
  // Vücut ölçüleri
  addBodyMeasurement: (measurement) => ipcRenderer.invoke('add-body-measurement', measurement),
  getBodyMeasurements: (memberId) => ipcRenderer.invoke('get-body-measurements', memberId),
  getAllBodyMeasurements: () => ipcRenderer.invoke('get-all-body-measurements'),
  updateBodyMeasurement: (id, measurement) => ipcRenderer.invoke('update-body-measurement', id, measurement),
  deleteBodyMeasurement: (id) => ipcRenderer.invoke('delete-body-measurement', id),
  getMemberMeasurementHistory: (memberId) => ipcRenderer.invoke('get-member-measurement-history', memberId),
  
  // Sistem bilgileri
  platform: process.platform,
  version: process.versions.electron,
  
  // Splash screen
  splashFinished: () => ipcRenderer.invoke('splash-finished')
}); 