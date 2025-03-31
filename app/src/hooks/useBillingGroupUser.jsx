import { useState } from "react";
import useSWR from "swr";
import { authFetch } from "#authFetch";

const fetcher = (url) => authFetch(url).then((res) => res.json());

export const useBillingGroupUser = (shopId, groupId, userId) => {
  const [opLoading, setOpLoading] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/shop/${shopId}/groups/${groupId}/users/${userId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const updateBillingGroupUser = async (updatedData) => {
    setOpLoading(true);
    try {
      const response = await authFetch(
        `/api/shop/${shopId}/groups/${groupId}/users/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedData),
        }
      );
      const updatedDataResponse = await response.json();
      if (updatedDataResponse.billingGroupUser) {
        await mutate(); // Re-fetches data after update
      } else {
        throw new Error("Failed to update billing group user");
      }
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setOpLoading(false);
    }
  };

  return {
    billingGroupUser: data?.billingGroupUser || {},
    loading: isLoading,
    opLoading,
    error,
    refetch: mutate,
    updateBillingGroupUser,
  };
};
