import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useJob = (shopId, jobId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [job, setJob] = useState({});

  const fetchJob = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}`);
      const data = await r.json();
      if (data.job) {
        setJob(data.job);
        setLoading(false);
      } else {
        setError("Internal server error");
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const updateJob = async (job) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}`, {
        method: "PUT",
        body: JSON.stringify(job),
      });
      const data = await r.json();
      if (data.job) {
        setJob(data.job);
        setOpLoading(false);
      } else {
        setError("Internal server error");
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, []);

  return { job, loading, error, refetch: fetchJob, updateJob, opLoading };
};
