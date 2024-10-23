import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useShop = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
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

  const updateShop = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const updatedShop = await r.json();
      if (updatedShop.shop) {
        setShop(updatedShop.shop);
        setOpLoading(false);
      } else {
        setError(updatedShop);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  return {
    shop,
    userShop,
    loading,
    error,
    refetch: fetchShop,
    updateShop,
    opLoading,
  };
};
