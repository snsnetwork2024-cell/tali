import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Printer, 
  Smartphone, 
  PhoneCall, 
  Wifi, 
  CreditCard, 
  UserCheck, 
  Receipt,
  CheckCircle2
} from 'lucide-react';
import { 
  Transaction, 
  Customer, 
  CardProduct, 
  SimWallet, 
  ShopSettings, 
  MfsService, 
  TelecomOperator 
} from '../types';
import { TeleKhattaDB } from '../services/db';
import { NotificationService } from '../services/notificationService';
import { formatBanglaCurrency } from '../utils/printAndExport';

interface QuickPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  wallets: SimWallet[];
  customers: Customer[];
  cards: CardProduct[];
  onTransactionComplete: (trx: Transaction, shouldPrint: boolean) => void;
}

type TabType = 'bkash' | 'nagad' | 'rocket' | 'flexiload' | 'cards' | 'customer_khata' | 'expense';

export const QuickPosModal: React.FC<QuickPosModalProps> = ({
  isOpen,
  onClose,
  settings,
  wallets,
  customers,
  cards,
  onTransactionComplete
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('bkash');
  const [subType, setSubType] = useState<'cash_in' | 'cash_out' | 'send_money'>('cash_out');
  const [operator, setOperator] = useState<TelecomOperator>('gp');
  const [amount, setAmount] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [fee, setFee] = useState<string>('0');
  const [note, setNote] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [dueType, setDueType] = useState<'due_given' | 'due_payment'>('due_payment');
  const [expenseCategory, setExpenseCategory] = useState<'rent' | 'electricity' | 'staff' | 'refreshment' | 'misc'>('refreshment');
  const [expenseTitle, setExpenseTitle] = useState<string>('');

  // Auto-fill customer name if phone matches existing customer
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const cleanInput = customerPhone.replace(/[^0-9]/g, '');
      const found = customers.find(c => c.phone.replace(/[^0-9]/g, '').includes(cleanInput) || cleanInput.includes(c.phone.replace(/[^0-9]/g, '')));
      if (found) {
        setCustomerName(found.name);
        setCustomerId(found.id);
      }
    }
  }, [customerPhone, customers]);

  // Default wallet selection based on active tab
  useEffect(() => {
    if (activeTab === 'bkash') {
      const w = wallets.find(wl => wl.service === 'bkash');
      if (w) setSelectedWalletId(w.id);
    } else if (activeTab === 'nagad') {
      const w = wallets.find(wl => wl.service === 'nagad');
      if (w) setSelectedWalletId(w.id);
    } else if (activeTab === 'rocket') {
      const w = wallets.find(wl => wl.service === 'rocket');
      if (w) setSelectedWalletId(w.id);
    } else if (activeTab === 'flexiload') {
      const w = wallets.find(wl => wl.service === operator || wl.service === 'gp');
      if (w) setSelectedWalletId(w.id);
    }
  }, [activeTab, operator, wallets]);

  const [customCommission, setCustomCommission] = useState<string>('0');
  const [isCommissionEdited, setIsCommissionEdited] = useState<boolean>(false);

  // Set card defaults
  useEffect(() => {
    if (activeTab === 'cards' && cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
      setAmount(cards[0].sellingPrice.toString());
    }
  }, [activeTab, cards, selectedCardId]);

  const numAmount = parseFloat(amount) || 0;
  const numFee = parseFloat(fee) || 0;

  // Helper to compute standard recommended commission for any service & type
  const getStandardCommission = (amt: number, tab: TabType, sub: 'cash_in' | 'cash_out' | 'send_money', op: TelecomOperator): number => {
    if (amt <= 0) return 0;
    if (tab === 'bkash') {
      if (sub === 'cash_out') return (amt / 1000) * settings.commissions.bkashCashOutRate;
      if (sub === 'cash_in') return (amt / 1000) * (settings.commissions.bkashCashInRate ?? 1.50);
      return 0;
    }
    if (tab === 'nagad') {
      if (sub === 'cash_out') return (amt / 1000) * settings.commissions.nagadCashOutRate;
      if (sub === 'cash_in') return (amt / 1000) * (settings.commissions.nagadCashInRate ?? 1.50);
      return 0;
    }
    if (tab === 'rocket') {
      if (sub === 'cash_out') return (amt / 1000) * settings.commissions.rocketCashOutRate;
      if (sub === 'cash_in') return (amt / 1000) * (settings.commissions.rocketCashInRate ?? 1.50);
      return 0;
    }
    if (tab === 'flexiload') {
      return (amt / 1000) * settings.commissions.flexiloadCommissionPerThousand;
    }
    if (tab === 'cards') {
      const card = cards.find(c => c.id === selectedCardId);
      return card ? Math.max(0, card.sellingPrice - card.buyingPrice) : 0;
    }
    return 0;
  };

  // Auto-calculate suggested commission unless manually edited
  useEffect(() => {
    if (!isCommissionEdited) {
      const std = getStandardCommission(numAmount, activeTab, subType, operator);
      setCustomCommission(std > 0 ? (Number.isInteger(std) ? std.toString() : std.toFixed(2)) : '0');
    }
  }, [numAmount, activeTab, subType, operator, selectedCardId, isCommissionEdited]);

  // Reset edited flag on service/tab switch
  useEffect(() => {
    setIsCommissionEdited(false);
  }, [activeTab, subType]);

  if (!isOpen) return null;

  const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000, 10000];

  const calculatedCommission = parseFloat(customCommission) || 0;
  const calculatedProfit = calculatedCommission + numFee;

  const handleSubmit = (printSlip = false) => {
    if (numAmount <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }

    let finalType: Transaction['type'] = 'cash_out';
    let finalService: Transaction['service'] = 'bkash';
    let drawerDelta = 0;
    let simDelta = 0;
    let packDetails = undefined;

    if (activeTab === 'bkash' || activeTab === 'nagad' || activeTab === 'rocket') {
      finalService = activeTab;
      finalType = subType;
      if (subType === 'cash_in') {
        drawerDelta = numAmount + numFee;
        simDelta = -numAmount;
      } else if (subType === 'cash_out') {
        drawerDelta = -numAmount + numFee;
        simDelta = numAmount;
      } else {
        drawerDelta = numAmount + numFee;
        simDelta = -numAmount;
      }
    } else if (activeTab === 'flexiload') {
      finalService = operator;
      finalType = 'flexiload';
      drawerDelta = numAmount + numFee;
      simDelta = -numAmount;
    } else if (activeTab === 'cards') {
      finalService = 'card';
      finalType = 'card_sale';
      drawerDelta = numAmount;
      simDelta = 0;
      const card = cards.find(c => c.id === selectedCardId);
      if (card) {
        packDetails = `${card.banglaTitle} (${card.operator.toUpperCase()})`;
      }
    } else if (activeTab === 'customer_khata') {
      finalService = 'customer';
      if (dueType === 'due_payment') {
        finalType = 'customer_payment';
        drawerDelta = numAmount;
        simDelta = 0;
      } else {
        finalType = 'customer_due';
        drawerDelta = 0; // Credit given, no cash collected yet
        simDelta = 0;
      }
    } else if (activeTab === 'expense') {
      finalService = 'expense';
      finalType = 'shop_expense';
      drawerDelta = -numAmount;
      simDelta = 0;
      TeleKhattaDB.saveExpenses([
        ...TeleKhattaDB.getExpenses(),
        {
          id: 'exp-' + Date.now(),
          category: expenseCategory,
          title: expenseTitle || 'দোকান ব্যয়',
          amount: numAmount,
          note: note,
          date: new Date().toISOString(),
          paidFrom: 'drawer'
        }
      ]);
    }

    const newTrx = TeleKhattaDB.recordTransaction({
      type: finalType,
      service: finalService,
      amount: numAmount,
      customerPhone: customerPhone || undefined,
      customerName: customerName || undefined,
      customerId: customerId || undefined,
      trxId: trxId || (['bkash', 'nagad', 'rocket'].includes(activeTab) ? `${activeTab.slice(0, 3).toUpperCase()}${Math.floor(100000 + Math.random() * 900000)}` : undefined),
      commission: calculatedCommission,
      fee: numFee,
      profit: calculatedProfit,
      note: note || undefined,
      packDetails,
      operator: activeTab === 'flexiload' ? operator : undefined,
      cardProductId: activeTab === 'cards' ? selectedCardId : undefined,
      drawerCashDelta: drawerDelta,
      simBalanceDelta: simDelta,
      simWalletId: selectedWalletId || undefined,
      source: 'pos',
      status: 'completed'
    });

    // Send push notification
    NotificationService.notify(
      `নতুন লেনদেন সম্পন্ন: ৳${numAmount.toLocaleString('en-US')}`,
      `${customerPhone ? customerPhone + ' ' : ''}(${finalType === 'cash_out' ? 'ক্যাশ আউট' : finalType === 'cash_in' ? 'ক্যাশ ইন' : 'রিচার্জ / প্যাক'}), অর্জিত লাভ: ৳${calculatedProfit.toFixed(2)}`,
      'transaction'
    );

    onTransactionComplete(newTrx, printSlip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm">
              ৳
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">দ্রুত লেনদেন এন্ট্রি (POS Entry)</h2>
              <p className="text-[11px] text-slate-400">ক্যাশ ইন/আউট, ফ্লেক্সিলোড ও প্যাক হিসাব</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons (bKash, Nagad, Rocket, Flexiload, Cards, Khata, Expense) */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 p-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => { setActiveTab('bkash'); setSubType('cash_out'); }}
            className={`py-2 px-1 text-center font-bold rounded-lg transition ${
              activeTab === 'bkash' 
                ? 'bg-pink-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            বিকাশ
          </button>
          <button
            onClick={() => { setActiveTab('nagad'); setSubType('cash_out'); }}
            className={`py-2 px-1 text-center font-bold rounded-lg transition ${
              activeTab === 'nagad' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            নগদ
          </button>
          <button
            onClick={() => { setActiveTab('rocket'); setSubType('cash_out'); }}
            className={`py-2 px-1 text-center font-bold rounded-lg transition ${
              activeTab === 'rocket' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            রকেট
          </button>
          <button
            onClick={() => setActiveTab('flexiload')}
            className={`py-2 px-1 text-center font-bold rounded-lg transition ${
              activeTab === 'flexiload' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            রিচার্জ
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-2 px-1 text-center font-bold rounded-lg transition ${
              activeTab === 'cards' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            কার্ড/প্যাক
          </button>
          <button
            onClick={() => setActiveTab('customer_khata')}
            className={`py-2 px-1 text-center font-bold rounded-lg transition ${
              activeTab === 'customer_khata' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            বাকি/জমা
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`py-2 px-1 text-center font-bold rounded-lg transition ${
              activeTab === 'expense' 
                ? 'bg-slate-700 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            খরচ
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Sub-Type Toggle for bKash / Nagad / Rocket */}
          {(activeTab === 'bkash' || activeTab === 'nagad' || activeTab === 'rocket') && (
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setSubType('cash_out')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  subType === 'cash_out'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                ক্যাশ আউট (গ্রাহক নিল)
              </button>
              <button
                type="button"
                onClick={() => setSubType('cash_in')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  subType === 'cash_in'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                ক্যাশ ইন (টাকা জমা)
              </button>
              <button
                type="button"
                onClick={() => setSubType('send_money')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  subType === 'send_money'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                সেন্ড মানি
              </button>
            </div>
          )}

          {/* Operator Selector for Flexiload */}
          {activeTab === 'flexiload' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                অপারেটর নির্বাচন করুন
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'gp', name: 'গ্রামীণফোন' },
                  { id: 'bl', name: 'বাংলালিংক' },
                  { id: 'robi', name: 'রবি' },
                  { id: 'airtel', name: 'এয়ারটেল' },
                  { id: 'teletalk', name: 'টেলিটক' },
                ].map(op => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperator(op.id as TelecomOperator)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition ${
                      operator === op.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {op.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Minute & MB Card Selector */}
          {activeTab === 'cards' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                প্যাকেজ বা স্ক্র্যাচ কার্ড নির্বাচন করুন
              </label>
              <select
                value={selectedCardId}
                onChange={(e) => {
                  setSelectedCardId(e.target.value);
                  const found = cards.find(c => c.id === e.target.value);
                  if (found) setAmount(found.sellingPrice.toString());
                }}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {cards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.banglaTitle} — মূল্য: ৳{c.sellingPrice} (স্টক: {c.stockCount} টি | লাভ: ৳{c.sellingPrice - c.buyingPrice})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Khata Type Toggle */}
          {activeTab === 'customer_khata' && (
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setDueType('due_payment')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  dueType === 'due_payment'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                বাকি আদায় / টাকা জমা
              </button>
              <button
                type="button"
                onClick={() => setDueType('due_given')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  dueType === 'due_given'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                নতুন বাকি দেওয়া
              </button>
            </div>
          )}

          {/* Expense Fields */}
          {activeTab === 'expense' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  খরচের শিরোনাম / বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: চা-নাস্তা, বিদ্যুৎ বিল, যাতায়াত"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-xs">
                {(['refreshment', 'rent', 'electricity', 'staff', 'misc'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setExpenseCategory(cat)}
                    className={`py-1.5 px-1 text-center rounded-lg border font-medium ${
                      expenseCategory === cat
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat === 'refreshment' ? 'নাস্তা' : cat === 'rent' ? 'ভাড়া' : cat === 'electricity' ? 'বিদ্যুৎ' : cat === 'staff' ? 'বেতন' : 'অন্যান্য'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Input & Quick Chips */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                টাকার পরিমাণ (Amount in BDT)
              </label>
              {calculatedProfit > 0 && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  অর্জিত লাভ: +৳{calculatedProfit.toFixed(2)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-lg text-slate-400">
                ৳
              </span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 font-mono text-xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                >
                  ৳{val}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Phone & Name Input */}
          {activeTab !== 'expense' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  গ্রাহকের মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  placeholder="017xxxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  গ্রাহকের নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: রফিকুল ইসলাম"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Agent Commission & Customer Fee (Directly Editable for Cash In, Cash Out, and Flexiload) */}
          {(activeTab === 'bkash' || activeTab === 'nagad' || activeTab === 'rocket' || activeTab === 'flexiload') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span>এজেন্ট কমিশন (টাকা)</span>
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-1 py-0.2 rounded">এডিটেবল</span>
                  </label>
                  {isCommissionEdited && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCommissionEdited(false);
                        const std = getStandardCommission(numAmount, activeTab, subType, operator);
                        setCustomCommission(std > 0 ? (Number.isInteger(std) ? std.toString() : std.toFixed(2)) : '0');
                      }}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      অটো রেট দিন
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="0.00"
                    value={customCommission}
                    onChange={(e) => {
                      setCustomCommission(e.target.value);
                      setIsCommissionEdited(true);
                    }}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {subType === 'cash_in' ? 'ক্যাশ ইন এজেন্ট কমিশন' : subType === 'cash_out' ? 'ক্যাশ আউট কমিশন' : 'ফ্লেক্সিলোড কমিশন'} (প্রয়োজনে পরিবর্তন করুন)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  সার্ভিস চার্জ / অতিরিক্ত ফি (টাকা)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-slate-400">৳</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  গ্রাহকের থেকে নেওয়া অতিরিক্ত চার্জ (যদি থাকে)
                </span>
              </div>
            </div>
          )}

          {/* TrxID (for MFS) */}
          {(activeTab === 'bkash' || activeTab === 'nagad' || activeTab === 'rocket') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ট্রানজেকশন আইডি (TrxID)
              </label>
              <input
                type="text"
                placeholder="যেমন: BKA881239X"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* SIM Wallet Selection (if MFS or Flexiload) */}
          {(activeTab === 'bkash' || activeTab === 'nagad' || activeTab === 'rocket' || activeTab === 'flexiload') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                লেনদেনের সিম / ওয়ালেট নির্বাচন (এজেন্ট অথবা পার্সোনাল)
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {wallets.map(w => {
                  const typeLabel = w.walletType === 'personal' ? 'পার্সোনাল' : 'এজেন্ট';
                  return (
                    <option key={w.id} value={w.id}>
                      [{typeLabel}] {w.name} ({w.phone}) — ব্যালেন্স: {formatBanglaCurrency(w.currentBalance)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Quick Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              মন্তব্য / নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="যেকোনো বিশেষ নির্দেশনা বা নোট"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
            />
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
          >
            বাতিল
          </button>
          
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="py-2.5 px-4 text-xs font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition"
          >
            শুধুমাত্র সেভ করুন
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>সম্পন্ন ও স্লিপ প্রিন্ট</span>
          </button>
        </div>

      </div>
    </div>
  );
};
