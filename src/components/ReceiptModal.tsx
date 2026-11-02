import React from 'react';
import { Printer, X, CheckCircle, Share2, Copy } from 'lucide-react';
import { Transaction, ShopSettings, Customer } from '../types';
import { formatBanglaCurrency, formatBanglaDateTime } from '../utils/printAndExport';

interface ReceiptModalProps {
  transaction: Transaction | null;
  settings: ShopSettings;
  customer?: Customer;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  customer,
  onClose
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const getServiceLabel = (service: string, type: string) => {
    if (service === 'bkash') {
      return type === 'cash_in' ? 'বিকাশ ক্যাশ ইন' : type === 'cash_out' ? 'বিকাশ ক্যাশ আউট' : 'বিকাশ সেন্ড মানি';
    }
    if (service === 'nagad') {
      return type === 'cash_in' ? 'নগদ ক্যাশ ইন' : type === 'cash_out' ? 'নগদ ক্যাশ আউট' : 'নগদ সেন্ড মানি';
    }
    if (service === 'rocket') {
      return type === 'cash_in' ? 'রকেট ক্যাশ ইন' : type === 'cash_out' ? 'রকেট ক্যাশ আউট' : 'রকেট লেনদেন';
    }
    if (service === 'gp' || service === 'bl' || service === 'robi' || service === 'airtel' || service === 'teletalk') {
      return `${service.toUpperCase()} মোবাইল রিচার্জ (ফ্লেক্সিলোড)`;
    }
    if (type === 'card_sale') return 'মিনিট / এমবি কার্ড ও ড্রাইভ প্যাক';
    if (type === 'customer_payment') return 'বাকি টাকা আদায় ও জমা';
    if (type === 'customer_due') return 'বাকি লেনদেন';
    return 'সাধারণ লেনদেন';
  };

  const copyReceiptText = () => {
    const text = `--- ${settings.shopName} ---
রসিদ নং: ${transaction.id}
সেবা: ${getServiceLabel(transaction.service, transaction.type)}
পরিমাণ: ${formatBanglaCurrency(transaction.amount)}
গ্রাহক: ${transaction.customerPhone || ''} ${transaction.customerName ? `(${transaction.customerName})` : ''}
${transaction.trxId ? `TrxID: ${transaction.trxId}\n` : ''}তারিখ: ${formatBanglaDateTime(transaction.createdAt)}
${customer ? `বর্তমান অবশিষ্ট বাকি: ${formatBanglaCurrency(customer.totalDue)}\n` : ''}যোগাযোগ: ${settings.phone}
ধন্যবাদ!`;
    navigator.clipboard.writeText(text);
    alert('রসিদের বিবরণ ক্লিপবোর্ডে কপি করা হয়েছে!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        
        {/* Action Header - Hidden during print */}
        <div className="no-print flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>লেনদেন রসিদ মেমো</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyReceiptText}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition"
              title="টেক্সট কপি করুন"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thermal Slip Content - Styled for 58mm/80mm Roll or Screen */}
        <div className="print-container p-6 bg-white text-slate-900 font-sans text-xs">
          
          {/* Shop Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-base font-bold tracking-tight text-slate-900">{settings.shopName}</h2>
            <p className="text-[11px] text-slate-600 mt-0.5">{settings.address}</p>
            <p className="text-[11px] font-mono text-slate-600 font-medium">মোবাইল: {settings.phone}</p>
            <div className="mt-2 inline-block px-2 py-0.5 border border-slate-400 text-[10px] font-bold uppercase tracking-wider rounded">
              ক্যাশ মেমো / রসিদ
            </div>
          </div>

          {/* Slip Meta */}
          <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">রসিদ নং:</span>
              <span className="font-mono font-semibold">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">তারিখ ও সময়:</span>
              <span className="font-mono text-slate-700">{formatBanglaDateTime(transaction.createdAt)}</span>
            </div>
            {transaction.trxId && (
              <div className="flex justify-between">
                <span className="text-slate-500">TrxID:</span>
                <span className="font-mono font-bold text-rose-600">{transaction.trxId}</span>
              </div>
            )}
          </div>

          {/* Customer & Service Info */}
          <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300 text-[11px]">
            {transaction.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">গ্রাহকের মোবাইল:</span>
                <span className="font-mono font-bold">{transaction.customerPhone}</span>
              </div>
            )}
            {transaction.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">গ্রাহকের নাম:</span>
                <span className="font-medium text-slate-800">{transaction.customerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">সেবার ধরন:</span>
              <span className="font-semibold text-slate-900">{getServiceLabel(transaction.service, transaction.type)}</span>
            </div>
            {transaction.packDetails && (
              <div className="flex justify-between text-slate-600">
                <span>প্যাকেজ বিবরণ:</span>
                <span className="font-medium">{transaction.packDetails}</span>
              </div>
            )}
          </div>

          {/* Amount Breakdown */}
          <div className="py-3 space-y-1.5 border-b border-slate-900 text-xs">
            <div className="flex justify-between text-sm font-bold pt-1">
              <span>মোট পরিশোধিত টাকা:</span>
              <span className="font-mono text-base">{formatBanglaCurrency(transaction.amount)}</span>
            </div>
            {transaction.fee > 0 && (
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>সার্ভিস চার্জ / ফি:</span>
                <span className="font-mono">{formatBanglaCurrency(transaction.fee)}</span>
              </div>
            )}
          </div>

          {/* Customer Remaining Due/Deposit */}
          {customer && (
            <div className="py-2.5 bg-slate-50 border-b border-dashed border-slate-300 px-2 my-1 rounded text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">বর্তমান অবশিষ্ট বাকি:</span>
                <span className="font-mono font-bold text-rose-600">{formatBanglaCurrency(customer.totalDue)}</span>
              </div>
              {customer.totalDeposit > 0 && (
                <div className="flex justify-between text-emerald-700 mt-0.5">
                  <span>অগ্রিম জমা ব্যালেন্স:</span>
                  <span className="font-mono font-semibold">{formatBanglaCurrency(customer.totalDeposit)}</span>
                </div>
              )}
            </div>
          )}

          {/* Barcode representation simulation for POS realism */}
          <div className="pt-3 text-center">
            <div className="inline-block font-mono tracking-[0.25em] text-[10px] text-slate-500 border-t border-b border-slate-300 py-1 px-4">
              ||| | |||| | |||||| || |||
            </div>
            <p className="mt-2 text-[10px] text-slate-500 italic">আমাদের সেবা গ্রহণ করার জন্য ধন্যবাদ!</p>
          </div>
        </div>

        {/* Print & Close Actions - Hidden on print */}
        <div className="no-print p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>থার্মাল প্রিন্ট করুন</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition"
          >
            বন্ধ
          </button>
        </div>

      </div>
    </div>
  );
};
