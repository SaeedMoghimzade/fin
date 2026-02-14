
import React from 'react';
import { Asset, Debt, Member, RecurringIncome, AppView } from '../types';
import { formatCurrency } from '../utils/dateUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Banknote, 
  ChevronLeft, 
  Users,
  Wallet,
  CreditCard,
  ArrowLeft
} from 'lucide-react';

interface DashboardProps {
  members: Member[];
  assets: Asset[];
  debts: Debt[];
  incomes: RecurringIncome[];
  onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ members, assets, debts, incomes, onNavigate }) => {
  const totalAssets = assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebts = debts.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalMonthlyIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  
  const now = new Date();
  const currentMonthInstallments = debts.flatMap(d => 
    d.installments.filter(i => {
      const dueDate = new Date(i.dueDate);
      return i.status === 'PENDING' && 
             dueDate.getMonth() === now.getMonth() && 
             dueDate.getFullYear() === now.getFullYear();
    })
  );

  const upcomingPayments = currentMonthInstallments.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyBalance = totalMonthlyIncome - upcomingPayments;

  return (
    <div className="space-y-6 pb-4">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <p className="text-[10px] text-indigo-100 opacity-70 mb-1">کل دارایی‌ها</p>
            <p className="font-bold text-sm truncate">{formatCurrency(totalAssets)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <p className="text-[10px] text-indigo-100 opacity-70 mb-1">کل بدهی‌ها</p>
            <p className="font-bold text-sm truncate">{formatCurrency(totalDebts)}</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Hub */}
      <div className="grid grid-cols-2 gap-4">
        {/* Assets Card */}
        <button 
          onClick={() => onNavigate('ASSETS')}
          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-3 active:scale-95 transition-transform"
        >
          <div className="bg-green-100 p-2.5 rounded-2xl">
            <Wallet className="text-green-600 w-6 h-6" />
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-bold">دارایی‌ها</p>
            <p className="text-gray-400 text-[10px] mt-1 flex items-center gap-1">
              مشاهده لیست <ChevronLeft className="w-3 h-3" />
            </p>
          </div>
        </button>

        {/* Debts Card */}
        <button 
          onClick={() => onNavigate('DEBTS')}
          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-3 active:scale-95 transition-transform"
        >
          <div className="bg-red-100 p-2.5 rounded-2xl">
            <CreditCard className="text-red-600 w-6 h-6" />
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-bold">بدهی و وام</p>
            <p className="text-gray-400 text-[10px] mt-1 flex items-center gap-1">
              مشاهده لیست <ChevronLeft className="w-3 h-3" />
            </p>
          </div>
        </button>

        {/* Income Card */}
        <button 
          onClick={() => onNavigate('INCOME')}
          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-3 active:scale-95 transition-transform"
        >
          <div className="bg-emerald-100 p-2.5 rounded-2xl">
            <Banknote className="text-emerald-600 w-6 h-6" />
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-bold">درآمد مستمر</p>
            <p className="text-gray-400 text-[10px] mt-1 flex items-center gap-1">
              مشاهده لیست <ChevronLeft className="w-3 h-3" />
            </p>
          </div>
        </button>

        {/* Members Card */}
        <button 
          onClick={() => onNavigate('MEMBERS')}
          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-3 active:scale-95 transition-transform"
        >
          <div className="bg-indigo-100 p-2.5 rounded-2xl">
            <Users className="text-indigo-600 w-6 h-6" />
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-bold">اعضای خانواده</p>
            <p className="text-gray-400 text-[10px] mt-1 flex items-center gap-1">
              مشاهده لیست <ChevronLeft className="w-3 h-3" />
            </p>
          </div>
        </button>
      </div>

      {/* Monthly Summary Section */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            خلاصه وضعیت ماه جاری
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">مجموع درآمدهای این ماه</span>
            <span className="font-bold text-emerald-600">{formatCurrency(totalMonthlyIncome)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">اقساط سررسید شده</span>
            <span className="font-bold text-red-600">{formatCurrency(upcomingPayments)}</span>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">تراز نهایی ماه (پیش‌بینی)</span>
            <span className={`text-sm font-black ${monthlyBalance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {monthlyBalance >= 0 ? '+' : ''}{formatCurrency(monthlyBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access to Members Summary */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-800 pr-2">تراز مالی به تفکیک اعضا</h3>
        <div className="grid gap-3">
          {members.slice(0, 3).map(member => {
            const mAssets = assets.filter(a => a.memberId === member.id).reduce((s, a) => s + a.amount, 0);
            const mDebts = debts.filter(d => d.memberId === member.id).reduce((s, d) => s + d.totalAmount, 0);
            const balance = mAssets - mDebts;

            return (
              <div key={member.id} className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {member.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{member.name}</p>
                    <p className="text-[10px] text-gray-400">{member.relation}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black ${balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            );
          })}
          {members.length > 3 && (
            <button 
              onClick={() => onNavigate('MEMBERS')}
              className="w-full py-2 text-indigo-600 text-xs font-bold bg-indigo-50 rounded-xl"
            >
              مشاهده سایر اعضا
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
