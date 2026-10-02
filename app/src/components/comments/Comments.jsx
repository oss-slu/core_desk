import React, { useState } from "react";
import { useComments } from "#useComments";
import { Card, Util, Input, Typography, Badge } from "tabler-react-2";
import { Loading } from "#loading";
import { Button } from "#button";
import { Avatar } from "#avatar";
import moment from "moment";
import { useAuth, useShop } from "#hooks";
const { H2, H4 } = Typography;
import * as Sentry from "@sentry/react";
import ErrorBoundaries from "../ErrorBoundaries/ErrorBoundaries";
import { NotifyUserPicker } from "./NotifyUserPicker";
import styles from "./comments.module.css";

export const Comments = ({ jobId, shopId }) => {
  const { comments, notifiableUsers, postComment, opLoading, loading } =
    useComments(shopId, jobId);
  const { user } = useAuth();
  const { userShop } = useShop(shopId);

  const [newCommentMessage, setNewCommentMessage] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [adminOverride, setAdminOverride] = useState(false);

  const isAdmin = Boolean(user?.admin || userShop?.accountType === "ADMIN");

  const handlePostComment = async () => {
    if (!newCommentMessage.trim()) return;
    const success = await postComment({
      message: newCommentMessage.trim(),
      notifyUserIds: selectedUserIds,
      adminOverride,
    });
    if (success) {
      setNewCommentMessage("");
      setSelectedUserIds([]);
      setAdminOverride(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <ErrorBoundaries
          error={error}
        />
      )}
    >
      <div>
        <Util.Col gap={1} className={styles.commentsList}>
          <div className={styles.commentComposer}>
            <H2>Comments</H2>
            <Input
              value={newCommentMessage}
              onChange={setNewCommentMessage}
              placeholder="Enter your comment here. Comments are permanent and cannot be deleted."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
            />
            <NotifyUserPicker
              users={notifiableUsers}
              selectedUserIds={selectedUserIds}
              onSelectUserIds={setSelectedUserIds}
              isAdmin={isAdmin}
              adminOverride={adminOverride}
              onToggleAdminOverride={setAdminOverride}
            />
            <Button
              onClick={handlePostComment}
              loading={opLoading}
              disabled={opLoading || !newCommentMessage.trim()}
              className={styles.commentButton}
            >
              Post Comment
            </Button>
          </div>
          <Util.Spacer size={2} />
          {comments.length === 0 ? (
            <i>No comments yet</i>
          ) : (
            comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))
          )}
        </Util.Col>
      </div>
    </Sentry.ErrorBoundary>
  );
};

const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const Comment = ({ comment }) => {
  const { user } = useAuth();
  const accountType = comment.user?.shops?.[0]?.accountType;

  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <ErrorBoundaries
          error={error}
        />
      )}
    >
      <Card
        title={
          <Util.Row
            align="center"
            justify="between"
            gap={1}
            wrap
            className={styles.commentHeader}
          >
            <Util.Row align="center" gap={1} wrap className={styles.commentAuthor}>
              <Avatar size="xs" dicebear initials={comment.user?.id || comment.userId} />
              <H4 style={{ marginBottom: 0 }}>
                {comment.user?.firstName} {comment.user?.lastName}
              </H4>
              {accountType && accountType !== "CUSTOMER" && (
                <Badge color="primary" soft>
                  {capitalize(accountType)}
                </Badge>
              )}
              {comment.userId === user?.id && (
                <Badge color="green" soft>
                  You
                </Badge>
              )}
            </Util.Row>
            <Util.Col className={styles.commentTimestamp}>
              <span className={"text-secondary"}>
                {moment(comment.createdAt).fromNow()} (
                {moment(comment.createdAt).format("MM/DD/YY, h:mm a")})
              </span>
            </Util.Col>
          </Util.Row>
        }
        style={{
          borderTopLeftRadius: "unset",
        }}
      >
        {comment.message}
      </Card>
    </Sentry.ErrorBoundary>
  );
};
