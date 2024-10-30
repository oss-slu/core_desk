import { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useUserShop = (shopId, userId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userShop, setUserShop] = useState({});

  const fetchUserShop = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}`);
      const data = await r.json();
      if (data.usershop) {
        setUserShop(data.usershop);
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

  useEffect(() => {
    fetchUserShop();
  }, []);

  return { userShop, loading, error, refetch: fetchUserShop };
};
