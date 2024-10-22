import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useResource = (shopId, resourceId) => {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources/${resourceId}`);
      const data = await r.json();
      if (data.resource) {
        setResource(data.resource);
        setLoading(false);
      } else {
        setError(data.error);
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResource();
  }, []);

  return {
    resource,
    loading,
    opLoading,
    error,
  };
};
