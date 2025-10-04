import React from "react";
import { Page } from "#page";
import { Typography, Util, useOffcanvas, Input } from "tabler-react-2";
import { useAuth } from "#useAuth";
import { sidenavItems } from "#page";
import styles from "./SchedulePage.module.css";

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

export const SchedulePage = () => {
  const { user, loading } = useAuth();
  const { offcanvas, OffcanvasElement } = useOffcanvas({
    offcanvasProps: { position: "end", size: 500, zIndex: 1051 },
  });
  const [activeEvent, setActiveEvent] = React.useState(null);

  if (loading) {
    return <Page sidenavItems={sidenavItems("Shops", user?.admin)}>Loading...</Page>;
  }

  const mockEvents = [
    {
      id: "evt1",
      startTime: "2025-09-27T09:30:00Z",
      endTime: "2025-09-27T10:30:00Z",
      userId: "user1",
      user: {
        id: "user1",
        email: "bellaOtt@notSlu.edu",
        firstName: "Bella",
        lastName: "Ott",
      },
      resourceId: "res1",
      resource: {
        title: "Test 1",
        description: "TestResourceDescription",
      },
      color: "#4e73df",
    },
    {
      id: "evt2",
      startTime: "2025-09-27T11:00:00Z",
      endTime: "2025-09-27T12:00:00Z",
      userId: "user2",
      user: {
        id: "user2",
        email: "jack.crane@notSlu.edu",
        firstName: "Jack",
        lastName: "Crane",
      },
      resourceId: "res1",
      resource: {
        title: "Test 2",
        description: "TestResourceDescription",
      },
      color: "#1cc88a",
    },
    {
      id: "evt3",
      startTime: "2025-09-27T13:00:00Z",
      endTime: "2025-09-27T14:30:00Z",
      userId: "user3",
      user: {
        id: "user3",
        email: "plsdontsendmeemails@notslu.edu",
        firstName: "Paul",
        lastName: "Ongkiko",
      },
      resourceId: "res2",
      resource: {
        title: "Test 1",
        description: "TestResourceDescription",
      },
      color: "#f6c23e",
    },
  ];

  const resources = Array.from(new Set(mockEvents.map((evt) => evt.resource.title)));
  const timeSlots = generateTimeSlots();

  const openEvent = (evt) => {
    setActiveEvent(evt);

    const startDate = new Date(evt.startTime);
    const localDatetime = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    offcanvas({
      content: (
        <div style={{ padding: 24 }}>
          <h2 style={{ color: evt.color }}>{evt.user.firstName} {evt.user.lastName}</h2>
          <h3>{evt.user.email}</h3>
          <p>
            {/*update with link to resource*/}
            <strong>Resource:</strong> {evt.resource.title} {evt.resourceId}
          </p>

          <p>
            <strong>Description:</strong> {evt.resource.description}
          </p>

          <div style={{ marginTop: 10 }}>
            <Input
              type="datetime-local"
              label="Booking Time"
              value={localDatetime}
              onChange={() => {}}
            />
          </div>
        </div>
      ),
    });
  };

  return (
    <Page sidenavItems={sidenavItems("Shops", user.admin)}>
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

            {mockEvents.map((evt) => {
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
