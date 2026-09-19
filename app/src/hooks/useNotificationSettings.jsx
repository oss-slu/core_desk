import { useState, useEffect, useCallback } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";

const DEFAULT_SETTINGS = {
  emailJobCreated: true,
  emailCommentCreated: true,
};

/**
 * Hook for fetching and updating a user's email notification preferences.
 * @param {string} userId
 */
export const useNotificationSettings = (userId) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch(`/api/users/${userId}/notification-settings`);
      const data = await r.json().catch(() => null);
      if (data?.settings) {
        setSettings({
          emailJobCreated: data.settings.emailJobCreated ?? true,
          emailCommentCreated: data.settings.emailCommentCreated ?? true,
        });
      } else if (data?.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error("[useNotificationSettings]", err);
      setError(err?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings) => {
    setError(null);
    try {
      const r = await authFetch(`/api/users/${userId}/notification-settings`, {
        method: "PUT",
        body: JSON.stringify(newSettings),
      });
      const res = await r.json().catch(() => null);
      if (res?.settings) {
        toast.success("Notification settings saved");
        setSettings({
          emailJobCreated: res.settings.emailJobCreated ?? true,
          emailCommentCreated: res.settings.emailCommentCreated ?? true,
        });
        return true;
      } else {
        const msg = res?.error || "Failed to save settings";
        setError(msg);
        toast.error(msg);
        return false;
      }
    } catch (err) {
      console.error("[useNotificationSettings]", err);
      const msg = err?.message || "Failed to save settings";
      setError(msg);
      toast.error(msg);
      return false;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
};
