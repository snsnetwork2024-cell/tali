import { Transaction, Customer, MonthlyProfitReport, ShopSettings } from '../types';

export function formatBanglaCurrency(amount: number): string {
  return '৳' + Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

export function formatBanglaDateTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function exportTransactionsCSV(transactions: Transaction[], filename = 'telekhatta_transactions.csv'): void {
  const headers = ['ID', 'Date Time', 'Service', 'Type', 'Amount (BDT)', 'Phone', 'Customer Name', 'TrxID', 'Commission', 'Fee', 'Profit', 'Drawer Cash Impact', 'SIM Impact'];
  
  const rows = transactions.map(t => [
    t.id,
    new Date(t.createdAt).toLocaleString('en-US'),
    t.service.toUpperCase(),
    t.type,
    t.amount,
    t.customerPhone || '',
    `"${(t.customerName || '').replace(/"/g, '""')}"`,
    t.trxId || '',
    t.commission,
    t.fee,
    t.profit,
    t.drawerCashDelta,
    t.simBalanceDelta
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCustomersCSV(customers: Customer[], filename = 'telekhatta_customer_ledger.csv'): void {
  const headers = ['ID', 'Customer Name', 'Phone', 'Address', 'Total Due (BDT)', 'Total Advance Deposit (BDT)', 'Last Activity'];
  
  const rows = customers.map(c => [
    c.id,
    `"${c.name.replace(/"/g, '""')}"`,
    c.phone,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    c.totalDue,
    c.totalDeposit,
    new Date(c.lastActivityAt).toLocaleString('en-US')
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportMonthlyReportCSV(report: MonthlyProfitReport, filename = `profit_report_${report.monthKey}.csv`): void {
  const lines = [
    `Mawa Enterprise & Digital Hub - Monthly Profit & Loss Statement`,
    `Month: ${report.monthName} (${report.monthKey})`,
    `Generated At: ${new Date().toLocaleString('en-US')}`,
    ``,
    `Metric,Amount (BDT)`,
    `Total Transactions Count,${report.totalTransactionsCount}`,
    `Total Turnover (মোট লেনদেন),${report.totalTurnover}`,
    `MFS Cash Out Volume,${report.mfsCashOutVolume}`,
    `MFS Cash In Volume,${report.mfsCashInVolume}`,
    `Flexiload Volume,${report.flexiloadVolume}`,
    `Card & Package Sales Volume,${report.cardSalesVolume}`,
    ``,
    `--- PROFIT & REVENUE BREAKDOWN ---`,
    `MFS Commissions (বিকাশ/নগদ কমিশন),${report.mfsCommissions.toFixed(2)}`,
    `Flexiload Commissions (রিচার্জ কমিশন),${report.flexiloadCommissions.toFixed(2)}`,
    `Card Sales Profit (কার্ড বিক্রির নিট লাভ),${report.cardProfits.toFixed(2)}`,
    `Other Service Fees (অন্যান্য চার্জ),${report.otherFees.toFixed(2)}`,
    `GROSS PROFIT (মোট আয়/লাভ),${report.grossProfit.toFixed(2)}`,
    ``,
    `--- SHOP EXPENSES (দোকান খরচ) ---`,
    `Total Shop Expenses (দোকান ব্যয়),${report.totalExpenses.toFixed(2)}`,
    ``,
    `NET PROFIT (মাসিক নিট মুনাফা),${report.netProfit.toFixed(2)}`,
    ``,
    `Customer Dues Given (নতুন বাকি),${report.newCustomerDuesGiven}`,
    `Customer Dues Collected (আদায়কৃত বাকি),${report.customerDuesCollected}`
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadJSONFile(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateDueReminderText(customer: Customer, settings: ShopSettings): string {
  return `শ্রদ্ধেয় ${customer.name}, ${settings.shopName} হতে আপনার অবগতির জন্য জানানো যাচ্ছে যে, আপনার বকেয়া/বাকি হিসাবের বর্তমান স্থিতি: ${formatBanglaCurrency(customer.totalDue)}। অনুগ্রহপূর্বক যথাসময়ে পরিশোধের অনুরোধ করা হলো। প্রয়োজনে যোগাযোগ: ${settings.phone}। ধন্যবাদ।`;
}
