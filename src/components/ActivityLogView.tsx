import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Filter
} from 'lucide-react';
import { ActivityLog } from '../types';
import { formatBanglaDateTime } from '../utils/printAndExport';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  onRefreshData: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  logs,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (!log.action.toLowerCase().includes(q) && !log.details.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    return true;
  });

  const getLevelBadge = (level: ActivityLog['level']) => {
    switch (level) {
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
            <CheckCircle className="w-3 h-3" />
            সফল
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
            <AlertTriangle className="w-3 h-3" />
            সতর্কতা
          </span>
        );
      case 'security':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
            <ShieldAlert className="w-3 h-3" />
            সিকিউরিটি
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
            <Info className="w-3 h-3" />
            তথ্য
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header Info */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              রিয়েল-টাইম অ্যাক্টিভিটি ট্র্যাকিং ও অডিট লগ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              দোকানের প্রতিটি লেনদেন, ব্যালেন্স পরিবর্তন ও সিকিউরিটি ইভেন্ট লাইভ ট্র্যাক হচ্ছে
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshData}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="অ্যাক্টিভিটি বা বিবরণ দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">সকল ক্যাটাগরি</option>
            <option value="transaction">লেনদেন (Transaction)</option>
            <option value="ledger">বাকি খতিয়ান (Ledger)</option>
            <option value="stock">স্টক ও প্যাক (Stock)</option>
            <option value="security">সিকিউরিটি (Security)</option>
            <option value="system">সিস্টেম ও ব্যালেন্স (System)</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">সকল লেভেল</option>
            <option value="success">সফল (Success)</option>
            <option value="info">তথ্য (Info)</option>
            <option value="warning">সতর্কবার্তা (Warning)</option>
            <option value="security">নিরাপত্তা (Security)</option>
          </select>

          <span className="text-xs text-slate-400 self-center ml-auto">
            মোট রেকর্ড: {filteredLogs.length} টি
          </span>
        </div>
      </div>

      {/* Log Feed */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            কোনো অ্যাক্টিভিটি লগ পাওয়া যায়নি
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition hover:bg-slate-100/70 dark:hover:bg-slate-800"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {log.action}
                  </span>
                  {getLevelBadge(log.level)}
                  <span className="text-[10px] uppercase font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                    {log.category}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {log.details}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 whitespace-nowrap self-end sm:self-center">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatBanglaDateTime(log.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
