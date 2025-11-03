import { useState, useEffect, useCallback } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";

export const useAppointments = (shopId) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch(`/api/shop/${shopId}/appointments`);
      const data = await r.json().catch(() => null);
      if (data?.appointments) {
        setAppointments(data.appointments);
      } else {
        setError(data?.error || "Failed to fetch appointments");
        toast.error(data?.error || "Failed to fetch appointments");
      }
    } catch (err) {
      console.error(err);
      setError(err);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = async (data) => {
    setOpLoading(true);
    setError(null);
    try {
      const r = await authFetch(`/api/shop/${shopId}/appointments`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const res = await r.json().catch(() => null);
      if (res?.appointment) {
        toast.success("Appointment created");
        await fetchAppointments();
      } else {
        setError(res?.error || "Failed to create appointment");
        toast.error(res?.error || "Failed to create appointment");
      }
    } catch (err) {
      console.error(err);
      setError(err);
      toast.error("Failed to create appointment");
    } finally {
      setOpLoading(false);
    }
  };

  const updateAppointment = async (appointmentId, data) => {
    if (!appointmentId) return;
    setOpLoading(true);
    setError(null);
    try {
      const r = await authFetch(`/api/shop/${shopId}/appointments/${appointmentId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const res = await r.json().catch(() => null);
      if (res?.appointment) {
        toast.success("Appointment updated");
        await fetchAppointments();
      } else {
        setError(res?.error || "Failed to update appointment");
        toast.error(res?.error || "Failed to update appointment");
      }
    } catch (err) {
      console.error(err);
      setError(err);
      toast.error("Failed to update appointment");
    } finally {
      setOpLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (!appointmentId) return;
    if (!window.confirm("Delete appointment?")) return;

    setOpLoading(true);
    setError(null);
    try {
      const r = await authFetch(`/api/shop/${shopId}/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      const res = await r.json().catch(() => null);
      if (res?.success) {
        toast.success("Appointment deleted");
        await fetchAppointments();
      } else {
        setError(res?.error || "Failed to delete appointment");
        toast.error(res?.error || "Failed to delete appointment");
      }
    } catch (err) {
      console.error(err);
      setError(err);
      toast.error("Failed to delete appointment");
    } finally {
      setOpLoading(false);
    }
  };

  return {
    appointments,
    loading,
    opLoading,
    error,
    refetch: fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
};
