import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const use3dPrinterTypes = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [printerTypes, setPrinterTypes] = useState({});

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/3d-printer/type`);
      const data = await r.json();
      if (data.types) {
        setPrinterTypes(data.types);
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

  const createType = async (type, description) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/3d-printer/type`, {
        method: "POST",
        body: JSON.stringify({ type, description }),
      });
      const data = await r.json();
      if (data.types) {
        setPrinterTypes(data.types);
        setOpLoading(false);
      } else {
        setError(data.error);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  return {
    printerTypes,
    loading,
    error,
    refetch: fetchTypes,
    opLoading,
    createType,
  };
};
