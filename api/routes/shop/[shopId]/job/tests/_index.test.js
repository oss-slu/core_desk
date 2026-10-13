
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { LogType } from "#prisma-client";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";

describe("/shop/[shopId]/job", () => {
    describe("POST", () => {
        let findFirstSpy;
        let createLogsSpy;
        let originalUserShopFindFirst;

        beforeEach(async () => {
            // Preserve the original implementation for DB verification.
            originalUserShopFindFirst = prisma.userShop.findFirst.bind(
                prisma.userShop,
            );

            createLogsSpy = vi.spyOn(prisma.logs, "create");
            findFirstSpy = vi.spyOn(prisma.userShop, "findFirst");
        });

        afterEach(async () => {
            vi.restoreAllMocks();
        });

        it("allows job creation if a user exists on the shop", async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue({
                userId: "example-id",
                shopId: tc.shop.id,
                active: true,
            });

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send({
                    title: "JobCreationExample Title",
                    description: "JobCreationExample description",
                    dueDate: new Date(),
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("job");
            expect(res.body.job).toMatchObject({
                title: "JobCreationExample Title",
                description: "JobCreationExample description",
                shopId: expect.any(String),
                userId: expect.any(String),
                dueDate: expect.any(String),
            });

            expect(createLogsSpy).toHaveBeenCalledOnce();
            expect(createLogsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        type: LogType.JOB_CREATED,
                        user: { connect: { id: expect.any(String) } },
                        shop: { connect: { id: expect.any(String) } },
                        job: { connect: { id: expect.any(String) } },
                        to: expect.any(String),
                    }),
                }),
            );
        });

        it("denies job creation if a user doesn't exist on the shop", async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue(null);

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send({
                    title: "JobCreationExample Title",
                    description: "JobCreationExample description",
                    dueDate: new Date(),
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Unauthorized");
            expect(createLogsSpy).not.toHaveBeenCalled();
        });

        it("allows job creation on behalf of billing group if user is a shop admin", async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue({
                userId: "example-id",
                shopId: tc.shop.id,
                active: true,
                accountType: "ADMIN",
            });

            const group = await prisma.billingGroup.create({
                data: {
                    shopId: tc.shop.id,
                    title: "Billing Group Test Group",
                },
            });

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send({
                    title: "JobCreationExample Title",
                    description: "JobCreationExample description",
                    dueDate: new Date(),
                    billingGroupId: group.id,
                });

            expect(res.status).toBe(200);
            expect(res.body.job.groupId).toBe(group.id);
        });

        it("defaults due date to two weeks out when dueDate is not provided", async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue({
                userId: "example-id",
                shopId: tc.shop.id,
                active: true,
            });

            const expectedDueDate = new Date();
            expectedDueDate.setDate(expectedDueDate.getDate() + 14);
            expectedDueDate.setHours(0, 0, 0, 0);

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send({
                    title: "Job with default due date",
                    description: "Missing due date should be defaulted",
                });

            expect(res.status).toBe(200);
            expect(new Date(res.body.job.dueDate).toISOString()).toBe(
                expectedDueDate.toISOString(),
            );
        });

        it("creates a job for a new user who does not already exist", async () => {
            const adminUser = tc.user;

            findFirstSpy.mockImplementation(async (args) => {
                if (args?.where?.userId === adminUser.id) {
                    return {
                        id: "admin-usershop-id",
                        userId: adminUser.id,
                        shopId: tc.shop.id,
                        active: true,
                        accountType: "ADMIN",
                    };
                }
                return null;
            });

            const newEmail = `newuser_${Date.now()}@slu.edu`;
            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true, user: adminUser })))
                .send({
                    title: "Job for New User",
                    description: "Job description for new user",
                    dueDate: new Date(),
                    onBehalfOf: true,
                    onBehalfOfUserEmail: newEmail,
                    onBehalfOfUserFirstName: "New",
                    onBehalfOfUserLastName: "User",
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("job");
            expect(res.body.job.title).toBe("Job for New User");

            const createdUser = await prisma.user.findFirst({
                where: { email: newEmail },
            });
            expect(createdUser).not.toBeNull();
            expect(createdUser.firstName).toBe("New");
            expect(res.body.job.userId).toBe(createdUser.id);
        });

        it("creates a job for an existing user and adds them to the shop without creating a duplicate account", async () => {
            const adminUser = tc.user;
            const existingEmail = `existing_${Date.now()}@slu.edu`;

            const existingUser = await prisma.user.create({
                data: {
                    email: existingEmail,
                    firstName: "Existing",
                    lastName: "User",
                },
            });

            findFirstSpy.mockImplementation(async (args) => {
                if (args?.where?.userId === adminUser.id) {
                    return {
                        id: "admin-usershop-id",
                        userId: adminUser.id,
                        shopId: tc.shop.id,
                        active: true,
                        accountType: "ADMIN",
                    };
                }
                if (args?.where?.userId === existingUser.id) {
                    return null; // Not yet in shop.
                }
                return null;
            });

            const countBefore = await prisma.user.count({
                where: { email: existingEmail },
            });
            expect(countBefore).toBe(1);

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true, user: adminUser })))
                .send({
                    title: "Job for Existing User",
                    description: "Job description",
                    dueDate: new Date(),
                    onBehalfOf: true,
                    onBehalfOfUserEmail: existingEmail,
                    onBehalfOfUserFirstName: "Existing",
                    onBehalfOfUserLastName: "User",
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("job");
            expect(res.body.job.userId).toBe(existingUser.id);

            const countAfter = await prisma.user.count({
                where: { email: existingEmail },
            });
            expect(countAfter).toBe(1);

            // Use the original Prisma method to query the actual DB,
            // bypassing the mocked findFirst used by the route.
            const userShopRecord = await originalUserShopFindFirst({
                where: {
                    userId: existingUser.id,
                    shopId: tc.shop.id,
                    active: true,
                },
            });
            expect(userShopRecord).not.toBeNull();
        });

        it("creates a job for an existing user who is already in the shop without creating duplicate accounts", async () => {
            const adminUser = tc.user;
            const inShopEmail = `inshop_${Date.now()}@slu.edu`;

            const existingUser = await prisma.user.create({
                data: {
                    email: inShopEmail,
                    firstName: "InShop",
                    lastName: "User",
                },
            });

            await prisma.userShop.create({
                data: {
                    userId: existingUser.id,
                    shopId: tc.shop.id,
                    active: true,
                },
            });

            findFirstSpy.mockImplementation(async (args) => {
                if (args?.where?.userId === adminUser.id) {
                    return {
                        id: "admin-usershop-id",
                        userId: adminUser.id,
                        shopId: tc.shop.id,
                        active: true,
                        accountType: "ADMIN",
                    };
                }
                if (args?.where?.userId === existingUser.id) {
                    return {
                        id: "target-usershop-id",
                        userId: existingUser.id,
                        shopId: tc.shop.id,
                        active: true,
                    };
                }
                return null;
            });

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true, user: adminUser })))
                .send({
                    title: "Job for User Already in Shop",
                    description: "Job description",
                    dueDate: new Date(),
                    onBehalfOf: true,
                    onBehalfOfUserEmail: inShopEmail,
                });

            expect(res.status).toBe(200);
            expect(res.body.job.userId).toBe(existingUser.id);

            const count = await prisma.user.count({
                where: { email: inShopEmail },
            });
            expect(count).toBe(1);
        });

        it("returns an appropriate error message instead of crashing when an existing user cannot be added automatically to the shop", async () => {
            const operatorUser = tc.user;
            const externalEmail = `external_${Date.now()}@slu.edu`;

            const externalUser = await prisma.user.create({
                data: {
                    email: externalEmail,
                    firstName: "External",
                    lastName: "User",
                },
            });

            // The requester is an OPERATOR (not admin) and not global admin.
            findFirstSpy.mockImplementation(async (args) => {
                if (args?.where?.userId === operatorUser.id) {
                    return {
                        id: "operator-usershop-id",
                        userId: operatorUser.id,
                        shopId: tc.shop.id,
                        active: true,
                        accountType: "OPERATOR",
                    };
                }
                if (args?.where?.userId === externalUser.id) {
                    return null; // Not connected to shop.
                }
                return null;
            });

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: false, user: operatorUser })))
                .send({
                    title: "Job by Operator for External User",
                    description: "Should fail gracefully",
                    dueDate: new Date(),
                    onBehalfOf: true,
                    onBehalfOfUserEmail: externalEmail,
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe("User already exists");
            expect(res.body.message).toContain(
                "Global Admins can visit the general Users page to add the existing user to the shop",
            );
        });
    });
});
