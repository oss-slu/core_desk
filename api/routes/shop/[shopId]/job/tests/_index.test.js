import { describe, expect, it , vi, beforeAll, afterAll, beforeEach, afterEach} from "vitest";
import { LogType } from "@prisma/client";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";

describe("/shop/[shopId]/job", () => {
    describe("POST", () => {

        let shop;

        beforeAll(async () => {
            shop = await prisma.shop.create({
                data: {
                    name: "JobCreationTestShop",
                    description: "JobCreationTestShop description",
                    imageUrl: "https://example.com/image.png",
                    color: "RED",
                },
            });
        });

        afterAll(async () => {
            await prisma.shop.delete({
                where: {
                    id: shop.id
                }
            });
        });

        let findFirstSpy;
        let createLogsSpy;

        beforeEach(async () => {
            createLogsSpy = vi.spyOn(prisma.logs, "create");
            findFirstSpy = vi.spyOn(prisma.userShop, "findFirst");
        });

        afterEach(async () => {
            findFirstSpy.mockRestore();
            createLogsSpy.mockRestore();
        });
        
        it("allows job creation if a user exists on the shop"), async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue({
                userId: "example-id",
                shopId: shop.id,
                active: true,
            });
            
            const jobDueDate = new Date();

            const res = await request(app)
                .post(`/api/shop/${shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send({
                    title: "JobCreationExample Title",
                    description: "JobCreationExample description",
                    dueDate: jobDueDate,
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("job");
            expect(res.body.job).toMatchSnapshot({
                title: "JobCreationExample Title",
                description: "JobCreationExample description",
                shopId: shop.id,
                userId: "example-id",
                dueDate: jobDueDate,
            });
            
            expect(createLogsSpy).toHaveBeenCalledOnce();
            expect(createLogsSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: LogType.JOB_CREATED,
                userId: "example-id",
                shopId: shop.id,
                jobId: expect.any(String),
            }));
        }

        it("denies job creation if a user doesn't exist on the shop"), async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue(null);

            const res = await request(app)
                .post(`/api/shop/${shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send({
                    title: "JobCreationExample Title",
                    description: "JobCreationExample description",
                    dueDate: new Date(),
                });
            
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Unauthorized")
            expect(createLogsSpy).not.toHaveBeenCalled();
        }
    })
})