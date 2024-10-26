import { useEffect, useState } from "react";
import { authFetch } from "../util/url";

export const useJobItem = (shopId, jobId, jobItemId, options) => {
  const initialValue = options?.initialValue;
  const shouldFetchJobItem =
    options?.fetchJobItem !== undefined ? options.fetchJobItem : true;

  const [item, setItem] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setItem(initialValue);
  }, [initialValue]);

  const fetchJobItem = async (_shouldFetchJobItem = true) => {
    if (!_shouldFetchJobItem) return;
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/${jobItemId}`
      );
      const data = await res.json();
      if (data.item) {
        setItem(data.item);
        setLoading(false);
      } else {
        setError("Internal server error");
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      setError(error);
    }
  };

  const updateJobItem = async (data) => {
    try {
      setOpLoading(true);
      setError(null);
      const res = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/${jobItemId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data }),
        }
      );
      const newData = await res.json();
      if (newData.item) {
        setItem(newData.item);
        setOpLoading(false);
      } else {
        setError("Internal server error");
        setOpLoading(false);
      }
    } catch (error) {
      setOpLoading(false);
      setError(error);
    }
  };

  const deleteJobItem = async (refetchJobs) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this item? You cannot undo this action."
      )
    )
      return;
    try {
      setOpLoading(true);
      setError(null);
      const res = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/${jobItemId}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (data.success) {
        setItem(null);
        setOpLoading(false);
        refetchJobs && refetchJobs(false);
      } else {
        setError("Internal server error");
        setOpLoading(false);
      }
    } catch (error) {
      setOpLoading(false);
      setError(error);
    }
  };

  useEffect(() => {
    fetchJobItem(shouldFetchJobItem);
  }, [jobId]);

  return {
    item,
    loading,
    error,
    refetch: fetchJobItem,
    updateJobItem,
    opLoading,
    deleteJobItem,
  };
};
