import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useParams } from "react-router-dom";
import { Page } from "#page";
import { Typography, Util, Input, Button } from "tabler-react-2";
import { useAuth } from "#useAuth";
import { sidenavItems } from "#page";
import { useAppointments } from "#useAppointments";
import { useResources } from "#useResources";
import { ResourcePicker } from "#resourcePicker";
import styles from "./SchedulePage.module.css";
import toast from "react-hot-toast";

const { H1 } = Typography;

// ------------------- Helpers -------------------

const generateTimeSlots = (startHour = 6, endHour = 22) => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "AM" : "PM";
    slots.push(`${hour12}:00 ${ampm}`);
    slots.push(`${hour12}:30 ${ampm}`);
  }
  return slots;
};

const timeToSlotIndex = (timeStr) => {
  const d = new Date(timeStr);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  return hours * 2 + (minutes >= 30 ? 1 : 0);
};

const toIsoStringSafe = (localStr) => {
  if (!localStr) return null;
  const withSeconds = localStr.length === 16 ? `${localStr}:00` : localStr;
  const localDate = new Date(withSeconds);
  if (isNaN(localDate.getTime())) return null;
  return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString();
};

const toLocalInputValue = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

// ------------------- Popover Modal -------------------

const EditPopover = ({ editing, onChange, onSave, onDelete, onClose }) => {
  if (!editing) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: 24,
          width: 380,
          boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Edit Appointment</h3>

        <ResourcePicker
          value={editing.resourceId}
          onChange={(val) => onChange("resourceId", val)}
        />

        <Input
          label="Start Time"
          type="datetime-local"
          value={toLocalInputValue(editing.startTime)}
          onChange={(e) => onChange("startTime", e.target.value)}
        />

        <Input
          label="End Time"
          type="datetime-local"
          value={toLocalInputValue(editing.endTime)}
          onChange={(e) => onChange("endTime", e.target.value)}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Button color="primary" onClick={onSave}>
            Save
          </Button>
          <Button color="danger" onClick={() => onDelete(editing.id)}>
            Delete
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ------------------- Main Component -------------------

export const SchedulePage = () => {
  const { shopId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointments(shopId);

  const { resources, loading: resourcesLoading, error: resourcesError } =
    useResources(shopId);

  const [newAppointment, setNewAppointment] = useState({
    resourceId: "",
    startTime: "",
    endTime: "",
  });

  const [editing, setEditing] = useState(null);

  if (authLoading || appointmentsLoading || resourcesLoading) {
    return (
      <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
        Loading schedule...
      </Page>
    );
  }

  if (appointmentsError || resourcesError) {
    return (
      <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
        <div className="text-danger">
          Error loading data:{" "}
          {appointmentsError?.message ||
            appointmentsError ||
            resourcesError?.message ||
            resourcesError}
        </div>
      </Page>
    );
  }

  const timeSlots = generateTimeSlots();

  const handleChange = (field) => (valueOrEvent) => {
    const value = valueOrEvent?.target?.value ?? valueOrEvent ?? "";
    setNewAppointment((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    const { resourceId, startTime, endTime } = newAppointment;
    if (!resourceId || !startTime?.trim() || !endTime?.trim()) {
      toast.error("Please fill out all fields");
      return;
    }

    const startISO = toIsoStringSafe(startTime);
    const endISO = toIsoStringSafe(endTime);
    if (!startISO || !endISO) {
      toast.error("Invalid date format");
      return;
    }

    try {
      await createAppointment({
        resourceId,
        startTime: startISO,
        endTime: endISO,
      });
      toast.success("Appointment created");
      setNewAppointment({ resourceId: "", startTime: "", endTime: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create appointment");
    }
  };

  const handleUpdate = async () => {
    const startISO = toIsoStringSafe(editing.startTime);
    const endISO = toIsoStringSafe(editing.endTime);
    if (!startISO || !endISO) {
      toast.error("Invalid date");
      return;
    }

    try {
      await updateAppointment(editing.id, {
        resourceId: editing.resourceId,
        startTime: startISO,
        endTime: endISO,
      });
      toast.success("Appointment updated");
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update appointment");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await deleteAppointment(id);
      toast.success("Appointment deleted");
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete appointment");
    }
  };

  return (
    <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
      <Util.Col gap={3}>
        <H1>Resource Availability</H1>

        <div className={styles.gridWrapper}>
          <div
            className={styles.calendarGrid}
            style={{
              gridTemplateColumns: `140px repeat(${timeSlots.length}, 80px)`,
              gridTemplateRows: `40px repeat(${resources.length}, 40px)`,
            }}
          >
            <div className={styles.headerCell} />
            {timeSlots.map((slot, idx) => (
              <div key={idx} className={styles.headerCell}>
                {slot}
              </div>
            ))}

            {resources.map((res, rowIdx) => {
              const rowNumber = rowIdx + 2;
              return (
                <React.Fragment key={res.id}>
                  <div
                    className={styles.resourceCell}
                    style={{ gridRow: rowNumber, gridColumn: 1 }}
                  >
                    {res.title}
                  </div>
                  {timeSlots.map((_, colIdx) => (
                    <div
                      key={colIdx}
                      className={styles.gridCell}
                      style={{ gridRow: rowNumber, gridColumn: colIdx + 2 }}
                    />
                  ))}
                </React.Fragment>
              );
            })}

            {appointments.map((evt) => {
              const rowIndex =
                resources.findIndex((r) => r.id === evt.resource.id) + 2;
              const startCol = timeToSlotIndex(evt.startTime) + 2;
              const endCol = timeToSlotIndex(evt.endTime) + 2;

              return (
                <div
                  key={evt.id}
                  className={styles.eventBlock}
                  style={{
                    gridRow: rowIndex,
                    gridColumnStart: startCol,
                    gridColumnEnd: endCol,
                    backgroundColor: "rgba(0,0,0,0.1)",
                    border: "2px solid #000",
                    color: "#000",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onClick={() => setEditing(evt)}
                >
                  {evt.user.firstName} {evt.user.lastName}
                </div>
              );
            })}
          </div>
        </div>

        {!editing && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              border: "1px solid #ccc",
              borderRadius: 8,
              background: "white",
            }}
          >
            <h2>Create Appointment</h2>

            <ResourcePicker
              value={newAppointment.resourceId}
              onChange={(val) =>
                setNewAppointment((prev) => ({ ...prev, resourceId: val }))
              }
            />

            <Input
              label="Start Time"
              type="datetime-local"
              value={newAppointment.startTime}
              onChange={handleChange("startTime")}
            />

            <Input
              label="End Time"
              type="datetime-local"
              value={newAppointment.endTime}
              onChange={handleChange("endTime")}
            />

            <Button color="primary" style={{ marginTop: 12 }} onClick={handleCreate}>
              Create
            </Button>
          </div>
        )}
      </Util.Col>

      {/* Global popover rendered outside the grid */}
      <EditPopover
        editing={editing}
        onChange={(field, val) => setEditing((p) => ({ ...p, [field]: val }))}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onClose={() => setEditing(null)}
      />
    </Page>
  );
};
