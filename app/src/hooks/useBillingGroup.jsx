import { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useBillingGroup = (shopId, billingGroupId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingGroup, setBillingGroup] = useState({});

  const fetchBillingGroup = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/groups/${billingGroupId}`);
      const data = await r.json();
      if (data.group) {
        setBillingGroup(data.group);
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

  const updateBillingGroup = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${billingGroupId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const updatedBillingGroup = await r.json();
      if (updatedBillingGroup.group) {
        setBillingGroup(updatedBillingGroup.group);
        setOpLoading(false);
      } else {
        setError(updatedBillingGroup);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingGroup();
  }, []);

  return {
    billingGroup,
    loading,
    error,
    refetch: fetchBillingGroup,
    updateBillingGroup,
    opLoading,
  };
};
