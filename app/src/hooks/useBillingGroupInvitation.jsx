import { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useBillingGroupInvitation = (
  shopId,
  groupId,
  billingGroupInvitationId
) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingGroupInvitation, setBillingGroupInvitation] = useState({});

  const fetchBillingGroupInvitation = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${groupId}/invite/${billingGroupInvitationId}`
      );
      const data = await r.json();
      if (data.invite) {
        setBillingGroupInvitation(data.invite);
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

  const updateBillingGroupInvitation = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${billingGroupInvitationId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const updatedBillingGroupInvitation = await r.json();
      if (updatedBillingGroupInvitation.invite) {
        setBillingGroupInvitation(updatedBillingGroupInvitation.invite);
        setOpLoading(false);
      } else {
        setError(updatedBillingGroupInvitation);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingGroupInvitation();
  }, []);

  return {
    billingGroupInvitation,
    loading,
    error,
    refetch: fetchBillingGroupInvitation,
    updateBillingGroupInvitation,
    opLoading,
  };
};
