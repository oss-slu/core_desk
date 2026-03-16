import { useState, useEffect } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";

export const useBillingGroupLedger = (shopId, groupId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [balance, setBalance] = useState(0);

  const fetchLedger = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/groups/${groupId}/ledger`);
      const data = await r.json();
      if (data.ledgerItems) {
        setLedger(data.ledgerItems);
        setBalance(data.balance);
        setLoading(false);
      } else {
        setError(data);
        setLoading(false);
      }
    } catch (fetchError) {
      setError(fetchError);
      setLoading(false);
    }
  };

  const postLedgerItem = async ({ type, value }) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/groups/${groupId}/ledger`, {
        method: "POST",
        body: JSON.stringify({
          type,
          value,
        }),
      });
      const data = await r.json();
      if (data.ledgerItems) {
        setLedger(data.ledgerItems);
        setBalance(data.balance);
        setOpLoading(false);
        return true;
      }
      toast.error(data.error || "Failed to post ledger item");
      setError(data);
      setOpLoading(false);
      return false;
    } catch (postError) {
      setError(postError);
      setOpLoading(false);
      return false;
    }
  };

  useEffect(() => {
    if (shopId && groupId) fetchLedger();
  }, [shopId, groupId]);

  return {
    ledger,
    loading,
    error,
    refetch: fetchLedger,
    postLedgerItem,
    opLoading,
    balance,
  };
};
