
import React, { useRef, useState } from 'react';
import { Asset, Debt, Member, RecurringIncome } from '../types';
import { formatCurrency, getJalaliMonthYear, toJalali, addJalaliMonth } from '../utils/dateUtils';
import { dbService, STORES } from '../db';
import ConfirmModal from './ConfirmModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Download, Upload, Database, CheckCircle, Copy, Share2, Loader2, X, ChevronDown, ClipboardPaste } from 'lucide-react';

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
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ type: null, message: '' });
  
  const now = new Date();
  const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

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
      if (!monthlyBreakdown[sortKey]) {
        monthlyBreakdown[sortKey] = { 
          sortKey,
          displayName: monthKeysToData[sortKey] || getJalaliMonthYear(inst.dueDate),
          total: 0, paid: 0, pending: 0, overdue: 0, details: [] 
        };
      }
      const isPast = inst.dueDate < todayISO;
      monthlyBreakdown[sortKey].total += inst.amount;
      if (inst.status === 'PAID') {
        monthlyBreakdown[sortKey].paid += inst.amount;
      } else if (isPast) {
        monthlyBreakdown[sortKey].overdue += inst.amount;
      } else {
        monthlyBreakdown[sortKey].pending += inst.amount;
      }
      monthlyBreakdown[sortKey].details.push({ 
        name: debt.name, amount: inst.amount, status: inst.status === 'PAID' ? 'PAID' : (isPast ? 'OVERDUE' : 'PENDING') 
      });
    });
  });

  const chartData = targetMonths.map(key => {
    const data = monthlyBreakdown[key] || { paid: 0, pending: 0, overdue: 0, displayName: monthKeysToData[key] };
    return { name: data.displayName, 'پرداخت شده': data.paid, 'در انتظار': data.pending, 'معوق': data.overdue };
  });

  const showStatus = (type: 'success' | 'error' | 'info', message: string, duration = 5000) => {
    setImportStatus({ type, message });
    if (type !== 'info') setTimeout(() => setImportStatus({ type: null, message: '' }), duration);
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  };

  const handleExportData = async () => {
    const backupData = JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: { members, assets, debts, incomes }
    }, null, 2);
    
    const fileName = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;

    if (navigator.share) {
      try {
        const file = new File([backupData], fileName, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'پشتیبان مدیریت مالی',
          });
          showStatus('success', 'فایل پشتیبان با موفقیت ارسال شد.');
          return;
        }
        await navigator.share({
          title: 'داده‌های پشتیبان',
          text: backupData
        });
        showStatus('success', 'اطلاعات به صورت متنی صادر شد.');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(backupData);
        showStatus('success', 'داده‌ها در حافظه کپی شد.');
        return;
      }
    } catch (err) {}

    if (fallbackCopyText(backupData)) {
      showStatus('success', 'داده‌ها در حافظه کپی شد.');
    } else {
      showStatus('error', 'متأسفانه سیستم اجازه خروجی داده را نداد.');
    }
  };

  const copyToClipboard = () => {
    const backupData = JSON.stringify({ 
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: { members, assets, debts, incomes } 
    });
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(backupData)
        .then(() => showStatus('success', 'کپی شد.'))
        .catch(() => {
          if (fallbackCopyText(backupData)) showStatus('success', 'کپی شد.');
          else showStatus('error', 'خطا در کپی.');
        });
    } else {
      if (fallbackCopyText(backupData)) showStatus('success', 'کپی شد.');
      else showStatus('error', 'خطا در کپی.');
    }
  };

  const processImportData = async (jsonString: string) => {
    try {
      const json = JSON.parse(jsonString);
      const sourceData = json.data || json; 
      if (!sourceData || !sourceData.members) throw new Error('فرمت داده‌ها نامعتبر است.');
      
      await Promise.all([
        dbService.clearStore(STORES.MEMBERS),
        dbService.clearStore(STORES.ASSETS),
        dbService.clearStore(STORES.DEBTS),
        dbService.clearStore(STORES.INCOME),
      ]);
      for (const item of (sourceData.members || [])) await dbService.put(STORES.MEMBERS, item);
      for (const item of (sourceData.assets || [])) await dbService.put(STORES.ASSETS, item);
      for (const item of (sourceData.debts || [])) await dbService.put(STORES.DEBTS, item);
      for (const item of (sourceData.incomes || [])) await dbService.put(STORES.INCOME, item);
      await onRefresh();
      showStatus('success', 'اطلاعات با موفقیت بازیابی شد.');
      setShowPasteModal(false);
      setPasteContent('');
    } catch (err) {
      showStatus('error', 'خطا در پردازش داده‌ها. لطفا مطمئن شوید متن را کامل کپی کرده‌اید.');
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowConfirm(true);
    event.target.value = '';
  };

  const executeFileImport = async () => {
    if (!pendingFile) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      await processImportData(e.target?.result as string);
    };
    reader.readAsText(pendingFile);
    setShowConfirm(false);
  };

  const [currentJY, currentJM] = toJalali(now);
  const currentMonthKey = `${currentJY}/${currentJM.toString().padStart(2, '0')}`;
  const sortedMonths = Object.keys(monthlyBreakdown).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-8 pb-10">
      <ConfirmModal 
        isOpen={showConfirm}
        title="بازیابی داده‌ها"
        message="با تایید این عملیات، تمام اطلاعات فعلی شما پاک شده و اطلاعات فایل جایگزین آن خواهد شد."
        confirmText="تایید و جایگزینی"
        onConfirm={executeFileImport}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Paste Data Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowPasteModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-gray-800 mb-2">وارد کردن دستی متن</h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">متنی که قبلاً از بخش "خروجی" کپی کرده بودید را اینجا بچسبانید (Paste کنید).</p>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder='متن را اینجا قرار دهید (مثلا: {"version": "1.0", ...})'
              className="w-full h-40 p-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] dir-ltr outline-none focus:ring-2 focus:ring-indigo-500 mb-4 font-mono"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => processImportData(pasteContent)}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all"
              >
                بازیابی اطلاعات
              </button>
              <button 
                onClick={() => setShowPasteModal(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold active:scale-95 transition-all"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {importStatus.type && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 fixed top-4 left-4 right-4 z-[120] shadow-2xl ${
          importStatus.type === 'success' ? 'bg-green-600 text-white' : 
          importStatus.type === 'error' ? 'bg-red-600 text-white' : 
          'bg-indigo-700 text-white'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : 
           importStatus.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : 
           <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
          <p className="text-xs font-bold">{importStatus.message}</p>
          <button onClick={() => setImportStatus({ type: null, message: '' })} className="mr-auto opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Charts and Lists remains the same */}
      <div>
        <h3 className="text-lg font-bold mb-4">وضعیت بازپرداخت‌ها (بازه ۶ ماهه)</h3>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textAlign: 'right', direction: 'rtl' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="پرداخت شده" stackId="a" fill="#22c55e" />
              <Bar dataKey="در انتظار" stackId="a" fill="#3b82f6" />
              <Bar dataKey="معوق" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">گزارش تفصیلی ماهانه</h3>
        <div className="space-y-4">
          {sortedMonths.length > 0 ? (
            sortedMonths.map(key => {
              const data = monthlyBreakdown[key];
              const isCurrent = key === currentMonthKey;
              return (
                <details key={key} className={`group bg-white rounded-2xl border ${isCurrent ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-gray-100'} shadow-sm overflow-hidden`}>
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800">{data.displayName}</p>
                        {isCurrent && <span className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-md">ماه جاری</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {data.paid > 0 && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">پرداخت: {formatCurrency(data.paid)}</span>}
                        {data.overdue > 0 && <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full">معوق: {formatCurrency(data.overdue)}</span>}
                        {data.pending > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">مانده: {formatCurrency(data.pending)}</span>}
                      </div>
                    </div>
                    <div className="text-left flex flex-col items-end">
                      <p className="font-bold text-gray-900">{formatCurrency(data.total)}</p>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform mt-1" />
                    </div>
                  </summary>
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3 bg-gray-50/30">
                    {data.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {detail.status === 'PAID' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : detail.status === 'OVERDUE' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-blue-500" />}
                          <span className={detail.status === 'PAID' ? 'text-gray-400 line-through' : 'text-gray-700'}>{detail.name}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(detail.amount)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })
          ) : (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">داده‌ای برای نمایش وجود ندارد.</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-600 p-2 rounded-xl"><Database className="text-white w-5 h-5" /></div>
            <h3 className="text-lg font-black text-gray-800">پشتیبان‌گیری داده‌ها</h3>
          </div>
          <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">اطلاعات شما فقط روی این گوشی ذخیره شده است. حتماً خروجی گرفته و در جایی مطمئن ذخیره کنید.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleExportData} className="flex flex-col items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-6 px-2 rounded-2xl font-bold border border-indigo-100 active:scale-95 transition-all">
              <Share2 className="w-6 h-6" />
              <span className="text-xs">خروجی و اشتراک</span>
            </button>
            <button onClick={handleImportClick} className="flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-700 py-6 px-2 rounded-2xl font-bold border border-gray-100 active:scale-95 transition-all">
              <Upload className="w-6 h-6" />
              <span className="text-xs">وارد کردن فایل</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <button onClick={copyToClipboard} className="flex items-center justify-center gap-2 bg-gray-50 text-gray-500 py-4 rounded-2xl font-bold active:scale-95 transition-all border border-dashed border-gray-200">
              <Copy className="w-4 h-4" />
              <span className="text-[10px]">کپی داده‌ها</span>
            </button>
            <button onClick={() => setShowPasteModal(true)} className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-bold active:scale-95 transition-all border border-dashed border-indigo-200">
              <ClipboardPaste className="w-4 h-4" />
              <span className="text-[10px]">وارد کردن متن</span>
            </button>
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default Reports;
