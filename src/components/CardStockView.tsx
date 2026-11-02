import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Smartphone, 
  Wifi, 
  PhoneCall, 
  Zap, 
  ShoppingBag, 
  AlertTriangle, 
  Edit3, 
  Check, 
  X,
  CreditCard
} from 'lucide-react';
import { CardProduct, TelecomOperator } from '../types';
import { TeleKhattaDB } from '../services/db';
import { formatBanglaCurrency } from '../utils/printAndExport';

interface CardStockViewProps {
  cards: CardProduct[];
  onRefreshData: () => void;
  onQuickSellCard: (card: CardProduct) => void;
}

export const CardStockView: React.FC<CardStockViewProps> = ({
  cards,
  onRefreshData,
  onQuickSellCard
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardProduct | null>(null);

  // New Card Form State
  const [title, setTitle] = useState('');
  const [operator, setOperator] = useState<TelecomOperator>('robi');
  const [category, setCategory] = useState<CardProduct['category']>('minute');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockCount, setStockCount] = useState('10');
  const [validityDays, setValidityDays] = useState('30');

  // Compute metrics
  const totalStockItems = cards.reduce((sum, c) => sum + c.stockCount, 0);
  const totalStockBuyingValue = cards.reduce((sum, c) => sum + (c.buyingPrice * c.stockCount), 0);
  const totalExpectedProfit = cards.reduce((sum, c) => sum + ((c.sellingPrice - c.buyingPrice) * c.stockCount), 0);
  const lowStockCount = cards.filter(c => c.stockCount <= 5).length;

  const filteredCards = cards.filter(c => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (!c.banglaTitle.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (operatorFilter !== 'all' && c.operator !== operatorFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    return true;
  });

  const handleCreateOrUpdateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !buyingPrice || !sellingPrice) {
      alert('অনুগ্রহ করে কার্ডের নাম এবং কেনা/বিক্রির দাম পূরণ করুন!');
      return;
    }

    const currentList = TeleKhattaDB.getCards();
    const buy = parseFloat(buyingPrice);
    const sell = parseFloat(sellingPrice);
    const stock = parseInt(stockCount, 10) || 0;
    const validity = parseInt(validityDays, 10) || 30;

    if (editingCard) {
      const idx = currentList.findIndex(c => c.id === editingCard.id);
      if (idx !== -1) {
        currentList[idx] = {
          ...editingCard,
          title: title.trim(),
          banglaTitle: title.trim(),
          operator,
          category,
          buyingPrice: buy,
          sellingPrice: sell,
          stockCount: stock,
          validityDays: validity
        };
        TeleKhattaDB.saveCards(currentList);
        TeleKhattaDB.addLog('প্যাকেজ তথ্য আপডেট', `${title} এর মূল্য ও স্টক আপডেট করা হয়েছে`, 'stock', 'info');
      }
      setEditingCard(null);
    } else {
      const newCard: CardProduct = {
        id: 'p-' + Date.now(),
        title: title.trim(),
        banglaTitle: title.trim(),
        operator,
        category,
        buyingPrice: buy,
        sellingPrice: sell,
        stockCount: stock,
        validityDays: validity
      };
      currentList.push(newCard);
      TeleKhattaDB.saveCards(currentList);
      TeleKhattaDB.addLog('নতুন প্যাকেজ বা কার্ড যুক্ত', `${newCard.banglaTitle} যুক্ত করা হয়েছে`, 'stock', 'info');
    }

    setIsAddCardOpen(false);
    setTitle('');
    setBuyingPrice('');
    setSellingPrice('');
    setStockCount('10');
    setValidityDays('30');
    onRefreshData();
  };

  const startEdit = (card: CardProduct) => {
    setEditingCard(card);
    setTitle(card.banglaTitle);
    setOperator(card.operator);
    setCategory(card.category);
    setBuyingPrice(card.buyingPrice.toString());
    setSellingPrice(card.sellingPrice.toString());
    setStockCount(card.stockCount.toString());
    setValidityDays(card.validityDays.toString());
    setIsAddCardOpen(true);
  };

  const handleRestock = (card: CardProduct, addedQuantity: number) => {
    const currentList = TeleKhattaDB.getCards();
    const idx = currentList.findIndex(c => c.id === card.id);
    if (idx !== -1) {
      currentList[idx].stockCount += addedQuantity;
      TeleKhattaDB.saveCards(currentList);
      TeleKhattaDB.addLog('কার্ড রিস্টক', `${card.banglaTitle} এর স্টকে ${addedQuantity} টি নতুন কার্ড যোগ করা হয়েছে`, 'stock', 'success');
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500">মোট স্টকে থাকা কার্ড/প্যাক</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {totalStockItems} <span className="text-xs font-sans font-normal text-slate-400">টি</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{cards.length} টি ভ্যারিয়েন্ট পণ্য</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500">স্টকের ক্রয়মূল্য ইনভেস্টমেন্ট</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatBanglaCurrency(totalStockBuyingValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">কেনা দামে বর্তমান স্টক</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500">প্রত্যাশিত মোট মুনাফা</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            +{formatBanglaCurrency(totalExpectedProfit)}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">স্টক শেষ হলে মোট লাভ</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500">কম স্টকের সতর্কবার্তা</div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {lowStockCount} <span className="text-xs font-sans font-normal text-slate-400">টি আইটেম</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">৫ টি বা তার কম অবশিষ্ট</div>
        </div>

      </div>

      {/* Control Bar: Filters & Add Product */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="প্যাকেজ নাম, এমবি বা মিনিট কার্ড খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setEditingCard(null);
              setTitle('');
              setBuyingPrice('');
              setSellingPrice('');
              setStockCount('10');
              setIsAddCardOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition active:scale-95 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন প্যাক / কার্ড যোগ</span>
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* Category Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {[
              { id: 'all', label: 'সকল ক্যাটাগরি' },
              { id: 'minute', label: 'মিনিট প্যাক' },
              { id: 'mb', label: 'ইন্টারনেট / MB' },
              { id: 'combo', label: 'কম্বো' },
              { id: 'scratch', label: 'স্ক্র্যাচ কার্ড' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  categoryFilter === cat.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Operator Filter */}
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">সকল অপারেটর</option>
            <option value="gp">গ্রামীণফোন (GP)</option>
            <option value="bl">বাংলালিংক (Banglalink)</option>
            <option value="robi">রবি (Robi)</option>
            <option value="airtel">এয়ারটেল (Airtel)</option>
            <option value="teletalk">টেলিটক (Teletalk)</option>
          </select>

        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map(card => {
          const profit = card.sellingPrice - card.buyingPrice;
          const isLowStock = card.stockCount <= 5;
          const isOutOfStock = card.stockCount <= 0;

          return (
            <div 
              key={card.id}
              className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs transition flex flex-col justify-between ${
                isOutOfStock 
                  ? 'border-red-300 dark:border-red-900/50 bg-red-50/20' 
                  : isLowStock 
                    ? 'border-amber-300 dark:border-amber-900/50' 
                    : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {card.operator}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {card.category === 'minute' ? 'মিনিট প্যাক' : card.category === 'mb' ? 'ইন্টারনেট ড্রাইভ' : card.category === 'combo' ? 'কম্বো প্যাক' : 'স্ক্র্যাচ কার্ড'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {card.banglaTitle}
                    </h4>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      মেয়াদ: {card.validityDays} দিন
                    </div>
                  </div>

                  {/* Stock Badge */}
                  <div className="text-right">
                    <div className={`text-sm font-mono font-bold ${
                      isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {card.stockCount} টি
                    </div>
                    <span className="text-[10px] text-slate-400">স্টক আছে</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mt-3 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">কেনা মূল্য</div>
                    <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatBanglaCurrency(card.buyingPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">বিক্রয় মূল্য</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatBanglaCurrency(card.sellingPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">নিট লাভ</div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatBanglaCurrency(profit)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRestock(card, 5)}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded-lg transition"
                    title="+৫ টি স্টক যোগ করুন"
                  >
                    +৫ স্টক
                  </button>
                  <button
                    onClick={() => startEdit(card)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition"
                    title="সম্পাদনা"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  disabled={isOutOfStock}
                  onClick={() => onQuickSellCard(card)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    isOutOfStock
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isOutOfStock ? 'স্টক শেষ' : 'বিক্রি করুন'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Card Modal */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingCard ? 'কার্ড ও প্যাক সম্পাদন' : 'নতুন মিনিট/ডাটা প্যাক যোগ করুন'}
              </h3>
              <button onClick={() => setIsAddCardOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateCard} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">প্যাকেজ বা কার্ডের নাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: রবি ৩৫০ মিনিট (৩০ দিন) অথবা জিপি ১০ জিবি"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">অপারেটর</label>
                  <select
                    value={operator}
                    onChange={e => setOperator(e.target.value as TelecomOperator)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="robi">রবি (Robi)</option>
                    <option value="gp">গ্রামীণফোন (GP)</option>
                    <option value="bl">বাংলালিংক (Banglalink)</option>
                    <option value="airtel">এয়ারটেল (Airtel)</option>
                    <option value="teletalk">টেলিটক (Teletalk)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">ক্যাটাগরি</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as CardProduct['category'])}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="minute">মিনিট প্যাক</option>
                    <option value="mb">ইন্টারনেট / MB ড্রাইভ</option>
                    <option value="combo">কম্বো প্যাক</option>
                    <option value="scratch">স্ক্র্যাচ কার্ড</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">ক্রয়মূল্য (কেনা দাম) ৳ *</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="220"
                    value={buyingPrice}
                    onChange={e => setBuyingPrice(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">বিক্রয়মূল্য ৳ *</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="250"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">স্টক পরিমাণ (সংখ্যা)</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={stockCount}
                    onChange={e => setStockCount(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">মেয়াদ (দিন)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={validityDays}
                    onChange={e => setValidityDays(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
