import React from "react";
import { useAuth } from "#useAuth";
import { Page, sidenavItems } from "#page";
import { Util, Typography } from "tabler-react-2";
import { Spinner } from "#spinner";
import { useNotificationSettings } from "#useNotificationSettings";

const { H2 } = Typography;

export const SettingsPage = () => {
    const { user } = useAuth();

    const {
        settings: notifSettings,
        loading: notifLoading,
        updateSettings: updateNotifSettings,
    } = useNotificationSettings(user?.id);

    if (!user) {
        return <Spinner />;
    }

    return (
        <Page sidenavItems={sidenavItems("Settings", user.admin)}>
            <H2>Email Notification Preferences</H2>

            <p
                style={{
                    color: "#6c757d",
                    marginTop: 0,
                    marginBottom: "1rem",
                }}
            >
                Choose which email notifications you want to receive.
            </p>

            {notifLoading ? (
                <Spinner />
            ) : (
                <Util.Col gap={0.75}>
                    <label>
                        <input
                            id="notif-job-created"
                            type="checkbox"
                            checked={notifSettings.emailJobCreated}
                            onChange={async (e) => {
                                await updateNotifSettings({
                                    ...notifSettings,
                                    emailJobCreated: e.target.checked,
                                });
                            }}
                        />
                        {" "}Email notifications when a job is created
                    </label>

                    <label>
                        <input
                            id="notif-comment-created"
                            type="checkbox"
                            checked={notifSettings.emailCommentCreated}
                            onChange={async (e) => {
                                await updateNotifSettings({
                                    ...notifSettings,
                                    emailCommentCreated: e.target.checked,
                                });
                            }}
                        />
                        {" "}Email notifications when a comment is created
                    </label>
                </Util.Col>
            )}

            <Util.Hr />
        </Page>
    );
};