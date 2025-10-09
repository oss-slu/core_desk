import { useState, useEffect } from "react";
import { authFetch } from "#url";

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
        setError(data);
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
  // Only fetch if both shopId and userId are valid, non-empty strings.
  if (shopId && userId) {
    fetchUserShop();
  } else {
    // If IDs are missing, we're not loading anything.
    setLoading(false); 
  }
}, [shopId, userId]);

  return { userShop, loading, error, refetch: fetchUserShop };
};