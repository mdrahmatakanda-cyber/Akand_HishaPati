import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase ক্রেডেনশিয়াল পাওয়া যায়নি! .env ফাইল চেক করুন।');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);