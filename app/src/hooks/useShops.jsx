import React, { useState, useEffect } from "react";
import { authFetch } from "#url";
import { Input } from "tabler-react-2";
import { useModal } from "#modal";
import { Button } from "#button";
import { toast } from "react-toastify";

const CreateShopModalContent = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const colors = ["RED", "BLUE", "GREEN", "YELLOW", "ORANGE", "PURPLE", "PINK", "TEAL"];

  return (
    <div>
      <Input
        value={name}
        onChange={(e) => setName(e)}
        label="Shop Name"
        placeholder="e.g. South Campus Shop"
      />
      <Input
        value={address}
        onChange={(e) => setAddress(e)}
        label="Shop Address (optional)"
        placeholder="e.g. 24 N Grand Blvd"
      />
      <Input
        value={email}
        onChange={(e) => setEmail(e)}
        label="Shop Email (optional)"
        placeholder="e.g. shop@slu.edu"
      />
      <Input
        value={phone}
        onChange={(e) => setPhone(e)}
        label="Shop Phone (optional)"
        placeholder="e.g. 123-456-7890"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e)}
        label="Job description (optional)"
        placeholder="e.g. Description"
      />
      <Input 
        value={color}
        onChange={(e) => setColor(e)}
        label="Job Color (optional)"
        placeholder="e.g. purple"
      />
      {name.length > 0 ? (
        <Button
          variant="primary"
          onClick={() => {
            onSubmit(
              name,
              address || null, 
              phone || null,
              email || null,
              description || null,
              colors.includes(color?.toUpperCase()) ? color.toUpperCase() : null,
            );
          }}
        >
          Submit
        </Button>
      ) : (
        <Button disabled>Submit</Button>
      )}
    </div>
  );
};

export const useShops = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState(null);
  const [opLoading, setOpLoading] = useState(false);

  const _createShop = async (
    name,
    address, 
    phone,
    email,
    description,
    color,
  ) => {
    try {
      setOpLoading(true);

      await authFetch(`/api/shop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          address,
          phone,
          email,
          description,
          color,
        }),
      });

      document.location.reload();
    } catch (error) {
      setError(error);
    } finally {
      setOpLoading(false);
    }
  };

  const { modal: createModal, ModalElement: createModalElement } = useModal({
      title: "Create a new Shop",
      text: <CreateShopModalContent onSubmit={_createShop}/>,
  });

  const fetchShops = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading && setLoading(true);
      const r = await authFetch("/api/shop");
      const data = await r.json();
      setShops(data.shops);
      setMeta(data.meta);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const createShop = async () => {
    try {
      await createModal();
    } catch (error) {
      if (error.message.includes("not authorized")) {
        toast.error("You are not authorized to create a shop.");
      } else {
        toast.error("Something went wrong while creating the shop.");
      }
    }
  };

  const addUserToShop = async (userId, shopId, role) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}`, {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      const data = await r.json();
      if (data.error) {
        setError(data.error);
      }
      if (data.message === "success") {
        setOpLoading(false);
        fetchShops(false);
        return true;
      }
      setOpLoading(false);
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const removeUserFromShop = async (userId, shopId) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}`, {
        method: "DELETE",
      });
      const data = await r.json();
      if (data.error) {
        setError(data.error);
      }
      if (data.message === "success") {
        setOpLoading(false);
        fetchShops();
        return true;
      }
      setOpLoading(false);
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const changeUserRole = async (userId, shopId, role) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/user/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      const data = await r.json();
      if (data.error) {
        setError(data.error);
      }
      if (data.message === "success") {
        setOpLoading(false);
        fetchShops();
        return true;
      }
      setOpLoading(false);
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  return {
    shops,
    loading,
    error,
    meta,
    refetch: fetchShops,
    addUserToShop,
    removeUserFromShop,
    changeUserRole,
    createModalElement,
    createShop,
    opLoading,
  };
};