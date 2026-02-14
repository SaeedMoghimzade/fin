
import React, { useState, useEffect } from 'react';
import { RecurringIncome, Member } from '../types';
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/dateUtils';

interface IncomeFormProps {
  income?: RecurringIncome | null;
  members: Member[];
  onSave: (income: RecurringIncome) => void;
  onCancel: () => void;
}

const IncomeForm: React.FC<IncomeFormProps> = ({ income, members, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [memberId, setMemberId] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (income) {
      setName(income.name);
      setAmount(income.amount);
      setMemberId(income.memberId);
      setDayOfMonth(income.dayOfMonth);
      setDescription(income.description || '');
    } else if (members.length > 0) {
      setMemberId(members[0].id);
    }
  }, [income, members]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: income?.id || crypto.randomUUID(),
      name,
      amount,
      memberId,
      dayOfMonth,
      description
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(parseFormattedNumber(val));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold mb-4">{income ? 'ویرایش درآمد' : 'ثبت درآمد مستمر جدید'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">دریافت‌کننده</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان درآمد</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="مثلا: حقوق ماهیانه"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ (تومان)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatNumberWithCommas(amount)}
              onChange={handleAmountChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left dir-ltr"
              placeholder="۰"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">روز دریافت (در ماه)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات (اختیاری)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={2}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="flex-1 bg-emerald-600 text-white p-3 rounded-xl font-bold">ذخیره</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl font-bold">انصراف</button>
        </div>
      </form>
    </div>
  );
};

export default IncomeForm;
