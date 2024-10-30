import { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useLedger = (shopId, userId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ledger, setLedger] = useState([]);

  const fetchLedger = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}/ledger`);
      const data = await r.json();
      if (data.ledgerItems) {
        setLedger(data.ledgerItems);
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
    fetchLedger();
  }, []);

  return { ledger, loading, error, refetch: fetchLedger };
};
