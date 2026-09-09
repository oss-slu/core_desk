import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "#prisma-client";
import { z } from "zod";

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

    const comment = await prisma.jobComment.create({
      data: {
        message,
        userId: req.user.id,
        jobId,
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.COMMENT_CREATED,
        userId: req.user.id,
        shopId,
        jobId,
        commentId: comment.id,
        message,
      },
    });

    console.log("Email Sent! - mock");

    /* - When you uncomment this don't forget to remove the comment for importing postmark!!!

    const { name: shopName } = await prisma.shop.findFirst({
        where: {
          id: shopId,
        }
      });

    const operators = await prisma.userShop.findMany({
      where: {
        shopId: shopId,
        accountType: 'OPERATOR',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    
    let emails = [];
    for (const operator of operators) {
      const jobLog = await prisma.logs.findFirst({
        where: {
          shopId: shopId,
          userId: operator.user.id,
          jobId: jobId,
        }
      });

      jobLog && emails.push(operator.user.email);
    }

    if (!emails.includes(req.user.email)) {
      emails.push(req.user.email);
    }

    client.sendEmail({
      "From": `${process.env.POSTMARK_FROM_EMAIL}`, 
      "To": `${emails.join(',')}`,
      "Subject": `Comment created on job ${job.title} and shop ${shopName}`,
      "HtmlBody": `The comment "${message}" was created on the job ${job.title} and shop ${shopName}`, 
      "TextBody": `The comment "${message}" was created on the job ${job.title} and shop ${shopName}`,
      "MessageStream": "outbound"
    }); 

    */

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
