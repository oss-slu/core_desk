import { useState, useEffect } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";

export const useComments = (shopId, jobId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);

  const fetchComments = async (shouldSetLoading = true) => {
    if (!shopId || !jobId) return;
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}/comments`);
      const data = await r.json();
      if (r.ok && data.comments) {
        setComments(data.comments);
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
        setOpLoading(false);
        return true;
      } else {
        const errorMessage =
          updatedComments?.message ||
          updatedComments?.error ||
          "Failed to post comment";
        toast.error(errorMessage);
        setError(updatedComments);
        setOpLoading(false);
        return false;
      }
    } catch (error) {
      toast.error(error.message || "Failed to post comment");
      setError(error);
      setOpLoading(false);
      return false;
    }
  };

  useEffect(() => {
    if (shopId && jobId) {
      fetchComments();
    }
  }, [shopId, jobId]);

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    postComment,
    opLoading,
  };
};
