import { useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabaseClient";
import type { DBRepairer } from "@/lib/supabaseExternal";

export function useRepairers() {
  return useQuery({
    queryKey: ["mobile", "repairers"],
    queryFn: async (): Promise<DBRepairer[]> => {
      const { data, error } = await supabaseClient
        .from("repairers")
        .select("*")
        .limit(50);
      if (error) throw error;
      return (data ?? []) as DBRepairer[];
    },
  });
}

export function useRepairer(id: string | undefined) {
  return useQuery({
    queryKey: ["mobile", "repairer", id],
    enabled: !!id,
    queryFn: async (): Promise<DBRepairer | null> => {
      const { data, error } = await supabaseClient
        .from("repairers")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DBRepairer | null;
    },
  });
}
