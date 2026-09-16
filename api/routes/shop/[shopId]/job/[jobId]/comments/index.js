import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "#prisma-client";
import { z } from "zod";
import client from "#postmark";

const commentSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
});

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

    res.json({ comments });
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

    const { message } = validationResult.data;

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

        const operators = await prisma.userShop.findMany({
          where: {
            shopId: shopId,
            accountType: "OPERATOR",
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

        const emails = [];
        for (const operator of operators) {
          // Only notify operators who have interacted with this job
          const jobLog = await prisma.logs.findFirst({
            where: {
              shopId: shopId,
              userId: operator.user.id,
              jobId: jobId,
            },
          });

          if (jobLog) {
            const optsIn =
              operator.user.notificationSettings?.emailCommentCreated ?? true;
            if (optsIn && operator.user.email) {
              emails.push(operator.user.email);
            }
          }
        }

        // Include the commenter themselves if opted in
        const commenterSettings =
          await prisma.userNotificationSettings.findUnique({
            where: { userId: req.user.id },
            select: { emailCommentCreated: true },
          });
        const commenterOptsIn =
          commenterSettings?.emailCommentCreated ?? true;
        if (commenterOptsIn && !emails.includes(req.user.email)) {
          emails.push(req.user.email);
        }

        if (emails.length > 0) {
          await client.sendEmail({
            From: `${process.env.POSTMARK_FROM_EMAIL}`,
            To: emails.join(","),
            Subject: `Comment created on job ${job.title} in shop ${shopName}`,
            HtmlBody: `The comment <em>"${message}"</em> was created on the job <strong>${job.title}</strong> in shop <strong>${shopName}</strong>.`,
            TextBody: `The comment "${message}" was created on the job ${job.title} in shop ${shopName}.`,
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
