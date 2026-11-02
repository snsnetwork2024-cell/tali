import React from 'react';
import { 
  Home, 
  Receipt, 
  Users, 
  Plus, 
  BarChart3, 
  Wallet 
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickPos: () => void;
  unreadCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickPos
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 xl:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`min-w-[48px] min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'dashboard'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">ড্যাশবোর্ড</span>
        </button>

        {/* Tab 2: Transactions */}
        <button
          onClick={() => setActiveTab('transactions')}
          className={`min-w-[48px] min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'transactions'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">লেনদেন</span>
        </button>

        {/* Center Floating Quick POS Trigger */}
        <div className="relative -top-3">
          <button
            onClick={onOpenQuickPos}
            className="w-13 h-13 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform ring-4 ring-white dark:ring-slate-900"
            title="নতুন লেনদেন"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Customer Ledger */}
        <button
          onClick={() => setActiveTab('customers')}
          className={`min-w-[48px] min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'customers'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">বাকি খাতা</span>
        </button>

        {/* Tab 4: Reports / SIMs */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`min-w-[48px] min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'reports'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">লাভ রিপোর্ট</span>
        </button>

      </div>
    </div>
  );
};
