import React, { useEffect, useState } from "react";
import { Page } from "../../../../../../../components/page/page";
import { shopSidenavItems } from "../../../..";
import { useParams } from "react-router-dom";
import { useAuth, useMaterial, useShop } from "../../../../../../../hooks";
import { Typography, Util, Input } from "tabler-react-2";
import { Loading } from "../../../../../../../components/loading/loading";
import { Button } from "tabler-react-2/dist/button";
import { Icon } from "../../../../../../../util/Icon";
import { ResourceTypePicker } from "../../../../../../../components/resourceTypePicker/ResourceTypePicker";
import Badge from "tabler-react-2/dist/badge";
import { UploadDropzone } from "../../../../../../../components/upload/uploader";
import { MarkdownEditor } from "../../../../../../../components/markdown/MarkdownEditor";
import { MarkdownRender } from "../../../../../../../components/markdown/MarkdownRender";
const { H1, H2, H3, B } = Typography;

const objectsAreEqual = (o1, o2) => {
  return JSON.stringify(o1) === JSON.stringify(o2);
};

export const MaterialPage = () => {
  const { shopId, resourceTypeId, materialId } = useParams();
  const { user } = useAuth();
  const { userShop } = useShop(shopId);
  const { material, loading, updateMaterial, opLoading } = useMaterial(
    shopId,
    resourceTypeId,
    materialId
  );

  const [nm, setNm] = useState(material);

  useEffect(() => {
    setNm(material);
  }, [material]);

  const [editing, setEditing] = useState(false);

  const [changed, setChanged] = useState(false);
  useEffect(() => {
    setChanged(!objectsAreEqual(nm, material));
  }, [nm, material]);

  if (loading)
    return (
      <Page
        sidenavItems={shopSidenavItems("Resources", shopId, user, userShop)}
      >
        <Loading />
      </Page>
    );

  return (
    <Page sidenavItems={shopSidenavItems("Resources", shopId, user, userShop)}>
      <Util.Row justify="between" align="center">
        <H1>{material.title}</H1>
        {!editing && (
          <Button onClick={() => setEditing(true)}>
            <Icon i="edit" />
            Edit
          </Button>
        )}
      </Util.Row>
      <Util.Hr />
      <Util.Responsive threshold={800} gap={2}>
        <div>
          <H2>Material Information</H2>
          <B>Manufacturer</B>{" "}
          <Badge color="teal">{material.manufacturer}</Badge>
          {material.costPublic && (
            <>
              <Util.Spacer size={2} />
              <H3>Costing Information</H3>
              <B>Cost per unit</B>{" "}
              <Badge color="teal">${material.costPerUnit}</Badge> per{" "}
              <Badge color="teal">{material.unitDescriptor}</Badge>
            </>
          )}
        </div>
      </Util.Responsive>
      <Util.Hr />
      {editing ? (
        <div>
          <Util.Row justify="between" align="center">
            <H2>Editing Material</H2>
            {changed && <i className="text-red">You have unsaved changes.</i>}
            <Button
              loading={opLoading}
              onClick={async () => {
                await updateMaterial(nm);
                setEditing(false);
              }}
              variant="primary"
            >
              Save & Close edit mode
            </Button>
          </Util.Row>
          <Input
            label="Title"
            value={material.title}
            onChange={(e) => setNm({ ...nm, title: e })}
          />
          <Input
            label="Manufacturer"
            value={material.manufacturer}
            onChange={(e) => setNm({ ...nm, manufacturer: e })}
          />
          <ResourceTypePicker
            value={material.resourceTypeId}
            onChange={(v) => setNm({ ...nm, resourceTypeId: v })}
          />
          <Util.Spacer size={1} />
          <Util.Row gap={1}>
            <Input
              label="Cost Per Unit in dollars*"
              value={material.costPerUnit}
              onChange={(e) => setNm({ ...nm, costPerUnit: e })}
              placeholder="Cost Per Unit"
              type="number"
              style={{
                flex: 1,
              }}
            />
            <Input
              label="Unit Descriptor*"
              value={material.unitDescriptor}
              onChange={(e) => setNm({ ...nm, unitDescriptor: e })}
              placeholder="e.g., gram, page, sheet"
              style={{
                width: "65%",
              }}
            />
          </Util.Row>
          <p>
            Cost per unit should be the cost of a single unit of the material,
            and unit descriptor should be this unit. This is the smallest unit
            of material that can be purchased. For 3d printing, this should be
            gram. For laser cutting, this should be sheet. For traditional
            printing, this should be page. For grammatical correctness, this
            should be singular lower-case, but this is not enforced.
          </p>

          <H2>Documentation</H2>
          <H3>MSDS (Material Safety Data Sheet)</H3>
          <UploadDropzone
            scope="material.msds"
            metadata={{ shopId, materialId }}
            dropzoneAppearance={{
              container: {
                height: 200,
                padding: 10,
              },
              uploadIcon: {
                display: "none",
              },
            }}
          />
          <Util.Spacer size={2} />
          <H3>TDS (Technical Data Sheet)</H3>
          <UploadDropzone
            scope="material.tds"
            metadata={{ shopId, materialId }}
            dropzoneAppearance={{
              container: {
                height: 200,
                padding: 10,
              },
              uploadIcon: {
                display: "none",
              },
            }}
          />
          <Util.Spacer size={2} />
          <MarkdownEditor
            value={material.description}
            onChange={(e) => setNm({ ...nm, description: e })}
          />
          <Util.Hr />
        </div>
      ) : (
        <div>
          <MarkdownRender markdown={material.description} />
        </div>
      )}
    </Page>
  );
};
