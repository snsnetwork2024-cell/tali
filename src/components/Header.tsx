import React from 'react';
import { 
  Plus, 
  Bell, 
  Lock, 
  Smartphone, 
  RefreshCw,
  Wallet,
  Cloud
} from 'lucide-react';
import { ShopSettings } from '../types';
import { formatBanglaCurrency } from '../utils/printAndExport';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  settings: ShopSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickPos: () => void;
  onLockScreen: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  totalSimBalance: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  setActiveTab,
  onOpenQuickPos,
  onLockScreen,
  onOpenNotifications,
  unreadCount,
  totalSimBalance
}) => {
  const { isInstallable, install } = usePWAInstall();

  const navLinks = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড' },
    { id: 'transactions', label: 'সকল লেনদেন' },
    { id: 'customers', label: 'বাকি খতিয়ান' },
    { id: 'cards', label: 'মিনিট ও এমবি প্যাক' },
    { id: 'wallets', label: 'সিম ও ড্রয়ার ক্যাশ' },
    { id: 'reports', label: 'মাসিক লাভ-ক্ষতি' },
    { id: 'activities', label: 'অ্যাক্টিভিটি ট্র্যাকিং' },
    { id: 'security', label: 'সিকিউরিটি ও ব্যাকআপ' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Bar Zone: Brand - Nav - Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Single text element wordmark / brand identity */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center font-bold text-lg text-white shadow-sm ring-1 ring-white/20">
                ৳
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold tracking-tight text-white block leading-tight">
                  {settings.shopName}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  টেলিকম ও এমএফএস পয়েন্ট
                </span>
              </div>
              <div className="sm:hidden">
                <span className="text-sm font-bold text-white tracking-tight">Mawa Enterprise</span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === link.id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Action & Quick Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Balance Glance (Drawer & SIMs) on desktop */}
            <div className="hidden md:flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="text-slate-400">ড্রয়ার:</span>
                <span className="font-mono font-bold">{formatBanglaCurrency(settings.drawerCash)}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">সিম:</span>
                <span className="font-mono font-bold">{formatBanglaCurrency(totalSimBalance)}</span>
              </div>
            </div>

            {/* PWA Install Button if available */}
            {isInstallable && (
              <button
                onClick={install}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-600/50 transition-colors whitespace-nowrap"
                title="মোবাইল বা পিসিতে অ্যাপ ইনস্টল করুন"
              >
                <Smartphone className="w-3.5 h-3.5" />
                ইনস্টল
              </button>
            )}

            {/* Google Drive Cloud Auto Backup Quick Indicator */}
            <button
              onClick={() => setActiveTab('security')}
              className="relative p-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
              title={settings.lastDriveBackupAt ? `গুগল ড্রাইভ ক্লাউড ব্যাকআপ (সর্বশেষ: ${new Date(settings.lastDriveBackupAt).toLocaleDateString('bn-BD')})` : 'গুগল ড্রাইভ ক্লাউড ব্যাকআপ'}
            >
              <Cloud className="w-4 h-4 text-sky-400" />
              {settings.lastDriveBackupAt && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              )}
            </button>

            {/* Notifications Alert Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="পুশ নোটিফিকেশন"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
              )}
            </button>

            {/* Master Security Lock Button */}
            <button
              onClick={onLockScreen}
              className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="পিন কোড দিয়ে লক করুন"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Main Primary Action: New POS Transaction */}
            <button
              onClick={onOpenQuickPos}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-lg shadow-sm transition active:scale-95 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন লেনদেন</span>
            </button>
          </div>

        </div>
      </div>

      {/* Sub-navigation bar for tablet/small desktop viewports */}
      <div className="xl:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 no-scrollbar">
        {navLinks.map(link => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === link.id
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};
