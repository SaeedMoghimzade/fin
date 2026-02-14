
import React, { useRef, useState } from 'react';
import { Asset, Debt, Member, RecurringIncome } from '../types';
import { formatCurrency, getJalaliMonthYear, toJalali, addJalaliMonth } from '../utils/dateUtils';
import { dbService, STORES } from '../db';
import ConfirmModal from './ConfirmModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Download, Upload, Database, CheckCircle } from 'lucide-react';

interface ReportsProps {
  members: Member[];
  assets: Asset[];
  debts: Debt[];
  incomes: RecurringIncome[];
  onRefresh: () => Promise<void>;
}

interface MonthlyData {
  sortKey: string;
  displayName: string;
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  details: { 
    name: string; 
    amount: number; 
    status: 'PENDING' | 'PAID' | 'OVERDUE' 
  }[];
}

const Reports: React.FC<ReportsProps> = ({ members, assets, debts, incomes, onRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  
  const now = new Date();
  const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // 1. Generate the specific 6-month range
  const targetMonths: string[] = [];
  const monthKeysToData: Record<string, string> = {};

  for (let i = -1; i <= 4; i++) {
    const dateOfTargetMonth = addJalaliMonth(now.toISOString(), i);
    const [jy, jm] = toJalali(dateOfTargetMonth);
    const sortKey = `${jy}/${jm.toString().padStart(2, '0')}`;
    const displayName = getJalaliMonthYear(dateOfTargetMonth);
    targetMonths.push(sortKey);
    monthKeysToData[sortKey] = displayName;
  }

  const monthlyBreakdown: Record<string, MonthlyData> = {};
  
  debts.forEach(debt => {
    debt.installments.forEach(inst => {
      const [jy, jm] = toJalali(inst.dueDate);
      const sortKey = `${jy}/${jm.toString().padStart(2, '0')}`;
      const displayName = getJalaliMonthYear(inst.dueDate);

      if (!monthlyBreakdown[sortKey]) {
        monthlyBreakdown[sortKey] = { 
          sortKey,
          displayName,
          total: 0, 
          paid: 0, 
          pending: 0, 
          overdue: 0,
          details: [] 
        };
      }
      
      const isPast = inst.dueDate < todayISO;
      let finalStatus: 'PENDING' | 'PAID' | 'OVERDUE' = inst.status;
      
      monthlyBreakdown[sortKey].total += inst.amount;
      if (inst.status === 'PAID') {
        monthlyBreakdown[sortKey].paid += inst.amount;
      } else if (isPast) {
        monthlyBreakdown[sortKey].overdue += inst.amount;
        finalStatus = 'OVERDUE';
      } else {
        monthlyBreakdown[sortKey].pending += inst.amount;
      }
      
      monthlyBreakdown[sortKey].details.push({ 
        name: debt.name, 
        amount: inst.amount, 
        status: finalStatus 
      });
    });
  });

  const chartData = targetMonths.map(key => {
    const data = monthlyBreakdown[key] || {
      displayName: monthKeysToData[key],
      paid: 0,
      pending: 0,
      overdue: 0
    };
    return {
      name: data.displayName,
      'پرداخت شده': data.paid,
      'در انتظار': data.pending,
      'معوق': data.overdue
    };
  });

  const sortedMonthsForList = Object.keys(monthlyBreakdown).sort((a, b) => a.localeCompare(b));

  const handleExportData = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: { members, assets, debts, incomes }
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowConfirm(true);
    setImportStatus({ type: null, message: '' });
    event.target.value = '';
  };

  const executeImport = async () => {
    if (!pendingFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.data || !json.data.members) throw new Error('فرمت فایل نامعتبر است.');

        await Promise.all([
          dbService.clearStore(STORES.MEMBERS),
          dbService.clearStore(STORES.ASSETS),
          dbService.clearStore(STORES.DEBTS),
          dbService.clearStore(STORES.INCOME),
        ]);

        const { members: m, assets: a, debts: d, incomes: i } = json.data;
        for (const item of m) await dbService.put(STORES.MEMBERS, item);
        for (const item of a) await dbService.put(STORES.ASSETS, item);
        for (const item of d) await dbService.put(STORES.DEBTS, item);
        for (const item of i) await dbService.put(STORES.INCOME, item);

        await onRefresh();
        setImportStatus({ type: 'success', message: 'اطلاعات با موفقیت بازیابی شد.' });
        setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
      } catch (err) {
        setImportStatus({ type: 'error', message: 'خطا: ' + (err as Error).message });
      }
    };
    reader.readAsText(pendingFile);
    setShowConfirm(false);
    setPendingFile(null);
  };

  return (
    <div className="space-y-8 pb-10">
      <ConfirmModal 
        isOpen={showConfirm}
        title="بازیابی داده‌ها"
        message="با تایید این عملیات، تمام اطلاعات فعلی شما پاک شده و اطلاعات فایل جایگزین آن خواهد شد. آیا مطمئن هستید؟"
        confirmText="تایید و جایگزینی"
        onConfirm={executeImport}
        onCancel={() => { setShowConfirm(false); setPendingFile(null); }}
      />

      {importStatus.type && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 ${
          importStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-bold">{importStatus.message}</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold mb-4">وضعیت بازپرداخت‌ها (بازه ۶ ماهه)</h3>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 9, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis hide />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textAlign: 'right', direction: 'rtl' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="پرداخت شده" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="در انتظار" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="معوق" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">گزارش تفصیلی ماهانه</h3>
        <div className="space-y-4">
          {sortedMonthsForList.map(key => {
            const data = monthlyBreakdown[key];
            const isCurrentMonth = key === targetMonths[1];

            return (
              <details key={key} className={`group bg-white rounded-2xl border ${isCurrentMonth ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-gray-100'} shadow-sm overflow-hidden`}>
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800">{data.displayName}</p>
                      {isCurrentMonth && <span className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-md">ماه جاری</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.paid > 0 && (
                        <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                          پرداخت: {formatCurrency(data.paid)}
                        </span>
                      )}
                      {data.overdue > 0 && (
                        <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
                          معوق: {formatCurrency(data.overdue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{formatCurrency(data.total)}</p>
                  </div>
                </summary>
                <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                  {data.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {detail.status === 'PAID' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : detail.status === 'OVERDUE' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-500" />
                        )}
                        <span className={`text-sm ${detail.status === 'PAID' ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                          {detail.name}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${
                        detail.status === 'PAID' ? 'text-green-600' : 
                        detail.status === 'OVERDUE' ? 'text-red-600' : 
                        'text-gray-900'
                      }`}>
                        {formatCurrency(detail.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="bg-indigo-50 rounded-[2.5rem] p-6 border border-indigo-100/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Database className="text-white w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-indigo-900">مدیریت داده‌ها</h3>
          </div>
          
          <p className="text-xs text-indigo-700/70 mb-6 leading-relaxed">
            شما می‌توانید از تمام اطلاعات ثبت شده خود یک فایل پشتیبان بگیرید یا داده‌های قبلی خود را از طریق فایل بازیابی کنید.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 bg-white text-indigo-700 py-4 px-2 rounded-2xl font-bold shadow-sm border border-indigo-100 active:scale-95 transition-all"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm">خروجی داده</span>
            </button>
            
            <button 
              onClick={handleImportClick}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 px-2 rounded-2xl font-bold shadow-md active:scale-95 transition-all"
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">وارد کردن فایل</span>
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
          
          <p className="text-center text-[10px] text-indigo-400 mt-6">
            پیشنهاد می‌شود به صورت دوره‌ای از داده‌های خود نسخه پشتیبان تهیه کنید.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
