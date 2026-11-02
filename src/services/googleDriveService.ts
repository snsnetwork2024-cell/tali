import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { TeleKhattaDB } from './db';

// Initialize Firebase App instance safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Provider with Google Drive file scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to track sign-in in flight
let isSigningIn = false;
// Token cached ONLY in-memory (never in localStorage per security requirements)
let cachedAccessToken: string | null = null;

export interface DriveBackupItem {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

export class GoogleDriveService {
  /**
   * Listen to Firebase Auth state
   */
  static initAuth(
    onAuthSuccess?: (user: User, token: string) => void,
    onAuthFailure?: () => void
  ) {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user && cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      }
    });
  }

  /**
   * Trigger Google Sign-In popup with Drive scopes
   */
  static async signIn(): Promise<{ user: User; accessToken: string } | null> {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Google Drive access token not received from Firebase Auth');
      }

      cachedAccessToken = credential.accessToken;
      
      TeleKhattaDB.addLog(
        'গুগল ড্রাইভ কানেক্টেড',
        `${result.user.email || 'ব্যবহারকারী'} এর সাথে গুগল ড্রাইভ ক্লাউড ব্যাকআপ সফলভাবে সংযুক্ত করা হয়েছে`,
        'security',
        'success'
      );

      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error) {
      console.error('Google Sign In error:', error);
      throw error;
    } finally {
      isSigningIn = false;
    }
  }

  /**
   * Disconnect & sign out from Google
   */
  static async signOut(): Promise<void> {
    await signOut(auth);
    cachedAccessToken = null;
    TeleKhattaDB.addLog(
      'গুগল ড্রাইভ ডিসকানেক্টেড',
      'গুগল ড্রাইভ ক্লাউড ব্যাকআপ সংযোগ বিচ্ছিন্ন করা হয়েছে',
      'security',
      'warning'
    );
  }

  /**
   * Get currently active user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Get cached access token in memory
   */
  static async getAccessToken(): Promise<string | null> {
    return cachedAccessToken;
  }

  /**
   * Upload shop backup JSON to user's Google Drive
   */
  static async uploadBackupToDrive(
    customFileName?: string
  ): Promise<{ fileId: string; fileName: string; timestamp: string }> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('গুগল ড্রাইভ একাউন্ট কানেক্ট করা নেই। অনুগ্রহ করে প্রথমে সাইন ইন করুন।');
    }

    const now = new Date();
    const dateFormatted = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = customFileName || `Mawa_Enterprise_Backup_${dateFormatted}.json`;
    const jsonData = TeleKhattaDB.exportFullBackupJSON();

    // Multipart upload payload for Drive REST API v3
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: `Mawa Enterprise & Digital Hub - Auto Cloud Backup taken at ${now.toLocaleString('bn-BD')}`
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonData +
      closeDelimiter;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`গুগল ড্রাইভে আপলোড ব্যর্থ হয়েছে (${response.status}): ${errText}`);
    }

    const resData = await response.json();
    const timestampStr = now.toISOString();

    // Update settings with last drive backup timestamp
    const settings = TeleKhattaDB.getSettings();
    settings.lastDriveBackupAt = timestampStr;
    TeleKhattaDB.saveSettings(settings);

    TeleKhattaDB.addLog(
      'গুগল ড্রাইভে অটো ব্যাকআপ সফল',
      `ফাইল: ${fileName} সফলভাবে গুগল ড্রাইভে ক্লাউড ব্যাকআপ রাখা হয়েছে`,
      'backup',
      'success'
    );

    return {
      fileId: resData.id,
      fileName,
      timestamp: timestampStr
    };
  }

  /**
   * List existing Mawa Enterprise backups from Google Drive
   */
  static async listDriveBackups(): Promise<DriveBackupItem[]> {
    const token = await this.getAccessToken();
    if (!token) return [];

    const query = encodeURIComponent("name contains 'Mawa_Enterprise_Backup' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc&pageSize=20`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn('Failed to fetch Drive files:', response.status);
      return [];
    }

    const data = await response.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime,
      size: f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(1)} KB` : undefined
    }));
  }

  /**
   * Download backup JSON content from Google Drive by fileId
   */
  static async downloadBackupContent(fileId: string): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('গুগল ড্রাইভ কানেক্টেড নেই!');
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`ব্যাকআপ ফাইল ডাউনলোড করা যায়নি (${response.status})`);
    }

    return await response.text();
  }

  /**
   * Delete backup file from Google Drive
   * (Confirmation MUST be handled before calling this)
   */
  static async deleteDriveFile(fileId: string): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.ok;
  }
}
