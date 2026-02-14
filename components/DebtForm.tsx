
import React, { useState, useEffect } from 'react';
import { Debt, Member, RepaymentMethod, Installment } from '../types';
import { addJalaliMonth, formatNumberWithCommas, parseFormattedNumber } from '../utils/dateUtils';
import JalaliDatePicker from './JalaliDatePicker';

interface DebtFormProps {
  debt?: Debt | null;
  members: Member[];
  onSave: (debt: Debt) => void;
  onCancel: () => void;
}

const DebtForm: React.FC<DebtFormProps> = ({ debt, members, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [perInstallmentAmount, setPerInstallmentAmount] = useState<number>(0);
  const [inputMode, setInputMode] = useState<'TOTAL' | 'PER_INSTALLMENT'>('TOTAL');
  const [memberId, setMemberId] = useState('');
  const [method, setMethod] = useState<RepaymentMethod>('LUMP_SUM');
  const [startDate, setStartDate] = useState(new Date().toISOString());
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setTotalAmount(debt.totalAmount);
      setMemberId(debt.memberId);
      setMethod(debt.repaymentMethod);
      setStartDate(debt.startDate);
      const count = debt.installments.length;
      setInstallmentCount(count);
      if (count > 0) {
        setPerInstallmentAmount(debt.installments[0].amount);
      }
      setDescription(debt.description || '');
    } else if (members.length > 0) {
      setMemberId(members[0].id);
    }
  }, [debt, members]);

  // Sync amounts when inputs change
  useEffect(() => {
    if (method === 'INSTALLMENT') {
      if (inputMode === 'PER_INSTALLMENT') {
        setTotalAmount(perInstallmentAmount * installmentCount);
      } else {
        if (installmentCount > 0) {
          setPerInstallmentAmount(Math.floor(totalAmount / installmentCount));
        }
      }
    }
  }, [totalAmount, perInstallmentAmount, installmentCount, inputMode, method]);

  const generateInstallments = (count: number, amount: number, start: string): Installment[] => {
    const installments: Installment[] = [];
    
    if (inputMode === 'PER_INSTALLMENT') {
      // In per-installment mode, all installments are exactly the same
      for (let i = 0; i < count; i++) {
        installments.push({
          id: crypto.randomUUID(),
          amount: perInstallmentAmount,
          dueDate: addJalaliMonth(start, i),
          status: 'PENDING'
        });
      }
    } else {
      // In total amount mode, handle the remainder in the last installment
      const instAmount = Math.floor(amount / count);
      for (let i = 0; i < count; i++) {
        installments.push({
          id: crypto.randomUUID(),
          amount: i === count - 1 ? amount - (instAmount * (count - 1)) : instAmount,
          dueDate: addJalaliMonth(start, i),
          status: 'PENDING'
        });
      }
    }
    return installments;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalTotal = inputMode === 'PER_INSTALLMENT' && method === 'INSTALLMENT' 
      ? perInstallmentAmount * installmentCount 
      : totalAmount;

    const installments = method === 'LUMP_SUM' 
      ? [{
          id: crypto.randomUUID(),
          amount: finalTotal,
          dueDate: startDate,
          status: 'PENDING' as const
        }]
      : generateInstallments(installmentCount, finalTotal, startDate);

    onSave({
      id: debt?.id || crypto.randomUUID(),
      name,
      totalAmount: finalTotal,
      memberId,
      repaymentMethod: method,
      startDate: startDate,
      installments: (debt && !isDataChanged(finalTotal, installments.length)) ? debt.installments : installments,
      description,
      createdAt: debt?.createdAt || new Date().toISOString()
    });
  };

  const isDataChanged = (newTotal: number, newCount: number) => {
    if (!debt) return true;
    return debt.totalAmount !== newTotal || debt.installments.length !== newCount;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 max-h-[80vh] overflow-y-auto no-scrollbar">
      <h3 className="text-lg font-bold mb-4">{debt ? 'ویرایش بدهی' : 'ثبت بدهی جدید'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">بدهکار</label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            required
          >
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان بدهی / وام</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="مثلا: وام مسکن"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">روش بازپرداخت</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as RepaymentMethod)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="LUMP_SUM">یکجا</option>
              <option value="INSTALLMENT">اقساطی</option>
            </select>
          </div>
          {method === 'INSTALLMENT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تعداد اقساط</label>
              <input
                type="number"
                min="1"
                value={installmentCount}
                onChange={(e) => setInstallmentCount(Math.max(1, Number(e.target.value)))}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}
        </div>

        {method === 'INSTALLMENT' && (
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex bg-white p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setInputMode('TOTAL')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputMode === 'TOTAL' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'}`}
              >
                بر اساس مبلغ کل
              </button>
              <button
                type="button"
                onClick={() => setInputMode('PER_INSTALLMENT')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputMode === 'PER_INSTALLMENT' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'}`}
              >
                بر اساس مبلغ قسط
              </button>
            </div>

            {inputMode === 'TOTAL' ? (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">مبلغ کل بدهی (تومان)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberWithCommas(totalAmount)}
                  onChange={(e) => setTotalAmount(parseFormattedNumber(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left dir-ltr font-bold text-indigo-700"
                  placeholder="۰"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">مبلغ هر قسط تقریباً: {formatNumberWithCommas(perInstallmentAmount)} تومان</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">مبلغ هر قسط (تومان)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberWithCommas(perInstallmentAmount)}
                  onChange={(e) => setPerInstallmentAmount(parseFormattedNumber(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left dir-ltr font-bold text-indigo-700"
                  placeholder="۰"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">مبلغ کل محاسبه شده: {formatNumberWithCommas(totalAmount)} تومان</p>
              </div>
            )}
          </div>
        )}

        {method === 'LUMP_SUM' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ بدهی (تومان)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatNumberWithCommas(totalAmount)}
              onChange={(e) => setTotalAmount(parseFormattedNumber(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left dir-ltr"
              placeholder="۰"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <JalaliDatePicker 
            label={method === 'INSTALLMENT' ? 'تاریخ اولین قسط' : 'تاریخ سررسید'}
            value={startDate}
            onChange={setStartDate}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={2}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700">ذخیره</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl font-bold hover:bg-gray-200">انصراف</button>
        </div>
      </form>
    </div>
  );
};

export default DebtForm;
