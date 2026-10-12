import { useState } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";

export const useBulkTopup = (shopId) => {
  const [opLoading, setOpLoading] = useState(false);

  const bulkTopup = async (value) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/topup`, {
        method: "POST",
        body: JSON.stringify({ value }),
      });
      const data = await r.json();
      if (r.ok) {
        toast.success(
          `Topped up ${data.toppedUp.length} user(s). Skipped ${data.skipped.length} already at or above that balance.`
        );
        setOpLoading(false);
        return true;
      } else {
        toast.error(data.error || "Something went wrong");
        setOpLoading(false);
        return false;
      }
    } catch (error) {
      toast.error("Something went wrong");
      setOpLoading(false);
      return false;
    }
  };

  return { bulkTopup, opLoading };
};