import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import { Input, Button } from "tabler-react-2";
import { useModal } from "tabler-react-2/dist/modal";

const CreateResourceModalContent = ({ onSubmit }) => {
  const [title, setTitle] = useState("");

  return (
    <div>
      <Input
        label="Resource Type Title"
        value={title}
        onChange={setTitle}
        placeholder={"FDM 3d Printer"}
      />
      {title.length > 1 ? (
        <Button
          variant="primary"
          onClick={() => {
            onSubmit(title);
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

export const useResourceTypes = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resourceTypes, setResourceTypes] = useState([]);

  const _createResourceType = async (title) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources/type`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      const data = await r.json();
      if (data.resourceType) {
        setResourceTypes([...resourceTypes, data.resourceType]);
        setOpLoading(false);
        document.location.hash = "#" + data.resourceType.id;
        document.location.reload();
      } else {
        setError(data.error);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const { modal, ModalElement } = useModal({
    title: "Create a new Resource Type",
    text: <CreateResourceModalContent onSubmit={_createResourceType} />,
  });

  const fetchResourceTypes = async () => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources/type`);
      const data = await r.json();
      if (data.resourceTypes) {
        setResourceTypes(data.resourceTypes);
        setLoading(false);
      } else {
        setError(data.error);
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const createResourceType = () => {
    modal();
  };

  useEffect(() => {
    fetchResourceTypes();
  }, []);

  return {
    resourceTypes,
    loading,
    error,
    refetch: fetchResourceTypes,
    createResourceType,
    opLoading,
    ModalElement,
  };
};
