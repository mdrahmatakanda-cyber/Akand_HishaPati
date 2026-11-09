import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Mail, Lock, User, Loader2, Phone } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // ফর্ম স্টেট
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // নতুন
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // নতুন

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!name.trim()) throw new Error('নাম আবশ্যক');
        if (!phone.trim()) throw new Error('মোবাইল নম্বর আবশ্যক');
        if (password !== confirmPassword) throw new Error('পাসওয়ার্ড দুইটি মিলছে না!');

        // রেজিস্ট্রেশন
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name, phone: phone } // নাম ও মোবাইল মেটাডাটায় পাঠানো হচ্ছে
          }
        });
        if (error) throw error;
        
        alert('রেজিস্ট্রেশন সফল হয়েছে! এখন লগইন করুন।');
        setIsLogin(true);
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-[#0B5C47] via-[#07465B] to-[#062D5E] flex items-center justify-center p-4 relative overflow-hidden font-serif">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#43A047]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-[#1E88E5]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl p-6 rounded-[24px] shadow-2xl border border-white/40 z-10">
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0B5C47] to-[#1E88E5] text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-black text-[#0F2A3D]">Akand HishabPati</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {isLogin ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-lg mb-4 border border-red-200 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input type="text" placeholder="আপনার নাম" value={name} onChange={e => setName(e.target.value)} required className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0B5C47] focus:bg-white transition text-sm font-medium" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input type="tel" placeholder="মোবাইল নম্বর" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0B5C47] focus:bg-white transition text-sm font-medium" />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input type="email" placeholder="ইমেইল" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0B5C47] focus:bg-white transition text-sm font-medium" />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0B5C47] focus:bg-white transition text-sm font-medium" />
          </div>

          {!isLogin && (
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input type="password" placeholder="পাসওয়ার্ড নিশ্চিত করুন" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0B5C47] focus:bg-white transition text-sm font-medium" />
            </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full bg-[#1E88E5] hover:bg-[#1565C0] text-white py-3.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 mt-2 transition active:scale-95">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : isLogin ? 'লগইন করুন' : 'রেজিস্টার করুন'}
          </button>
        </form>

        <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="w-full text-center text-sm text-[#1E88E5] font-bold mt-5 hover:underline">
          {isLogin ? 'নতুন অ্যাকাউন্ট খুলুন' : 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন'}
        </button>
      </div>
    </div>
  );
}