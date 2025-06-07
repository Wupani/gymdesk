import React, { useState, useEffect, createContext, useContext } from 'react';
import { Dumbbell, Users, CreditCard, Calendar, Plus, Search, BarChart3, TrendingUp, Ruler } from 'lucide-react';
import Dashboard from './screens/Dashboard';
import Members from './screens/Members';
import Payments from './screens/Payments';
import WorkoutPlans from './screens/WorkoutPlans';
import Progress from './screens/Progress';
import Reports from './screens/Reports';
import BodyMeasurements from './screens/BodyMeasurements';
import Alert from './components/Alert';
import Modal from './components/Modal';

// Alert Context
const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Modal Context
const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null);

  const showModal = (options) => {
    setModal(options);
  };

  const hideModal = () => {
    setModal(null);
  };

  const confirm = (title, message, onConfirm) => {
    return new Promise((resolve) => {
      showModal({
        title,
        message,
        type: 'warning',
        onConfirm: () => {
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onClose: () => {
          resolve(false);
        }
      });
    });
  };

  const alert = (title, message, type = 'info') => {
    return new Promise((resolve) => {
      showModal({
        title,
        message,
        type,
        showCancel: false,
        confirmText: 'Tamam',
        onConfirm: () => {
          resolve(true);
        },
        onClose: () => {
          resolve(true);
        }
      });
    });
  };

  const promptPassword = (title = 'Şifre Girin', message = 'Devam etmek için şifre girin:') => {
    return new Promise((resolve) => {
      showModal({
        title,
        message,
        type: 'password',
        onConfirm: (password) => {
          resolve(password);
        },
        onClose: () => {
          resolve(null);
        }
      });
    });
  };

  return (
    <ModalContext.Provider value={{ confirm, alert, promptPassword, showModal, hideModal }}>
      {children}
      {modal && (
        <Modal
          isOpen={true}
          title={modal.title}
          message={modal.message}
          type={modal.type || 'confirm'}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          showCancel={modal.showCancel}
          onConfirm={modal.onConfirm}
          onClose={() => {
            if (modal.onClose) modal.onClose();
            hideModal();
          }}
        />
      )}
    </ModalContext.Provider>
  );
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (type, title, message, autoClose = true) => {
    const id = Date.now() + Math.random();
    const newAlert = { id, type, title, message, autoClose };
    setAlerts(prev => [...prev, newAlert]);
    return id;
  };

  const hideAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const success = (message, title = 'Başarılı', autoClose = true) => {
    return showAlert('success', title, message, autoClose);
  };

  const error = (message, title = 'Hata', autoClose = true) => {
    return showAlert('error', title, message, autoClose);
  };

  const warning = (message, title = 'Uyarı', autoClose = true) => {
    return showAlert('warning', title, message, autoClose);
  };

  const info = (message, title = 'Bilgi', autoClose = true) => {
    return showAlert('info', title, message, autoClose);
  };

  return (
    <AlertContext.Provider value={{ success, error, warning, info, hideAlert }}>
      {children}
      {/* Render alerts */}
      {alerts.map((alert, index) => (
        <div key={alert.id} style={{ top: `${20 + (index * 80)}px` }}>
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => hideAlert(alert.id)}
            autoClose={alert.autoClose}
          />
        </div>
      ))}
    </AlertContext.Provider>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Electron ortamında mı kontrol et
    setIsElectron(typeof window !== 'undefined' && window.electronAPI !== undefined);
  }, []);

  const navigationItems = [
    { id: 'dashboard', label: 'Anasayfa', icon: Dumbbell },
    { id: 'members', label: 'Üyeler', icon: Users },
    { id: 'payments', label: 'Ödemeler', icon: CreditCard },
    { id: 'workouts', label: 'Antrenman Planları', icon: Calendar },
    { id: 'body-measurements', label: 'Vücut Ölçüleri', icon: Ruler },
    { id: 'progress', label: 'Progress & Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Mali Raporlar', icon: TrendingUp },
  ];

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <Members />;
      case 'payments':
        return <Payments />;
      case 'workouts':
        return <WorkoutPlans />;
      case 'body-measurements':
        return <BodyMeasurements />;
      case 'progress':
        return <Progress />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  if (!isElectron) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        textAlign: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <Dumbbell size={64} color="#3b82f6" />
        <div>
          <h1>GymDesk</h1>
          <p>Bu uygulamanın Electron masaüstü uygulaması olarak çalışması gerekmektedir.</p>
          <p>Lütfen <code>npm start</code> komutu ile başlatın.</p>
        </div>
      </div>
    );
  }

  return (
    <ModalProvider>
      <AlertProvider>
        <div className="app">
          {/* Navigation Bar */}
          <nav className="navbar">
            <div 
              className="navbar-brand" 
              onClick={() => setActiveTab('dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <Dumbbell size={24} color="#3b82f6" />
              <span>GymDesk</span>
            </div>
            <ul className="navbar-nav">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id)}
                      style={{ background: 'none', border: 'none' }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Main Content */}
          <main className="main-content">
            {renderActiveScreen()}
          </main>
        </div>
      </AlertProvider>
    </ModalProvider>
  );
}

export default App; 