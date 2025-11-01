import { useState, useEffect } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";

export const useAppointments = (shopId) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/appointments`);
      const data = await r.json();
      if (data.appointments) {
        setAppointments(data.appointments);
        setLoading(false);
      } else {
        setError(data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) fetchAppointments();
  }, [shopId]);

  const createAppointment = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/appointments`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const res = await r.json();
      if (res.appointment) {
        setAppointments((prev) => [...prev, res.appointment]);
        toast.success("Appointment created");
        setOpLoading(false);
      } else {
        toast.error(res.error);
        setError(res.error);
        setOpLoading(false);
      }
    } catch (error) {
      console.error(error);
      setError(error);
      setOpLoading(false);
    }
  };

  const updateAppointment = async (appointmentId, data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/appointments/${appointmentId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      const res = await r.json();
      if (res.appointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? res.appointment : a))
        );
        toast.success("Appointment updated");
        setOpLoading(false);
      } else {
        toast.error(res.error);
        setError(res.error);
        setOpLoading(false);
      }
    } catch (error) {
      console.error(error);
      setError(error);
      setOpLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (!confirm("Delete appointment?")) return;
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/appointments/${appointmentId}`,
        { method: "DELETE" }
      );
      const res = await r.json();
      if (res.success) {
        setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
        toast.success("Appointment deleted");
        setOpLoading(false);
      } else {
        toast.error(res.error);
        setError(res.error);
        setOpLoading(false);
      }
    } catch (error) {
      console.error(error);
      setError(error);
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