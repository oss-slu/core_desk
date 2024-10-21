import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useShop = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shop, setShop] = useState({});
  const [userShop, setUserShop] = useState({});

  const fetchShop = async () => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}`);
      const data = await r.json();
      setShop(data.shop);
      setUserShop(data.userShop);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  return { shop, userShop, loading, error, refetch: fetchShop };
};
