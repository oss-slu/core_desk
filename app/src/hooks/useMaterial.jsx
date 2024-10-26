import { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useMaterial = (shopId, resourceId, materialId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [material, setMaterial] = useState({});

  const fetchMaterial = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/${resourceId}/material/${materialId}`
      );
      const data = await r.json();
      if (data.material) {
        setMaterial(data.material);
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

  const updateMaterial = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/${resourceId}/material/${materialId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const updatedMaterial = await r.json();
      if (updatedMaterial.material) {
        setMaterial(updatedMaterial.material);
        setOpLoading(false);
      } else {
        setError(updatedMaterial);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterial();
  }, []);

  return {
    material,
    loading,
    error,
    refetch: fetchMaterial,
    updateMaterial,
    opLoading,
  };
};
