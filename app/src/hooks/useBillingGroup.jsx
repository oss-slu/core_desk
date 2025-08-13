import { useState } from "react";
import useSWR from "swr";
import { authFetch } from "#url";
import toast from "react-hot-toast";

const fetcher = async (url) => {
  const r = await authFetch(url);
  const data = await r.json();
  if (data.group) {
    return data.group;
  }
  throw new Error("Failed to fetch billing group");
};

export const useBillingGroup = (shopId, billingGroupId) => {
  const [opLoading, setOpLoading] = useState(false);

  const {
    data: billingGroup,
    error,
    mutate,
    isLoading,
  } = useSWR(
    shopId && billingGroupId
      ? `/api/shop/${shopId}/groups/${billingGroupId}`
      : null,
    fetcher
  );

  const updateBillingGroup = async (data) => {
    setOpLoading(true);
    try {
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${billingGroupId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const updatedData = await r.json();
      if (updatedData.group) {
        mutate(updatedData.group, false);
      } else {
        throw new Error("Failed to update billing group");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setOpLoading(false);
    }
  };

  const removeUserFromGroup = async (userId) => {
    setOpLoading(true);
    try {
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${billingGroupId}/users/${userId}`,
        { method: "DELETE" }
      );
      const res = await r.json();
      if (res.success) {
        mutate();
      } else {
        throw new Error("Failed to remove user from group");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setOpLoading(false);
    }
  };

  const addUserToGroup = async (userId, role) => {
    setOpLoading(true);
    try {
      const r = await authFetch(
        `/api/shop/${shopId}/groups/${billingGroupId}/users/${userId}`,
        {
          method: "POST",
          body: JSON.stringify({ role }),
        }
      );
      const res = await r.json();
      if (res.success) {
        toast.success("User added to billing group");
        mutate();
      } else {
        throw new Error("Failed to add user to group");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setOpLoading(false);
    }
  };

  return {
    billingGroup,
    loading: isLoading,
    error,
    refetch: mutate,
    updateBillingGroup,
    removeUserFromGroup,
    addUserToGroup,
    opLoading,
  };
};
