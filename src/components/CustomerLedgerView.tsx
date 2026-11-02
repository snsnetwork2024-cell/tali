import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  MessageSquare, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Download, 
  UserCheck, 
  Printer, 
  FileText,
  X,
  CreditCard,
  History,
  Trash2
} from 'lucide-react';
import { Customer, Transaction, ShopSettings } from '../types';
import { TeleKhattaDB } from '../services/db';
import { 
  formatBanglaCurrency, 
  formatBanglaDateTime, 
  exportCustomersCSV, 
  generateDueReminderText 
} from '../utils/printAndExport';

interface CustomerLedgerViewProps {
  customers: Customer[];
  transactions: Transaction[];
  settings: ShopSettings;
  onRefreshData: () => void;
  onOpenDuePayment: (customer: Customer) => void;
  onOpenAddDue: (customer: Customer) => void;
}

export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({
  customers,
  transactions,
  settings,
  onRefreshData,
  onOpenDuePayment,
  onOpenAddDue
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'deposit'>('all');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);

  // New Customer Form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newInitialDue, setNewInitialDue] = useState('0');
  const [newInitialDeposit, setNewInitialDeposit] = useState('0');
  const [newNotes, setNewNotes] = useState('');

  const totalMarketDue = customers.reduce((sum, c) => sum + c.totalDue, 0);
  const totalMarketDeposit = customers.reduce((sum, c) => sum + c.totalDeposit, 0);
  const dueCustomersCount = customers.filter(c => c.totalDue > 0).length;

  const filteredCustomers = customers.filter(c => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.phone.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterType === 'due' && c.totalDue <= 0) return false;
    if (filterType === 'deposit' && c.totalDeposit <= 0) return false;
    return true;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('নাম এবং মোবাইল নম্বর পূরণ করা আবশ্যক!');
      return;
    }

    const currentList = TeleKhattaDB.getCustomers();
    const newCust: Customer = {
      id: 'c-' + Date.now(),
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim() || undefined,
      totalDue: parseFloat(newInitialDue) || 0,
      totalDeposit: parseFloat(newInitialDeposit) || 0,
      notes: newNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };

    currentList.push(newCust);
    TeleKhattaDB.saveCustomers(currentList);
    TeleKhattaDB.addLog(
      'নতুন কাস্টমার খাতা তৈরি',
      `${newCust.name} (${newCust.phone}) এর হিসাব খাতা খোলা হয়েছে`,
      'ledger',
      'info'
    );

    setIsAddCustomerOpen(false);
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewInitialDue('0');
    setNewInitialDeposit('0');
    setNewNotes('');
    onRefreshData();
  };

  const sendWhatsAppReminder = (customer: Customer) => {
    const text = encodeURIComponent(generateDueReminderText(customer, settings));
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('88') ? cleanPhone : '88' + cleanPhone;
    window.open(`https://api.whatsapp.com/send?phone=${intlPhone}&text=${text}`, '_blank');
  };

  const copySmsReminder = (customer: Customer) => {
    const text = generateDueReminderText(customer, settings);
    navigator.clipboard.writeText(text);
    alert(`${customer.name} এর জন্য এসএমএস রিমাইন্ডার ক্লিপবোর্ডে কপি করা হয়েছে!`);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (customer.totalDue > 0) {
      const pin = prompt(
        `সতর্কতা: ${customer.name} এর কাছে এখনো ৳${customer.totalDue.toLocaleString('en-US')} বকেয়া বাকি রয়েছে!\n\nখাতাটি নিশ্চিতভাবে মুছে ফেলতে দোকানের মাস্টার পিন (Master PIN) প্রবেশ করুন:`
      );
      if (pin === settings.masterPin) {
        TeleKhattaDB.deleteCustomer(customer.id);
        if (selectedCustomerForHistory?.id === customer.id) {
          setSelectedCustomerForHistory(null);
        }
        alert(`"${customer.name}" এর কাস্টমার খাতা সফলভাবে মুছে ফেলা হয়েছে।`);
        onRefreshData();
      } else if (pin !== null) {
        alert('ভুল পিন কোড! কাস্টমার ডিলিট করা হয়নি।');
      }
    } else {
      if (confirm(`আপনি কি নিশ্চিতভাবে "${customer.name}" এর কাস্টমার খাতা মুছে ফেলতে চান?`)) {
        TeleKhattaDB.deleteCustomer(customer.id);
        if (selectedCustomerForHistory?.id === customer.id) {
          setSelectedCustomerForHistory(null);
        }
        onRefreshData();
      }
    }
  };

  // Get transactions for the customer history drawer
  const customerTrxList = selectedCustomerForHistory
    ? transactions.filter(t => t.customerId === selectedCustomerForHistory.id || (t.customerPhone && selectedCustomerForHistory.phone.includes(t.customerPhone)))
    : [];

  return (
    <div className="space-y-6">
      
      {/* Top Ledger Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">মোট বাকিদার সংখ্যা</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {dueCustomersCount} <span className="text-xs font-sans font-normal text-slate-400">জন</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">সর্বমোট খাতা: {customers.length} জন</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">বাজারে মোট বাকি টাকা</div>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {formatBanglaCurrency(totalMarketDue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">কাস্টমারদের থেকে পাওনা</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">মোট অগ্রিম জমা টাকা</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatBanglaCurrency(totalMarketDeposit)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">গ্রাহকদের রক্ষিত ব্যালেন্স</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Control Bar: Search, Filters & Add Customer */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="কাস্টমারের নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCustomersCSV(filteredCustomers)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
            >
              <Download className="w-4 h-4" />
              <span>CSV ডাউনলোড</span>
            </button>

            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition active:scale-95 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কাস্টমার যোগ</span>
            </button>
          </div>

        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 font-semibold rounded-md transition ${
              filterType === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            সকল কাস্টমার ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('due')}
            className={`px-3 py-1 font-semibold rounded-md transition ${
              filterType === 'due' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            শুধু বাকিদার ({dueCustomersCount})
          </button>
          <button
            onClick={() => setFilterType('deposit')}
            className={`px-3 py-1 font-semibold rounded-md transition ${
              filterType === 'deposit' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            অগ্রিম জমা ({customers.filter(c => c.totalDeposit > 0).length})
          </button>
        </div>

      </div>

      {/* Customer Ledger Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => (
          <div 
            key={customer.id}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {customer.name}
                  </h4>
                  <div className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                    {customer.phone}
                  </div>
                  {customer.address && (
                    <div className="text-[11px] text-slate-500 mt-1">
                      {customer.address}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  {customer.totalDue > 0 ? (
                    <div>
                      <div className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                        {formatBanglaCurrency(customer.totalDue)}
                      </div>
                      <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                        বাকি বকেয়া
                      </span>
                    </div>
                  ) : customer.totalDeposit > 0 ? (
                    <div>
                      <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatBanglaCurrency(customer.totalDeposit)}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        অগ্রিম জমা
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-slate-400">পরিশোধিত</span>
                    </div>
                  )}
                </div>
              </div>

              {customer.notes && (
                <div className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 italic">
                  "{customer.notes}"
                </div>
              )}
            </div>

            {/* Action Bar for Customer */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5 text-xs">
              
              <div className="flex items-center gap-1">
                {/* Due Payment (Taka Adai) */}
                <button
                  onClick={() => onOpenDuePayment(customer)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                  title="বাকি টাকা আদায়"
                >
                  আদায়
                </button>

                {/* Add Due */}
                <button
                  onClick={() => onOpenAddDue(customer)}
                  className="px-2.5 py-1.5 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 font-bold rounded-lg transition"
                  title="নতুন বাকি দেওয়া"
                >
                  + বাকি
                </button>
              </div>

              <div className="flex items-center gap-1">
                {/* History Drawer Trigger */}
                <button
                  onClick={() => setSelectedCustomerForHistory(customer)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  title="লেনদেন ইতিহাস"
                >
                  <History className="w-4 h-4" />
                </button>

                {/* WhatsApp Reminder */}
                <button
                  onClick={() => sendWhatsAppReminder(customer)}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                  title="WhatsApp তাগাদা পাঠান"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                {/* SMS Copy */}
                <button
                  onClick={() => copySmsReminder(customer)}
                  className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  title="এসএমএস কপি করুন"
                >
                  <FileText className="w-4 h-4" />
                </button>

                {/* Delete Customer */}
                <button
                  onClick={() => handleDeleteCustomer(customer)}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                  title="কাস্টমার খাতা ডিলিট"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Add New Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                নতুন কাস্টমার খাতা যোগ করুন
              </h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">কাস্টমারের নাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: আল-আমিন ভাই"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  placeholder="017xxxxxxxx"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">ঠিকানা / পরিচিতি</label>
                <input
                  type="text"
                  placeholder="যেমন: বাজার গলি, দোকান নং ৪"
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">পূর্বের বাকি (যদি থাকে)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newInitialDue}
                    onChange={e => setNewInitialDue(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">অগ্রিম জমা (যদি থাকে)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newInitialDeposit}
                    onChange={e => setNewInitialDeposit(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">বিশেষ নোট</label>
                <input
                  type="text"
                  placeholder="যেমন: ১ তারিখে বেতন পেলে পরিশোধ করবেন"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  খাতা সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detailed History Modal */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedCustomerForHistory.name} — খতিয়ান ইতিহাস
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedCustomerForHistory.phone} | বর্তমান বাকি: {formatBanglaCurrency(selectedCustomerForHistory.totalDue)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCustomerForHistory(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {customerTrxList.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  এই কাস্টমারের কোনো পূর্ববর্তী লেনদেন রেকর্ড নেই
                </div>
              ) : (
                customerTrxList.map(t => (
                  <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {t.type === 'customer_payment' ? 'বাকি পরিশোধ ও আদায়' : t.type === 'customer_due' ? 'বাকি গ্রহণ' : `${t.service.toUpperCase()} ${t.type}`}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {formatBanglaDateTime(t.createdAt)} {t.note ? `• ${t.note}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${t.type === 'customer_payment' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'customer_payment' ? '-' : '+'}{formatBanglaCurrency(t.amount)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDeleteCustomer(selectedCustomerForHistory)}
                className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-semibold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>এই কাস্টমার ডিলিট করুন</span>
              </button>

              <button
                onClick={() => setSelectedCustomerForHistory(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
