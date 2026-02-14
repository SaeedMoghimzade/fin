
import React, { useState, useEffect } from 'react';
import { toJalali, toGregorian, jalaliMonths } from '../utils/dateUtils';
import { Calendar as CalendarIcon } from 'lucide-react';

interface JalaliDatePickerProps {
  value: string; // ISO string
  onChange: (isoValue: string) => void;
  label: string;
}

const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({ value, onChange, label }) => {
  const [show, setShow] = useState(false);
  
  // Selected values in the picker
  const [selectedY, setSelectedY] = useState(1403);
  const [selectedM, setSelectedM] = useState(1);
  const [selectedD, setSelectedD] = useState(1);

  // Synchronize internal picker state when value prop changes or picker opens
  useEffect(() => {
    const date = value ? new Date(value) : new Date();
    const [jy, jm, jd] = toJalali(date);
    setSelectedY(jy);
    setSelectedM(jm);
    setSelectedD(jd);
  }, [value, show]);

  // Available year range: current year +/- 10 years (or specifically 1380 to 1420 for family planning)
  const currentJalaliYear = toJalali(new Date())[0];
  const years = Array.from({ length: 41 }, (_, i) => 1380 + i);
  const days = Array.from({ length: selectedM <= 6 ? 31 : (selectedM <= 11 ? 30 : 29) }, (_, i) => i + 1);

  const handleConfirm = () => {
    const greg = toGregorian(selectedY, selectedM, selectedD);
    onChange(greg.toISOString());
    setShow(false);
  };

  const formattedValue = new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(value ? new Date(value) : new Date());

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setShow(true)}
        className="w-full p-3 border border-gray-300 rounded-xl flex items-center justify-between bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-right"
      >
        <span className="text-gray-900 font-medium">{formattedValue}</span>
        <CalendarIcon className="w-5 h-5 text-gray-400" />
      </button>

      {show && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShow(false)} />
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h4 className="text-center font-bold text-lg mb-6">انتخاب تاریخ شمسی</h4>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              {/* Day Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 text-center uppercase">روز</label>
                <select 
                  value={selectedD}
                  onChange={(e) => setSelectedD(Number(e.target.value))}
                  className="bg-gray-50 p-3 rounded-xl border-none text-center font-bold outline-none appearance-none"
                >
                  {days.map(d => (
                    <option key={d} value={d}>
                      {new Intl.NumberFormat('fa-IR').format(d)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Month Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 text-center uppercase">ماه</label>
                <select 
                  value={selectedM}
                  onChange={(e) => setSelectedM(Number(e.target.value))}
                  className="bg-gray-50 p-3 rounded-xl border-none text-center font-bold outline-none appearance-none"
                >
                  {jalaliMonths.map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 text-center uppercase">سال</label>
                <select 
                  value={selectedY}
                  onChange={(e) => setSelectedY(Number(e.target.value))}
                  className="bg-gray-50 p-3 rounded-xl border-none text-center font-bold outline-none appearance-none"
                >
                  {years.map(y => (
                    <option key={y} value={y}>
                      {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(y)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={handleConfirm}
                className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-100"
              >
                تایید تاریخ
              </button>
              <button 
                type="button"
                onClick={() => setShow(false)}
                className="flex-1 bg-gray-100 text-gray-700 p-4 rounded-2xl font-bold"
              >
                انصراف
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JalaliDatePicker;
