
import React, { useState, useEffect } from 'react';
import { Member } from '../types';

interface MemberFormProps {
  member?: Member | null;
  onSave: (member: Member) => void;
  onCancel: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ member, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setRelation(member.relation);
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: member?.id || crypto.randomUUID(),
      name,
      relation
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold mb-4">{member ? 'ویرایش عضو' : 'افزودن عضو جدید'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="مثلا: سعید سعیدی"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نسبت</label>
          <input
            type="text"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="مثلا: پدر، مادر، همسر"
            required
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700"
          >
            ذخیره
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl font-bold hover:bg-gray-200"
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;
