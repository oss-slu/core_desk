import { useState, useEffect } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";

export const useComments = (shopId, jobId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [notifiableUsers, setNotifiableUsers] = useState([]);

  const fetchComments = async (shouldSetLoading = true) => {
    if (!shopId || !jobId) return;
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}/comments`);
      const data = await r.json();
      if (r.ok && data.comments) {
        setComments(data.comments);
        if (data.notifiableUsers) {
          setNotifiableUsers(data.notifiableUsers);
        }
        setLoading(false);
      } else {
        const errorMessage =
          data?.message ||
          data?.error ||
          "Failed to load comments";

        toast.error(errorMessage);
        setError(data);
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load comments");
      setError(error);
      setLoading(false);
    }
  };

  const postComment = async (data) => {
    if (!shopId || !jobId) return false;
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}/comments`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const updatedComments = await r.json();
      if (r.ok && updatedComments.comments) {
        setComments(updatedComments.comments);
        return true;
      }

      const errorMessage =
        updatedComments?.message ||
        updatedComments?.error ||
        "Failed to post comment";

      toast.error(errorMessage);
      setError(updatedComments);
      return false;
    } catch (error) {
      toast.error(error.message || "Failed to post comment");
      setError(error);
      return false;
    } finally {
      setOpLoading(false);
    }
  };

  useEffect(() => {
    if (shopId && jobId) {
      fetchComments();
    }
  }, [shopId, jobId]);

  return {
    comments,
    notifiableUsers,
    loading,
    error,
    refetch: fetchComments,
    postComment,
    opLoading,
  };
};
