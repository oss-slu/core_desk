import React, { useEffect, useMemo, useState } from "react";
import { Input, Util } from "tabler-react-2";
import { ShopUserPicker } from "#shopUserPicker";

export const USER_SELECTOR_MODE = {
  EXISTING: "existing",
  NEW: "new",
};

export const createDefaultUserSelection = () => ({
  mode: USER_SELECTOR_MODE.EXISTING,
  userId: null,
  email: "",
  firstName: "",
  lastName: "",
});

const capitalize = (s) => {
  if (typeof s !== "string" || s.length === 0) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const UserSelectorCard = ({
  value,
  onChange,
  includeNone = false,
  existingTabLabel = "Select an existing user",
  newTabLabel = "Create a new user",
}) => {
  const initial = useMemo(
    () => ({ ...createDefaultUserSelection(), ...value }),
    [value]
  );
  const [selection, setSelection] = useState(initial);
  const [activeTab, setActiveTab] = useState(initial.mode || USER_SELECTOR_MODE.EXISTING);

  useEffect(() => {
    setSelection((prev) => ({ ...prev, ...initial }));
    setActiveTab(initial.mode || USER_SELECTOR_MODE.EXISTING);
  }, [initial]);

  useEffect(() => {
    if (activeTab === USER_SELECTOR_MODE.NEW && selection.email) {
      const [username] = selection.email.split("@");
      if (username) {
        const sanitized = username.replace(/\d/g, "");
        const [first = "", last = ""] = sanitized.split(".");
        setSelection((prev) => ({
          ...prev,
          firstName: prev.firstName || capitalize(first),
          lastName: prev.lastName || capitalize(last),
        }));
      }
    }
  }, [activeTab, selection.email]);

  useEffect(() => {
    if (typeof onChange === "function") {
      onChange({ ...selection, mode: activeTab });
    }
  }, [selection, activeTab, onChange]);

  const handleTabChange = (mode) => {
    setActiveTab(mode);
    setSelection((prev) => {
      if (mode === USER_SELECTOR_MODE.EXISTING) {
        return {
          ...prev,
          mode,
          email: "",
          firstName: "",
          lastName: "",
        };
      }
      return {
        ...prev,
        mode,
        userId: null,
      };
    });
  };

  return (
    <div className="card card-md">
      <div className="card-tabs">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link${
                activeTab === USER_SELECTOR_MODE.EXISTING ? " active" : ""
              }`}
              onClick={() => handleTabChange(USER_SELECTOR_MODE.EXISTING)}
            >
              {existingTabLabel}
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link${
                activeTab === USER_SELECTOR_MODE.NEW ? " active" : ""
              }`}
              onClick={() => handleTabChange(USER_SELECTOR_MODE.NEW)}
            >
              {newTabLabel}
            </button>
          </li>
        </ul>
        <div className="tab-content">
          <div
            className={`card tab-pane${
              activeTab === USER_SELECTOR_MODE.EXISTING ? " active show" : ""
            }`}
          >
            <div className="card-body">
              <ShopUserPicker
                value={selection.userId}
                onChange={(userId) =>
                  setSelection((prev) => ({
                    ...prev,
                    userId,
                  }))
                }
                includeNone={includeNone}
              />
            </div>
          </div>
          <div
            className={`card tab-pane${
              activeTab === USER_SELECTOR_MODE.NEW ? " active show" : ""
            }`}
          >
            <div className="card-body">
              <Util.Col gap={1}>
                <Input
                  value={selection.email}
                  onChange={(email) =>
                    setSelection((prev) => ({
                      ...prev,
                      email,
                      firstName: "",
                      lastName: "",
                    }))
                  }
                  label="Email"
                  placeholder="first.last@slu.edu"
                />
                <Input
                  value={selection.firstName}
                  onChange={(firstName) =>
                    setSelection((prev) => ({
                      ...prev,
                      firstName,
                    }))
                  }
                  label="First Name"
                />
                <Input
                  value={selection.lastName}
                  onChange={(lastName) =>
                    setSelection((prev) => ({
                      ...prev,
                      lastName,
                    }))
                  }
                  label="Last Name"
                />
              </Util.Col>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

UserSelectorCard.defaultProps = {
  value: createDefaultUserSelection(),
};
