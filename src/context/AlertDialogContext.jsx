import React, { createContext, useContext, useState } from 'react';

const AlertDialogContext = createContext();

export const useAlertDialog = () => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('useAlertDialog must be used within AlertDialogProvider');
  }
  return context;
};

export const AlertDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'alert', // 'alert', 'confirm', 'success', 'error'
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  const showAlert = (message, title = 'Notice') => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        type: 'alert',
        title,
        message,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        confirmText: 'OK'
      });
    });
  };

  const showConfirm = (message, title = 'Confirm') => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        onCancel: () => {
          closeDialog();
          resolve(false);
        },
        confirmText: 'Confirm',
        cancelText: 'Cancel'
      });
    });
  };

  const showSuccess = (message, title = 'Success') => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        type: 'success',
        title,
        message,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        confirmText: 'OK'
      });
    });
  };

  const showError = (message, title = 'Error') => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        type: 'error',
        title,
        message,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        confirmText: 'OK'
      });
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertDialogContext.Provider value={{ dialog, showAlert, showConfirm, showSuccess, showError, closeDialog }}>
      {children}
    </AlertDialogContext.Provider>
  );
};
