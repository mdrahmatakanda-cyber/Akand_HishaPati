import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Store, Building2, Loader2, User, MapPin } from 'lucide-react';

export default function SetupBusinessPage() {
  const { user, refreshBusiness } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.user_metadata?.name || '');
  const [address, setAddress] = useState(user?.user_metadata?.address || '');
  const [shopType, setShopType] = useState<'shop' | 'depot' | 'general'>('shop');

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return alert('দোকানের নাম দিন');
    setIsLoading(true);

    try {
      // ১. নতুন বিজনেস তৈরি
      const { data: biz, error: bizError } = await supabase
        .from('businesses')
        .insert([{ 
          name: shopName.trim(), 
          type: shopType,
          owner_name: ownerName,
          address: address,
          owner_id: user.id 
        }])
        .select()
        .single();

      if (bizError) throw bizError;

      // ২. প্রোফাইলে বিজনেস আইডি আপডেট
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ business_id: biz.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // ৩. রিফ্রেশ
      await refreshBusiness();
      
    } catch (error: any) {
      alert('দোকান তৈরি করতে সমস্যা: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-[#0B5C47] via-[#07465B] to-[#062D5E] flex items-center justify-center p-4 font-serif">
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl p-6 rounded-[24px] shadow-2xl border border-white/40">
        
        <div className="text-center mb-6">
          <h1 className="text-xl font-black text-[#0F2A3D]">আপনার ব্যবসা সেটআপ করুন</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">শুরু করতে আপনার দোকান বা ডিপোর তথ্য দিন</p>
        </div>

        <form onSubmit={handleCreateBusiness} className="flex flex-col gap-4">
          
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">ব্যবসার নাম <span className="text-red-500">*</span></label>
            <div className="relative">
              <Store className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input type="text" placeholder="যেমন: মায়ের দোয়া এন্টারপ্রাইজ" value={shopName} onChange={e => setShopName(e.target.value)} required className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0B5C47] focus:bg-white transition text-sm font-medium" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">মালিকের নাম</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input type="text" placeholder="মালিকের নাম" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0B5C47] focus:bg-white transition text-sm font-medium" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">ঠিকানা</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input type="text" placeholder="দোকান/ডিপোর ঠিকানা" value={address} onChange={e => setAddress(e.target.value)} className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0B5C47] focus:bg-white transition text-sm font-medium" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">ব্যবসার ধরন</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setShopType('shop')} className={`py-3 rounded-xl font-bold text-sm border flex flex-col items-center gap-1.5 transition ${shopType === 'shop' ? 'bg-[#EFF6FF] border-[#1E88E5] text-[#1E88E5] shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                <Store size={20} /> রিটেইল দোকান
              </button>
              <button type="button" onClick={() => setShopType('depot')} className={`py-3 rounded-xl font-bold text-sm border flex flex-col items-center gap-1.5 transition ${shopType === 'depot' ? 'bg-[#E8F5E9] border-[#0B5C47] text-[#0B5C47] shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                <Building2 size={20} /> ডিস্ট্রিবিউশন ডিপো
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-[#1E88E5] hover:bg-[#1565C0] text-white py-3.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 mt-2 transition active:scale-95">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'সেটআপ সম্পূর্ণ করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}