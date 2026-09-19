import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "#prisma-client";
import { z } from "zod";
import client from "#postmark";

const commentSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  notifyUserIds: z.array(z.string()).optional().default([]),
  adminOverride: z.boolean().optional().default(false),
});

const escapeHtml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId } = req.params;
    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ message: "Shop not found" });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      return res.status(400).json({ message: "Job not found" });
    }

    const comments = await prisma.jobComment.findMany({
      where: {
        jobId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shops: {
              where: {
                shopId: shopId,
              },
              select: {
                accountTitle: true,
                accountType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const staffMembers = await prisma.userShop.findMany({
      where: {
        shopId,
        active: true,
        accountType: { in: ["ADMIN", "OPERATOR"] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            notificationSettings: {
              select: { emailCommentCreated: true },
            },
          },
        },
      },
    });

    const notifiableMap = new Map();
    for (const staff of staffMembers) {
      if (staff.user && staff.user.id !== req.user.id) {
        notifiableMap.set(staff.user.id, {
          id: staff.user.id,
          firstName: staff.user.firstName,
          lastName: staff.user.lastName,
          name: `${staff.user.firstName} ${staff.user.lastName}`.trim(),
          accountType: staff.accountType,
          emailCommentCreated:
            staff.user.notificationSettings?.emailCommentCreated ?? true,
        });
      }
    }

    if (job.userId && job.userId !== req.user.id && !notifiableMap.has(job.userId)) {
      const jobUserShop = await prisma.userShop.findFirst({
        where: {
          shopId,
          userId: job.userId,
          active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              notificationSettings: {
                select: { emailCommentCreated: true },
              },
            },
          },
        },
      });

      if (jobUserShop?.user) {
        notifiableMap.set(jobUserShop.user.id, {
          id: jobUserShop.user.id,
          firstName: jobUserShop.user.firstName,
          lastName: jobUserShop.user.lastName,
          name: `${jobUserShop.user.firstName} ${jobUserShop.user.lastName}`.trim(),
          accountType: jobUserShop.accountType,
          emailCommentCreated:
            jobUserShop.user.notificationSettings?.emailCommentCreated ?? true,
        });
      }
    }

    const notifiableUsers = Array.from(notifiableMap.values());

    res.json({ comments, notifiableUsers });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId } = req.params;
    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ message: "Shop not found" });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      return res.status(400).json({ message: "Job not found" });
    }

    const validationResult = commentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid data",
        issues: validationResult.error.format(),
      });
    }

    const { message, notifyUserIds, adminOverride } = validationResult.data;
    const isAdmin = Boolean(req.user.admin || userShop.accountType === "ADMIN");
    const canOverride = isAdmin && Boolean(adminOverride);

    await prisma.$transaction(async (tx) => {
      const newComment = await tx.jobComment.create({
        data: {
          message,
          userId: req.user.id,
          jobId,
        },
      });

      await tx.logs.create({
        data: {
          type: LogType.COMMENT_CREATED,
          userId: req.user.id,
          shopId,
          jobId,
          commentId: newComment.id,
          message,
        },
      });
    });

    // Send email notification (fire-and-forget — errors must not fail the request)
    (async () => {
      try {
        const { name: shopName } = await prisma.shop.findFirst({
          where: { id: shopId },
        });

        const emails = [];
        let overrideApplied = false;

        if (notifyUserIds && notifyUserIds.length > 0) {
          const targetUsers = await prisma.userShop.findMany({
            where: {
              shopId,
              active: true,
              userId: { in: notifyUserIds },
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  notificationSettings: {
                    select: { emailCommentCreated: true },
                  },
                },
              },
            },
          });

          for (const target of targetUsers) {
            if (!target.user || !target.user.email) continue;
            const optsIn =
              target.user.notificationSettings?.emailCommentCreated ?? true;
            if (optsIn) {
              emails.push(target.user.email);
            } else if (canOverride) {
              emails.push(target.user.email);
              overrideApplied = true;
            }
          }
        }

        const commenterName = `${req.user.firstName} ${req.user.lastName}`.trim();
        const safeCommenterName = escapeHtml(commenterName);
        const safeMessage = escapeHtml(message);
        const safeJobTitle = escapeHtml(job.title);
        const safeShopName = escapeHtml(shopName);

        const subject = overrideApplied
          ? `[Urgent / Admin Notice] Comment on job ${job.title} in shop ${shopName}`
          : `Comment created on job ${job.title} in shop ${shopName}`;

        const overrideBannerHtml = overrideApplied
          ? `<div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin-bottom: 15px; color: #856404;">
              <strong>Administrator Notice:</strong> This notification was prioritized by an administrator (${safeCommenterName}) and overrides notification preferences.
            </div>`
          : "";

        const overrideBannerText = overrideApplied
          ? `[ADMINISTRATOR NOTICE]: This notification was prioritized by an administrator (${commenterName}) and overrides notification preferences.\n\n`
          : "";

        if (emails.length > 0) {
          await client.sendEmail({
            From: process.env.POSTMARK_FROM_EMAIL,
            To: emails.join(","),
            Subject: subject,
            HtmlBody: `
              ${overrideBannerHtml}
              <p>
                <strong>${safeCommenterName}</strong> commented on the job
                <strong>${safeJobTitle}</strong> in shop
                <strong>${safeShopName}</strong>.
              </p>
              <p><strong>Comment:</strong></p>
              <p><em>"${safeMessage}"</em></p>
            `,
            TextBody: `${overrideBannerText}${commenterName} commented on the job ${job.title} in shop ${shopName}. Comment: "${message}" Shop: ${shopName}`,
            MessageStream: "outbound",
          });
        }
      } catch (emailErr) {
        console.error("[comments/post] Email notification failed:", emailErr);
      }
    })();

    const comments = await prisma.jobComment.findMany({
      where: {
        jobId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shops: {
              where: {
                shopId: shopId,
              },
              select: {
                accountTitle: true,
                accountType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ comments });
  },
];
