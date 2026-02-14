
import React from 'react';
import { Asset, Debt, Member, RecurringIncome } from '../types';
import { formatCurrency, getJalaliMonthYear, toJalali, toGregorian, addJalaliMonth } from '../utils/dateUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ReportsProps {
  members: Member[];
  assets: Asset[];
  debts: Debt[];
  incomes: RecurringIncome[];
}

interface MonthlyData {
  sortKey: string; // YYYY/MM for sorting
  displayName: string; // "Month YYYY" for display
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

const Reports: React.FC<ReportsProps> = ({ members, assets, debts, incomes }) => {
  const now = new Date();
  const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // 1. Generate the specific 6-month range: [Prev, Current, Next, Next+1, Next+2, Next+3]
  // We'll use the first day of each month to generate display names and sort keys
  const targetMonths: string[] = []; // Stores sortKeys like "1403/02"
  const monthKeysToData: Record<string, string> = {}; // sortKey -> displayName

  // Start from previous month (-1) to 4 months in future (+4)
  for (let i = -1; i <= 4; i++) {
    const dateOfTargetMonth = addJalaliMonth(now.toISOString(), i);
    const [jy, jm] = toJalali(dateOfTargetMonth);
    const sortKey = `${jy}/${jm.toString().padStart(2, '0')}`;
    const displayName = getJalaliMonthYear(dateOfTargetMonth);
    targetMonths.push(sortKey);
    monthKeysToData[sortKey] = displayName;
  }

  const monthlyBreakdown: Record<string, MonthlyData> = {};
  
  // Initialize buckets for all months found in debts plus the target range
  // We want to see the specific 6 months in chart, but maybe more in the list
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

  // Prepare Chart Data specifically for the 6-month window requested
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

  // Sorted months for the detailed list (all of them)
  const sortedMonthsForList = Object.keys(monthlyBreakdown).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-8">
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
            const isCurrentMonth = key === targetMonths[1]; // Index 1 is current month in our loop

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
                          پرداخت شده: {formatCurrency(data.paid)}
                        </span>
                      )}
                      {data.overdue > 0 && (
                        <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
                          معوق: {formatCurrency(data.overdue)}
                        </span>
                      )}
                      {data.pending > 0 && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                          آینده: {formatCurrency(data.pending)}
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
                      <span className={`text-sm ${
                        detail.status === 'PAID' ? 'text-green-600' : 
                        detail.status === 'OVERDUE' ? 'text-red-600 font-bold' : 
                        'text-gray-900 font-bold'
                      }`}>
                        {formatCurrency(detail.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
          {sortedMonthsForList.length === 0 && (
            <div className="bg-gray-50 p-8 rounded-3xl border border-dashed border-gray-200 text-center">
              <p className="text-gray-400 text-sm">هنوز هیچ بدهی یا قسطی ثبت نشده است.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
