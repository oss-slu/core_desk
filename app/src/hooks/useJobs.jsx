import React, { useState, useEffect } from "react";
import { authFetch } from "#authFetch";
import { useModal } from "#useModal";
import { Input, Spinner, Util, Switch, Card } from "tabler-react-2";
import { Button } from "#button";
import { useParams } from "react-router-dom";
import { useUserShop } from "./useUserShop";
import { useAuth } from "./useAuth";
import { ShopUserPicker } from "../components/shopUserPicker/ShopUserPicker";
import { BillingGroupPicker } from "../components/billingGroupPicker/BillingGroupPicker";

const CreateJobModalContent = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [onBehalfOf, setOnBehalfOf] = useState(false);
  const [onBehalfOfUserId, setOnBehalfOfUserId] = useState(null);
  const [onBehalfOfUserEmail, setOnBehalfOfUserEmail] = useState("");
  const [onBehalfOfUserFirstName, setOnBehalfOfUserFirstName] = useState("");
  const [onBehalfOfUserLastName, setOnBehalfOfUserLastName] = useState("");
  const [onBehalfOfBillingGroup, setOnBehalfOfBillingGroup] = useState(false);
  const [onBehalfOfBillingGroupId, setOnBehalfOfBillingGroupId] =
    useState(null);

  const capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  useEffect(() => {
    let [name] = onBehalfOfUserEmail.split("@");
    name = name.replace(/\d/g, "");

    setOnBehalfOfUserFirstName(capitalize(name.split(".")[0]) || "");
    setOnBehalfOfUserLastName(capitalize(name.split(".")[1]) || "");
  }, [onBehalfOfUserEmail]);

  const { shopId } = useParams();
  const { user } = useAuth();
  const { loading: userShopLoading, userShop } = useUserShop(shopId, user?.id);

  return (
    <div>
      <Input
        value={title}
        onChange={(e) => setTitle(e)}
        label="Job title"
        placeholder="e.g. Wind Mill Assembly"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e)}
        label="Job description (optional)"
        placeholder="e.g. Parts for version 2 of the wind mill design project"
      />
      <Input
        type="date"
        label="Due Date"
        onChange={(e) => setDueDate(e + "T00:00:00")}
        value={dueDate?.split("T")[0]}
      />
      {userShopLoading ? (
        <>
          <Spinner />
          <br />
        </>
      ) : (
        (userShop.accountType === "OPERATOR" ||
          userShop.accountType === "ADMIN") && (
          <>
            <Switch
              label="Create on behalf of another user"
              value={onBehalfOf}
              onChange={setOnBehalfOf}
            />
            {onBehalfOf && (
              <Card
                size="md"
                variantPos="top"
                tabs={[
                  {
                    title: "Select an existing user",
                    content: (
                      <ShopUserPicker
                        value={onBehalfOfUserId}
                        onChange={setOnBehalfOfUserId}
                        includeNone={false}
                      />
                    ),
                  },
                  {
                    title: "Create a new user",
                    content: (
                      <>
                        <Input
                          value={onBehalfOfUserEmail}
                          onChange={setOnBehalfOfUserEmail}
                          label="Email"
                          placeholder="first.last@slu.edu"
                        />
                        <Input
                          value={onBehalfOfUserFirstName}
                          onChange={setOnBehalfOfUserFirstName}
                          label="First Name"
                        />
                        <Input
                          value={onBehalfOfUserLastName}
                          onChange={setOnBehalfOfUserLastName}
                          label="Last Name"
                        />
                      </>
                    ),
                  },
                ]}
              />
            )}
            <Util.Spacer size={2} />
          </>
        )
      )}
      {!onBehalfOf ? (
        <>
          <label className="form-label">Billing Group</label>
          <Switch
            label="Create this job on a billing group"
            value={onBehalfOfBillingGroup}
            onChange={setOnBehalfOfBillingGroup}
          />
          {onBehalfOfBillingGroup && (
            <>
              <BillingGroupPicker
                value={onBehalfOfBillingGroupId}
                onChange={setOnBehalfOfBillingGroupId}
                includeNone={false}
              />
            </>
          )}
        </>
      ) : null}
      <Util.Spacer size={2} />
      {title.length > 1 && dueDate.length > 1 ? (
        <Button
          variant="primary"
          loading={loading}
          onClick={() => {
            setLoading(true);
            onSubmit(
              title,
              description,
              dueDate,
              onBehalfOf,
              onBehalfOfUserId,
              onBehalfOfUserEmail,
              onBehalfOfUserFirstName,
              onBehalfOfUserLastName,
              onBehalfOfBillingGroup,
              onBehalfOfBillingGroupId
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

export const useJobs = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [opLoading, setOpLoading] = useState(false);
  const [microLoading, setMicroLoading] = useState(false);

  const _createJob = async (
    title,
    description,
    dueDate,
    onBehalfOf,
    onBehalfOfUserId,
    onBehalfOfUserEmail,
    onBehalfOfUserFirstName,
    onBehalfOfUserLastName,
    onBehalfOfBillingGroup,
    onBehalfOfBillingGroupId
  ) => {
    try {
      setOpLoading(true);

      const r = await authFetch(`/api/shop/${shopId}/job`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          dueDate,
          onBehalfOf,
          onBehalfOfUserId,
          onBehalfOfUserEmail,
          onBehalfOfUserFirstName,
          onBehalfOfUserLastName,
          onBehalfOfBillingGroup,
          billingGroupId: onBehalfOfBillingGroupId,
        }),
      });
      const data = await r.json();
      document.location.href = `/shops/${shopId}/jobs/${data.job.id}`;

      setOpLoading(false);
    } catch (error) {
      setError(error);
    }
  };

  const { modal, ModalElement } = useModal({
    title: "Create a new Job",
    text: <CreateJobModalContent onSubmit={_createJob} />,
  });

  const fetchJobs = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading ? setLoading(true) : setMicroLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job`);
      const data = await r.json();
      setJobs(data.jobs);
      setMeta(data.meta);
      setLoading(false);
      setMicroLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
      setMicroLoading(false);
    }
  };

  const createJob = async () => {
    modal();
  };

  const updateJob = async (jobId, newJob) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job.finalized) {
      const result = await confirm();
      if (!result) {
        return;
      }
    }
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}`, {
        method: "PUT",
        body: JSON.stringify(newJob),
      });
      const data = await r.json();
      if (newJob.finalized) {
        fetchJobs(false);
        setOpLoading(false);
      } else {
        if (data.job) {
          fetchJobs(false);
          setOpLoading(false);
        } else {
          setError("Internal server error");
          setOpLoading(false);
        }
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return {
    jobs,
    loading,
    microLoading,
    error,
    meta,
    refetch: fetchJobs,
    ModalElement,
    createJob,
    opLoading,
    updateJob,
  };
};
