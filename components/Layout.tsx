
import React from 'react';
import { Home, BarChart3, Plus } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onAddClick: () => void;
  isAddMenuOpen: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, onAddClick, isAddMenuOpen }) => {
  return (
    <div className="flex flex-col min-h-screen pb-20 max-w-md mx-auto bg-gray-50 shadow-xl relative overflow-x-hidden">
      <header className="sticky top-0 z-10 bg-indigo-600 text-white p-4 shadow-md flex items-center justify-between">
        <h1 className="text-xl font-bold">مدیریت مالی</h1>
        <div className="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center border border-indigo-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="flex-1 p-4 overflow-x-hidden">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around items-center z-20 h-16 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        
        {/* ثبت جدید - سمت راست */}
        <button
          onClick={onAddClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            isAddMenuOpen ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${isAddMenuOpen ? 'bg-indigo-50' : ''}`}>
            <Plus className={`w-6 h-6 transition-transform ${isAddMenuOpen ? 'rotate-45' : ''}`} />
          </div>
          <span className="text-[10px] mt-1 font-bold">ثبت </span>
        </button>

        {/* داشبورد - مرکز */}
        <button
          onClick={() => setActiveView('DASHBOARD')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            activeView === 'DASHBOARD' && !isAddMenuOpen ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeView === 'DASHBOARD' && !isAddMenuOpen ? 'bg-indigo-50' : ''}`}>
            <Home className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-bold">داشبورد</span>
        </button>

        {/* گزارشات - سمت چپ */}
        <button
          onClick={() => setActiveView('REPORTS')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            activeView === 'REPORTS' && !isAddMenuOpen ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeView === 'REPORTS' && !isAddMenuOpen ? 'bg-indigo-50' : ''}`}>
            <BarChart3 className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-bold">گزارشات</span>
        </button>

      </nav>
    </div>
  );
};

export default Layout;
