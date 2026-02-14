
import React, { useState, useEffect } from 'react';
import { Asset, Member, AssetType } from '../types';
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/dateUtils';

interface AssetFormProps {
  asset?: Asset | null;
  members: Member[];
  onSave: (asset: Asset) => void;
  onCancel: () => void;
}

const AssetForm: React.FC<AssetFormProps> = ({ asset, members, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [memberId, setMemberId] = useState('');
  const [type, setType] = useState<AssetType>('CASH');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setAmount(asset.amount);
      setMemberId(asset.memberId);
      setType(asset.type);
      setDescription(asset.description || '');
    } else if (members.length > 0) {
      setMemberId(members[0].id);
    }
  }, [asset, members]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: asset?.id || crypto.randomUUID(),
      name,
      amount,
      memberId,
      type,
      description,
      createdAt: asset?.createdAt || new Date().toISOString()
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(parseFormattedNumber(val));
  };

  const assetTypes: { value: AssetType; label: string }[] = [
    { value: 'BANK', label: 'موجودی بانکی' },
    { value: 'CASH', label: 'نقد' },
    { value: 'GOLD', label: 'طلا و سکه' },
    { value: 'CAR', label: 'خودرو' },
    { value: 'REAL_ESTATE', label: 'ملک و املاک' },
    { value: 'OTHER', label: 'سایر دارایی‌ها' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold mb-4">{asset ? 'ویرایش دارایی' : 'ثبت دارایی جدید'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">مالک دارایی</label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          >
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نام دارایی</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="مثلا: حساب بانک ملی"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع دارایی</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AssetType)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {assetTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
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
          <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold">ذخیره</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl font-bold">انصراف</button>
        </div>
      </form>
    </div>
  );
};

export default AssetForm;
