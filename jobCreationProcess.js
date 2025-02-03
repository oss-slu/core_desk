import { describe, it, expect } from 'vitest';

describe("Successful job creation", () => {

    //Sucessful job creation
    it("Should return 200 OK with job details (ID, title, description, created date)", async () => {
        const res = await request(app)
            .get("/api/job")
            .set(...(await gt()))
            .send();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProprty("jobId");
        expect(res.body.title).toBe("title");
        expect(res.description).toBe("description");
        expect(res.body).toHaveProperty("createdDate");
    });
    
    //Missing Required Fields
    it("Should return 400 bad request with relevant error message", async () => {
        const res = await request(app)
            .get("/api/job")
            .send({});

        expect(res.status).toBe(400);
        expecct(res.status).toBe("Required Field Missing");
    });

    //Invalid Data
    it("Should return 400 Bad Request with a specific error message", async () => {
        const res = await request(app)
            .get("/api/job")
            .send();

        expect(res.status).toBe(400);
        expect(res.status).toBe("Data not valid");
    });

    //Unauthorized User 
    it("Should return 401 Unauthorized with error message", async () => {
        const res = await request(app)
          .get("/api/users")
          .set(...(await gt()))
          .send();
  
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Unauthorized" });
        expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
});

    //Job Data Consistency
    it("Job ID and data should match request and be valid in system", async () => {
        const res = await request(app)
        .get("/api/job")
        .set(...(await gt()))
        .send();

        expect(res.body).toMatchSnapshot();
    });
});
