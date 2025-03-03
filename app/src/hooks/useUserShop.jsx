import { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import toast from "react-hot-toast";

export const useUserShop = (shopId, userId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userShop, setUserShop] = useState({});

  const fetchUserShop = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}`);
      const data = await r.json();
      if (data.userShop) {
        setUserShop(data.userShop);
        setLoading(false);
      } else {
        toast.error(data);
        setError(data);
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserShop();
  }, [shopId, userId]);

  return { userShop, loading, error, refetch: fetchUserShop };
};
