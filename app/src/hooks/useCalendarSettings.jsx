import { useState, useEffect, useCallback } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";

export const useCalendarSettings = (shopId) => {
  const [settings, setSettings] = useState({
    calendarStartHour: 6,
    calendarEndHour: 24,
    calendarDefaultIncrement: 30,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch(`/api/shop/${shopId}/appointments/settings`);
      const data = await r.json().catch(() => null);
      if (data?.settings) {
        setSettings(data.settings);
      } else {
        setError(data?.error || "Failed to fetch settings");
      }
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings) => {
    setError(null);
    try {
      const r = await authFetch(`/api/shop/${shopId}/appointments/settings`, {
        method: "PUT",
        body: JSON.stringify(newSettings),
      });
      const res = await r.json().catch(() => null);
      if (res?.settings) {
        toast.success("Calendar settings updated");
        setSettings(res.settings);
        return true;
      } else {
        setError(res?.error || "Failed to update settings");
        toast.error(res?.error || "Failed to update settings");
        return false;
      }
    } catch (err) {
      console.error(err);
      setError(err);
      toast.error("Failed to update settings");
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