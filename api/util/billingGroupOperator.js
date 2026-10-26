import { prisma } from "#prisma";

export const getBillingGroupOperatorGroupIds = async (userId, shopId) => {
  const memberships = await prisma.userBillingGroup.findMany({
    where: {
      userId,
      role: "BILLING_GROUP_OPERATOR",
      active: true,
      billingGroup: {
        is: {
          shopId,
          active: true,
        },
      },
    },
    select: {
      billingGroupId: true,
    },
  });

  return memberships.map(({ billingGroupId }) => billingGroupId);
};

export const hasBillingGroupOperatorAccess = async (
  userId,
  shopId,
  groupId,
) => {
  if (!groupId) return false;

  const membership = await prisma.userBillingGroup.findFirst({
    where: {
      userId,
      billingGroupId: groupId,
      role: "BILLING_GROUP_OPERATOR",
      active: true,
      billingGroup: {
        is: {
          shopId,
          active: true,
        },
      },
    },
    select: { id: true },
  });

  return Boolean(membership);
};

export const isShopOperator = (userShop, isGlobalAdmin) =>
  Boolean(
    isGlobalAdmin ||
      userShop?.accountType === "ADMIN" ||
      userShop?.accountType === "OPERATOR",
  );

export const canOperateJob = async (
  userId,
  shopId,
  userShop,
  isGlobalAdmin,
  groupId,
) =>
  isShopOperator(userShop, isGlobalAdmin) ||
  hasBillingGroupOperatorAccess(userId, shopId, groupId);

export const canAccessJob = async (
  userId,
  shopId,
  userShop,
  isGlobalAdmin,
  job,
) => {
  if (!isGlobalAdmin && !userShop) return false;

  if (
    await canOperateJob(
      userId,
      shopId,
      userShop,
      isGlobalAdmin,
      job.groupId,
    )
  ) {
    return true;
  }

  if (!job.groupId) return job.userId === userId;

  const membership = await prisma.userBillingGroup.findFirst({
    where: {
      userId,
      billingGroupId: job.groupId,
      active: true,
      billingGroup: {
        is: {
          shopId,
          active: true,
        },
      },
    },
    select: { id: true },
  });

  return Boolean(membership);
};
