import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { z } from "zod";

const settingsSchema = z.object({
    emailJobCreated: z.boolean(),
    emailCommentCreated: z.boolean(),
});

const DEFAULT_SETTINGS = {
    emailJobCreated: true,
    emailCommentCreated: true,
};

export const get = [
    verifyAuth,
    async (req, res) => {
        const { userId } = req.params;

        if (req.user.id !== userId && !req.user.admin) {
            return res
                .status(403)
                .json({ error: "Forbidden: cannot access another user's settings." });
        }

        try {
            const settings = await prisma.userNotificationSettings.upsert({
                where: { userId },
                create: {
                    userId,
                    ...DEFAULT_SETTINGS,
                },
                update: {},
            });

            return res.json({ settings });
        } catch (e) {
            console.error("[notification-settings GET]", e);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
];

export const put = [
    verifyAuth,
    async (req, res) => {
        const { userId } = req.params;

        if (req.user.id !== userId && !req.user.admin) {
            return res
                .status(403)
                .json({ error: "Forbidden: cannot modify another user's settings." });
        }

        const validationResult = settingsSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                error: "Invalid data",
                issues: validationResult.error.format(),
            });
        }

        const { emailJobCreated, emailCommentCreated } = validationResult.data;

        try {
            const settings = await prisma.userNotificationSettings.upsert({
                where: { userId },
                create: {
                    userId,
                    emailJobCreated,
                    emailCommentCreated,
                },
                update: {
                    emailJobCreated,
                    emailCommentCreated,
                },
            });

            return res.json({ settings });
        } catch (e) {
            console.error("[notification-settings PUT]", e);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
];