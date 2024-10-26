import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import { Input, Button, Util } from "tabler-react-2";
import { useModal } from "tabler-react-2/dist/modal";
import { ResourceTypePicker } from "../components/resourceTypePicker/ResourceTypePicker";

const CreateResourceModalContent = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [resourceTypeId, setResourceTypeId] = useState(null);

  return (
    <div>
      <Input
        label="Resource Title"
        value={title}
        onChange={setTitle}
        placeholder={"Bambu Lab X1C"}
      />
      <ResourceTypePicker value={null} onChange={setResourceTypeId} />
      <Util.Spacer size={2} />
      {title.length > 1 && resourceTypeId?.toString()?.length > 5 ? (
        <Button
          variant="primary"
          onClick={() => {
            onSubmit(title, resourceTypeId);
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

  const _createResource = async (title, resourceTypeId) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources`, {
        method: "POST",
        body: JSON.stringify({ title, resourceTypeId }),
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

  const { modal, ModalElement } = useModal({
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
