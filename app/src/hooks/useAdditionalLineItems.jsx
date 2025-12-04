import { useState, useEffect } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";
import { getErrorMessage } from "../util/errorMessage";

export const useAdditionalLineItems = (shopId, jobId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lineItems, setLineItems] = useState([]);

  const fetchlineItems = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems`
      );
      const data = await r.json();
      if (data.lineItems) {
        setLineItems(data.lineItems);
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

  const createLineItem = async () => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/additionalLineItems`,
        {
          method: "POST",
        }
      );
      const newLineItem = await r.json();
      if (newLineItem.lineItems) {
        setLineItems(newLineItem.lineItems);
        setOpLoading(false);
      } else {
        toast.error(
          getErrorMessage(
            newLineItem,
            "Failed to create an additional cost line item."
          )
        );
        setError(newLineItem);
        setOpLoading(false);
      }
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Failed to create an additional cost line item."
        )
      );
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchlineItems();
  }, [shopId, jobId]);

  return {
    lineItems,
    loading,
    opLoading,
    error,
    createLineItem,
    refetch: fetchlineItems,
  };
};
