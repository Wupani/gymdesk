import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, X, CheckCircle, Lock } from 'lucide-react';

function Modal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'confirm', // 'confirm', 'alert', 'warning', 'password'
  confirmText = 'Tamam',
  cancelText = 'İptal',
  showCancel = true
}) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen && type === 'password') {
      setPassword('');
    }
  }, [isOpen, type]);
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={32} color="#f59e0b" />;
      case 'success':
        return <CheckCircle size={32} color="#10b981" />;
      case 'alert':
        return <Info size={32} color="#3b82f6" />;
      case 'password':
        return <Lock size={32} color="#3b82f6" />;
      default:
        return <AlertTriangle size={32} color="#f59e0b" />;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'modalFadeIn 0.2s ease-out',
        fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
      onClick={handleBackdropClick}
    >
      <style>
        {`
          @keyframes modalFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes modalSlideIn {
            from {
              transform: scale(0.9);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>

      <div 
        style={{
          backgroundColor: '#1f2937',
          borderRadius: '16px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          margin: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          animation: 'modalSlideIn 0.2s ease-out',
          border: '1px solid #374151'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '20px',
          gap: '12px'
        }}>
          {getIcon()}
          
          <div style={{ flex: 1 }}>
            <h3 style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '600',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <div style={{
          color: '#d1d5db',
          fontSize: '14px',
          lineHeight: '1.6',
          marginBottom: type === 'password' ? '16px' : '24px'
        }}>
          {message}
        </div>

        {/* Password Input */}
        {type === 'password' && (
          <div style={{ marginBottom: '24px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre girin..."
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#4b5563';
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (onConfirm) onConfirm(password);
                  onClose();
                }
              }}
            />
          </div>
        )}

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          {showCancel && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#374151',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#4b5563';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#374151';
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={() => {
              if (onConfirm) {
                if (type === 'password') {
                  onConfirm(password);
                } else {
                  onConfirm();
                }
              }
              onClose();
            }}
            style={{
              backgroundColor: type === 'warning' ? '#dc2626' : '#ff6b00',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = type === 'warning' ? '#b91c1c' : '#ea580c';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = type === 'warning' ? '#dc2626' : '#ff6b00';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal; 