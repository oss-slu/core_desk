import React from "react";
import { useParams } from "react-router-dom";
import { Page } from "#page";
import { Typography, Util, Input, Button, SegmentedControl } from "tabler-react-2";
import { useAuth } from "#useAuth";
import { sidenavItems } from "#page";
import { useAppointments } from "#useAppointments";
import { useResources } from "#useResources";
import { useCalendarSettings } from "#useCalendarSettings";
import { ResourcePicker } from "#resourcePicker";
import { useModal } from "#modal";
import toast from "react-hot-toast";
import styles from "./SchedulePage.module.css";

const { H1 } = Typography;

const generateTimeSlots = (startHour = 6, endHour = 24, incrementMinutes = 30) => {
  const slots = [];
  const totalMinutes = (endHour - startHour) * 60;
  
  for (let minutes = 0; minutes < totalMinutes; minutes += incrementMinutes) {
    const totalMins = startHour * 60 + minutes;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "AM" : "PM";
    const minutesStr = m.toString().padStart(2, "0");
    slots.push(`${hour12}:${minutesStr} ${ampm}`);
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
  return new Date(localStr).toISOString();
};

const timeToSlotIndex = (isoStr, incrementMinutes, startHour = 0) => {
  const d = new Date(isoStr);
  const totalMinutes = d.getHours() * 60 + d.getMinutes();
  const minutesFromStart = totalMinutes - (startHour * 60);
  return Math.floor(minutesFromStart / incrementMinutes);
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
  const { settings, loading: settingsLoading, updateSettings } = useCalendarSettings(shopId);

  const [incrementMinutes, setIncrementMinutes] = React.useState(30);

  React.useEffect(() => {
    if (settings.calendarDefaultIncrement) {
      setIncrementMinutes(settings.calendarDefaultIncrement);
    }
  }, [settings.calendarDefaultIncrement]);

  const presetIncrements = [
    { id: "15", label: "15 min", value: 15 },
    { id: "30", label: "30 min", value: 30 },
    { id: "60", label: "1 hour", value: 60 },
    { id: "120", label: "2 hours", value: 120 },
  ];

  const SettingsForm = () => {
    const [formData, setFormData] = React.useState({
      calendarStartHour: settings.calendarStartHour || 6,
      calendarEndHour: settings.calendarEndHour || 24,
      calendarDefaultIncrement: settings.calendarDefaultIncrement || 30,
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Input
          type="number"
          label="Start Hour (24-hour format)"
          value={formData.calendarStartHour}
          onChange={(val) => setFormData(prev => ({ ...prev, calendarStartHour: parseInt(val) || 0 }))}
          min={0}
          max={23}
        />
        <Input
          type="number"
          label="End Hour (24-hour format)"
          value={formData.calendarEndHour}
          onChange={(val) => setFormData(prev => ({ ...prev, calendarEndHour: parseInt(val) || 24 }))}
          min={1}
          max={24}
        />
        <div>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", display: "block" }}>
            Default Time Increment
          </label>
          <SegmentedControl
            value={formData.calendarDefaultIncrement.toString()}
            onChange={(selected) => {
              setFormData(prev => ({ ...prev, calendarDefaultIncrement: parseInt(selected.id) }));
            }}
            items={presetIncrements}
          />
        </div>
        <Button 
          onClick={async () => {
            const success = await updateSettings(formData);
            if (success) {
              closeSettingsModal();
            }
          }}
        >
          Save Settings
        </Button>
      </div>
    );
  };

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

  const { 
    modal: openSettingsModal, 
    close: closeSettingsModal, 
    ModalElement: SettingsModal 
  } = useModal({
    title: "Calendar Settings",
    text: <SettingsForm />,
  });

  if (authLoading || appointmentsLoading || resourcesLoading || settingsLoading)
    return <Page sidenavItems={sidenavItems("Shops", user?.admin)}>Loading schedule...</Page>;

  if (appointmentsError || resourcesError)
    return (
      <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
        <div className="text-danger">{appointmentsError?.message || resourcesError?.message}</div>
      </Page>
    );

  const startHour = settings.calendarStartHour || 6;
  const endHour = settings.calendarEndHour || 24;

  const timeSlots = generateTimeSlots(startHour, endHour, incrementMinutes);

  const cellSize = 70;

  const userShop = user?.shops?.find(s => s.shopId === shopId);
  const canEditSettings = user?.admin || userShop?.accountType === "ADMIN" || userShop?.accountType === "OPERATOR";

  return (
    <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
      <Util.Col gap={3}>
        <div className={styles.headerRow}>
          <H1>Resource Availability</H1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>View:</span>
              <SegmentedControl
                value={incrementMinutes.toString()}
                onChange={(selected) => {
                  const preset = presetIncrements.find(p => p.id === selected.id);
                  if (preset) {
                    setIncrementMinutes(preset.value);
                  }
                }}
                items={presetIncrements}
              />
            </div>
            {canEditSettings && (
              <Button variant="outline" onClick={() => openSettingsModal()}>
                Settings
              </Button>
            )}
            <Button onClick={() => openCreateModal()}>Create Appointment</Button>
          </div>
        </div>

        <div className={styles.gridWrapper}>
          <div
            className={styles.calendarGrid}
            style={{
              "--grid-cols": `140px repeat(${timeSlots.length}, ${cellSize}px)`,
              "--grid-rows": `${cellSize}px repeat(${resources.length}, ${cellSize}px)`,
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

                const startCol = timeToSlotIndex(evt.startTime, incrementMinutes, startHour) + 2;
                const endCol = timeToSlotIndex(evt.endTime, incrementMinutes, startHour) + 2;

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
        {SettingsModal}
      </Util.Col>
    </Page>
  );
};