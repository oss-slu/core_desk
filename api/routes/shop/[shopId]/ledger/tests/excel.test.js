import { describe, expect, it } from "vitest";
import request from "supertest";
import ExcelJS from "exceljs";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";
import { generateBillingExcelWorkbook } from "../../../../../util/docgen/excel.js";

const parseBuffer = (res, callback) => {
  const chunks = [];
  res.on("data", (chunk) => {
    chunks.push(chunk);
  });
  res.on("end", () => {
    callback(null, Buffer.concat(chunks));
  });
};

const createGroup = async (title = "Test Billing Group") =>
  prisma.billingGroup.create({
    data: {
      shopId: tc.shop.id,
      title,
      users: {
        create: {
          userId: tc.user.id,
          role: "MEMBER",
        },
      },
    },
  });

describe("/shop/[shopId]/ledger/excel", () => {
  describe("GET - Date filtering, inclusion, and exclusion", () => {
    it("exports valid Excel workbook with qualifying jobs and excludes non-qualifying jobs", async () => {
      const group = await createGroup("Engineering Labs");

      // Other shop to test shop isolation
      const otherShop = await prisma.shop.create({
        data: {
          name: "Other Shop",
        },
      });

      // 1. Qualifying job with billing group within date range
      const groupJob = await prisma.job.create({
        data: {
          title: "Group Qualifying Job",
          shopId: tc.shop.id,
          userId: tc.user.id,
          groupId: group.id,
          finalized: true,
          finalizedAt: new Date("2026-03-10T10:00:00.000Z"),
          status: "COMPLETED",
          ledgerItems: {
            create: {
              shopId: tc.shop.id,
              userId: tc.user.id,
              billingGroupId: group.id,
              type: "JOB",
              value: -75.5,
            },
          },
        },
      });

      // 2. Qualifying job for individual user within date range
      const individualJob = await prisma.job.create({
        data: {
          title: "Individual User Job",
          shopId: tc.shop.id,
          userId: tc.targetUser.id,
          finalized: true,
          finalizedAt: new Date("2026-03-20T14:30:00.000Z"),
          status: "COMPLETED",
          ledgerItems: {
            create: {
              shopId: tc.shop.id,
              userId: tc.targetUser.id,
              type: "JOB",
              value: -42.0,
            },
          },
        },
      });

      // 3. Excluded job: finalized before date range
      await prisma.job.create({
        data: {
          title: "Too Early Job",
          shopId: tc.shop.id,
          userId: tc.user.id,
          finalized: true,
          finalizedAt: new Date("2026-02-28T23:59:59.000Z"),
          status: "COMPLETED",
          ledgerItems: {
            create: {
              shopId: tc.shop.id,
              userId: tc.user.id,
              type: "JOB",
              value: -10.0,
            },
          },
        },
      });

      // 4. Excluded job: finalized after date range
      await prisma.job.create({
        data: {
          title: "Too Late Job",
          shopId: tc.shop.id,
          userId: tc.user.id,
          finalized: true,
          finalizedAt: new Date("2026-04-01T00:00:01.000Z"),
          status: "COMPLETED",
          ledgerItems: {
            create: {
              shopId: tc.shop.id,
              userId: tc.user.id,
              type: "JOB",
              value: -15.0,
            },
          },
        },
      });

      // 5. Excluded job: not finalized
      await prisma.job.create({
        data: {
          title: "Unfinalized Job",
          shopId: tc.shop.id,
          userId: tc.user.id,
          finalized: false,
          status: "IN_PROGRESS",
        },
      });

      // 6. Excluded job: from another shop within same date range
      await prisma.job.create({
        data: {
          title: "Other Shop Job",
          shopId: otherShop.id,
          userId: tc.user.id,
          finalized: true,
          finalizedAt: new Date("2026-03-15T12:00:00.000Z"),
          status: "COMPLETED",
        },
      });

      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/ledger/excel?startDate=2026-03-01&endDate=2026-03-31`
        )
        .set(...(await gt({ sat: "ADMIN" })))
        .buffer(true)
        .parse(parseBuffer);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      expect(res.headers["content-disposition"]).toContain(
        `billing-export-${tc.shop.id}-2026-03-01-to-2026-03-31.xlsx`
      );

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(res.body);

      const sheetNames = workbook.worksheets.map((ws) => ws.name);
      expect(sheetNames[0]).toBe("All Print Jobs");
      expect(sheetNames[1]).toBe("Billing Group Totals");
      expect(sheetNames).toContain("Engineering Labs");
      expect(
        sheetNames.some(
          (name) =>
            name.includes("TARGET_TestFirstName TARGET_TestLas") ||
            name.includes("TARGET_TestFirstName TARGET_Tes")
        )
      ).toBe(true);

      // Verify Sheet 1: All Print Jobs
      const allJobsSheet = workbook.getWorksheet("All Print Jobs");
      expect(allJobsSheet).toBeDefined();

      // Check date range indicator
      const allJobsRows = allJobsSheet.getSheetValues();
      const stringifiedAllJobs = JSON.stringify(allJobsRows);
      expect(stringifiedAllJobs).toContain(
        "Date Range: 2026-03-01 to 2026-03-31"
      );
      expect(stringifiedAllJobs).toContain(groupJob.id);
      expect(stringifiedAllJobs).toContain(individualJob.id);
      expect(stringifiedAllJobs).not.toContain("Too Early Job");
      expect(stringifiedAllJobs).not.toContain("Too Late Job");
      expect(stringifiedAllJobs).not.toContain("Unfinalized Job");
      expect(stringifiedAllJobs).not.toContain("Other Shop Job");

      // Verify Sheet 2: Billing Group Totals
      const totalsSheet = workbook.getWorksheet("Billing Group Totals");
      expect(totalsSheet).toBeDefined();
      const stringifiedTotals = JSON.stringify(totalsSheet.getSheetValues());
      expect(stringifiedTotals).toContain(
        "Date Range: 2026-03-01 to 2026-03-31"
      );
      expect(stringifiedTotals).toContain("Engineering Labs");
      expect(stringifiedTotals).toContain(
        "TARGET_TestFirstName TARGET_TestLastName"
      );

      // Verify individual billing group sheets
      const groupSheet = workbook.getWorksheet("Engineering Labs");
      expect(groupSheet).toBeDefined();
      const stringifiedGroup = JSON.stringify(groupSheet.getSheetValues());
      expect(stringifiedGroup).toContain(groupJob.id);
      expect(stringifiedGroup).toContain("75.5");

      const individualTargetName = "TARGET_TestFirstName TARGET_TestLastName";
      const individualSheet =
        workbook.getWorksheet(individualTargetName) ||
        workbook.worksheets.find((ws) =>
          ws.name.includes("TARGET_TestFirstName")
        );
      expect(individualSheet).toBeDefined();
      const stringifiedIndividual = JSON.stringify(
        individualSheet.getSheetValues()
      );
      expect(stringifiedIndividual).toContain(individualJob.id);
      expect(stringifiedIndividual).toContain("42");
    });
  });

  describe("GET - Date validation and error handling", () => {
    it("returns 400 when startDate or endDate is missing", async () => {
      const resWithoutEnd = await request(app)
        .get(`/api/shop/${tc.shop.id}/ledger/excel?startDate=2026-03-01`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(resWithoutEnd.status).toBe(400);
      expect(resWithoutEnd.body.error).toMatch(/Valid start date and end date/);

      const resWithoutStart = await request(app)
        .get(`/api/shop/${tc.shop.id}/ledger/excel?endDate=2026-03-31`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(resWithoutStart.status).toBe(400);
      expect(resWithoutStart.body.error).toMatch(/Valid start date and end date/);
    });

    it("returns 400 for invalid date format", async () => {
      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/ledger/excel?startDate=03-01-2026&endDate=2026-03-31`
        )
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Valid start date and end date/);
    });

    it("returns 400 for non-existent calendar date", async () => {
      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/ledger/excel?startDate=2026-02-30&endDate=2026-03-31`
        )
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid date");
    });

    it("returns 400 when startDate is after endDate", async () => {
      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/ledger/excel?startDate=2026-03-31&endDate=2026-03-01`
        )
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        "Start date must be before or equal to end date"
      );
    });

    it("returns 403 for unauthorized non-staff user", async () => {
      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/ledger/excel?startDate=2026-03-01&endDate=2026-03-31`
        )
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/ledger/excel?startDate=2026-03-01&endDate=2026-03-31`
        )
        .send();

      expect(res.status).toBe(401);
    });
  });

  describe("generateBillingExcelWorkbook unit tests", () => {
    it("generates an Excel workbook with empty job list and date range", async () => {
      const workbook = await generateBillingExcelWorkbook([], {
        shopId: "shop123",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });

      expect(workbook).toBeInstanceOf(ExcelJS.Workbook);
      expect(workbook.worksheets).toHaveLength(2);
      expect(workbook.worksheets[0].name).toBe("All Print Jobs");
      expect(workbook.worksheets[1].name).toBe("Billing Group Totals");
    });

    it("properly separates multiple billing groups and individual users with sanitized sheet names", async () => {
      const jobs = [
        {
          id: "job-1",
          title: "Group 1 Job",
          userId: "user-1",
          groupId: "group-1",
          finalizedAt: new Date("2026-03-05"),
          calculatedCost: 15.0,
          user: { firstName: "Alice", lastName: "Smith" },
          group: { id: "group-1", title: "Robotics: Team/Special*Char" },
          items: [{}],
        },
        {
          id: "job-2",
          title: "Individual User Job",
          userId: "user-2",
          finalizedAt: new Date("2026-03-12"),
          calculatedCost: 25.5,
          user: { firstName: "Bob", lastName: "Jones" },
          items: [{}, {}],
        },
      ];

      const workbook = await generateBillingExcelWorkbook(jobs, {
        shopId: "shop123",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
      });

      expect(workbook.worksheets.length).toBe(4);
      const sheetNames = workbook.worksheets.map((s) => s.name);
      expect(sheetNames).toContain("All Print Jobs");
      expect(sheetNames).toContain("Billing Group Totals");
      expect(sheetNames).toContain("Robotics_ Team_Special_Char");
      expect(sheetNames).toContain("Bob Jones");
    });
  });
});
