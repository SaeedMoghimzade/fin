
import React, { useState, useEffect } from 'react';
import { Debt, Member, RepaymentMethod, Installment } from '../types';
import { addJalaliMonth } from '../utils/dateUtils';
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
      setInstallmentCount(debt.installments.length);
      setDescription(debt.description || '');
    } else if (members.length > 0) {
      setMemberId(members[0].id);
    }
  }, [debt, members]);

  const generateInstallments = (count: number, amount: number, start: string): Installment[] => {
    const installments: Installment[] = [];
    const instAmount = Math.floor(amount / count);
    
    for (let i = 0; i < count; i++) {
      installments.push({
        id: crypto.randomUUID(),
        amount: i === count - 1 ? amount - (instAmount * (count - 1)) : instAmount,
        dueDate: addJalaliMonth(start, i),
        status: 'PENDING'
      });
    }
    return installments;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const installments = method === 'LUMP_SUM' 
      ? generateInstallments(1, totalAmount, startDate)
      : generateInstallments(installmentCount, totalAmount, startDate);

    onSave({
      id: debt?.id || crypto.randomUUID(),
      name,
      totalAmount,
      memberId,
      repaymentMethod: method,
      startDate: startDate,
      installments: debt?.installments.length === installments.length ? debt.installments : installments,
      description,
      createdAt: debt?.createdAt || new Date().toISOString()
    });
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
            <label className="block text-sm font-medium text-gray-700 mb-1">کل بدهی (تومان)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
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
        </div>
        <div className="grid grid-cols-1 gap-4">
          <JalaliDatePicker 
            label={method === 'INSTALLMENT' ? 'تاریخ اولین قسط' : 'تاریخ سررسید'}
            value={startDate}
            onChange={setStartDate}
          />
          
          {method === 'INSTALLMENT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تعداد اقساط</label>
              <input
                type="number"
                min="1"
                value={installmentCount}
                onChange={(e) => setInstallmentCount(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}
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
