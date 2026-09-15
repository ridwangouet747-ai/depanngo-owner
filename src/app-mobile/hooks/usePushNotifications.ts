import { useState, useEffect, useCallback } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

const VAPID_PUBLIC_KEY = ""; // Replace with your VAPID public key

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    setPermission(Notification.permission);

    // Check existing subscription
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscription(sub);
      });
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, [supported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported || !VAPID_PUBLIC_KEY) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setSubscription(sub);

      // Save to Supabase
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return false;

      const subJson = sub.toJSON();
      await supabaseClient.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: (subJson.keys?.p256dh as string) ?? "",
        auth_key: (subJson.keys?.auth as string) ?? "",
        platform: "web",
      }, { onConflict: "user_id,endpoint" });

      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      return false;
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        await supabaseClient
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }

      setSubscription(null);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
  }, [subscription]);

  return {
    supported,
    permission,
    isSubscribed: !!subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
