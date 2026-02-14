
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'تایید',
  cancelText = 'انصراف',
  isDanger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-2xl mb-4 ${isDanger ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={onConfirm}
              className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
                isDanger ? 'bg-red-600 shadow-red-100' : 'bg-indigo-600 shadow-indigo-100'
              }`}
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-4 rounded-2xl font-bold text-gray-700 bg-gray-100 transition-transform active:scale-95"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
