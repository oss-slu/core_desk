import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { CostingMode, LogType } from "#prisma-client";
import {
  getDefaultCostingCriteria,
  RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
} from "../../../../../util/costingCriteria.js";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().min(1, "Resouce must have title"),
  shopId: z.string().min(1, "Shop must have ID"),
  costingMode: z.nativeEnum(CostingMode).optional(),
});

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId: shopId,
        active: true,
      },
    });

    if (!userShop) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    const resourceTypes = await prisma.resourceType.findMany({
      where: {
        shopId: shopId,
        active: true,
      },
      include: {
        ...RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
        resources: {
          where: {
            active: true,
          },
          include: {
            images: {
              where: {
                active: true,
              },
              include: {
                file: true,
              },
            },
          },
        },
      },
    });

    res.json({ resourceTypes });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId: shopId,
        active: true,
      },
    });

    if (!userShop) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR"
    ) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    const validationResult = resourceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid data",
        issues: validationResult.error.format(),
      });
    }

    const validatedData = validationResult.data;

    const costingModeToUse =
      validatedData.costingMode ||
      CostingMode.CALCULATE_WITH_RESOURCE_AND_MATERIAL;

    const resourceType = await prisma.resourceType.create({
      data: {
        title: validatedData.title,
        shopId: validatedData.shopId,
        costingMode: costingModeToUse,
        costingCriteria: {
          createMany: {
            data: getDefaultCostingCriteria(costingModeToUse),
          },
        },
      },
      include: RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
    });

    await prisma.logs.create({
      data: {
        type: LogType.RESOURCE_TYPE_CREATED,
        userId: req.user.id,
        shopId,
        resourceTypeId: resourceType.id,
        to: JSON.stringify(resourceType),
      },
    });

    res.json({ resourceType });
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId: shopId,
        active: true,
      },
    });

    if (!userShop) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR"
    ) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    const { title, resourceTypeId: id, costingMode } = req.body;

    const parsedCostingMode = z
      .nativeEnum(CostingMode)
      .optional()
      .safeParse(costingMode);

    if (!parsedCostingMode.success) {
      return res.status(400).json({
        error: "Invalid costing mode",
        issues: parsedCostingMode.error.format(),
      });
    }

    const resourceType = await prisma.resourceType.update({
      where: {
        id,
      },
      data: {
        title,
        costingMode: parsedCostingMode.data,
      },
      include: RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
    });

    await prisma.logs.create({
      data: {
        type: LogType.RESOURCE_TYPE_MODIFIED,
        userId: req.user.id,
        shopId,
        resourceTypeId: resourceType.id,
        to: JSON.stringify(resourceType),
      },
    });

    res.json({ resourceType });
  },
];
