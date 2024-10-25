import { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useResourceType = (shopId, resourceTypeId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resourceType, setResourceType] = useState({});
  const [resources, setResources] = useState([]);

  const fetchResourceType = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/type/${resourceTypeId}`
      );
      const data = await r.json();
      if (data.resourceType && data.resources) {
        setResourceType(data.resourceType);
        setResources(data.resources);
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

  const updateResourceType = async (updatedData) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/type/${resourceTypeId}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedData),
        }
      );
      const data = await r.json();
      if (data.resourceType && data.resources) {
        setResourceType(data.resourceType);
        setResources(data.resources);
        setLoading(false);
      } else {
        setError(data);
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchResourceType();
  }, []);

  return {
    resourceType,
    resources,
    loading,
    opLoading,
    error,
    refetch: fetchResourceType,
    updateResourceType,
  };
};
