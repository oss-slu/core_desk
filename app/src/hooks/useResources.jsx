import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import { Input, Button } from "tabler-react-2";
import { useModal } from "tabler-react-2/dist/modal";

const CreateResourceModalContent = ({ onSubmit }) => {
  const [title, setTitle] = useState("");

  return (
    <div>
      <Input
        label="Resource Title"
        value={title}
        onChange={setTitle}
        placeholder={"Bambu Lab X1C"}
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

export const useResources = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);

  const _createResource = async (title) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      const data = await r.json();
      if (data.resource) {
        setResources([...resources, data.resource]);
        setOpLoading(false);
        document.location.href = `/shops/${shopId}/resources/${data.resource.id}`;
      } else {
        setError(data.error);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const { modal, ModalElement, close } = useModal({
    title: "Create a new Resource",
    text: <CreateResourceModalContent onSubmit={_createResource} />,
  });

  const fetchResources = async () => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources`);
      const data = await r.json();
      setResources(data.resources);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const createResource = () => {
    modal();
  };

  useEffect(() => {
    fetchResources();
  }, []);

  return {
    resources,
    loading,
    error,
    refetch: fetchResources,
    createResource,
    opLoading,
    ModalElement,
  };
};
