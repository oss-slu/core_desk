import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import { Input, Util } from "tabler-react-2";
import { useModal } from "tabler-react-2/dist/modal";
import { ShopUserPicker } from "../components/shopUserPicker/ShopUserPicker";
import { Button } from "tabler-react-2/dist/button";

const CreateShopModalContent = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");

  return(
    <div>
      <Input
        value={name}
        onChange={(e) => setName(e)}
        label="Shop Name"
        placeholder="e.g. Example Name"
      />
      <Input
        value={address}
        onChange={(e) => setAddress(e)}
        label="Shop Address"
        placeholder="e.g. 24 N Grand Blvd"
      />
      <Input
        value={email}
        onChange={(e) => setEmail(e)}
        label="Shop Email"
        placeholder="e.g. shop@slu.edu"
      />
      <Input
        value={phone}
        onChange={(e) => setPhone(e)}
        label="Shop Phone"
        placeholder="e.g. 123-456-7890"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e)}
        label="Job description (optional)"
        placeholder="e.g. Description"
      />
      <Util.Spacer size={1} />
      {name.length > 1 ? (
        <Button
          variant = "primary"
          onClick={() => {
            onSubmit(
              name,
              address, 
              phone,
              email,
              description,
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
}

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
  ) => {
    try {
      const r = await authFetch(`api/shops`, {
        method: "POST",
        body: JSON.stringify({
          name,
          address,
          phone,
          email,
          description,
        }),
      });
    } catch (error) {
      setError(error);
    }
  };

  const { modal, ModalElement } = useModal({
      title: "Create a new Shop",
      text: <CreateShopModalContent onSubmit={_createShop} />,
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
    modal();
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


  const newShop = async (data) => {
    try { 
      const r = await authFetch(`/api/shop`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const createdShop = await r.json();
      if (createdShop.shop) {
        setShops(createdShop.shops);
      } else {
        setError(createdShop);
      }
    } catch (error) {
      setError(error);
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
    ModalElement,
    createShop,
    opLoading,
  };
};
