
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MemberForm from './components/MemberForm';
import AssetForm from './components/AssetForm';
import DebtForm from './components/DebtForm';
import IncomeForm from './components/IncomeForm';
import Reports from './components/Reports';
import InstallmentManager from './components/InstallmentManager';
import { Member, Asset, Debt, RecurringIncome, AppView } from './types';
import { dbService, STORES } from './db';
import { X, Users, Wallet, CreditCard, Banknote, ListOrdered, Edit3, Trash2, PlusCircle } from 'lucide-react';
import { formatCurrency, toJalaliString } from './utils/dateUtils';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('DASHBOARD');
  const [members, setMembers] = useState<Member[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [incomes, setIncomes] = useState<RecurringIncome[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingDebtId, setViewingDebtId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [m, a, d, i] = await Promise.all([
      dbService.getAll<Member>(STORES.MEMBERS),
      dbService.getAll<Asset>(STORES.ASSETS),
      dbService.getAll<Debt>(STORES.DEBTS),
      dbService.getAll<RecurringIncome>(STORES.INCOME)
    ]);
    setMembers(m || []);
    setAssets(a || []);
    setDebts(d || []);
    setIncomes(i || []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNavigateFromDashboard = (view: AppView) => {
    setActiveView(view);
    setIsFormOpen(false);
  };

  const handleOpenAddForm = (view: AppView) => {
    setEditingItem(null);
    setActiveView(view);
    setIsFormOpen(true);
    setIsAddMenuOpen(false);
  };

  const handleSaveMember = async (member: Member) => {
    await dbService.put(STORES.MEMBERS, member);
    fetchData();
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSaveAsset = async (asset: Asset) => {
    await dbService.put(STORES.ASSETS, asset);
    fetchData();
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSaveDebt = async (debt: Debt) => {
    await dbService.put(STORES.DEBTS, debt);
    await fetchData();
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSaveIncome = async (income: RecurringIncome) => {
    await dbService.put(STORES.INCOME, income);
    fetchData();
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (store: string, id: string) => {
    if (confirm('آیا از حذف این مورد اطمینان دارید؟')) {
      await dbService.delete(store, id);
      fetchData();
    }
  };

  const renderContent = () => {
    if (isFormOpen) {
      if (activeView === 'MEMBERS') return <MemberForm member={editingItem} onSave={handleSaveMember} onCancel={() => setIsFormOpen(false)} />;
      if (activeView === 'ASSETS') return <AssetForm asset={editingItem} members={members} onSave={handleSaveAsset} onCancel={() => setIsFormOpen(false)} />;
      if (activeView === 'DEBTS') return <DebtForm debt={editingItem} members={members} onSave={handleSaveDebt} onCancel={() => setIsFormOpen(false)} />;
      if (activeView === 'INCOME') return <IncomeForm income={editingItem} members={members} onSave={handleSaveIncome} onCancel={() => setIsFormOpen(false)} />;
    }

    const currentViewingDebt = debts.find(d => d.id === viewingDebtId);
    if (currentViewingDebt) {
      return (
        <InstallmentManager 
          debt={currentViewingDebt} 
          onUpdate={handleSaveDebt} 
          onClose={() => setViewingDebtId(null)} 
        />
      );
    }

    switch (activeView) {
      case 'DASHBOARD':
        return <Dashboard 
          members={members} 
          assets={assets} 
          debts={debts} 
          incomes={incomes} 
          onNavigate={handleNavigateFromDashboard} 
        />;
      
      case 'MEMBERS':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black pr-2 border-r-4 border-indigo-600 text-gray-800">اعضای خانواده</h2>
              <button onClick={() => setIsFormOpen(true)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl"><PlusCircle className="w-5 h-5" /></button>
            </div>
            <div className="grid gap-3">
              {members.map(m => (
                <div key={m.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">{m.name[0]}</div>
                    <div>
                      <h4 className="font-bold text-gray-800">{m.name}</h4>
                      <p className="text-xs text-gray-500">{m.relation}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingItem(m); setIsFormOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(STORES.MEMBERS, m.id)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {members.length === 0 && <p className="text-center text-gray-400 py-12">هنوز عضوی ثبت نشده است.</p>}
            </div>
          </div>
        );

      case 'ASSETS':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black pr-2 border-r-4 border-green-600 text-gray-800">لیست دارایی‌ها</h2>
              <button onClick={() => setIsFormOpen(true)} className="p-2 text-green-600 bg-green-50 rounded-xl"><PlusCircle className="w-5 h-5" /></button>
            </div>
            <div className="grid gap-3">
              {assets.map(a => (
                <div key={a.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-800">{a.name}</h4>
                      <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        {members.find(m => m.id === a.memberId)?.name}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-indigo-700 text-sm">{formatCurrency(a.amount)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-50 mt-2">
                    <button onClick={() => { setEditingItem(a); setIsFormOpen(true); }} className="text-xs text-indigo-600 font-bold px-3 py-1 bg-indigo-50 rounded-lg">ویرایش</button>
                    <button onClick={() => handleDelete(STORES.ASSETS, a.id)} className="text-xs text-red-500 font-bold px-3 py-1 bg-red-50 rounded-lg">حذف</button>
                  </div>
                </div>
              ))}
              {assets.length === 0 && <p className="text-center text-gray-400 py-12">هیچ دارایی ثبت نشده است.</p>}
            </div>
          </div>
        );

      case 'INCOME':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black pr-2 border-r-4 border-emerald-600 text-gray-800">درآمدهای مستمر</h2>
              <button onClick={() => setIsFormOpen(true)} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl"><PlusCircle className="w-5 h-5" /></button>
            </div>
            <div className="grid gap-3">
              {incomes.map(inc => (
                <div key={inc.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-800">{inc.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">
                        دریافت در روز <span className="font-bold text-gray-800">{inc.dayOfMonth}</span> هر ماه
                      </p>
                      <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        توسط {members.find(m => m.id === inc.memberId)?.name}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-emerald-600 text-sm">{formatCurrency(inc.amount)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-50 mt-2">
                    <button onClick={() => { setEditingItem(inc); setIsFormOpen(true); }} className="text-xs text-indigo-600 font-bold px-3 py-1 bg-indigo-50 rounded-lg">ویرایش</button>
                    <button onClick={() => handleDelete(STORES.INCOME, inc.id)} className="text-xs text-red-500 font-bold px-3 py-1 bg-red-50 rounded-lg">حذف</button>
                  </div>
                </div>
              ))}
              {incomes.length === 0 && <p className="text-center text-gray-400 py-12">هیچ درآمد مستمری ثبت نشده است.</p>}
            </div>
          </div>
        );

      case 'DEBTS':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black pr-2 border-r-4 border-red-600 text-gray-800">بدهی‌ها و وام‌ها</h2>
              <button onClick={() => setIsFormOpen(true)} className="p-2 text-red-600 bg-red-50 rounded-xl"><PlusCircle className="w-5 h-5" /></button>
            </div>
            <div className="grid gap-3">
              {debts.map(d => {
                const paidCount = d.installments.filter(i => i.status === 'PAID').length;
                const totalCount = d.installments.length;
                const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
                return (
                  <div key={d.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div onClick={() => setViewingDebtId(d.id)} className="cursor-pointer flex-1">
                        <h4 className="font-bold text-gray-800">{d.name}</h4>
                        <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">
                          بدهکار: {members.find(m => m.id === d.memberId)?.name}
                        </p>
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>پیشرفت بازپرداخت</span>
                            <span>{paidCount} از {totalCount} قسط</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-red-600 text-sm">{formatCurrency(d.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-3 border-t border-gray-50 mt-3">
                      <button onClick={() => setViewingDebtId(d.id)} className="flex items-center gap-1 text-xs text-amber-700 font-bold px-3 py-1 bg-amber-50 rounded-lg">
                        <ListOrdered className="w-4 h-4" /> مدیریت اقساط
                      </button>
                      <button onClick={() => { setEditingItem(d); setIsFormOpen(true); }} className="text-xs text-indigo-600 font-bold px-3 py-1 bg-indigo-50 rounded-lg">ویرایش</button>
                      <button onClick={() => handleDelete(STORES.DEBTS, d.id)} className="text-xs text-red-500 font-bold px-3 py-1 bg-red-50 rounded-lg">حذف</button>
                    </div>
                  </div>
                );
              })}
              {debts.length === 0 && <p className="text-center text-gray-400 py-12">هیچ بدهی ثبت نشده است.</p>}
            </div>
          </div>
        );

      case 'REPORTS':
        return <Reports members={members} assets={assets} debts={debts} incomes={incomes} />;

      default:
        return <div>در حال توسعه...</div>;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView} 
      onAddClick={() => setIsAddMenuOpen(true)}
      isAddMenuOpen={isAddMenuOpen}
    >
      {renderContent()}

      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-20 sm:pb-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddMenuOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-800">ثبت اطلاعات جدید</h3>
              <button onClick={() => setIsAddMenuOpen(false)} className="p-2 bg-gray-100 rounded-full active:scale-90 transition-transform">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleOpenAddForm('MEMBERS')} className="flex flex-col items-center gap-3 p-5 bg-indigo-50 text-indigo-700 rounded-3xl hover:bg-indigo-100 transition-all border border-indigo-100/50">
                <div className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg shadow-indigo-200"><Users className="w-7 h-7" /></div>
                <span className="font-bold text-sm">عضو جدید</span>
              </button>
              <button onClick={() => handleOpenAddForm('ASSETS')} className="flex flex-col items-center gap-3 p-5 bg-green-50 text-green-700 rounded-3xl hover:bg-green-100 transition-all border border-green-100/50">
                <div className="bg-green-600 text-white p-3.5 rounded-2xl shadow-lg shadow-green-200"><Wallet className="w-7 h-7" /></div>
                <span className="font-bold text-sm">دارایی جدید</span>
              </button>
              <button onClick={() => handleOpenAddForm('DEBTS')} className="flex flex-col items-center gap-3 p-5 bg-red-50 text-red-700 rounded-3xl hover:bg-red-100 transition-all border border-red-100/50">
                <div className="bg-red-600 text-white p-3.5 rounded-2xl shadow-lg shadow-red-200"><CreditCard className="w-7 h-7" /></div>
                <span className="font-bold text-sm">بدهی جدید</span>
              </button>
              <button onClick={() => handleOpenAddForm('INCOME')} className="flex flex-col items-center gap-3 p-5 bg-emerald-50 text-emerald-700 rounded-3xl hover:bg-emerald-100 transition-all border border-emerald-100/50">
                <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg shadow-emerald-200"><Banknote className="w-7 h-7" /></div>
                <span className="font-bold text-sm">درآمد جدید</span>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-8">اطلاعات ثبت شده در مرورگر شما ذخیره خواهند شد.</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
