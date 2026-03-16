import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";

describe("/shop/[shopId]/groups/[groupId]", () => {
  it("returns the billing group balance in the group payload", async () => {
    const group = await prisma.billingGroup.create({
      data: {
        shopId: tc.shop.id,
        title: "Group Detail Balance Test",
        users: {
          create: {
            userId: tc.user.id,
            role: "MEMBER",
          },
        },
      },
    });

    await prisma.ledgerItem.createMany({
      data: [
        {
          shopId: tc.shop.id,
          billingGroupId: group.id,
          type: "MANUAL_DEPOSIT",
          value: 80,
        },
        {
          shopId: tc.shop.id,
          billingGroupId: group.id,
          type: "MANUAL_REDUCTION",
          value: -15,
        },
      ],
    });

    const res = await request(app)
      .get(`/api/shop/${tc.shop.id}/groups/${group.id}`)
      .set(...(await gt()))
      .send();

    expect(res.status).toBe(200);
    expect(res.body.group.balance).toBe(65);
  });
});
