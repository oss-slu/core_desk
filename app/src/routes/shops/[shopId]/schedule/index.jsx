import React from "react";
import { useParams } from "react-router-dom";
import { Page } from "#page";
import { Typography, Util, Input, Button } from "tabler-react-2";
import { useAuth } from "#useAuth";
import { useUser } from "#hooks";
import { sidenavItems } from "#page";
import { useAppointments } from "#useAppointments";
import { useResources } from "#useResources";
import { ResourcePicker } from "#resourcePicker";
import { useModal } from "#modal";
import { NotFound } from "../../../../components/404/404";
import toast from "react-hot-toast";
import styles from "./SchedulePage.module.css";

const { H1 } = Typography;

const generateTimeSlots = (startHour = 6, endHour = 22) => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "AM" : "PM";
    slots.push(`${hour12}:00 ${ampm}`, `${hour12}:30 ${ampm}`);
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

const timeToSlotIndex = (isoStr) => {
  const d = new Date(isoStr);
  return d.getHours() * 2 + (d.getMinutes() >= 30 ? 1 : 0);
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
  const { user: activeUser } = useUser(user?.id);

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

  const timeSlots = generateTimeSlots();

  if (activeUser?.simple === true) return <NotFound />;

  return (
    <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
      <Util.Col gap={3}>
        <div className={styles.headerRow}>
          <H1>Resource Availability</H1>
          <Button onClick={() => openCreateModal()}>
            Create Appointment
          </Button>
        </div>

        <div className={styles.gridWrapper}>
          <div
            className={styles.calendarGrid}
            style={{
              "--grid-cols": `140px repeat(${timeSlots.length}, 80px)`,
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

                const startCol = timeToSlotIndex(evt.startTime) + 2;
                const endCol = timeToSlotIndex(evt.endTime) + 2;

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
