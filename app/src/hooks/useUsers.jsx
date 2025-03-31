import { useState, useEffect } from "react";
import { authFetch } from "#authFetch";

export const useUsers = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const r = await authFetch(
        shopId ? `/api/shop/${shopId}/user` : "/api/users"
      );
      const data = await r.json();
      setUsers(data.users);
      setMeta(data.meta);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, meta, refetch: fetchUsers };
};
