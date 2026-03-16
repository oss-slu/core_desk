import useSWR from "swr";
import React, { useState } from "react";
import { authFetch } from "#url";
import { Input, Button, SegmentedControl } from "tabler-react-2";
import { useModal } from "#modal";

const COSTING_MODE_OPTIONS = [
  {
    id: "CALCULATE_WITH_RESOURCE_AND_MATERIAL",
    label: "Calcuate with resource & material",
  },
  {
    id: "RAW_VALUE_ENTRY",
    label: "Raw value entry",
  },
];

const CreateResourceModalContent = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [costingMode, setCostingMode] = useState(
    COSTING_MODE_OPTIONS[0].id
  );

  return (
    <div>
      <Input
        label="Resource Type Title"
        value={title}
        onChange={setTitle}
        placeholder="FDM 3d Printer"
      />
      <div style={{ marginBottom: 12 }}>
        <label className="form-label">Costing Mode</label>
        <SegmentedControl
          value={costingMode}
          onChange={(selected) => setCostingMode(selected.id)}
          items={COSTING_MODE_OPTIONS}
        />
      </div>
      {title.length > 1 ? (
        <Button
          variant="primary"
          onClick={() => {
            onSubmit(title, costingMode);
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

const EditResourceModalContent = ({
  onSubmit,
  resourceTypeTitle,
  resourceTypeCostingMode,
}) => {
  const [title, setTitle] = useState(resourceTypeTitle || "");
  const [costingMode, setCostingMode] = useState(
    resourceTypeCostingMode || COSTING_MODE_OPTIONS[0].id
  );

  return (
    <div>
      <Input
        label="Resource Type Title"
        value={title}
        onChange={setTitle}
        placeholder={"FDM 3d Printer"}
      />
      <div style={{ marginBottom: 12 }}>
        <label className="form-label">Costing Mode</label>
        <SegmentedControl
          value={costingMode}
          onChange={(selected) => setCostingMode(selected.id)}
          items={COSTING_MODE_OPTIONS}
        />
      </div>
      {title.length > 1 ? (
        <Button
          variant="primary"
          onClick={() => {
            onSubmit(title, costingMode);
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

const fetcher = (url) => authFetch(url).then((res) => res.json());

export const useResourceTypes = (shopId) => {
  const { data, error, mutate } = useSWR(
    `/api/shop/${shopId}/resources/type`,
    fetcher,
    { suspense: false }
  );

  const [opLoading, setOpLoading] = useState(false);

  const _createResourceType = async (title, costingMode) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources/type`, {
        method: "POST",
        body: JSON.stringify({ title, shopId, costingMode }),
      });
      const data = await r.json();
      if (data.resourceType) {
        // Optimistically update the data
        mutate();
        setOpLoading(false);
        document.location.hash = "#" + data.resourceType.id;
        document.location.reload();
      } else {
        throw data.error;
      }
    } catch (error) {
      setOpLoading(false);
      throw error;
    }
  };

  const _editResourceType = async (title, resourceTypeId, costingMode) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources/type`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, resourceTypeId, costingMode }),
      });
      const data = await r.json();
      if (data.resourceType) {
        // Optimistically update the data
        mutate();
        setOpLoading(false);
        document.location.hash = "#" + data.resourceType.id;
        document.location.reload();
      } else {
        throw data.error;
      }
    } catch (error) {
      setOpLoading(false);
      throw error;
    }
  };

  const { modal: createModal, ModalElement: createModalElement } = useModal({
    title: "Create a new Resource Type",
    text: (
      <CreateResourceModalContent
        onSubmit={async (title, costingMode) => {
          await _createResourceType(title, costingMode);
        }}
      />
    ),
  });

  const deleteResourceType = async (resourceTypeId) => {
    try {
      setOpLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}/resources/type/${resourceTypeId}`,
        {
          method: "DELETE",
        }
      );
      const data = await r.json();
      if (data.message) {
        // Optimistically update the data
        mutate();
        setOpLoading(false);
        document.location.reload();
      } else {
        throw data.error;
      }
    } catch (error) {
      setOpLoading(false);
      throw error;
    }
  };

  const useEditResourceTypeModal = (
    resourceTypeId,
    resourceTypeTitle,
    resourceTypeCostingMode
  ) => {
    const { modal: editModal, ModalElement: editModalElement } = useModal({
      title: "Edit Resource Type",
      text: (
        <EditResourceModalContent
          onSubmit={(title, costingMode) => {
            _editResourceType(title, resourceTypeId, costingMode);
          }}
          resourceTypeTitle={resourceTypeTitle}
          resourceTypeCostingMode={resourceTypeCostingMode}
        />
      ),
    });

    return { editModal, editModalElement };
  };

  return {
    resourceTypes: data ? data.resourceTypes : [],
    loading: !data && !error,
    error,
    refetch: mutate,
    createResourceType: createModal,
    useEditResourceTypeModal,
    opLoading,
    // ModalElement: modal,
    deleteResourceType,
    createModalElement,
  };
};
