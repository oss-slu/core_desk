import { describe, expect, it } from "vitest";
import prisma from "#prisma";
import { LogType } from "@prisma/client";
import { prisma as mockPrisma } from "#mock-prisma";
import request from "supertest";
import { app } from "#index";
import { tc } from "#setup";
import { gt } from "#gt";

//forgotPassword.js
describe("/auth/forgotPassword/", () => {
    describe("GET", () => {
        it("returns a user's shop information to admins", async () => {
            const res = await request(app)
                .get(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}`)
                .set(...(await gt({ ga: true })))
                .send();

            expect(res.status).toBe(200);

            expect(res.body.userShop).toMatchSnapshot({
                id: expect.any(String),
                userId: expect.any(String),
                shopId: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                user: {
                    id: expect.any(String),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    isMe: true,
                },
            });
        });


    });
});


//login.js
describe("/auth/login/", () => {
    describe("PUT", () => {
        it("resets a users password", async () => { //tests the fact that there is a password in the globalLocalUser
            const res = await request(app)
                .put(`/api/login/`)
                .send({
                    userId: tc.globalLocalUser.id,
                    password: "newPassword",
                });
            expect(res.status).toBe(200);

            //get the user
            const User = await prisma.user.findUnique({
                where: { id: tc.globalLocalUser.id },
            });

            expect(User.password).toBeDefined();
            expect(User.password).not.toBe("TestPassword");
            expect(User.password).toBe("newPassword"); //might be overkill

            //check the logs
            const log = await prisma.logs.findFirst({
                where: { userId: tc.globalLocalUser.id },
            });

            expect(log).toBeDefined();

        });

        it("throws a 404 because no user exists", async () => { //tests the fact that we dont have the user in our db
            const res = await request(app)
                .put(`/api/login/`)
                .send({
                    userId: "nonExistentUser",
                    password: "newPassword",
                });

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

        });

        it("throws a 404 because no password field exisits in the db", async () => { //tests the fact that user doesnt have a password field i.e (SSO)
            const res = await request(app)
                .put(`/api/login/`)
                .send({
                    userId: tc.globalUser.id, //we can just use the globalUser because this has no password attribute and should throw an error.
                    password: "newPassword",
                });

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

        });

    });





    describe("POST", () => {
        it("emables a user to login", async () => {
            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}`)
                .set(...(await gt({ ga: true })))
                .send();

            expect(res.status).toBe(200);

            expect(res.body.userShop).toMatchSnapshot({
                id: expect.any(String),
                userId: expect.any(String),
                shopId: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                user: {
                    id: expect.any(String),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    isMe: true,
                },
            });
        });
        it("throws a 401 because no password field exists in the db", async () => { //tests the fact that user doesnt have a password field i.e (SSO)
            const res = await request(app)
                .post(`/api/login/`)
                .send({
                    email: tc.globalLocalUser.email, //we can just use the globalUser because this has no password attribute and should throw an error.
                    password: "password",
                });


            const log = await prisma.logs.findFirst({
                where: {
                type: LogType.USER_LOGIN_FAILURE,
                },
                orderBy: { createdAt: "desc" },
            });

            expect(log).toBeDefined();
            expect(log.message).toContain("Failed to login");

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

        });
        it("throws a 401 because no user exisits in the db", async () => { //tests a random email or person not in the db
            const res = await request(app)
                .post(`/api/login/`)
                .send({
                    email: "randomEmail@email.com", //user a random email
                    password: "password",
                });


            const log = await prisma.logs.findFirst({
                where: {
                type: LogType.USER_LOGIN_FAILURE,
                },
                orderBy: { createdAt: "desc" },
            });

            expect(log).toBeDefined();
            expect(log.message).toContain("Failed to login");

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

        });

        it("throws a 401 the passwords dont match", async () => { //tests a password doesnt match what is in the db
            const res = await request(app)
                .post(`/api/login/`)
                .send({
                    email: globalLocalUser.email, 
                    password: "passwordNotMatch",
                });


            const log = await prisma.logs.findFirst({
                where: {
                type: LogType.USER_LOGIN_FAILURE,
                },
                orderBy: { createdAt: "desc" },
            });

            expect(log).toBeDefined();
            expect(log.message).toContain("Failed to login");

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

        });


    });

});
