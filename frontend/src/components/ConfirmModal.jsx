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
  backgroundColor: 'rgba(60, 36, 21, 0.5)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 20
};

const modalStyle = {
  background: '#FAF8F4',
  borderRadius: 16,
  padding: '24px 32px',
  width: '100%',
  maxWidth: 400,
  boxShadow: '0 20px 40px rgba(60, 36, 21, 0.15)',
  border: '1px solid #E8DCC8'
};

const titleStyle = {
  margin: '0 0 12px 0', fontSize: 18, fontWeight: 800, color: '#3C2415'
};

const messageStyle = {
  margin: '0 0 24px 0', fontSize: 14, color: '#6F4E37', lineHeight: 1.5
};

const actionsStyle = {
  display: 'flex', justifyContent: 'flex-end', gap: 12
};
