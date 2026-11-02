import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Upload, 
  Lock, 
  KeyRound, 
  Clock, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  Database,
  Printer,
  Sliders,
  History,
  Cloud,
  CloudUpload,
  CloudCheck,
  RefreshCw,
  Trash2,
  ExternalLink,
  Check,
  LogOut,
  UserCheck
} from 'lucide-react';
import { ShopSettings } from '../types';
import { TeleKhattaDB } from '../services/db';
import { downloadJSONFile, formatBanglaDateTime } from '../utils/printAndExport';
import { GoogleDriveService, DriveBackupItem } from '../services/googleDriveService';
import { User } from 'firebase/auth';

interface SecurityBackupViewProps {
  settings: ShopSettings;
  onRefreshData: () => void;
  onLockScreen: () => void;
}

export const SecurityBackupView: React.FC<SecurityBackupViewProps> = ({
  settings,
  onRefreshData,
  onLockScreen
}) => {
  // Google Drive Cloud Backup states
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [isFetchingDriveFiles, setIsFetchingDriveFiles] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupItem[]>([]);
  const [driveMessage, setDriveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoCloudBackup, setAutoCloudBackup] = useState<boolean>(settings.autoBackupToDrive ?? true);

  // Security PIN states
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Shop Settings state
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopOwner, setShopOwner] = useState(settings.shopOwner);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [printSize, setPrintSize] = useState<'58mm' | '80mm' | 'a4'>(settings.printPaperSize);
  const [autoLockMinutes, setAutoLockMinutes] = useState(settings.autoLockMinutes.toString());

  // Commission Rates
  const [bkashCashOutRate, setBkashCashOutRate] = useState(settings.commissions.bkashCashOutRate.toString());
  const [bkashCashInRate, setBkashCashInRate] = useState((settings.commissions.bkashCashInRate ?? 1.50).toString());
  const [nagadCashOutRate, setNagadCashOutRate] = useState(settings.commissions.nagadCashOutRate.toString());
  const [nagadCashInRate, setNagadCashInRate] = useState((settings.commissions.nagadCashInRate ?? 1.50).toString());
  const [rocketCashOutRate, setRocketCashOutRate] = useState(settings.commissions.rocketCashOutRate.toString());
  const [rocketCashInRate, setRocketCashInRate] = useState((settings.commissions.rocketCashInRate ?? 1.50).toString());
  const [flexiRate, setFlexiRate] = useState(settings.commissions.flexiloadCommissionPerThousand.toString());

  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Snapshots
  const snapshots = TeleKhattaDB.getLocalSnapshots();

  // Initialize and check Google Drive Auth
  useEffect(() => {
    const unsubscribe = GoogleDriveService.initAuth(
      async (user, _token) => {
        setGoogleUser(user);
        setIsDriveConnected(true);
        loadDriveBackups();
      },
      () => {
        setGoogleUser(null);
        setIsDriveConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch backups from Google Drive
  const loadDriveBackups = async () => {
    setIsFetchingDriveFiles(true);
    try {
      const files = await GoogleDriveService.listDriveBackups();
      setDriveBackups(files);
    } catch (err) {
      console.error('Failed to list drive files:', err);
    } finally {
      setIsFetchingDriveFiles(false);
    }
  };

  // Connect Google Account
  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setDriveMessage(null);
    try {
      const result = await GoogleDriveService.signIn();
      if (result) {
        setGoogleUser(result.user);
        setIsDriveConnected(true);
        setDriveMessage({ type: 'success', text: 'গুগল ড্রাইভ সফলভাবে সংযুক্ত করা হয়েছে!' });
        await loadDriveBackups();
      }
    } catch (err: any) {
      setDriveMessage({ 
        type: 'error', 
        text: err?.message || 'গুগল সাইন-ইন সম্পন্ন করা সম্ভব হয়নি।' 
      });
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Disconnect Google Account
  const handleDisconnectGoogle = async () => {
    if (confirm('আপনি কি গুগল ড্রাইভ সংযোগ বিচ্ছিন্ন করতে চান?')) {
      await GoogleDriveService.signOut();
      setGoogleUser(null);
      setIsDriveConnected(false);
      setDriveBackups([]);
      setDriveMessage({ type: 'success', text: 'গুগল ড্রাইভ সংযোগ বিচ্ছিন্ন করা হয়েছে।' });
    }
  };

  // Trigger Cloud Backup Upload
  const handleUploadToDriveNow = async () => {
    setIsUploadingToDrive(true);
    setDriveMessage(null);
    try {
      const result = await GoogleDriveService.uploadBackupToDrive();
      setDriveMessage({
        type: 'success',
        text: `অভিনন্দন! গুগল ড্রাইভে ক্লাউড ব্যাকআপ সফল হয়েছে (${result.fileName})`
      });
      await loadDriveBackups();
      onRefreshData();
    } catch (err: any) {
      setDriveMessage({
        type: 'error',
        text: err?.message || 'গুগল ড্রাইভে ব্যাকআপ আপলোড ব্যর্থ হয়েছে!'
      });
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Restore from Google Drive file
  const handleRestoreFromDrive = async (item: DriveBackupItem) => {
    const pin = prompt(
      `গুগল ড্রাইভ ব্যাকআপ "${item.name}" থেকে রিস্টোর করতে মাস্টার পিন লিখুন:\n\nসতর্কতা: রিস্টোর করলে বর্তমান ডাটা এই ব্যাকআপ ফাইল দ্বারা প্রতিস্থাপিত হবে!`
    );
    if (!pin) return;

    if (pin !== settings.masterPin) {
      alert('ভুল পিন কোড! রিস্টোর বাতিল করা হয়েছে।');
      return;
    }

    try {
      // Create rollback snapshot first
      TeleKhattaDB.createLocalSnapshot(`গুগল ড্রাইভ রিস্টোর পূর্ববর্তী স্ন্যাপশট (${item.name})`);
      const jsonContent = await GoogleDriveService.downloadBackupContent(item.id);
      const res = TeleKhattaDB.restoreFullBackupJSON(jsonContent);

      if (res.success) {
        alert('অভিনন্দন! গুগল ড্রাইভ ব্যাকআপ থেকে সফলভাবে রিস্টোর করা হয়েছে। পৃষ্ঠাটি রিফ্রেশ হচ্ছে...');
        window.location.reload();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(`রিস্টোর ব্যর্থ হয়েছে: ${err?.message || 'অজানা ত্রুটি'}`);
    }
  };

  // Delete from Google Drive (Mandatory user confirmation per Workspace Skill)
  const handleDeleteFromDrive = async (item: DriveBackupItem) => {
    const isConfirmed = confirm(
      `আপনি কি নিশ্চিত যে গুগল ড্রাইভ থেকে ব্যাকআপ ফাইল "${item.name}" মুছে ফেলতে চান?\n\nএই ব্যাকআপটি আপনার গুগল ড্রাইভ থেকে পার্মানেন্টলি ডিলিট হবে।`
    );
    if (!isConfirmed) return;

    try {
      const success = await GoogleDriveService.deleteDriveFile(item.id);
      if (success) {
        setDriveBackups(prev => prev.filter(f => f.id !== item.id));
        setDriveMessage({ type: 'success', text: `গুগল ড্রাইভ থেকে "${item.name}" মুছে ফেলা হয়েছে।` });
        TeleKhattaDB.addLog('ড্রাইভ ব্যাকআপ ডিলিট', `গুগল ড্রাইভ ফাইল ${item.name} ডিলিট করা হয়েছে`, 'backup', 'warning');
      } else {
        alert('ফাইলটি মুছে ফেলা যায়নি!');
      }
    } catch (err: any) {
      alert(`ডিলিট ব্যর্থ হয়েছে: ${err?.message || 'ত্রুটি'}`);
    }
  };

  // Toggle Auto Cloud Backup
  const handleToggleAutoCloudBackup = (enabled: boolean) => {
    setAutoCloudBackup(enabled);
    const s = TeleKhattaDB.getSettings();
    s.autoBackupToDrive = enabled;
    TeleKhattaDB.saveSettings(s);
    onRefreshData();
  };

  // Manual Local File Download
  const handleDownloadBackup = () => {
    TeleKhattaDB.createLocalSnapshot('ম্যানুয়াল ব্যাকআপ ডাউনলোড পূর্ববর্তী স্ন্যাপশট');
    const jsonStr = TeleKhattaDB.exportFullBackupJSON();
    const dateStr = new Date().toISOString().substring(0, 10);
    const filename = `Mawa_Enterprise_Backup_${dateStr}.json`;
    downloadJSONFile(jsonStr, filename);
    TeleKhattaDB.addLog('ডাটাবেস ব্যাকআপ ডাউনলোড', `সম্পূর্ণ ডাটাবেস সফলভাবে JSON ফাইলে এক্সপোর্ট করা হয়েছে: ${filename}`, 'backup', 'success');
    alert('ডাটাবেসের সম্পূর্ণ ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন হয়েছে!');
  };

  // Manual Local File Restore
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const pin = prompt('ডাটাবেস রিস্টোর অত্যন্ত সংবেদনশীল। নিশ্চিত করতে মাস্টার পিন (Master PIN) প্রবেশ করুন:');
    if (pin !== settings.masterPin) {
      alert('ভুল পিন কোড! রিস্টোর বাতিল করা হয়েছে।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        TeleKhattaDB.createLocalSnapshot('রিস্টোর পূর্ববর্তী অটো সেফটি স্ন্যাপশট');
        const res = TeleKhattaDB.restoreFullBackupJSON(content);
        if (res.success) {
          alert('অভিনন্দন! ডাটাবেস ব্যাকআপ থেকে সফলভাবে রিস্টোর করা হয়েছে। পৃষ্ঠাটি রিফ্রেশ হচ্ছে...');
          window.location.reload();
        } else {
          alert(res.message);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinInput !== settings.masterPin) {
      setPinMessage({ type: 'error', text: 'বর্তমান পিন কোড ভুল হয়েছে!' });
      return;
    }
    if (newPinInput.length < 4) {
      setPinMessage({ type: 'error', text: 'নতুন পিন কোড কমপক্ষে ৪ সংখ্যার হতে হবে!' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinMessage({ type: 'error', text: 'নতুন পিন ও কনফার্ম পিন মেলেনি!' });
      return;
    }

    const s = TeleKhattaDB.getSettings();
    s.masterPin = newPinInput;
    TeleKhattaDB.saveSettings(s);
    TeleKhattaDB.addLog('মাস্টার পিন পরিবর্তন', 'দোকানের অ্যাডমিন সিকিউরিটি পিন সফলভাবে পরিবর্তন করা হয়েছে', 'security', 'security');

    setPinMessage({ type: 'success', text: 'মাস্টার পিন সফলভাবে আপডেট করা হয়েছে!' });
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    onRefreshData();
  };

  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const s = TeleKhattaDB.getSettings();
    s.shopName = shopName.trim();
    s.shopOwner = shopOwner.trim();
    s.phone = phone.trim();
    s.address = address.trim();
    s.printPaperSize = printSize;
    s.autoLockMinutes = parseInt(autoLockMinutes, 10) || 15;
    s.commissions = {
      ...s.commissions,
      bkashCashOutRate: parseFloat(bkashCashOutRate) || 4.10,
      bkashCashInRate: parseFloat(bkashCashInRate) || 1.50,
      nagadCashOutRate: parseFloat(nagadCashOutRate) || 4.30,
      nagadCashInRate: parseFloat(nagadCashInRate) || 1.50,
      rocketCashOutRate: parseFloat(rocketCashOutRate) || 4.20,
      rocketCashInRate: parseFloat(rocketCashInRate) || 1.50,
      flexiloadCommissionPerThousand: parseFloat(flexiRate) || 28
    };

    TeleKhattaDB.saveSettings(s);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
    onRefreshData();
  };

  const handleRestoreSnapshot = (snap: { id: string; name: string; timestamp: string; dataString: string }) => {
    const pin = prompt(`স্ন্যাপশট "${snap.name}" এ রোলব্যাক করতে মাস্টার পিন লিখুন:`);
    if (pin === settings.masterPin) {
      TeleKhattaDB.restoreFullBackupJSON(snap.dataString);
      alert('সফলভাবে পূর্ববর্তী স্ন্যাপশটে ফিরে যাওয়া হয়েছে!');
      window.location.reload();
    } else if (pin !== null) {
      alert('ভুল পিন কোড!');
    }
  };

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------------------- */}
      {/* 1. GOOGLE DRIVE AUTO CLOUD BACKUP HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-white to-sky-50/50 dark:from-slate-900 dark:to-sky-950/20 rounded-2xl border-2 border-sky-500/30 shadow-sm space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center p-2 shrink-0">
              {/* Google Drive Official Colors Icon */}
              <svg className="w-full h-full" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  গুগল ড্রাইভ স্বয়ংক্রিয় ক্লাউড ব্যাকআপ
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Google Drive Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                আপনার গুগল ড্রাইভে দোকানের হিসাব ও বাকি খতিয়ানের অটোমেটিক ব্যাকআপ সংরক্ষণ
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          {isDriveConnected ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>কানেক্টেড ও নিরাপদ</span>
              </span>
              <button
                onClick={handleDisconnectGoogle}
                className="text-xs text-slate-400 hover:text-rose-500 p-1"
                title="গুগল একাউন্ট ডিসকানেক্ট করুন"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>কানেক্ট করা নেই</span>
            </span>
          )}
        </div>

        {/* Message notification if any */}
        {driveMessage && (
          <div className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            driveMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' 
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {driveMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{driveMessage.text}</span>
            </div>
            <button onClick={() => setDriveMessage(null)} className="text-slate-400 hover:text-slate-700 ml-2">×</button>
          </div>
        )}

        {/* CASE A: NOT CONNECTED -> Sign in with Google Button */}
        {!isDriveConnected ? (
          <div className="p-5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                গুগল একাউন্ট যুক্ত করে অটোমেটিক ব্যাকআপ চালু করুন
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                আপনার গুগল ড্রাইভে নিরাপদ ব্যাকআপ ফাইল সংরক্ষণ করা হবে। মোবাইল পরিবর্তন করলেও বা কম্পিউটার উইন্ডোজ ক্র্যাশ করলেও গুগল ড্রাইভ থেকে ১ ক্লিকে সমস্ত কাস্টমার খতিয়ান, বাকি ও লেনদেনের হিসাব ফিরে পাওয়া যাবে।
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Official Google Sign In Button */}
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 font-semibold text-xs rounded-xl shadow-xs border border-slate-300 dark:border-slate-700 transition active:scale-95 disabled:opacity-50"
              >
                {/* Official Google 'G' Logo SVG */}
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>{isConnectingGoogle ? 'গুগলে কানেক্ট হচ্ছে...' : 'Sign in with Google (গুগল দিয়ে কানেক্ট করুন)'}</span>
              </button>

              <span className="text-[11px] text-slate-400">
                🔒 এন্ড-টু-এন্ড নিরাপদ ও শুধুমাত্র আপনার ড্রাইভে সেভ হবে
              </span>
            </div>
          </div>
        ) : (
          /* CASE B: CONNECTED -> User info, controls, manual trigger & drive files */
          <div className="space-y-4">
            
            {/* Account Card & Settings Bar */}
            <div className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {googleUser?.photoURL ? (
                  <img 
                    src={googleUser.photoURL} 
                    alt="User Avatar" 
                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {googleUser?.displayName || 'সংযুক্ত গুগল একাউন্ট'}
                  </div>
                  <div className="font-mono text-slate-500">
                    {googleUser?.email}
                  </div>
                </div>
              </div>

              {/* Auto Cloud Backup Toggle */}
              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-2 sm:pt-0 sm:pl-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCloudBackup}
                    onChange={(e) => handleToggleAutoCloudBackup(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      অটো ক্লাউড ব্যাকআপ সক্রিয়
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      নিয়মিত ব্যাকআপ গুগলে জমা হবে
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Backup Now Action Banner */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CloudCheck className="w-4 h-4 text-sky-600" />
                  <span>সর্বশেষ গুগল ড্রাইভ ব্যাকআপ:</span>
                  <strong className="font-mono text-sky-700 dark:text-sky-300">
                    {settings.lastDriveBackupAt 
                      ? formatBanglaDateTime(settings.lastDriveBackupAt) 
                      : 'এখনো ব্যাকআপ নেওয়া হয়নি'}
                  </strong>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  একটি ক্লিকে বর্তমান মুহূর্তের সকল হিসাব ক্লাউডে জমা করুন।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUploadToDriveNow}
                  disabled={isUploadingToDrive}
                  className="flex items-center gap-2 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
                >
                  <CloudUpload className={`w-4 h-4 ${isUploadingToDrive ? 'animate-bounce' : ''}`} />
                  <span>{isUploadingToDrive ? 'গুগল ড্রাইভে আপলোড হচ্ছে...' : 'এখনই গুগল ড্রাইভে ব্যাকআপ নিন'}</span>
                </button>

                <button
                  type="button"
                  onClick={loadDriveBackups}
                  disabled={isFetchingDriveFiles}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition"
                  title="ড্রাইভ ফাইল তালিকা রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingDriveFiles ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* List of files on Google Drive */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                <span>গুগল ড্রাইভে সংরক্ষিত ব্যাকআপ তালিকা ({driveBackups.length}টি)</span>
                <span className="text-[11px] text-slate-400 font-normal">যেকোনো সময় রিস্টোর করতে পারবেন</span>
              </div>

              {driveBackups.length === 0 ? (
                <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                  {isFetchingDriveFiles ? 'গুগল ড্রাইভ ফাইল খোঁজা হচ্ছে...' : 'এখনো কোনো ব্যাকআপ ফাইল ড্রাইভে পাওয়া যায়নি। উপরের "এখনই ব্যাকআপ নিন" বোতামে চাপুন।'}
                </div>
              ) : (
                <div className="space-y-2">
                  {driveBackups.map(file => (
                    <div 
                      key={file.id} 
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-sky-300 transition"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-sky-500" />
                          <span>{file.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>তৈরি: {formatBanglaDateTime(file.createdTime)}</span>
                          {file.size && <span>• সাইজ: {file.size}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Restore Button */}
                        <button
                          type="button"
                          onClick={() => handleRestoreFromDrive(file)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-slate-800 dark:text-slate-200 rounded-lg transition"
                          title="এই ব্যাকআপটি থেকে সমস্ত হিসাব রিস্টোর করুন"
                        >
                          <Upload className="w-3 h-3 text-emerald-600" />
                          <span>রিস্টোর</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteFromDrive(file)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="গুগল ড্রাইভ থেকে এই ব্যাকআপ মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. LOCAL OFFLINE BACKUP & RESTORE HERO CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              লোকাল অফলাইন ব্যাকআপ ও রিস্টোর সিস্টেম
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ইন্টারনেট ছাড়াও কম্পিউটারে ফাইল সেভ করে রাখার সুবিধা
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          
          {/* 1-Click Export Backup */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>১-ক্লিকে সম্পূর্ণ ব্যাকআপ ডাউনলোড (JSON)</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                আপনার ডিভাইসে একটি নিরাপদ এনক্রিপ্টেড ব্যাকআপ ফাইল সেভ করে রাখুন। কম্পিউটার নষ্ট বা মোবাইল হারালেও সকল হিসাব অক্ষত থাকবে।
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>ব্যাকআপ ফাইল ডাউনলোড করুন (.json)</span>
            </button>
          </div>

          {/* 1-Click Restore */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <Upload className="w-4 h-4 text-rose-600" />
                <span>পূর্ববর্তী ফাইল থেকে রিস্টোর (Local Restore)</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                পূর্বের ব্যাকআপ JSON ফাইল সিলেক্ট করে সকল হিসাব ও খতিয়ান ফিরিয়ে আনুন। রিস্টোরের পূর্বে মাস্টার পিন যাচাই করা হবে।
              </p>
            </div>
            <label className="mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95">
              <Upload className="w-4 h-4" />
              <span>ব্যাকআপ ফাইল নির্বাচন করুন</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>

        </div>

        {/* Local Snapshots Rollback History */}
        {snapshots.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              লোকাল সেফটি স্ন্যাপশট হিস্টোরি (Rollback Points)
            </h4>
            <div className="space-y-1.5 text-xs">
              {snapshots.map(s => (
                <div key={s.id} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 ml-2">
                      ({formatBanglaDateTime(s.timestamp)})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRestoreSnapshot(s)}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    রোলব্যাক করুন &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SECURITY PIN & SETTINGS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Change Master PIN Form */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                মাস্টার সিকিউরিটি পিন পরিবর্তন
              </h3>
            </div>
            <button
              onClick={onLockScreen}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>স্ক্রিন লক করুন</span>
            </button>
          </div>

          <form onSubmit={handleChangePin} className="space-y-3 text-xs">
            {pinMessage && (
              <div className={`p-2.5 rounded-xl font-semibold ${
                pinMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {pinMessage.text}
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1">বর্তমান পিন কোড (Current PIN)</label>
              <input
                type="password"
                maxLength={6}
                placeholder="ডিফল্ট: 1234"
                value={currentPinInput}
                onChange={e => setCurrentPinInput(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">নতুন ৪-সংখ্যার পিন</label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="যেমন: 5678"
                  value={newPinInput}
                  onChange={e => setNewPinInput(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">কনফার্ম নতুন পিন</label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="পুনরায় লিখুন"
                  value={confirmPinInput}
                  onChange={e => setConfirmPinInput(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition"
            >
              পিন কোড আপডেট করুন
            </button>
          </form>
        </div>

        {/* Shop Profile & Commissions Settings */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              দোকান বিবরণ ও কমিশন রেট সেটিংস
            </h3>
          </div>

          <form onSubmit={handleSaveShopSettings} className="space-y-3 text-xs">
            {settingsSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1">দোকানের নাম (রসিদে প্রদর্শিত হবে)</label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">দোকানের মোবাইল নম্বর</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">থার্মাল প্রিন্ট সাইজ</label>
                <select
                  value={printSize}
                  onChange={e => setPrintSize(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  <option value="58mm">৫৮ মিমি (ছোট পস রোল)</option>
                  <option value="80mm">৮০ মিমি (স্ট্যান্ডার্ড পস)</option>
                  <option value="a4">এ৪ সাইজ প্রিন্টার</option>
                </select>
              </div>
            </div>

            {/* Commissions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                কমিশন রেট কনফিগারেশন (প্রতি হাজারে টাকা)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500">বিকাশ ক্যাশআউট</label>
                  <input
                    type="number"
                    step="0.05"
                    value={bkashCashOutRate}
                    onChange={e => setBkashCashOutRate(e.target.value)}
                    className="w-full px-2 py-1.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">বিকাশ ক্যাশইন</label>
                  <input
                    type="number"
                    step="0.05"
                    value={bkashCashInRate}
                    onChange={e => setBkashCashInRate(e.target.value)}
                    className="w-full px-2 py-1.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">নগদ ক্যাশআউট</label>
                  <input
                    type="number"
                    step="0.05"
                    value={nagadCashOutRate}
                    onChange={e => setNagadCashOutRate(e.target.value)}
                    className="w-full px-2 py-1.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">নগদ ক্যাশইন</label>
                  <input
                    type="number"
                    step="0.05"
                    value={nagadCashInRate}
                    onChange={e => setNagadCashInRate(e.target.value)}
                    className="w-full px-2 py-1.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">রকেট ক্যাশআউট</label>
                  <input
                    type="number"
                    step="0.05"
                    value={rocketCashOutRate}
                    onChange={e => setRocketCashOutRate(e.target.value)}
                    className="w-full px-2 py-1.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">ফ্লেক্সিলোড / লোড</label>
                  <input
                    type="number"
                    step="0.5"
                    value={flexiRate}
                    onChange={e => setFlexiRate(e.target.value)}
                    className="w-full px-2 py-1.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
            >
              সেটিংস সেভ করুন
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
