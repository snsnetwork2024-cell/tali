import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Smartphone, 
  Volume2, 
  AlertTriangle, 
  CheckCircle, 
  Clock 
} from 'lucide-react';
import { NotificationService, AppNotification } from '../services/notificationService';
import { formatBanglaDateTime } from '../utils/printAndExport';
import { playCashRegisterSound } from '../utils/sound';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshUnread: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onRefreshUnread
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permStatus, setPermStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isOpen) {
      setNotifications(NotificationService.getNotifications());
      setPermStatus(NotificationService.getPermissionStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    const res = await NotificationService.requestPermission();
    setPermStatus(res);
    if (res === 'granted') {
      NotificationService.notify(
        'পুশ নোটিফিকেশন চালু হয়েছে!',
        'এখন থেকে সকল লেনদেন ও ব্যালেন্স সতর্কতার লাইভ নোটিফিকেশন পাবেন।',
        'system'
      );
      setNotifications(NotificationService.getNotifications());
      onRefreshUnread();
    }
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead();
    setNotifications(NotificationService.getNotifications());
    onRefreshUnread();
  };

  const handleClearAll = () => {
    NotificationService.clearAll();
    setNotifications([]);
    onRefreshUnread();
  };

  const handleTestSound = () => {
    playCashRegisterSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              লাইভ পুশ নোটিফিকেশন
            </h3>
            <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
              {notifications.filter(n => !n.read).length} টি নতুন
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Notification Permission Banner */}
        {permStatus !== 'granted' && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs">
            <div className="text-rose-900 dark:text-rose-200">
              <span className="font-bold">মোবাইল বা পিসি পুশ নোটিফিকেশন:</span> সরাসরি ডিভাইসে লাইভ অ্যালার্ট পেতে অনুমতি দিন।
            </div>
            <button
              onClick={handleRequestPush}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg whitespace-nowrap text-xs shadow-xs"
            >
              চালু করুন
            </button>
          </div>
        )}

        {/* Quick Toolbar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={handleTestSound}
            className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900"
            title="সাউন্ড পরীক্ষা করুন"
          >
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <span>সাউন্ড টেস্ট</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              সব পঠিত করুন
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleClearAll}
              className="text-xs text-rose-600 hover:underline"
            >
              মুছে ফেলুন
            </button>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">কোনো নোটিফিকেশন নেই</p>
              <p className="text-[11px] text-slate-400">নতুন লেনদেন বা ব্যালেন্স অ্যালার্ট হলে এখানে প্রদর্শিত হবে।</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border transition ${
                  !n.read 
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' 
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {n.title}
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1" />
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {n.body}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatBanglaDateTime(n.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
