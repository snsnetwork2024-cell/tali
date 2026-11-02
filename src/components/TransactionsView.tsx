import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Filter, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Transaction, ShopSettings } from '../types';
import { formatBanglaCurrency, formatBanglaDateTime, exportTransactionsCSV } from '../utils/printAndExport';

interface TransactionsViewProps {
  transactions: Transaction[];
  settings: ShopSettings;
  onSelectTransactionToPrint: (trx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  settings,
  onSelectTransactionToPrint,
  onDeleteTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('all');

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thisMonthStr = now.toISOString().substring(0, 7);

    return transactions.filter(t => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchPhone = t.customerPhone?.toLowerCase().includes(query);
        const matchName = t.customerName?.toLowerCase().includes(query);
        const matchTrxId = t.trxId?.toLowerCase().includes(query);
        const matchId = t.id.toLowerCase().includes(query);
        if (!matchPhone && !matchName && !matchTrxId && !matchId) return false;
      }

      // Service filter
      if (serviceFilter !== 'all') {
        if (serviceFilter === 'flexiload') {
          if (!['gp', 'bl', 'robi', 'airtel', 'teletalk'].includes(t.service) && t.type !== 'flexiload') return false;
        } else if (t.service !== serviceFilter) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }

      // Date filter
      if (dateFilter === 'today') {
        return t.createdAt.startsWith(todayStr);
      } else if (dateFilter === 'yesterday') {
        return t.createdAt.startsWith(yesterdayStr);
      } else if (dateFilter === 'week') {
        return new Date(t.createdAt) >= sevenDaysAgo;
      } else if (dateFilter === 'month') {
        return t.createdAt.startsWith(thisMonthStr);
      }

      return true;
    });
  }, [transactions, searchTerm, serviceFilter, typeFilter, dateFilter]);

  const totalFilteredVolume = filtered.reduce((acc, t) => acc + t.amount, 0);
  const totalFilteredProfit = filtered.reduce((acc, t) => acc + t.profit, 0);

  const handleDelete = (id: string, amount: number) => {
    const pin = prompt(`লেনদেন ডিলিট নিশ্চিত করতে অ্যাডমিন পিন (Master PIN) প্রবেশ করুন:\n(টাকার পরিমাণ: ৳${amount})`);
    if (pin === settings.masterPin) {
      onDeleteTransaction(id);
    } else if (pin !== null) {
      alert('ভুল পিন কোড! লেনদেন ডিলিট করা সম্ভব হয়নি।');
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="মোবাইল নম্বর, নাম, TrxID বা রসিদ নং দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Export to CSV Button */}
          <button
            onClick={() => exportTransactionsCSV(filtered)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>CSV এক্সপোর্ট ({filtered.length})</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* Date Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['today', 'yesterday', 'week', 'month', 'all'] as const).map(df => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  dateFilter === df
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {df === 'today' ? 'আজ' : df === 'yesterday' ? 'গতকাল' : df === 'week' ? '৭ দিন' : df === 'month' ? 'এই মাস' : 'সব'}
              </button>
            ))}
          </div>

          {/* Service Dropdown */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">সকল সার্ভিস</option>
            <option value="bkash">বিকাশ (bKash)</option>
            <option value="nagad">নগদ (Nagad)</option>
            <option value="rocket">রকেট (Rocket)</option>
            <option value="flexiload">মোবাইল রিচার্জ (Flexiload)</option>
            <option value="card">মিনিট ও ডাটা কার্ড</option>
            <option value="customer">বাকি ও জমা</option>
            <option value="expense">দোকান খরচ</option>
          </select>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">সকল ধরন</option>
            <option value="cash_out">ক্যাশ আউট</option>
            <option value="cash_in">ক্যাশ ইন</option>
            <option value="flexiload">ফ্লেক্সিলোড</option>
            <option value="card_sale">কার্ড বিক্রি</option>
            <option value="customer_payment">বাকি আদায়</option>
            <option value="customer_due">বাকি দেওয়া</option>
            <option value="shop_expense">দোকান খরচ</option>
          </select>

        </div>
      </div>

      {/* Summary KPI Bar for current filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600 dark:text-slate-400">ফিল্টারে মোট:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">{filtered.length} টি</span>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-500 mr-1.5">মোট লেনদেন:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{formatBanglaCurrency(totalFilteredVolume)}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">অর্জিত লাভ:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{formatBanglaCurrency(totalFilteredProfit)}</span>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold">কোনো লেনদেন পাওয়া যায়নি</p>
            <p className="text-xs">অনুসন্ধান বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-3.5 py-2.5 rounded-l-lg">তারিখ ও সময়</th>
                  <th className="px-3.5 py-2.5">সার্ভিস</th>
                  <th className="px-3.5 py-2.5">গ্রাহকের তথ্য</th>
                  <th className="px-3.5 py-2.5">TrxID / নোট</th>
                  <th className="px-3.5 py-2.5 text-right">পরিমাণ</th>
                  <th className="px-3.5 py-2.5 text-right">অর্জিত লাভ</th>
                  <th className="px-3.5 py-2.5 text-center rounded-r-lg">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(trx => (
                  <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-3.5 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {formatBanglaDateTime(trx.createdAt)}
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="font-bold uppercase text-slate-800 dark:text-slate-200">
                        {trx.service}
                      </span>
                      <span className="text-slate-500 text-[11px] block">
                        {trx.type === 'cash_out' ? 'ক্যাশ আউট' : trx.type === 'cash_in' ? 'ক্যাশ ইন' : trx.type === 'flexiload' ? 'রিচার্জ' : trx.type === 'card_sale' ? 'প্যাক বিক্রি' : trx.type === 'customer_payment' ? 'বাকি আদায়' : trx.type === 'customer_due' ? 'বাকি প্রদান' : 'খরচ'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {trx.customerPhone || 'কাউন্টার সরাসরি'}
                      </div>
                      {trx.customerName && (
                        <div className="text-[11px] text-slate-500">{trx.customerName}</div>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-[11px] font-mono text-slate-500 max-w-[150px] truncate">
                      {trx.trxId ? <span className="font-bold text-rose-600 dark:text-rose-400">{trx.trxId}</span> : (trx.packDetails || trx.note || '-')}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatBanglaCurrency(trx.amount)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{formatBanglaCurrency(trx.profit)}
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectTransactionToPrint(trx)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition"
                          title="রসিদ স্লিপ প্রিন্ট"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(trx.id, trx.amount)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition"
                          title="লেনদেন ডিলিট (পিন সুরক্ষিত)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
