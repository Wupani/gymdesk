import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

function Alert({ type = 'info', title, message, onClose, autoClose = true }) {
  // Auto close after 4 seconds
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.95)',
          borderColor: '#10b981',
          textColor: '#ffffff',
          iconColor: '#ffffff'
        };
      case 'error':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          borderColor: '#ef4444',
          textColor: '#ffffff',
          iconColor: '#ffffff'
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.95)',
          borderColor: '#f59e0b',
          textColor: '#ffffff',
          iconColor: '#ffffff'
        };
      default:
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.95)',
          borderColor: '#3b82f6',
          textColor: '#ffffff',
          iconColor: '#ffffff'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} />;
      case 'error':
        return <AlertCircle size={24} />;
      case 'warning':
        return <AlertCircle size={24} />;
      default:
        return <Info size={24} />;
    }
  };

  const styles = getAlertStyles();

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: styles.backgroundColor,
        border: `2px solid ${styles.borderColor}`,
        borderRadius: '12px',
        padding: '16px 20px',
        minWidth: '320px',
        maxWidth: '500px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        animation: 'slideInRight 0.3s ease-out',
        fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ color: styles.iconColor, marginTop: '2px' }}>
          {getIcon()}
        </div>
        
        <div style={{ flex: 1 }}>
          {title && (
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: styles.textColor,
              marginBottom: '4px'
            }}>
              {title}
            </div>
          )}
          <div style={{ 
            fontSize: '14px', 
            color: styles.textColor,
            lineHeight: '1.5'
          }}>
            {message}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: styles.textColor,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert; 