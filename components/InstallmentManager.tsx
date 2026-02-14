
import React, { useState } from 'react';
import { Debt, Installment } from '../types';
import { toJalaliString, formatCurrency, formatNumberWithCommas, parseFormattedNumber } from '../utils/dateUtils';
import { CheckCircle2, Circle, Edit2, Check, X } from 'lucide-react';

interface InstallmentManagerProps {
  debt: Debt;
  onUpdate: (updatedDebt: Debt) => void;
  onClose: () => void;
}

const InstallmentManager: React.FC<InstallmentManagerProps> = ({ debt, onUpdate, onClose }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);

  const toggleStatus = (instId: string) => {
    const updatedInstallments: Installment[] = debt.installments.map(inst => 
      inst.id === instId 
        ? { ...inst, status: inst.status === 'PAID' ? 'PENDING' : 'PAID' } 
        : inst
    );
    onUpdate({ ...debt, installments: updatedInstallments });
  };

  const startEditing = (inst: Installment) => {
    setEditingId(inst.id);
    setEditAmount(inst.amount);
  };

  const saveAmount = (instId: string) => {
    const updatedInstallments: Installment[] = debt.installments.map(inst => 
      inst.id === instId ? { ...inst, amount: editAmount } : inst
    );
    const newTotal = updatedInstallments.reduce((sum, i) => sum + i.amount, 0);
    onUpdate({ ...debt, installments: updatedInstallments, totalAmount: newTotal });
    setEditingId(null);
  };

  const handleEditAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditAmount(parseFormattedNumber(e.target.value));
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
      <header className="p-4 border-b flex items-center justify-between bg-gray-50">
        <div>
          <h3 className="font-bold text-lg">{debt.name}</h3>
          <p className="text-xs text-gray-500">مدیریت اقساط</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {debt.installments.map((inst, index) => (
          <div 
            key={inst.id} 
            className={`p-4 rounded-2xl border transition-all ${
              inst.status === 'PAID' ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleStatus(inst.id)}
                  className={`transition-colors ${inst.status === 'PAID' ? 'text-green-600' : 'text-gray-300'}`}
                >
                  {inst.status === 'PAID' ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                </button>
                <div>
                  <p className="text-xs text-gray-400 font-medium">قسط شماره {index + 1}</p>
                  <p className="font-bold text-gray-800">{toJalaliString(inst.dueDate)}</p>
                </div>
              </div>

              <div className="text-left">
                {editingId === inst.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={formatNumberWithCommas(editAmount)}
                      onChange={handleEditAmountChange}
                      className="w-32 p-1 border rounded text-sm text-left outline-none focus:ring-1 focus:ring-indigo-500 dir-ltr"
                      autoFocus
                    />
                    <button onClick={() => saveAmount(inst.id)} className="p-1 bg-green-500 text-white rounded">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className={`font-bold ${inst.status === 'PAID' ? 'text-green-700' : 'text-indigo-600'}`}>
                      {formatCurrency(inst.amount)}
                    </span>
                    <button 
                      onClick={() => startEditing(inst)}
                      className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <p className={`text-[10px] ${inst.status === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                  {inst.status === 'PAID' ? 'پرداخت شده' : 'در انتظار پرداخت'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">جمع کل اقساط:</span>
          <span className="font-bold text-lg">{formatCurrency(debt.totalAmount)}</span>
        </div>
      </footer>
    </div>
  );
};

export default InstallmentManager;
