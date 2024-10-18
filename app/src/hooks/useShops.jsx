import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useShops = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState(null);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const r = await authFetch("/api/shop");
      const data = await r.json();
      setShops(data.shops);
      setMeta(data.meta);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  return { shops, loading, error, meta, refetch: fetchShops };
};
