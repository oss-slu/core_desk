import { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useUserLogs = (userId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const fetchLogs = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/users/${userId}?includeLogs=true`);
      const data = await r.json();
      if (data.user?.logs) {
        setLogs(data.user?.logs);
        setLoading(false);
      } else {
        setError(data);
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return { logs, loading, error, refetch: fetchLogs };
};
