import React, { useState, useEffect } from "react";
import { authFetch } from "#url";
import { useModal } from "#modal";
import toast from "react-hot-toast";
import { Button } from "#button";
import { Input } from "tabler-react-2";

const CreateInviteUserModalContent = ({onSubmit}) => {
  const [userEmails, setUserEmails] = useState("");

  return (
    <div>
      <Input
        value={userEmails}
        type="text"
        onChange={(e) => setUserEmails(e)}
        label="Email(s)"
        placeholder="Enter email addresses separated by commas"
      />
      <Button variant="primary" 
        onClick={() => {
          onSubmit(
            userEmails
          );
        }}
      >
        Submit
      </Button>
    </div>
  );
};

export const useUsers = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const r = await authFetch(
        shopId ? `/api/shop/${shopId}/user` : "/api/users"
      );
      const data = await r.json();
      setUsers(data.users);
      setMeta(data.meta);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const _inviteUser = async (userEmails) => {
    try {
      console.log("emails", userEmails);
      const r = await authFetch(`/api/shop/${shopId}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userEmails }),
      });
      if (!r.ok) {
        // toast.error(data.error); we are not going to put up a toast, we just wont send an email if they dont exist in our db
        return;
      }
      document.location.href = `/shops/${shopId}/users`;
      toast.success(`Invite sent to ${userEmails}`);
    } catch (error) {
      toast.error(error);
      console.error("Error sending email: ", error.message);
      return;
    }
  };

  const { modal, ModalElement } = useModal({
    title: "Invite New User",
    text: <CreateInviteUserModalContent onSubmit={_inviteUser} />,
  });

  const inviteUser = async () => {
    modal({
      title: "Invite New User",
      text: <CreateInviteUserModalContent onSubmit={_inviteUser}/>,
    });
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, meta, ModalElement, inviteUser, refetch: fetchUsers };
};
