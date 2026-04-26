import React from 'react';
import Button from './Button';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  variant = 'primary',
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>
        <div style={actionsStyle}>
          <Button variant="outline" onClick={onCancel} disabled={loading}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 20
};

const modalStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: '24px 32px',
  width: '100%',
  maxWidth: 400,
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

const titleStyle = {
  margin: '0 0 12px 0', fontSize: 18, fontWeight: 800, color: '#0f172a'
};

const messageStyle = {
  margin: '0 0 24px 0', fontSize: 14, color: '#475569', lineHeight: 1.5
};

const actionsStyle = {
  display: 'flex', justifyContent: 'flex-end', gap: 12
};
