import React from "react";
import { useParams } from "react-router-dom";
import { Page } from "#page";
import { Typography, Util, Input, Button } from "tabler-react-2";
import { useAuth } from "#useAuth";
import { sidenavItems } from "#page";
import { useAppointments } from "#useAppointments";
import { useResources } from "#useResources";
import { ResourcePicker } from "#resourcePicker";
import { useModal } from "#modal";
import toast from "react-hot-toast";
import styles from "./SchedulePage.module.css";

const { H1 } = Typography;

const generateTimeSlots = (startHour = 6, endHour = 24, incrementMinutes = 30) => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += incrementMinutes) {
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? "AM" : "PM";
      const minutes = m.toString().padStart(2, "0");
      slots.push(`${hour12}:${minutes} ${ampm}`);
    }
  }
  return slots;
};

const isoToLocalDatetime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const localToUtcIso = (localStr) => {
  if (!localStr) return null;
  const d = new Date(localStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
};

const timeToSlotIndex = (isoStr, incrementMinutes) => {
  const d = new Date(isoStr);
  const totalMinutes = d.getHours() * 60 + d.getMinutes();
  return Math.floor(totalMinutes / incrementMinutes);
};

const AppointmentForm = ({ mode, appointment, onSave, onDelete }) => {
  const [formData, setFormData] = React.useState({
    resourceId: appointment?.resource?.id || "",
    startTime: isoToLocalDatetime(appointment?.startTime),
    endTime: isoToLocalDatetime(appointment?.endTime),
  });

  return (
    <div className={styles.appointmentForm}>
      <ResourcePicker
        value={formData.resourceId}
        onChange={(val) => setFormData((prev) => ({ ...prev, resourceId: val }))}
      />
      <Input
        label="Start Time"
        type="datetime-local"
        value={formData.startTime}
        onChange={(val) => setFormData((prev) => ({ ...prev, startTime: val }))}
      />
      <Input
        label="End Time"
        type="datetime-local"
        value={formData.endTime}
        onChange={(val) => setFormData((prev) => ({ ...prev, endTime: val }))}
      />
      <div className={styles.formActions}>
        <Button
          onClick={async () => {
            const startISO = localToUtcIso(formData.startTime);
            const endISO = localToUtcIso(formData.endTime);
            if (!startISO || !endISO || !formData.resourceId) {
              toast.error("Please fill out all fields correctly");
              return;
            }
            await onSave({ resourceId: formData.resourceId, startTime: startISO, endTime: endISO });
          }}
        >
          Save
        </Button>
        {mode === "edit" && (
          <Button
            color="danger"
            onClick={async () => {
              if (!window.confirm("Delete this appointment?")) return;
              await onDelete();
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

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
  const { resources, loading: resourcesLoading, error: resourcesError } = useResources(shopId);

  const [incrementMinutes, setIncrementMinutes] = React.useState(30);
  const [columnWidth, setColumnWidth] = React.useState(80);

  const { modal: openCreateModal, ModalElement: CreateModal } = useModal({
    title: "Create Appointment",
    text: (
      <AppointmentForm
        key="create"
        mode="create"
        resources={resources}
        onSave={async (data) => await createAppointment(data)}
      />
    ),
  });

  const { modal: openEditModal, ModalElement: EditModal } = useModal({
    title: "Edit Appointment",
    text: <div>Loading...</div>,
  });

  if (authLoading || appointmentsLoading || resourcesLoading)
    return <Page sidenavItems={sidenavItems("Shops", user?.admin)}>Loading schedule...</Page>;

  if (appointmentsError || resourcesError)
    return (
      <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
        <div className="text-danger">{appointmentsError?.message || resourcesError?.message}</div>
      </Page>
    );

  const timeSlots = generateTimeSlots(6, 24, incrementMinutes);

  const presetIncrements = [
    { label: "15 min", value: 15, width: 60 },
    { label: "30 min", value: 30, width: 80 },
    { label: "1 hour", value: 60, width: 100 },
    { label: "2 hours", value: 120, width: 120 },
  ];

  return (
    <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
      <Util.Col gap={3}>
        <div className={styles.headerRow}>
          <H1>Resource Availability</H1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 20, fontWeight: 500, marginRight: 5}}>View:</span>
              {presetIncrements.map((preset) => (
                <Button
                  key={preset.value}
                  color={incrementMinutes === preset.value ? "primary" : ""}
                  onClick={() => {
                    setIncrementMinutes(preset.value);
                    setColumnWidth(preset.width);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Button onClick={() => openCreateModal()}>Create Appointment</Button>
          </div>
        </div>

        <div className={styles.gridWrapper}>
          <div
            className={styles.calendarGrid}
            style={{
              "--grid-cols": `140px repeat(${timeSlots.length}, ${columnWidth}px)`,
              "--grid-rows": `40px repeat(${resources.length}, 40px)`,
            }}
          >
            <div className={styles.headerCell} style={{ gridRow: 1, gridColumn: 1 }} />
            {timeSlots.map((slot, idx) => (
              <div key={idx} className={styles.headerCell} style={{ gridRow: 1, gridColumn: idx + 2 }}>
                {slot}
              </div>
            ))}

            {resources.map((res, rowIdx) => (
              <React.Fragment key={res.id}>
                <div className={styles.resourceCell} style={{ gridRow: rowIdx + 2, gridColumn: 1 }}>
                  {res.title}
                </div>
                {timeSlots.map((_, colIdx) => (
                  <div key={colIdx} className={styles.gridCell} style={{ gridRow: rowIdx + 2, gridColumn: colIdx + 2 }} />
                ))}
              </React.Fragment>
            ))}

            {appointments
              .filter((evt) => evt.active)
              .map((evt) => {
                if (!evt.resource) return null;
                const rowIdx = resources.findIndex((r) => r.id === evt.resource.id);
                if (rowIdx === -1) return null;

                const startCol = timeToSlotIndex(evt.startTime, incrementMinutes) + 2;
                const endCol = timeToSlotIndex(evt.endTime, incrementMinutes) + 2;

                return (
                  <div
                    key={evt.id}
                    className={styles.eventBlock}
                    style={{
                      gridRow: rowIdx + 2,
                      gridColumnStart: startCol,
                      gridColumnEnd: endCol,
                    }}
                    onClick={() => {
                      const editContent = (
                        <AppointmentForm
                          key={evt.id}
                          mode="edit"
                          appointment={evt}
                          resources={resources}
                          onSave={async (data) => await updateAppointment(evt.id, data)}
                          onDelete={async () => await deleteAppointment(evt.id)}
                        />
                      );

                      openEditModal({ text: editContent });
                    }}
                  >
                    {evt.user.firstName} {evt.user.lastName}
                  </div>
                );
              })}
          </div>
        </div>

        {CreateModal}
        {EditModal}
      </Util.Col>
    </Page>
  );
};