import React, { useState } from 'react';
import { Lock, Delete, ShieldAlert } from 'lucide-react';
import { ShopSettings } from '../types';
import { playSoftTap, playAlertTone, playSuccessChime } from '../utils/sound';

interface PinLockScreenProps {
  settings: ShopSettings;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ settings, onUnlock }) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [isError, setIsError] = useState(false);

  const handleKeyPress = (num: string) => {
    playSoftTap();
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);

      if (nextPin.length === 4) {
        if (nextPin === settings.masterPin) {
          playSuccessChime();
          onUnlock();
        } else {
          playAlertTone();
          setIsError(true);
          setTimeout(() => {
            setEnteredPin('');
            setIsError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    playSoftTap();
    setEnteredPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-xs text-center space-y-6">
        
        {/* Store Icon & Title */}
        <div>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white shadow-lg mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            {settings.shopName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            হিসাব খাতা সুরক্ষিত রাখতে মাস্টার পিন দিন
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className={`flex justify-center items-center gap-3.5 my-4 transition-transform ${isError ? 'animate-bounce text-rose-500' : ''}`}>
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                enteredPin.length > idx
                  ? 'bg-rose-500 border-rose-500 scale-110 shadow-sm'
                  : 'border-slate-600 bg-transparent'
              }`}
            />
          ))}
        </div>

        {isError && (
          <div className="text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-4 h-4" />
            <span>ভুল পিন কোড! পুনরায় চেষ্টা করুন</span>
          </div>
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-rose-600 text-xl font-bold font-mono text-white transition active:scale-95 shadow-xs border border-slate-800"
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setEnteredPin('')}
            className="h-14 rounded-2xl bg-slate-900/40 text-slate-400 hover:text-white font-medium text-xs transition"
          >
            মুছুন
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-rose-600 text-xl font-bold font-mono text-white transition active:scale-95 shadow-xs border border-slate-800"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 shadow-xs border border-slate-800"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 pt-2">
          ডিফল্ট পিন কোড: <span className="font-mono font-bold text-slate-400">1234</span>
        </p>

      </div>
    </div>
  );
};
