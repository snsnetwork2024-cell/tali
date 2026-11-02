import React, { useState } from 'react';
import { 
  Wallet, 
  Smartphone, 
  Plus, 
  RefreshCw, 
  AlertTriangle, 
  Coins, 
  Calculator, 
  CheckCircle,
  ArrowRightLeft,
  X,
  SlidersHorizontal,
  Edit3,
  Settings2,
  Trash2,
  User,
  ShieldCheck,
  Building2,
  PhoneCall,
  Info
} from 'lucide-react';
import { SimWallet, ShopSettings, SimWalletType, ServiceType } from '../types';
import { TeleKhattaDB } from '../services/db';
import { formatBanglaCurrency } from '../utils/printAndExport';

interface WalletsViewProps {
  wallets: SimWallet[];
  settings: ShopSettings;
  onRefreshData: () => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  wallets,
  settings,
  onRefreshData
}) => {
  // Filter tabs: 'all' | 'agent' | 'personal'
  const [filterType, setFilterType] = useState<'all' | 'agent' | 'personal'>('all');

  // Add SIM Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWalletType, setNewWalletType] = useState<SimWalletType>('agent');
  const [newService, setNewService] = useState<ServiceType>('bkash');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newThreshold, setNewThreshold] = useState('2000');
  const [newDeductFromDrawer, setNewDeductFromDrawer] = useState(false);
  const [newNotes, setNewNotes] = useState('');

  // Edit SIM Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string>('');
  const [editWalletType, setEditWalletType] = useState<SimWalletType>('agent');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Refill Modal state
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');
  const [refillAmount, setRefillAmount] = useState<string>('');
  const [refillSource, setRefillSource] = useState<'drawer' | 'bank_dsr'>('drawer');

  // Balance Adjustment (Fix SIM Balance) state
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustWalletId, setAdjustWalletId] = useState<string>(wallets[0]?.id || '');
  const [adjustNewBalance, setAdjustNewBalance] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('ব্যালেন্স চেক ও মিলকরণ');
  const [adjustThreshold, setAdjustThreshold] = useState<string>('');
  const [adjustDrawerWithDiff, setAdjustDrawerWithDiff] = useState<boolean>(false);

  // Physical Note Counter Drawer Audit state
  const [showCalculator, setShowCalculator] = useState(false);
  const [notes, setNotes] = useState({
    n1000: 0,
    n500: 0,
    n200: 0,
    n100: 0,
    n50: 0,
    n20: 0,
    n10: 0,
    coins: 0
  });

  const countedDrawerTotal = 
    (notes.n1000 * 1000) +
    (notes.n500 * 500) +
    (notes.n200 * 200) +
    (notes.n100 * 100) +
    (notes.n50 * 50) +
    (notes.n20 * 20) +
    (notes.n10 * 10) +
    notes.coins;

  const drawerMismatch = countedDrawerTotal - settings.drawerCash;

  const totalSimBalance = wallets.reduce((sum, w) => sum + w.currentBalance, 0);
  const agentWallets = wallets.filter(w => (w.walletType || 'agent') === 'agent');
  const personalWallets = wallets.filter(w => w.walletType === 'personal');
  const totalAgentBalance = agentWallets.reduce((sum, w) => sum + w.currentBalance, 0);
  const totalPersonalBalance = personalWallets.reduce((sum, w) => sum + w.currentBalance, 0);

  const filteredWallets = wallets.filter(w => {
    const type = w.walletType || 'agent';
    if (filterType === 'agent') return type === 'agent';
    if (filterType === 'personal') return type === 'personal';
    return true;
  });

  // Open Add SIM Modal with defaults
  const handleOpenAddSim = (defaultType: SimWalletType = 'agent') => {
    setNewWalletType(defaultType);
    setNewService('bkash');
    setNewName(defaultType === 'agent' ? 'বিকাশ এজেন্ট' : 'বিকাশ পার্সোনাল');
    setNewPhone('');
    setNewBalance('0');
    setNewThreshold(defaultType === 'agent' ? '5000' : '2000');
    setNewDeductFromDrawer(false);
    setNewNotes('');
    setIsAddModalOpen(true);
  };

  // Helper when user toggles service or type in Add SIM modal
  const handleServiceOrTypeChange = (service: ServiceType, type: SimWalletType) => {
    setNewService(service);
    setNewWalletType(type);
    
    // Auto suggest name
    let sName = 'সিম';
    if (service === 'bkash') sName = 'বিকাশ';
    else if (service === 'nagad') sName = 'নগদ';
    else if (service === 'rocket') sName = 'রকেট';
    else if (service === 'upay') sName = 'উপায়';
    else if (service === 'gp') sName = 'জিপি ফ্লেক্সিলোড';
    else if (service === 'bl') sName = 'বাংলালিংক ইজিলোড';
    else if (service === 'robi') sName = 'রবি লোড';
    else if (service === 'airtel') sName = 'এয়ারটেল লোড';
    else if (service === 'teletalk') sName = 'টেলিটক লোড';

    const typeStr = type === 'agent' ? 'এজেন্ট' : 'পার্সোনাল';
    setNewName(`${sName} ${typeStr}`);
  };

  // Add SIM Submit
  const handleAddSimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('অনুগ্রহ করে সিমের একটি নাম দিন!');
      return;
    }
    if (!newPhone.trim()) {
      alert('অনুগ্রহ করে সিমের ফোন নম্বর দিন!');
      return;
    }

    const openBal = parseFloat(newBalance) || 0;
    const thresh = parseFloat(newThreshold) || 1000;

    TeleKhattaDB.addSimWallet(
      {
        name: newName.trim(),
        service: newService,
        walletType: newWalletType,
        phone: newPhone.trim(),
        currentBalance: openBal,
        minThreshold: thresh,
        notes: newNotes.trim() || undefined,
        status: 'active'
      },
      newDeductFromDrawer
    );

    setIsAddModalOpen(false);
    onRefreshData();
  };

  // Open Edit SIM Modal
  const handleOpenEdit = (wallet: SimWallet) => {
    setEditingWalletId(wallet.id);
    setEditName(wallet.name);
    setEditPhone(wallet.phone);
    setEditWalletType(wallet.walletType || 'agent');
    setEditThreshold(wallet.minThreshold.toString());
    setEditNotes(wallet.notes || '');
    setIsEditModalOpen(true);
  };

  // Save Edit SIM
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) {
      alert('নাম এবং ফোন নম্বর পূরণ করুন!');
      return;
    }

    const thresh = parseFloat(editThreshold);
    TeleKhattaDB.editSimWallet(editingWalletId, {
      name: editName.trim(),
      phone: editPhone.trim(),
      walletType: editWalletType,
      minThreshold: !isNaN(thresh) ? thresh : 2000,
      notes: editNotes.trim() || undefined
    });

    setIsEditModalOpen(false);
    onRefreshData();
  };

  // Delete SIM
  const handleDeleteSim = (wallet: SimWallet) => {
    const isConfirmed = confirm(
      `আপনি কি নিশ্চিত যে "${wallet.name} (${wallet.phone})" ডিলিট করতে চান?\n\nবর্তমান ব্যালেন্স: ৳${wallet.currentBalance.toLocaleString('en-US')}\n\nসতর্কতা: সিম ডিলিট করলে এর পূর্বের সকল ব্যালেন্স রেকর্ড মুছে যাবে!`
    );
    if (!isConfirmed) return;

    TeleKhattaDB.deleteSimWallet(wallet.id);
    onRefreshData();
  };

  // Open Balance Adjust Modal
  const handleOpenAdjust = (wallet: SimWallet) => {
    setAdjustWalletId(wallet.id);
    setAdjustNewBalance(wallet.currentBalance.toString());
    setAdjustThreshold(wallet.minThreshold.toString());
    setAdjustReason('সিম ব্যালেন্স চেক ও মিলকরণ');
    setAdjustDrawerWithDiff(false);
    setIsAdjustOpen(true);
  };

  // Submit Balance Adjust
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBal = parseFloat(adjustNewBalance);
    if (isNaN(newBal) || newBal < 0) {
      alert('অনুগ্রহ করে সঠিক ব্যালেন্সের পরিমাণ লিখুন!');
      return;
    }
    const thresh = parseFloat(adjustThreshold);
    TeleKhattaDB.updateWalletBalance(
      adjustWalletId,
      newBal,
      adjustReason,
      adjustDrawerWithDiff,
      !isNaN(thresh) ? thresh : undefined
    );
    setIsAdjustOpen(false);
    onRefreshData();
  };

  // Refill Submit
  const handleRefillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(refillAmount);
    if (!amt || amt <= 0) {
      alert('সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }

    const currentWallets = TeleKhattaDB.getWallets();
    const wIdx = currentWallets.findIndex(w => w.id === selectedWalletId);
    if (wIdx === -1) return;

    currentWallets[wIdx].currentBalance += amt;
    currentWallets[wIdx].lastReloadAt = new Date().toISOString();
    TeleKhattaDB.saveWallets(currentWallets);

    // If paid from drawer, deduct cash
    if (refillSource === 'drawer') {
      const s = TeleKhattaDB.getSettings();
      s.drawerCash -= amt;
      TeleKhattaDB.saveSettings(s);
    }

    TeleKhattaDB.addLog(
      'সিম রিফিল সম্পন্ন',
      `${currentWallets[wIdx].name} এ ৳${amt.toLocaleString('en-US')} ব্যালেন্স লোড করা হয়েছে (${refillSource === 'drawer' ? 'ড্রয়ার ক্যাশ থেকে' : 'ব্যাংক / ডিএসআর থেকে'})`,
      'system',
      'success'
    );

    setIsRefillOpen(false);
    setRefillAmount('');
    onRefreshData();
  };

  const handleApplyCountedCash = () => {
    if (confirm(`আপনি কি গুনে বের করা নগদ ক্যাশ ৳${countedDrawerTotal.toLocaleString('en-US')} ড্রয়ার ব্যালেন্স হিসেবে সেট করতে চান?`)) {
      const s = TeleKhattaDB.getSettings();
      s.drawerCash = countedDrawerTotal;
      TeleKhattaDB.saveSettings(s);
      TeleKhattaDB.addLog(
        'ড্রয়ার ক্যাশ অডিট ও সমন্বয়',
        `নোট গুনে ড্রয়ার ব্যালেন্স সমন্বয় করা হয়েছে: ৳${countedDrawerTotal.toLocaleString('en-US')}`,
        'system',
        'info'
      );
      setShowCalculator(false);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Balances Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Drawer Cash Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">হাত ক্যাশ / ড্রয়ার ব্যালেন্স</span>
              <Wallet className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
              {formatBanglaCurrency(settings.drawerCash)}
            </div>
            <p className="text-xs text-slate-500 mt-1">দোকানের কাঠের ক্যাশ ড্রয়ারের বর্তমান স্থিতি</p>
          </div>

          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
          >
            <Calculator className="w-4 h-4" />
            <span>নোট গুনে ক্যাশ মেলান</span>
          </button>
        </div>

        {/* Total SIM Agent & Personal Balances */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">মোট সিম ওয়ালেট ব্যালেন্স</span>
              <Smartphone className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-2">
              {formatBanglaCurrency(totalSimBalance)}
            </div>
            
            {/* Agent vs Personal breakdown */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                এজেন্ট ({agentWallets.length}): <strong className="font-mono text-slate-800 dark:text-slate-200">{formatBanglaCurrency(totalAgentBalance)}</strong>
              </span>
              <span className="text-slate-500">
                পার্সোনাল ({personalWallets.length}): <strong className="font-mono text-slate-800 dark:text-slate-200">{formatBanglaCurrency(totalPersonalBalance)}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => handleOpenAddSim('agent')}
              className="flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-rose-500" />
              <span>সিম যোগ করুন</span>
            </button>
            <button
              onClick={() => setIsRefillOpen(true)}
              className="flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ব্যালেন্স রিফিল</span>
            </button>
          </div>
        </div>

        {/* Total Liquid Capital */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">মোট চলমান লিকুইড ক্যাপিটাল</span>
              <Coins className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-2">
              {formatBanglaCurrency(settings.drawerCash + totalSimBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">ড্রয়ার ক্যাশ + সকল সিমের মোট টাকা</p>
          </div>

          <div className="mt-4 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
            ব্যালেন্স স্থিতি স্বাভাবিক • মোট {wallets.length}টি সক্রিয় সিম
          </div>
        </div>

      </div>

      {/* Note Counting Audit Panel (Accordion) */}
      {showCalculator && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-rose-500/30 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-rose-600" />
                নোট গুনে ক্যাশ ড্রয়ার অডিট (Cash Note Denominations)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ড্রয়ারে থাকা বিভিন্ন নোটের সংখ্যা লিখুন, মোট হিসাব স্বয়ংক্রিয়ভাবে বের হবে।
              </p>
            </div>
            <button 
              onClick={() => setShowCalculator(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { key: 'n1000', label: '১০০০ টাকার নোট', mult: 1000 },
              { key: 'n500', label: '৫০০ টাকার নোট', mult: 500 },
              { key: 'n200', label: '২০০ টাকার নোট', mult: 200 },
              { key: 'n100', label: '১০০ টাকার নোট', mult: 100 },
              { key: 'n50', label: '৫০ টাকার নোট', mult: 50 },
              { key: 'n20', label: '২০ টাকার নোট', mult: 20 },
              { key: 'n10', label: '১০ টাকার নোট', mult: 10 },
              { key: 'coins', label: 'খুচরা পয়সা / কয়েন ৳', mult: 1 },
            ].map(item => (
              <div key={item.key} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {item.label}
                </label>
                <input
                  type="number"
                  min="0"
                  value={notes[item.key as keyof typeof notes] || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setNotes(prev => ({ ...prev, [item.key]: val }));
                  }}
                  className="w-full px-2.5 py-1.5 font-mono text-sm font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder="নোটের সংখ্যা"
                />
                <div className="text-[10px] text-right font-mono text-slate-400 mt-1">
                  = ৳{((notes[item.key as keyof typeof notes] || 0) * item.mult).toLocaleString('en-US')}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500">গুনে পাওয়া মোট ড্রয়ার ক্যাশ:</span>
                <span className="font-mono font-bold text-lg text-slate-900 dark:text-white ml-2">
                  {formatBanglaCurrency(countedDrawerTotal)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-slate-500">সিস্টেম ব্যালেন্সের সাথে পার্থক্য:</div>
              <div className={`text-base font-bold font-mono ${
                drawerMismatch === 0 
                  ? 'text-emerald-600' 
                  : drawerMismatch > 0 
                    ? 'text-cyan-600' 
                    : 'text-rose-600'
              }`}>
                {drawerMismatch === 0 ? '✓ ক্যাশ সম্পূর্ণ সঠিক মিলেছে!' : `${drawerMismatch > 0 ? '+' : ''}${formatBanglaCurrency(drawerMismatch)} (${drawerMismatch > 0 ? 'বেশি আছে' : 'কম আছে'})`}
              </div>
            </div>

            <button
              onClick={handleApplyCountedCash}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              এই হিসাব সেট করুন
            </button>
          </div>
        </div>
      )}

      {/* Individual SIM Wallets Grid */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-rose-600" />
              এজেন্ট সিম ও রিচার্জ ওয়ালেট তালিকা
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              দোকানের সকল এজেন্ট ও পার্সোনাল সিমের ব্যালেন্স, রিফিল ও সমন্বয় পরিচালনা
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Add SIM Button */}
            <button
              onClick={() => handleOpenAddSim('agent')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন সিম যোগ করুন</span>
            </button>

            {/* Global Adjust Balance */}
            <button
              onClick={() => {
                if (wallets.length > 0) handleOpenAdjust(wallets[0]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
              title="যেকোনো সিমের প্রকৃত ব্যালেন্স লিখে ঠিক করুন"
            >
              <SlidersHorizontal className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>ব্যালেন্স ঠিক করুন</span>
            </button>

            {/* Global Refill */}
            <button
              onClick={() => setIsRefillOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>রিফিল</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs: All / Agent / Personal */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              সকল সিম ({wallets.length})
            </button>
            <button
              onClick={() => setFilterType('agent')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                filterType === 'agent'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>এজেন্ট সিম ({agentWallets.length})</span>
            </button>
            <button
              onClick={() => setFilterType('personal')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                filterType === 'personal'
                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>পার্সোনাল সিম ({personalWallets.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            দেখাচ্ছে: <strong className="text-slate-700 dark:text-slate-300">{filteredWallets.length}টি</strong> সিম
          </div>
        </div>

        {/* SIM Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredWallets.map(w => {
            const isLow = w.currentBalance < w.minThreshold;
            const isPersonal = w.walletType === 'personal';

            return (
              <div
                key={w.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                  isLow
                    ? 'border-amber-400 bg-amber-50/25 dark:bg-amber-950/15'
                    : isPersonal
                      ? 'border-teal-200 dark:border-teal-900/60 bg-teal-50/20 dark:bg-teal-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      {/* SIM Type & Service Badge */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isPersonal
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                        }`}>
                          {isPersonal ? <User className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                          <span>{isPersonal ? 'পার্সোনাল সিম' : 'এজেন্ট সিম'}</span>
                        </span>

                        <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {w.service}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                        {w.name}
                      </h4>
                      <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-slate-400" />
                        <span>{w.phone}</span>
                      </div>

                      {w.notes && (
                        <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                          {w.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                        {formatBanglaCurrency(w.currentBalance)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">বর্তমান ব্যালেন্স</span>
                    </div>
                  </div>

                  {isLow && (
                    <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-950/60 rounded-lg flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>ব্যালেন্স সতর্কতার নিচে (নূন্যতম: ৳{w.minThreshold})</span>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs gap-1.5">
                  <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                    {w.lastReloadAt ? `লোড: ${new Date(w.lastReloadAt).toLocaleDateString('bn-BD')}` : 'সক্রিয়'}
                  </span>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Adjust Balance Button */}
                    <button
                      onClick={() => handleOpenAdjust(w)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition"
                      title="এই সিমের ব্যালেন্স চেক করে সংশোধন বা ঠিক করুন"
                    >
                      <Edit3 className="w-3 h-3 text-rose-500" />
                      <span>ঠিক করুন</span>
                    </button>
                    
                    {/* Refill Button */}
                    <button
                      onClick={() => {
                        setSelectedWalletId(w.id);
                        setIsRefillOpen(true);
                      }}
                      className="px-2 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    >
                      রিফিল
                    </button>

                    {/* Edit SIM Info */}
                    <button
                      onClick={() => handleOpenEdit(w)}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition"
                      title="নাম, নম্বর বা তথ্য এডিট করুন"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete SIM */}
                    <button
                      onClick={() => handleDeleteSim(w)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="সিম মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ADD SIM MODAL (এজেন্ট অথবা পার্সোনাল সিম যোগ করুন) */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    নতুন সিম ও ওয়ালেট যুক্ত করুন
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    এজেন্ট অথবা পার্সোনাল সিম নির্বাচন করে যোগ করুন
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSimSubmit} className="space-y-3.5 text-xs">
              
              {/* Step 1: SIM Type Selector (Agent vs Personal) */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  সিমের ধরন নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleServiceOrTypeChange(newService, 'agent')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                      newWalletType === 'agent'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      newWalletType === 'agent' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">এজেন্ট সিম (Agent)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        গ্রাহকের ক্যাশ ইন, ক্যাশ আউট ও কমিশন উপার্জনের জন্য
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleServiceOrTypeChange(newService, 'personal')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                      newWalletType === 'personal'
                        ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      newWalletType === 'personal' ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">পার্সোনাল সিম (Personal)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        দোকানের নিজস্ব পার্সোনাল লেনদেন, সেন্ড মানি বা পেমেন্টের জন্য
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Service Provider */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  সার্ভিস / অপারেটর নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'bkash', label: 'বিকাশ' },
                    { id: 'nagad', label: 'নগদ' },
                    { id: 'rocket', label: 'রকেট' },
                    { id: 'upay', label: 'উপায়' },
                    { id: 'gp', label: 'গ্রামীণফোন' },
                    { id: 'bl', label: 'বাংলালিংক' },
                    { id: 'robi', label: 'রবি' },
                    { id: 'airtel', label: 'এয়ারটেল' },
                    { id: 'teletalk', label: 'টেলিটক' },
                  ].map(srv => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleServiceOrTypeChange(srv.id as ServiceType, newWalletType)}
                      className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition ${
                        newService === srv.id
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-extrabold ring-1 ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {srv.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    সিমের পরিচিতি / নাম *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="যেমন: বিকাশ পার্সোনাল ১"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    সিমের মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="যেমন: 01712-345678"
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Step 4: Opening Balance & Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    প্রারম্ভিক ব্যালেন্স (টাকা)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 font-mono text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    নূন্যতম সতর্কবার্তা লিমিট (টাকা)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={newThreshold}
                      onChange={(e) => setNewThreshold(e.target.value)}
                      placeholder="2000"
                      className="w-full pl-7 pr-3 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Deduct from drawer toggle */}
              {parseFloat(newBalance) > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDeductFromDrawer}
                      onChange={(e) => setNewDeductFromDrawer(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      প্রারম্ভিক ৳{parseFloat(newBalance).toLocaleString('en-US')} ড্রয়ার হাত ক্যাশ থেকে কেটে নেওয়া হবে
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1 pl-6">
                    টিক দিলে ড্রয়ার ক্যাশ কমবে; টিক না দিলে আলাদা অতিরিক্ত মূলধন হিসেবে যুক্ত থাকবে।
                  </p>
                </div>
              )}

              {/* Step 5: Notes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  নোট / বিবরণ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="যেমন: দোকানের কাউন্টারের ছোট ফোনটিতে রাখা"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition active:scale-95"
                >
                  সিম যুক্ত করুন
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT SIM MODAL */}
      {/* ------------------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  সিমের তথ্য এডিট করুন
                </h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              
              {/* Type Switch */}
              <div>
                <label className="block font-semibold mb-1">সিমের ধরন</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditWalletType('agent')}
                    className={`py-2 px-2 text-center rounded-xl border font-bold flex items-center justify-center gap-1.5 ${
                      editWalletType === 'agent'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>এজেন্ট সিম</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditWalletType('personal')}
                    className={`py-2 px-2 text-center rounded-xl border font-bold flex items-center justify-center gap-1.5 ${
                      editWalletType === 'personal'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>পার্সোনাল সিম</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">সিমের নাম *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">ফোন নম্বর *</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">নূন্যতম ব্যালেন্স সতর্কতা লিমিট (টাকা)</label>
                <input
                  type="number"
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">নোট / মন্তব্য</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
                >
                  আপডেট সংরক্ষণ
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BALANCE CORRECTION / ADJUSTMENT MODAL */}
      {/* ------------------------------------------------------------- */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    সিম ব্যালেন্স ঠিক করুন ও সমন্বয়
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ইউএসএসডি বা অ্যাপ দেখে সিমের বর্তমান প্রকৃত ব্যালেন্স সেট করুন
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdjustOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const currentWallet = wallets.find(w => w.id === adjustWalletId) || wallets[0];
              const parsedNew = parseFloat(adjustNewBalance);
              const diff = !isNaN(parsedNew) ? parsedNew - (currentWallet?.currentBalance || 0) : 0;

              return (
                <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
                  {/* Select Target Wallet */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      কোন সিমের ব্যালেন্স ঠিক করতে চান?
                    </label>
                    <select
                      value={adjustWalletId}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        setAdjustWalletId(targetId);
                        const w = wallets.find(item => item.id === targetId);
                        if (w) {
                          setAdjustNewBalance(w.currentBalance.toString());
                          setAdjustThreshold(w.minThreshold.toString());
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>
                          [{w.walletType === 'personal' ? 'পার্সোনাল' : 'এজেন্ট'}] {w.name} ({w.phone}) — বর্তমান: {formatBanglaCurrency(w.currentBalance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Current Balance & New Balance Comparison Box */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">বর্তমানে সিস্টেমে থাকা ব্যালেন্স:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatBanglaCurrency(currentWallet?.currentBalance || 0)}
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 text-xs">
                        প্রকৃত সঠিক ব্যালেন্স (টাকা) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold font-mono text-sm text-slate-400">
                          ৳
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="যেমন: 42500"
                          value={adjustNewBalance}
                          onChange={(e) => setAdjustNewBalance(e.target.value)}
                          className="w-full pl-8 pr-3 py-2.5 font-mono text-base font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Difference Highlight */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                      <span className="text-slate-500">ব্যালেন্সের পরিবর্তন / পার্থক্য:</span>
                      <span className={`font-mono font-bold ${
                        diff === 0 
                          ? 'text-slate-500' 
                          : diff > 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {diff === 0 
                          ? 'অপরিবর্তিত (কোনো পার্থক্য নেই)' 
                          : `${diff > 0 ? '+' : ''}${formatBanglaCurrency(diff)} (${diff > 0 ? 'সিম ব্যালেন্স বাড়বে' : 'সিম ব্যালেন্স কমবে'})`}
                      </span>
                    </div>
                  </div>

                  {/* Drawer Cash sync toggle */}
                  {diff !== 0 && (
                    <div className="p-2.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adjustDrawerWithDiff}
                          onChange={(e) => setAdjustDrawerWithDiff(e.target.checked)}
                          className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          ড্রয়ার হাত ক্যাশের সাথে পার্থক্য সমন্বয় করুন
                        </span>
                      </label>
                      <p className="text-[10px] text-slate-500 mt-1 pl-6">
                        {diff > 0 
                          ? `ড্রয়ার ক্যাশ থেকে ৳${diff.toLocaleString('en-US')} কমবে (যদি ড্রয়ার টাকা দিয়ে ব্যালেন্স এনে থাকেন)`
                          : `ড্রয়ার ক্যাশে ৳${Math.abs(diff).toLocaleString('en-US')} যোগ হবে`}
                      </p>
                    </div>
                  )}

                  {/* Low Balance Alert Threshold Limit */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      নূন্যতম ব্যালেন্স সতর্কতা লিমিট (টাকা)
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: 5000"
                      value={adjustThreshold}
                      onChange={(e) => setAdjustThreshold(e.target.value)}
                      className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      ব্যালেন্স এই টাকার নিচে নামলে সিস্টেমে সতর্কবার্তা দেখাবে
                    </span>
                  </div>

                  {/* Reason & Quick Chips */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ব্যালেন্স ঠিক করার কারণ / নোট
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: সিম ব্যালেন্স চেক করে আপডেট"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        'ব্যালেন্স চেক ও মিলকরণ',
                        'অফলাইন রিচার্জ সমন্বয়',
                        'সার্ভিস চার্জ কর্তন',
                        'কমিশন রিভার্সাল'
                      ].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setAdjustReason(chip)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAdjustOpen(false)}
                      className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition active:scale-95"
                    >
                      ব্যালেন্স ঠিক করুন ও সেভ
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REFILL MODAL */}
      {/* ------------------------------------------------------------- */}
      {isRefillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                সিম ব্যালেন্স রিফিল / লোড
              </h3>
              <button onClick={() => setIsRefillOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefillSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">কোন সিমে লোড করবেন?</label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      [{w.walletType === 'personal' ? 'পার্সোনাল' : 'এজেন্ট'}] {w.name} — বর্তমান: {formatBanglaCurrency(w.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">টাকার পরিমাণ *</label>
                <input
                  type="number"
                  placeholder="যেমন: 5000"
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">টাকার উৎস (Source)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefillSource('drawer')}
                    className={`py-2 px-2 text-center rounded-xl border font-bold ${
                      refillSource === 'drawer'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    ড্রয়ার ক্যাশ থেকে (ক্যাশ কমবে)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefillSource('bank_dsr')}
                    className={`py-2 px-2 text-center rounded-xl border font-bold ${
                      refillSource === 'bank_dsr'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    ব্যাংক / ডিএসআর সরাসরি
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRefillOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  রিফিল নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
