import { useEffect, useState } from "react";
import { authFetch } from "#url";

export const useShopLedger = (shopId, options = {}) => {
  const enabled = options.enabled ?? true;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const fetchLedger = async (shouldSetLoading = true) => {
    if (!shopId || !enabled) {
      setLoading(false);
      setRows([]);
      return;
    }

    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/ledger`);
      const data = await r.json();
      if (data.rows) {
        setRows(data.rows);
      } else {
        setError(data);
      }
    } catch (fetchError) {
      setError(fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [shopId, enabled]);

  return {
    rows,
    loading,
    error,
    refetch: fetchLedger,
  };
};
