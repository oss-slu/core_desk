import React, { useState, useRef, useEffect } from "react";
import { Badge, Button } from "tabler-react-2";
import { Icon } from "#icon";
import styles from "./comments.module.css";

export const NotifyUserPicker = ({
  users = [],
  selectedUserIds = [],
  onSelectUserIds,
  isAdmin = false,
  adminOverride = false,
  onToggleAdminOverride,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const toggleUser = (userId) => {
    if (selectedUserIds.includes(userId)) {
      onSelectUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      onSelectUserIds([...selectedUserIds, userId]);
    }
  };

  const removeUser = (userId) => {
    onSelectUserIds(selectedUserIds.filter((id) => id !== userId));
  };

  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
  const hasMutedSelected = selectedUsers.some((u) => !u.emailCommentCreated);

  return (
    <div className={styles.notifyPickerContainer} ref={dropdownRef}>
      <div className={styles.notifyPickerHeader}>
        <Button
          size="sm"
          outline
          color={selectedUserIds.length > 0 ? "primary" : "secondary"}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className={styles.notifyDropdownBtn}
        >
          <Icon i="bell" size={14} style={{ marginRight: "0.4rem" }} />
          Notify...
          {selectedUserIds.length > 0 && (
            <span className={styles.notifyCountBadge}>
              {selectedUserIds.length}
            </span>
          )}
          <Icon
            i={isOpen ? "chevron-up" : "chevron-down"}
            size={14}
            style={{ marginLeft: "0.4rem" }}
          />
        </Button>

        {selectedUsers.length > 0 && (
          <div className={styles.selectedChips}>
            {selectedUsers.map((user) => (
              <Badge
                key={user.id}
                color={user.emailCommentCreated ? "primary" : "warning"}
                soft
                className={styles.userChip}
              >
                <span>{user.name || `${user.firstName} ${user.lastName}`}</span>
                {!user.emailCommentCreated && (
                  <span
                    className={styles.mutedTextSmall}
                    title="User has comment emails disabled"
                  >
                    (Muted)
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUser(user.id);
                  }}
                  className={styles.chipRemoveBtn}
                  aria-label={`Remove ${user.name}`}
                >
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className={styles.notifyDropdownMenu}>
          <div className={styles.notifyDropdownTitle}>
            Select who to notify via email
          </div>
          {users.length === 0 ? (
            <div className={styles.notifyEmpty}>No staff members found</div>
          ) : (
            users.map((user) => {
              const isChecked = selectedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className={`${styles.notifyOption} ${isChecked ? styles.notifyOptionSelected : ""
                    }`}
                  onClick={() => toggleUser(user.id)}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => { }} // handled by row click
                    className={styles.notifyCheckbox}
                  />
                  <div className={styles.notifyUserInfo}>
                    <div className={styles.notifyUserName}>
                      {user.name || `${user.firstName} ${user.lastName}`}
                      {user.accountType && (
                        <span className={styles.accountTypeLabel}>
                          {user.accountType.toLowerCase()}
                        </span>
                      )}
                    </div>
                    {!user.emailCommentCreated && (
                      <span className={styles.mutedNotice}>
                        <Icon i="bell-off" size={12} /> Email notifications
                        disabled
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {isAdmin && hasMutedSelected && (
        <div className={styles.adminOverrideBox}>
          <label className={styles.adminOverrideLabel}>
            <input
              type="checkbox"
              checked={adminOverride}
              onChange={(e) => onToggleAdminOverride(e.target.checked)}
              className={styles.adminOverrideCheckbox}
            />
            <span>
              <strong>Admin Override:</strong> Prioritize notification and send
              email even though recipient has muted notifications.
            </span>
          </label>
        </div>
      )}
    </div>
  );
};
