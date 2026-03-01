import { describe, expect, it, vi } from "vitest";
import prisma from "#prisma";
import { LogType } from "@prisma/client";
import request from "supertest";
import { app } from "#index";
import { tc } from "#setup";
import postmark from "postmark";
import jwt from "jsonwebtoken";


const sendEmailMock = vi.fn().mockResolvedValue(true);

vi.mock("postmark", () => {
    return {
        ServerClient: vi.fn().mockImplementation(() => {
            return {
                sendEmail: sendEmailMock,
            };
        }),
    };
});


describe("/api/auth/forgotPassword", () => {
    describe("POST", () => {
        it("sends a user a reset link with postmark", async () => {
            const res = await request(app)
                .post("/api/auth/forgotPassword")
                .send({
                    email: tc.globalLocalUser.email,
                })

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
            expect(postmark.ServerClient).toHaveBeenCalled();
            expect(sendEmailMock).toHaveBeenCalled();
        });


        it("returns status 404, user does not exist", async () => { //token is invalid
            const res = await request(app)
                .post("/api/auth/forgotPassword")
                .send({
                    email: "nonExistentUser@email.com",
                });

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "User does not exist." });

        });


    });


    describe("PUT", () => { //this route is very similar to the put request in login, but we are passing a token 
        it("resets a users password with postmark", async () => {
            const res = await request(app)
                .put("/api/auth/forgotPassword")
                .send({
                    token: tc.token,
                    newPassword: "newPassword",
                })

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });

            const log = await prisma.logs.findFirst({
                where: {
                    type: LogType.USER_PASSWORD_CHANGE,
                    userId: tc.globalLocalUser.id,
                },
            });

            expect(log).toBeDefined();
            expect(log.type).toBe(LogType.USER_PASSWORD_CHANGE);
        });



        it("returns status 401, invalid token", async () => { //token is invalid
            const res = await request(app)
                .put("/api/auth/forgotPassword")
                .send({
                    newPassword: "newPassword",
                    token: "fake-token",
                });

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Invalid or expired link." });

        });


        it("returns status 401, user not found", async () => { //token is valid, but the user doesnt exist with that token
            const fakeUserId = "00000000-0000-0000-0000-000000000000";

            const token = jwt.sign( //we need the jwt token to verify successfully
                { id: fakeUserId },
                process.env.JWT_SECRET
            );
            const res = await request(app)
                .put("/api/auth/forgotPassword")
                .send({
                    token: token,
                    newPassword: "newPassword",
                });

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Invalid or expired link." });

        });


    });
});

