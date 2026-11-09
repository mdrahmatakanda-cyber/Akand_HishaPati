import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Business {
  id: string;
  name: string;
  type: 'shop' | 'depot' | 'general';
  owner_name?: string;
  address?: string;
  logo_url?: string;
}

interface AuthContextType {
  user: any | null;
  businesses: Business[]; 
  activeBusiness: Business | null; 
  business: Business | null; 
  isLoading: boolean;
  refreshBusinesses: () => Promise<void>;
  refreshBusiness: () => Promise<void>; 
  switchBusiness: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUser(null);
        setBusinesses([]);
        setActiveBusiness(null);
        setIsLoading(false);
        return;
      }

      setUser(session.user);

      // সব দোকান লোড করা
      const { data: allBiz } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: true });

      setBusinesses(allBiz || []);

      // প্রোফাইল থেকে বর্তমান সিলেক্টেড দোকান বের করা
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.business_id && allBiz) {
        const active = allBiz.find(b => b.id === profile.business_id);
        // যদি প্রোফাইলে থাকা আইডি ডাটাবেসে না থাকে (ডিলিট হয়ে গেছে), তবে প্রথমটি সিলেক্ট হবে
        if (active) {
          setActiveBusiness(active);
        } else if (allBiz.length > 0) {
          setActiveBusiness(allBiz[0]);
          await supabase.from('profiles').update({ business_id: allBiz[0].id }).eq('id', session.user.id);
        } else {
          setActiveBusiness(null);
        }
      } else if (allBiz && allBiz.length > 0) {
        setActiveBusiness(allBiz[0]);
        await supabase.from('profiles').update({ business_id: allBiz[0].id }).eq('id', session.user.id);
      } else {
        setActiveBusiness(null);
      }

    } catch (error) {
      console.error("Auth Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') fetchData();
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const switchBusiness = async (id: string) => {
    const target = businesses.find(b => b.id === id);
    if (!target || !user) return;
    setActiveBusiness(target);
    await supabase.from('profiles').update({ business_id: id }).eq('id', user.id);
  };

  const refreshBusinesses = async () => {
    await fetchData();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, businesses, activeBusiness, business: activeBusiness, 
      isLoading, refreshBusinesses, refreshBusiness: refreshBusinesses, 
      switchBusiness, signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}