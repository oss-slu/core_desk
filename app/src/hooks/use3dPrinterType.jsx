import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const use3dPrinterType = (shopId, typeId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [printerType, setPrinterType] = useState({});

  const fetchType = async () => {
    try {
      setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/3d-printer/type/${typeId}`
      );
      const data = await r.json();
      if (data.type) {
        setPrinterType(data.type);
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

  const updateType = async (type, description) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/3d-printer/type/${typeId}`,
        {
          method: "PUT",
          body: JSON.stringify({ type, description }),
        }
      );
      const data = await r.json();
      if (data.type) {
        setPrinterType(data.type);
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
    fetchType();
  }, []);

  return {
    printerType,
    loading,
    error,
    refetch: fetchType,
    opLoading,
    updateType,
    deleteType,
  };
};
