import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PieChart, 
  DollarSign, 
  FileText,
  X
} from 'lucide-react';
import { MonthlyProfitReport, ShopSettings, ShopExpense } from '../types';
import { TeleKhattaDB } from '../services/db';
import { formatBanglaCurrency, exportMonthlyReportCSV } from '../utils/printAndExport';

interface MonthlyReportViewProps {
  settings: ShopSettings;
  expenses: ShopExpense[];
  onRefreshData: () => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  settings,
  expenses,
  onRefreshData
}) => {
  const currentMonthKey = new Date().toISOString().substring(0, 7); // "2026-11"
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // New Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<ShopExpense['category']>('refreshment');
  const [expNote, setExpNote] = useState('');

  // Month options for the selector
  const monthOptions = [
    { key: '2026-11', label: 'নভেম্বর ২০২৬ (চলতি মাস)' },
    { key: '2026-10', label: 'অক্টোবর ২০২৬' },
    { key: '2026-09', label: 'সেপ্টেম্বর ২০২৬' },
    { key: '2026-08', label: 'আগস্ট ২০২৬' }
  ];

  const report: MonthlyProfitReport = TeleKhattaDB.generateMonthlyReport(selectedMonthKey);
  const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonthKey));

  const handlePrint = () => {
    window.print();
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!amt || amt <= 0 || !expTitle.trim()) {
      alert('অনুগ্রহ করে সঠিক বিবরণ ও টাকার পরিমাণ দিন!');
      return;
    }

    const currentExpenses = TeleKhattaDB.getExpenses();
    const newExp: ShopExpense = {
      id: 'exp-' + Date.now(),
      category: expCategory,
      title: expTitle.trim(),
      amount: amt,
      note: expNote.trim() || undefined,
      date: `${selectedMonthKey}-01T12:00:00.000Z`,
      paidFrom: 'drawer'
    };

    currentExpenses.unshift(newExp);
    TeleKhattaDB.saveExpenses(currentExpenses);

    // Deduct from drawer
    const s = TeleKhattaDB.getSettings();
    s.drawerCash -= amt;
    TeleKhattaDB.saveSettings(s);

    TeleKhattaDB.addLog(
      'দোকান খরচ এন্ট্রি',
      `${newExp.title}: ৳${amt.toLocaleString('en-US')} ড্রয়ার থেকে খরচ হিসেবে কাটা হয়েছে`,
      'system',
      'info'
    );

    setIsAddExpenseOpen(false);
    setExpTitle('');
    setExpAmount('');
    setExpNote('');
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Month Selector & Action Bar (Hidden on Print) */}
      <div className="no-print p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <div className="text-[11px] text-slate-500 font-medium">মাসিক লাভ-ক্ষতির রিপোর্ট দেখতে মাস নির্বাচন করুন:</div>
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="mt-0.5 px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
            >
              {monthOptions.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            <span>খরচ যুক্ত করুন</span>
          </button>

          <button
            onClick={() => exportMonthlyReportCSV(report)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>CSV ডাউনলোড</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>স্টেটমেন্ট প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Printable Formal Statement Area */}
      <div className="print-container p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Printable Formal Header */}
        <div className="text-center pb-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {settings.shopName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {settings.address} | মোবাইল: {settings.phone}
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
            মাসিক লাভ ও ক্ষতি বিবরণী (Profit & Loss Statement) — {report.monthName}
          </div>
        </div>

        {/* Big 4 KPI Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-500">মোট লেনদেন (Turnover)</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {formatBanglaCurrency(report.totalTurnover)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{report.totalTransactionsCount} টি লেনদেন</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">মোট অর্জিত আয় / গ্রস লাভ</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatBanglaCurrency(report.grossProfit)}
            </div>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">কমিশন ও মার্জিন</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">মোট দোকান পরিচালন ব্যয়</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {formatBanglaCurrency(report.totalExpenses)}
            </div>
            <span className="text-[11px] text-rose-600/80 mt-0.5 block">{monthExpenses.length} টি খরচের হিসাব</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
            <span className="text-xs font-semibold text-slate-300">মাসিক নিট মুনাফা (Net Profit)</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
              {formatBanglaCurrency(report.netProfit)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">আয় মাইনাস ব্যয়</span>
          </div>

        </div>

        {/* Detailed Breakdown Grids: Revenue vs Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Revenue & Commission Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ১. অর্জিত কমিশন ও মার্জিন তালিকা (Income)
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">বিকাশ ও নগদ ক্যাশআউট কমিশন:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  +{formatBanglaCurrency(report.mfsCommissions)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">ফ্লেক্সিলোড / রিচার্জ কমিশন (২৮৳/হাজার):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  +{formatBanglaCurrency(report.flexiloadCommissions)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">মিনিট ও ইন্টারনেট কার্ড বিক্রির মার্জিন:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  +{formatBanglaCurrency(report.cardProfits)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">অতিরিক্ত সার্ভিস চার্জ / ফি:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  +{formatBanglaCurrency(report.otherFees)}
                </span>
              </div>

              <div className="flex justify-between py-2.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 rounded-xl mt-2">
                <span>সর্বমোট অর্জিত আয় (Gross Income):</span>
                <span className="font-mono text-sm">{formatBanglaCurrency(report.grossProfit)}</span>
              </div>
            </div>
          </div>

          {/* Shop Operating Expenses Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ২. দোকান পরিচালন ব্যয় (Expenses)
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              {monthExpenses.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  এই মাসে কোনো অতিরিক্ত খরচ রেকর্ড করা হয়নি
                </div>
              ) : (
                monthExpenses.map(exp => (
                  <div key={exp.id} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{exp.title}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({exp.category})</span>
                    </div>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{formatBanglaCurrency(exp.amount)}
                    </span>
                  </div>
                ))
              )}

              <div className="flex justify-between py-2.5 font-bold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 px-3 rounded-xl mt-2">
                <span>সর্বমোট দোকান ব্যয় (Total Expenses):</span>
                <span className="font-mono text-sm">{formatBanglaCurrency(report.totalExpenses)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Customer Dues Cash Flow Analysis */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            ৩. চলতি মাসের কাস্টমার বাকি ক্যাশফ্লো বিশ্লেষণ:
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500">এই মাসে নতুন বাকি দেওয়া হয়েছে:</span>
              <div className="font-mono font-bold text-rose-600 mt-0.5">
                {formatBanglaCurrency(report.newCustomerDuesGiven)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">এই মাসে বাকি আদায় হয়েছে:</span>
              <div className="font-mono font-bold text-emerald-600 mt-0.5">
                {formatBanglaCurrency(report.customerDuesCollected)}
              </div>
            </div>
          </div>
        </div>

        {/* Signatures Area for Formal Print */}
        <div className="print-only pt-12 flex justify-between text-xs text-slate-700">
          <div className="border-t border-slate-400 pt-1 w-40 text-center">
            হিসাব পরিচালনাকারী
          </div>
          <div className="border-t border-slate-400 pt-1 w-40 text-center">
            স্বত্বাধিকারীর স্বাক্ষর
          </div>
        </div>

      </div>

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                নতুন দোকান খরচ যুক্ত করুন
              </h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">খরচের শিরোনাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: দোকান ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন"
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">খরচের খাত / ক্যাটাগরি</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as ShopExpense['category'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  <option value="rent">দোকান ভাড়া</option>
                  <option value="electricity">বিদ্যুৎ বিল</option>
                  <option value="staff">কর্মচারীর বেতন</option>
                  <option value="refreshment">চা-নাস্তা / আপ্যায়ন</option>
                  <option value="transport">যাতায়াত</option>
                  <option value="misc">অন্যান্য বিবিধ খরচ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">টাকার পরিমাণ *</label>
                <input
                  type="number"
                  placeholder="যেমন: 1500"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">এই টাকা দোকানের ড্রয়ার ক্যাশ থেকে স্বয়ংক্রিয়ভাবে বাদ যাবে।</span>
              </div>

              <div>
                <label className="block font-semibold mb-1">নোট বা মন্তব্য</label>
                <input
                  type="text"
                  placeholder="ঐচ্ছিক"
                  value={expNote}
                  onChange={e => setExpNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  খরচ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
