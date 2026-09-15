import { useQuery } from "@tanstack/react-query";
import { supabaseExt } from "@/lib/supabaseExternal";

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client_name: string;
  client_id: string;
}

export interface ReviewStats {
  total_reviews: number;
  avg_rating: number;
  rating_1: number;
  rating_2: number;
  rating_3: number;
  rating_4: number;
  rating_5: number;
}

export function useRepairerReviews(repairerId: string | undefined, limit = 10) {
  return useQuery<Review[]>({
    queryKey: ["reviews", repairerId, limit],
    enabled: !!repairerId,
    queryFn: async () => {
      if (!repairerId) return [];
      const { data, error } = await supabaseExt.rpc("get_repairer_reviews", {
        p_repairer_id: repairerId,
        p_limit: limit,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

export function useRepairerReviewStats(repairerId: string | undefined) {
  return useQuery<ReviewStats>({
    queryKey: ["review-stats", repairerId],
    enabled: !!repairerId,
    queryFn: async () => {
      if (!repairerId) return { total_reviews: 0, avg_rating: 0, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0 };
      const { data, error } = await supabaseExt.rpc("get_repairer_review_stats", {
        p_repairer_id: repairerId,
      });
      if (error) throw error;
      return (data?.[0] ?? { total_reviews: 0, avg_rating: 0, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0 }) as ReviewStats;
    },
  });
}
