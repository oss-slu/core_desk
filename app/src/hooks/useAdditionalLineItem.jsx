import { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useAdditionalLineItem = (shopId, jobId, lineItemId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lineItem, setLineItem] = useState({});

  const fetchLineItem = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems/${lineItemId}`
      );
      const data = await r.json();
      if (data.lineItem) {
        setLineItem(data.lineItem);
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

  const updateLineItem = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems/${lineItemId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const updatedlineItem = await r.json();
      if (updatedlineItem.lineItem) {
        setLineItem(updatedlineItem.lineItem);
        setOpLoading(false);
      } else {
        setError(updatedlineItem);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const deleteLineItem = async (refetchLineItems) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems/${lineItemId}`,
        {
          method: "DELETE",
        }
      );
      const data = await r.json();
      if (data.success) {
        refetchLineItems && (await refetchLineItems(false));
        setLineItem(null);
        setOpLoading(false);
      } else {
        setError(data);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchLineItem();
  }, []);

  return {
    lineItem,
    loading,
    error,
    refetch: fetchLineItem,
    updateLineItem,
    opLoading,
    deleteLineItem,
  };
};
