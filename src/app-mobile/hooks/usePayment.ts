import { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

interface PaymentParams {
  transactionId: string;
  provider: "wave" | "orange_money" | "mtn_momo";
  amountFcfa: number;
  type: "deposit" | "balance" | "refund";
  phoneNumber: string;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  message?: string;
  error?: string;
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        throw new Error("Vous devez être connecté");
      }

      const { data, error: fnError } = await supabaseClient.functions.invoke("initiate-payment", {
        body: {
          transaction_id: params.transactionId,
          provider: params.provider,
          amount_fcfa: params.amountFcfa,
          type: params.type,
          phone_number: params.phoneNumber,
        },
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || "Paiement échoué");

      return {
        success: true,
        paymentId: data.payment_id,
        status: data.status,
        message: data.message,
      };
    } catch (err: any) {
      const msg = err?.message ?? "Erreur lors du paiement";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }

  async function checkPaymentStatus(paymentId: string) {
    const { data, error } = await supabaseClient.rpc("get_payment_status", {
      p_payment_id: paymentId,
    });
    if (error) throw error;
    return data?.[0] ?? null;
  }

  return { initiatePayment, checkPaymentStatus, loading, error };
}
