import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, retries = 3): Promise<Profile | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (data) return data;
      } catch {
        // ignore
      }
      if (i < retries - 1) await sleep(800);
    }
    return null;
  }, []);

  const fetchIsAdmin = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      return !!data;
    } catch {
      return false;
    }
  }, []);

  const loadUserState = useCallback(async (s: Session | null) => {
    try {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const [p, admin] = await Promise.all([
          fetchProfile(s.user.id),
          fetchIsAdmin(s.user.id),
        ]);
        setProfile(p);
        setIsAdmin(admin);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    } catch {
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, fetchIsAdmin]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await fetchProfile(user.id, 1);
      setProfile(p);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Restore session first
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      loadUserState(s);
    });

    // Listen for subsequent changes — no async work inside callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        loadUserState(s);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserState]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, isAdmin, isLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
