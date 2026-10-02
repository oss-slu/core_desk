import React, { useState, useEffect } from "react";
import { authFetch } from "#url";
import { useModal } from "#modal";
import toast from "react-hot-toast";
import { Button } from "#button";
import { Input } from "tabler-react-2";

const CreateInviteUserModalContent = ({onSubmit}) => {
  const [userEmail, setUserEmail] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");

  return (
    <div>
      <Input
        value={userEmail}
        onChange={(e) => setUserEmail(e)}
        label="Email"
        placeholder="first.last@slu.edu"
      />
      <Input
        value={userFirstName}
        onChange={(e) => setUserFirstName(e)}
        label="First Name"
      />
      <Input
        value={userLastName}
        onChange={(e) => setUserLastName(e)}
        label="Last Name"
      />
      <Button variant="primary" 
        onClick={() => {
          onSubmit(
            userEmail, 
            userFirstName, 
            userLastName
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

  const _inviteUser = async (userEmail, userFirstName, userLastName) => {
    try {
      console.log("email", userEmail);
      console.log("first name", userFirstName);
      console.log("last name", userLastName);
      const r = await authFetch(`/api/shop/${shopId}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userEmail, userFirstName, userLastName }),
      });
      if (!r.ok) {
        // toast.error(data.error); we are not going to put up a toast, we just wont send an email if they dont exist in our db
        return;
      }
      document.location.href = `/shops/${shopId}/users`;
      toast.success(`Invite sent to ${userEmail}`);
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
