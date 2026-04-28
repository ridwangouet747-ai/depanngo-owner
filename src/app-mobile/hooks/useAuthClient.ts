import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

export function useAuthClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabaseClient.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabaseClient.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null as User | null, loading };
}

export async function signOut() {
  await supabaseClient.auth.signOut();
}
