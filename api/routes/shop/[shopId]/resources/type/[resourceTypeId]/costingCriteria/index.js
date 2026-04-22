import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { CostingCriterionType } from "#prisma-client";
import {
  RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
  validateCostingCriteria,
} from "../../../../../../../util/costingCriteria.js";
import { z } from "zod";

const criterionSchema = z.object({
  id: z.string().optional(),
  key: z.nativeEnum(CostingCriterionType),
  label: z.string().min(1),
  enabled: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
});

const criteriaSchema = z.object({
  criteria: z.array(criterionSchema).min(1),
});

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, resourceTypeId } = req.params;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      if (
        !req.user.admin &&
        userShop.accountType !== "ADMIN" &&
        userShop.accountType !== "OPERATOR"
      ) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const resourceType = await prisma.resourceType.findFirst({
        where: {
          id: resourceTypeId,
          shopId,
          active: true,
        },
        include: RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
      });

      if (!resourceType) {
        return res.status(404).json({ error: "Resource type not found" });
      }

      const parsedBody = criteriaSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          error: "Invalid data",
          issues: parsedBody.error.format(),
        });
      }

      const criteriaWithOrder = [...parsedBody.data.criteria].sort(
        (a, b) => a.displayOrder - b.displayOrder
      );

      const validationError = validateCostingCriteria(
        criteriaWithOrder,
        resourceType.costingMode
      );

      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const updatedResourceType = await prisma.$transaction(async (tx) => {
        await tx.resourceTypeCostingCriterion.deleteMany({
          where: {
            resourceTypeId,
          },
        });

        await tx.resourceTypeCostingCriterion.createMany({
          data: criteriaWithOrder.map((criterion) => ({
            resourceTypeId,
            key: criterion.key,
            label: criterion.label,
            enabled: criterion.enabled,
            displayOrder: criterion.displayOrder,
          })),
        });

        return tx.resourceType.findFirst({
          where: {
            id: resourceTypeId,
          },
          include: RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
        });
      });

      return res.json({ resourceType: updatedResourceType });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];
