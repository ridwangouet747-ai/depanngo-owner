import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sendFilteredMessage, supabaseExt, pickName } from "@/lib/supabaseExternal";
import { useAuthClient } from "../hooks/useAuthClient";

type MessageRow = {
  id: string;
  transaction_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  is_flagged?: boolean | null;
};

type SupabaseRecord = Record<string, unknown>;

type ConversationTransaction = SupabaseRecord & {
  id: string;
  repairers?: SupabaseRecord | null;
};

type ConversationResolution = {
  transaction: ConversationTransaction | null;
  repairer: SupabaseRecord | null;
};

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Messages() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthClient();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const { data: resolution, isLoading: resolving } = useQuery<ConversationResolution>({
    queryKey: ["mobile-message-resolution", id, user?.id],
    enabled: !!id,
    queryFn: async () => {
      const { data: directTransaction } = await supabaseExt
        .from("transactions")
        .select("*, repairers(*), profiles(*)")
        .eq("id", id)
        .maybeSingle();

      if (directTransaction) {
        const transaction = directTransaction as ConversationTransaction;
        return {
          transaction,
          repairer: transaction.repairers ?? null,
        };
      }

      const { data: repairer } = await supabaseExt
        .from("repairers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      let latestTransaction: ConversationTransaction | null = null;
      if (repairer) {
        let query = supabaseExt
          .from("transactions")
          .select("*, repairers(*), profiles(*)")
          .eq("repairer_id", id)
          .in("status", ["accepted", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(1);

        if (user?.id) {
          query = query.eq("client_id", user.id);
        }

        const { data } = await query.maybeSingle();
        latestTransaction = data as ConversationTransaction | null;
      }

      return { transaction: latestTransaction, repairer };
    },
  });

  const transactionId = resolution?.transaction?.id;

  const { data: messages = [], isLoading: loadingMessages } = useQuery<MessageRow[]>({
    queryKey: ["mobile-messages", transactionId],
    enabled: !!transactionId,
    queryFn: async () => {
      const { data, error } = await supabaseExt
        .from("messages")
        .select("*")
        .eq("transaction_id", transactionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });

  useEffect(() => {
    if (!transactionId) return;

    const channel = supabaseExt
      .channel(`mobile-messages-${transactionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `transaction_id=eq.${transactionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["mobile-messages", transactionId] });
        },
      )
      .subscribe();

    return () => {
      supabaseExt.removeChannel(channel);
    };
  }, [queryClient, transactionId]);

  const title = useMemo(() => {
    if (resolution?.repairer) return pickName(resolution.repairer, "Réparateur");
    if (resolution?.transaction?.repairers) {
      return pickName(resolution.transaction.repairers, "Réparateur");
    }
    return "Messagerie";
  }, [resolution]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();

    if (!trimmed || !transactionId) return;
    if (!user?.id) {
      toast.error("Connectez-vous pour envoyer un message.");
      return;
    }

    setSending(true);
    try {
      const result = await sendFilteredMessage(trimmed, user.id, transactionId);
      if (result.blocked) {
        toast.error(result.message);
      } else {
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["mobile-messages", transactionId] });
      }
    } catch {
      toast.error("Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  }

  const hasConversation = !!transactionId;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col pb-24">
      <header className="sticky top-0 z-40 bg-[#F5F5F5]/95 backdrop-blur px-5 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-900 truncate">{title}</h1>
            <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-bold mt-0.5">
              <ShieldCheck size={13} />
              <span>Messages filtrés par Dépann'Go</span>
            </div>
          </div>
        </div>
      </header>

      {!hasConversation && !resolving ? (
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={28} />
            </div>
            <h2 className="text-lg font-black text-gray-900">Aucune mission active</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              La messagerie s'ouvre après une réservation acceptée afin de garder les échanges liés à une mission.
            </p>
            <button
              onClick={() => navigate(id ? `/app/reservation/${id}` : "/app/reparateurs")}
              className="mt-5 w-full h-12 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2"
            >
              Réserver une intervention
              <CalendarCheck size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 px-5 pt-4 space-y-3 overflow-y-auto">
          {resolving || loadingMessages ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`h-16 rounded-2xl animate-pulse ${
                  index % 2 === 0 ? "bg-white mr-12" : "bg-orange-100 ml-12"
                }`}
              />
            ))
          ) : messages.length === 0 ? (
            <div className="pt-20 text-center">
              <div className="w-16 h-16 bg-white text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
                <MessageCircle size={28} />
              </div>
              <p className="font-black text-gray-900">Démarrez l'échange</p>
              <p className="text-sm text-gray-400 mt-1">
                Les coordonnées directes sont automatiquement bloquées.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMine = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                      isMine
                        ? "bg-orange-500 text-white rounded-br-md"
                        : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-orange-100" : "text-gray-400"}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {hasConversation && (
        <form
          onSubmit={handleSubmit}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-2 z-50"
        >
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Votre message..."
            rows={1}
            className="flex-1 max-h-28 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-orange-400"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      )}
    </div>
  );
}
