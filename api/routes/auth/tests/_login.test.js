import { describe, expect, it } from "vitest";
import prisma from "#prisma";
import { LogType } from "@prisma/client";
import request from "supertest";
import { app } from "#index";
import { tc } from "#setup";

describe("/api/auth/login", () => {
    describe("POST", () => {
        it("enables a user to login", async () => { //test standard login
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: tc.globalLocalUser.email,
                    password: "TestPassword",
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("token");
            const log = await prisma.logs.findFirst({
                where: {
                    type: LogType.USER_LOGIN_LOCAL,
                    userId: tc.globalLocalUser.id,
                },
            });

            expect(log).toBeDefined();
        });
        it("returns status 401, no password field exists in the db", async () => { //tests the fact that user doesnt have a password field i.e (SSO)
            const res = await request(app)
                .post("/api/auth/login")
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
            expect(log.type).toBe(LogType.USER_LOGIN_FAILURE);
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

        });
        it("returns status 401, no user exists in the db", async () => { //tests a random email or person not in the db
            const res = await request(app)
                .post("/api/auth/login")
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
            expect(log.type).toBe(LogType.USER_LOGIN_FAILURE);
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

        });

        it("returns status 401, passwords dont match", async () => { //tests a password doesnt match what is in the db
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: tc.globalLocalUser.email,
                    password: "passwordNotMatch",
                });


            const log = await prisma.logs.findFirst({
                where: {
                    type: LogType.USER_LOGIN_FAILURE,
                    userId: tc.globalLocalUser.id,
                },
            });

            expect(log).toBeDefined();
            expect(log.type).toBe(LogType.USER_LOGIN_FAILURE);
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

        });

    });



        describe("PUT", () => {
            it("resets a users password", async () => { //tests the fact that there is a password in the globalLocalUser
                const res = await request(app)
                    .put("/api/auth/login")
                    .send({
                        userId: tc.globalLocalUser.id,
                        password: "newPassword",
                    });
                expect(res.status).toBe(200);
                expect(res.body).toEqual({ success: true });

                //get the user
                const User = await prisma.user.findUnique({
                    where: { id: tc.globalLocalUser.id },
                });

                expect(User.password).toBeDefined();

                //check the logs
                const log = await prisma.logs.findFirst({
                    where: {
                        type: LogType.USER_PASSWORD_CHANGE,
                        userId: tc.globalLocalUser.id,
                    },
                });

                expect(log).toBeDefined();
                expect(log.type).toBe(LogType.USER_PASSWORD_CHANGE);

            });

            it("returns status 401, no user exists", async () => { //tests the fact that we dont have the user in our db
                const res = await request(app)
                    .put("/api/auth/login")
                    .send({
                        userId: "nonExistentUser",
                        password: "newPassword",
                    });

                expect(res.status).toBe(401);
                expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

            });



            
            it("returns status 401, no password field exisits in the db", async () => { //tests the fact that user doesnt have a password field i.e (SSO)
                const res = await request(app)
                    .put("/api/auth/login")
                    .send({
                        userId: tc.globalUser.id, //we can just use the globalUser because this has no password attribute and should throw an error.
                        password: "newPassword",
                    });

                expect(res.status).toBe(401);
                expect(res.body).toEqual({ error: "Invalid credentials or SSO required" });

            });

        });


    

});
