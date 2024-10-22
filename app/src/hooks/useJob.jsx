import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useJob = (shopId, jobId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState({});

  const fetchJob = async () => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}`);
      const data = await r.json();
      setJob(data.job);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, []);

  return { job, loading, error, refetch: fetchJob };
};
