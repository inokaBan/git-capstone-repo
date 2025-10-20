import React, { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAlertDialog } from '../context/AlertDialogContext';

const AlertDialog = () => {
  const { dialog, closeDialog } = useAlertDialog();
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (dialog.isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [dialog.isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!dialog.isOpen) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (dialog.onConfirm) {
          dialog.onConfirm();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (dialog.type === 'confirm' && dialog.onCancel) {
          dialog.onCancel();
        } else if (dialog.onConfirm) {
          dialog.onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  if (!dialog.isOpen) return null;

  const getIcon = () => {
    switch (dialog.type) {
      case 'success':
        return <CheckCircle className="w-10 h-10 text-green-600" />;
      case 'error':
        return <XCircle className="w-10 h-10 text-red-600" />;
      case 'confirm':
        return <AlertTriangle className="w-10 h-10 text-red-600" />;
      default:
        return <AlertCircle className="w-10 h-10 text-blue-600" />;
    }
  };

  const getIconBgColor = () => {
    switch (dialog.type) {
      case 'success':
        return 'bg-green-100';
      case 'error':
        return 'bg-red-100';
      case 'confirm':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-100 flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (dialog.type === 'confirm' && dialog.onCancel) {
            dialog.onCancel();
          } else if (dialog.onConfirm) {
            dialog.onConfirm();
          }
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className={`w-20 h-20 ${getIconBgColor()} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {getIcon()}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{dialog.title}</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{dialog.message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
            {dialog.type === 'confirm' && dialog.onCancel && (
              <button
                onClick={dialog.onCancel}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {dialog.cancelText}
              </button>
            )}
            {dialog.onConfirm && (
              <button
                ref={confirmButtonRef}
                onClick={dialog.onConfirm}
                className={`flex-1 text-white py-3 px-4 rounded-lg transition-colors font-medium ${
                  dialog.type === 'error' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : dialog.type === 'success'
                    ? 'bg-green-600 hover:bg-green-700'
                    : dialog.type === 'confirm'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {dialog.confirmText}
              </button>
            )}
          </div>

          {/* Keyboard hint */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Enter</kbd> to confirm
            {dialog.type === 'confirm' && ' or '}
            {dialog.type === 'confirm' && <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Esc</kbd>}
            {dialog.type === 'confirm' && ' to cancel'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
