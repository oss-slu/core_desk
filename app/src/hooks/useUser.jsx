import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";

export const useUser = (userId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState([]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/users/${userId}`);
      const data = await r.json();
      setUser(data.user);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  return { user, loading, error, refetch: fetchUser };
};
