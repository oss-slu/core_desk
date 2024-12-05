import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

export const useResource = (shopId, resourceId) => {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/resource/${resourceId}`
      );
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
  }, [resourceId]);

  const updateResource = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/resource/${resourceId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const res = await r.json();
      if (res.resource) {
        setResource(res.resource);
        setOpLoading(false);
      } else {
        toast.error(res.error);
        setError(res.error);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const deleteResourceImage = async (imageId) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/${resourceId}/images/${imageId}`,
        {
          method: "DELETE",
        }
      );
      const res = await r.json();
      if (res.resource) {
        setResource(res.resource);
        setOpLoading(false);
      } else {
        toast.error(res.error);
        setError(res.error);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const deleteResource = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this resource? This cannot be undone"
      )
    )
      return;
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/resource/${resourceId}`,
        {
          method: "DELETE",
        }
      );
      const res = await r.json();
      if (res.success) {
        setOpLoading(false);
        window.location.href = `/shops/${shopId}/resources`;
      } else {
        toast.error(res.error);
        setError(res.error);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  return {
    resource,
    loading,
    opLoading,
    error,
    refetch: fetchResource,
    updateResource,
    deleteResourceImage,
    deleteResource,
  };
};
