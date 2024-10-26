import React, { useState } from "react";
import { Card, Util, Typography, DropdownInput } from "tabler-react-2";
import { RenderMedia } from "../media/renderMedia";
import { Button } from "tabler-react-2/dist/button";
import { Icon } from "../../util/Icon";
import { useModal } from "tabler-react-2/dist/modal";
import { useJobItem } from "../../hooks/useJobItem";
import { useParams } from "react-router-dom";
import { Spinner } from "tabler-react-2/dist/spinner";
const { H3 } = Typography;
import styles from "./jobItem.module.css";
import {
  use3dPrinterMaterials,
  use3dPrinterTypes,
  useResources,
} from "../../hooks";
import { RESOURCE_TYPES } from "../../util/constants";
import { LoadableDropdownInput } from "../loadableDropdown/LoadableDropdown";
import { ResourceTypePicker } from "../resourceTypePicker/ResourceTypePicker";

function downloadFile(url, filename) {
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href); // Clean up
    })
    .catch((error) => {
      console.error("Error downloading file:", error);
    });
}

export const switchStatusToUI = (status) => {
  switch (status) {
    case "IN_PROGRESS":
      return ["In Progress", "yellow"];
    case "COMPLETED":
      return ["Completed", "green"];
    case "NOT_STARTED":
      return ["Not Started", "red"];
    case "CANCELLED":
      return ["Cancelled", "secondary"];
    case "WONT_DO":
      return ["Won't Do", "secondary"];
    case "WAITING":
      return ["Waiting", "blue"];
    case "WAITING_FOR_PICKUP":
      return ["Waiting for Pickup", "teal"];
    case "WAITING_FOR_PAYMENT":
      return ["Waiting for Payment", "orange"];
    default:
      return [status, "secondary"];
  }
};

export const JobItem = ({ item: _item, refetchJobs }) => {
  const { shopId, jobId } = useParams();

  const { item, opLoading, updateJobItem, deleteJobItem } = useJobItem(
    shopId,
    jobId,
    _item.id,
    {
      initialValue: _item,
      fetchJobItem: false,
    }
  );

  const { modal, ModalElement } = useModal({
    title: item?.title,
    text: (
      <div>
        <RenderMedia big mediaUrl={item?.fileUrl} fileType={item?.fileType} />
      </div>
    ),
  });

  if (!item) return null;

  return (
    <Card>
      <div className={styles.modal}>{ModalElement}</div>
      <Util.Responsive gap={1} align="start" threshold={600}>
        <RenderMedia mediaUrl={item.fileUrl} fileType={item.fileType} />
        <Util.Responsive gap={1} align="start" threshold={800}>
          <div style={{ minWidth: 300, maxWidth: 300.1 }}>
            <H3>{item.title}</H3>
            <Util.Row gap={1}>
              <Button
                onClick={modal}
                style={{
                  padding: "0.4375rem",
                }}
              >
                <Icon i="cube" size={20} />
              </Button>
              <Button
                onClick={() => {
                  downloadFile(item.fileUrl, item.title);
                }}
                style={{
                  padding: "0.4375rem",
                }}
                download
              >
                <Icon i="download" size={20} />
              </Button>
              <Button
                onClick={() => {
                  deleteJobItem(refetchJobs);
                }}
                style={{
                  padding: "0.4375rem",
                }}
                variant="danger"
                outline
              >
                <Icon i="trash" size={20} />
              </Button>
              {opLoading ? (
                <Spinner />
              ) : (
                <DropdownInput
                  values={[
                    { id: "IN_PROGRESS", label: "In Progress" },
                    { id: "COMPLETED", label: "Completed" },
                    { id: "NOT_STARTED", label: "Not Started" },
                    { id: "CANCELLED", label: "Cancelled" },
                    { id: "WONT_DO", label: "Won't Do" },
                    { id: "WAITING", label: "Waiting" },
                    { id: "WAITING_FOR_PICKUP", label: "Waiting for Pickup" },
                    { id: "WAITING_FOR_PAYMENT", label: "Waiting for Payment" },
                  ]}
                  value={item.status}
                  onChange={(value) => {
                    updateJobItem({ status: value.id });
                  }}
                  color={switchStatusToUI(item.status)[1]}
                  outline
                />
              )}
            </Util.Row>
            <Util.Spacer size={1} />

            <ResourceTypePicker
              value={item.resourceTypeId}
              loading={opLoading}
              onChange={(value) => updateJobItem({ resourceTypeId: value })}
              includeNone={true}
            />
          </div>
          {item.resourceType === "PRINTER_3D" ? (
            <div>
              <PrinterTypePicker
                value={item.printer3dTypeId}
                opLoading={opLoading}
                onChange={(value) =>
                  updateJobItem({ printer3dTypeId: value.id })
                }
              />
              <Util.Spacer size={1} />
              <PrinterMaterialPicker
                value={item.materialId}
                printerTypeId={item.printer3dTypeId}
                opLoading={opLoading}
                onChange={(value) => updateJobItem({ materialId: value.id })}
                disabled={
                  item.printer3dTypeId === null || item.printer3dTypeId === ""
                }
                disabledText={"Select a printer type first"}
              />
            </div>
          ) : (
            <i>Select a fulfillment type to see more options</i>
          )}
        </Util.Responsive>
      </Util.Responsive>
    </Card>
  );
};

const ResourcePicker = ({ value, onChange, opLoading }) => {
  const { shopId } = useParams();
  const { resources, loading } = useResources(shopId);

  const [selectedResource, setSelectedResource] = useState({
    id: value,
    label: "Select a resource",
  });

  if (loading)
    return (
      <>
        <label className="form-label">Resource</label>
        <Button loading disabled>
          Loading...
        </Button>
      </>
    );

  return (
    <>
      <label className="form-label">Resource</label>
      {opLoading ? (
        <Button disabled loading>
          {selectedResource.label}
        </Button>
      ) : (
        <DropdownInput
          values={resources.map((resource) => ({
            id: resource.id,
            label: resource.title,
          }))}
          value={value}
          onChange={(value) => {
            setSelectedResource(value);
            onChange(value.id);
          }}
          prompt="Select a fulfillment type"
        />
      )}
    </>
  );
};

const PrinterTypePicker = ({ value, onChange, opLoading }) => {
  const { shopId } = useParams();
  const { printerTypes, loading } = use3dPrinterTypes(shopId);

  const [selectedPrinterType, setSelectedPrinterType] = useState({
    id: value,
    label: "Select a printer type",
  });

  if (loading)
    return (
      <>
        <label className="form-label">Printer Type</label>
        <Button loading disabled>
          Loading...
        </Button>
      </>
    );

  return (
    <>
      <label className="form-label">Printer Type</label>
      {opLoading ? (
        <Button disabled loading>
          {selectedPrinterType.label}
        </Button>
      ) : (
        <DropdownInput
          values={[
            ...printerTypes.map((printerType) => ({
              id: printerType.id,
              label: printerType.type,
            })),
            {
              id: null,
              label: "Select a printer type",
              dropdownText: "None",
            },
          ]}
          value={value}
          onChange={(value) => {
            setSelectedPrinterType(value);
            onChange(value);
          }}
          prompt="Select a printer type"
        />
      )}
    </>
  );
};

const PrinterMaterialPicker = ({
  value,
  printerTypeId,
  onChange,
  opLoading,
  disabled = false,
  disabledText,
}) => {
  const { shopId } = useParams();
  const { printerMaterials, loading } = use3dPrinterMaterials(
    shopId,
    printerTypeId
  );

  return (
    <LoadableDropdownInput
      loading={loading || opLoading}
      prompt={"Select a material"}
      label="Material"
      values={printerMaterials?.map((material) => ({
        id: material.id,
        label: `${material.manufacturer} ${material.type}`,
      }))}
      value={value}
      onChange={onChange}
      disabled={disabled}
      disabledText={disabledText}
    />
  );
};
