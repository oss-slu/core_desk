import { useState, useEffect } from "react";
import { authFetch } from "#url";
import { useConfirm } from "tabler-react-2";
import toast from "react-hot-toast";

export const useJob = (shopId, jobId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [job, setJob] = useState({});
  const [draftInvoiceLoading, setDraftInvoiceLoading] = useState(false);
  const [regenerateInvoiceLoading, setRegenerateInvoiceLoading] =
    useState(false);

  const fetchJob = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}`);
      const data = await r.json();
      if (data.job) {
        setJob(data.job);
        setLoading(false);
      } else {
        setError("Internal server error");
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const { confirm, ConfirmModal } = useConfirm({
    title: "Already finalized",
    text: "This job has already been finalized. You can still update it, but you cannot re-charge the customer.",
    commitText: "Continue",
    cancelText: "Cancel",
  });

  const updateJob = async (newJob) => {
    if (job.finalized) {
      const result = await confirm();
      if (!result) {
        return;
      }
    }
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}`, {
        method: "PUT",
        body: JSON.stringify(newJob),
      });
      const data = await r.json();
      console.log(job, data);
      if (newJob.finalized) {
        fetchJob(false);
        setOpLoading(false);
      } else {
        if (data.job) {
          setJob(data.job);
          setOpLoading(false);
        } else {
          toast.error("Internal server error");
          setError("Internal server error");
          setOpLoading(false);
        }
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const downloadDraftInvoice = async () => {
    try {
      setDraftInvoiceLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/draft-invoice`
      );
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Failed to download draft invoice");
        return;
      }
      window.open(data.url, "_blank");
    } catch (error) {
      setError(error);
      toast.error("Failed to download draft invoice");
    } finally {
      setDraftInvoiceLoading(false);
    }
  };

  const regenerateInvoice = async () => {
    try {
      setRegenerateInvoiceLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/job/${jobId}/regenerate-invoice`,
        {
          method: "POST",
        }
      );
      const data = await r.json();

      if (!r.ok) {
        toast.error(data.error || "Failed to regenerate invoice");
        return;
      }

      if (data.url) {
        window.open(data.url, "_blank");
      }

      await fetchJob(false);
    } catch (error) {
      setError(error);
      toast.error("Failed to regenerate invoice");
    } finally {
      setRegenerateInvoiceLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [shopId, jobId]);

  return {
    job,
    loading,
    error,
    refetch: fetchJob,
    updateJob,
    opLoading,
    ConfirmModal,
    downloadDraftInvoice,
    draftInvoiceLoading,
    regenerateInvoice,
    regenerateInvoiceLoading,
  };
};
