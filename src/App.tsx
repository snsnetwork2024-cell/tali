import React, { useState, useEffect, useCallback } from 'react';
import { TeleKhattaDB } from './services/db';
import { NotificationService } from './services/notificationService';
import { 
  Transaction, 
  Customer, 
  CardProduct, 
  SimWallet, 
  ShopExpense, 
  ShopSettings, 
  ActivityLog 
} from './types';

// Components
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { CustomerLedgerView } from './components/CustomerLedgerView';
import { CardStockView } from './components/CardStockView';
import { WalletsView } from './components/WalletsView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { ActivityLogView } from './components/ActivityLogView';
import { SecurityBackupView } from './components/SecurityBackupView';
import { QuickPosModal } from './components/QuickPosModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PinLockScreen } from './components/PinLockScreen';
import { NotificationDrawer } from './components/NotificationDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';

export default function App() {
  const [settings, setSettings] = useState<ShopSettings>(() => TeleKhattaDB.getSettings());
  const [transactions, setTransactions] = useState<Transaction[]>(() => TeleKhattaDB.getTransactions());
  const [customers, setCustomers] = useState<Customer[]>(() => TeleKhattaDB.getCustomers());
  const [cards, setCards] = useState<CardProduct[]>(() => TeleKhattaDB.getCards());
  const [wallets, setWallets] = useState<SimWallet[]>(() => TeleKhattaDB.getWallets());
  const [expenses, setExpenses] = useState<ShopExpense[]>(() => TeleKhattaDB.getExpenses());
  const [logs, setLogs] = useState<ActivityLog[]>(() => TeleKhattaDB.getLogs());

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isQuickPosOpen, setIsQuickPosOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Receipt Modal state
  const [receiptTrx, setReceiptTrx] = useState<Transaction | null>(null);

  const refreshData = useCallback(() => {
    setSettings(TeleKhattaDB.getSettings());
    setTransactions(TeleKhattaDB.getTransactions());
    setCustomers(TeleKhattaDB.getCustomers());
    setCards(TeleKhattaDB.getCards());
    setWallets(TeleKhattaDB.getWallets());
    setExpenses(TeleKhattaDB.getExpenses());
    setLogs(TeleKhattaDB.getLogs());

    const notifs = NotificationService.getNotifications();
    setUnreadCount(notifs.filter(n => !n.read).length);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleTransactionComplete = (trx: Transaction, shouldPrint: boolean) => {
    refreshData();
    if (shouldPrint) {
      setReceiptTrx(trx);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    TeleKhattaDB.deleteTransaction(id);
    refreshData();
  };

  const handleQuickSellCard = (card: CardProduct) => {
    // Open Quick POS Modal with cards preselected
    setIsQuickPosOpen(true);
  };

  const handleOpenDuePayment = (cust: Customer) => {
    setIsQuickPosOpen(true);
  };

  const handleOpenAddDue = (cust: Customer) => {
    setIsQuickPosOpen(true);
  };

  const totalSimBalance = wallets.reduce((sum, w) => sum + w.currentBalance, 0);

  // Find linked customer for receipt if present
  const receiptCustomer = receiptTrx?.customerId
    ? customers.find(c => c.id === receiptTrx.customerId)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      
      {/* Security Pin Lock Screen if active */}
      {isLocked && (
        <PinLockScreen
          settings={settings}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* Top Application Bar */}
      <Header
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickPos={() => setIsQuickPosOpen(true)}
        onLockScreen={() => setIsLocked(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={unreadCount}
        totalSimBalance={totalSimBalance}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 xl:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            customers={customers}
            wallets={wallets}
            cards={cards}
            settings={settings}
            onOpenQuickPos={() => setIsQuickPosOpen(true)}
            onSelectTransactionToPrint={(trx) => setReceiptTrx(trx)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            settings={settings}
            onSelectTransactionToPrint={(trx) => setReceiptTrx(trx)}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerLedgerView
            customers={customers}
            transactions={transactions}
            settings={settings}
            onRefreshData={refreshData}
            onOpenDuePayment={handleOpenDuePayment}
            onOpenAddDue={handleOpenAddDue}
          />
        )}

        {activeTab === 'cards' && (
          <CardStockView
            cards={cards}
            onRefreshData={refreshData}
            onQuickSellCard={handleQuickSellCard}
          />
        )}

        {activeTab === 'wallets' && (
          <WalletsView
            wallets={wallets}
            settings={settings}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            settings={settings}
            expenses={expenses}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'activities' && (
          <ActivityLogView
            logs={logs}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'security' && (
          <SecurityBackupView
            settings={settings}
            onRefreshData={refreshData}
            onLockScreen={() => setIsLocked(true)}
          />
        )}
      </main>

      {/* Quick POS Modal */}
      <QuickPosModal
        isOpen={isQuickPosOpen}
        onClose={() => setIsQuickPosOpen(false)}
        settings={settings}
        wallets={wallets}
        customers={customers}
        cards={cards}
        onTransactionComplete={handleTransactionComplete}
      />

      {/* Thermal Receipt Preview Modal */}
      <ReceiptModal
        transaction={receiptTrx}
        settings={settings}
        customer={receiptCustomer}
        onClose={() => setReceiptTrx(null)}
      />

      {/* Push Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onRefreshUnread={refreshData}
      />

      {/* Mobile Ergonomic Bottom Tab Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickPos={() => setIsQuickPosOpen(true)}
        unreadCount={unreadCount}
      />

    </div>
  );
}
