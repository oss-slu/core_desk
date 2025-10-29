import React, { useState } from "react";
import { Page } from "#page";
import { Typography, Util, Input, Button, useOffcanvas } from "tabler-react-2";
import { useAuth } from "#useAuth";
import { sidenavItems } from "#page";
import { useAppointments } from "#useAppointments";
import styles from "./SchedulePage.module.css";
import toast from "react-hot-toast";

const { H1 } = Typography;

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
  return d.getUTCHours() * 2 + (d.getUTCMinutes() >= 30 ? 1 : 0);
};

const hexToRgba = (hex, alpha = 0.2) => {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const SchedulePage = ({ shopId }) => {
  const { user, loading: authLoading } = useAuth();
  const { offcanvas, OffcanvasElement } = useOffcanvas({
    offcanvasProps: { position: "end", size: 500, zIndex: 1051 },
  });

  const {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointments(shopId);

  const [newAppointment, setNewAppointment] = useState({
    resourceId: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  if (authLoading || loading) {
    return (
      <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
        Loading schedule...
      </Page>
    );
  }

  if (error) {
    return (
      <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
        <div className="text-danger">
          Error loading appointments: {error.message || error}
        </div>
      </Page>
    );
  }

  const resources = Array.from(new Set(appointments.map((evt) => evt.resource.title)));
  const timeSlots = generateTimeSlots();

  const openEvent = (evt) => {
    const startLocal = new Date(evt.startTime).toISOString().slice(0, 16);
    const endLocal = new Date(evt.endTime).toISOString().slice(0, 16);

    offcanvas({
      content: (
        <div style={{ padding: 24 }}>
          <h2 style={{ color: evt.color }}>{evt.user.firstName} {evt.user.lastName}</h2>
          <h3>{evt.user.email}</h3>
          <p><strong>Resource:</strong> {evt.resource.title}</p>
          <p><strong>Description:</strong> {evt.resource.description}</p>

          <div style={{ marginTop: 10 }}>
            <Input
              type="datetime-local"
              label="Start Time"
              value={startLocal}
              onChange={(e) => evt.startTime = new Date(e.target.value).toISOString()}
            />
            <Input
              type="datetime-local"
              label="End Time"
              value={endLocal}
              onChange={(e) => evt.endTime = new Date(e.target.value).toISOString()}
            />
            <Input
              type="text"
              label="Notes"
              value={evt.notes || ""}
              onChange={(e) => evt.notes = e.target.value}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <Button
              color="primary"
              onClick={async () => {
                await updateAppointment(evt.id, {
                  resourceId: evt.resourceId,
                  startTime: evt.startTime,
                  endTime: evt.endTime,
                  notes: evt.notes,
                });
                toast.success("Appointment updated");
              }}
            >
              Save
            </Button>
            <Button
              color="danger"
              style={{ marginLeft: 8 }}
              onClick={async () => {
                await deleteAppointment(evt.id);
                toast.success("Appointment deleted");
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
    });
  };

  const handleCreate = async () => {
    if (!newAppointment.resourceId || !newAppointment.startTime || !newAppointment.endTime) {
      toast.error("Please fill out all fields");
      return;
    }
    await createAppointment(newAppointment);
    setNewAppointment({ resourceId: "", startTime: "", endTime: "", notes: "" });
  };

  return (
    <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
      <Util.Col gap={3}>
        <H1>Resource Availability</H1>

        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Resource ID"
            value={newAppointment.resourceId}
            onChange={(e) => setNewAppointment({ ...newAppointment, resourceId: e.target.value })}
          />
          <Input
            type="datetime-local"
            value={newAppointment.startTime}
            onChange={(e) => setNewAppointment({ ...newAppointment, startTime: e.target.value })}
          />
          <Input
            type="datetime-local"
            value={newAppointment.endTime}
            onChange={(e) => setNewAppointment({ ...newAppointment, endTime: e.target.value })}
          />
          <Input
            placeholder="Notes"
            value={newAppointment.notes}
            onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
          />
          <Button color="primary" onClick={handleCreate} style={{ marginTop: 8 }}>
            Add Appointment
          </Button>
        </div>

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
              <div key={idx} className={styles.headerCell}>{slot}</div>
            ))}

            {resources.map((res, rowIdx) => {
              const rowNumber = rowIdx + 2;
              const labelCell = (
                <div
                  key={res}
                  className={styles.resourceCell}
                  style={{ gridRow: rowNumber, gridColumn: 1 }}
                >
                  {res}
                </div>
              );
              const emptyCells = timeSlots.map((_, colIdx) => (
                <div
                  key={colIdx}
                  className={styles.gridCell}
                  style={{ gridRow: rowNumber, gridColumn: colIdx + 2 }}
                />
              ));
              return (
                <React.Fragment key={res}>
                  {labelCell}
                  {emptyCells}
                </React.Fragment>
              );
            })}

            {appointments.map((evt) => {
              const rowIndex = resources.indexOf(evt.resource.title) + 2;
              const startCol = timeToSlotIndex(evt.startTime) + 2;
              const endCol = timeToSlotIndex(evt.endTime) + 2;
              return (
                <div
                  key={evt.id}
                  className={styles.eventBlock}
                  onClick={() => openEvent(evt)}
                  style={{
                    gridRow: rowIndex,
                    gridColumnStart: startCol,
                    gridColumnEnd: endCol,
                    border: `2px solid ${evt.color}`,
                    backgroundColor: hexToRgba(evt.color, 0.2),
                    color: evt.color,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {evt.user.firstName} {evt.user.lastName}
                </div>
              );
            })}
          </div>
        </div>

        {OffcanvasElement}
      </Util.Col>
    </Page>
  );
};
