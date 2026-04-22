import { describe, expect, it } from "vitest";
import {
  calculateTotalCostOfJob,
  selectInvoiceCustomer,
} from "../docgen/invoice.js";

describe("selectInvoiceCustomer", () => {
  it("prefers the billing group name and omits email", () => {
    expect(
      selectInvoiceCustomer({
        billingGroup: {
          title: "Department Billing",
        },
        payerAccount: {
          firstName: "Pay",
          lastName: "User",
          email: "payer@example.com",
        },
        requester: {
          firstName: "Request",
          lastName: "User",
          email: "requester@example.com",
        },
      })
    ).toEqual({
      name: "Department Billing",
      email: "",
    });
  });

  it("falls back to the payer account before the requester", () => {
    expect(
      selectInvoiceCustomer({
        payerAccount: {
          firstName: "Pay",
          lastName: "User",
          email: "payer@example.com",
        },
        requester: {
          firstName: "Request",
          lastName: "User",
          email: "requester@example.com",
        },
      })
    ).toEqual({
      name: "Pay User",
      email: "payer@example.com",
    });
  });

  it("falls back to the requester when there is no billing group or payer account", () => {
    expect(
      selectInvoiceCustomer({
        requester: {
          firstName: "Request",
          lastName: "User",
          email: "requester@example.com",
        },
      })
    ).toEqual({
      name: "Request User",
      email: "requester@example.com",
    });
  });
});

describe("calculateTotalCostOfJob", () => {
  it("includes resource and primary material charges when no secondary material is set", () => {
    expect(
      calculateTotalCostOfJob({
        additionalCostOverride: false,
        additionalCosts: [],
        items: [
          {
            qty: 1,
            unitQty: 1,
            timeQty: 5.633333333333333,
            materialQty: 165.68,
            resourceType: {
              costingMode: "CALCULATE_WITH_RESOURCE_AND_MATERIAL",
            },
            resource: {
              costPerUnit: 1.5,
              costPerTime: 0.6,
            },
            material: {
              costPerUnit: 0.03,
            },
            secondaryMaterial: null,
          },
        ],
      })
    ).toBeCloseTo(9.8504);
  });

  it("includes calculated additional costs when secondary material is omitted", () => {
    expect(
      calculateTotalCostOfJob({
        additionalCostOverride: false,
        items: [],
        additionalCosts: [
          {
            unitQty: 2,
            materialQty: 10,
            resourceType: {
              costingMode: "CALCULATE_WITH_RESOURCE_AND_MATERIAL",
            },
            resource: {
              costPerUnit: 4,
            },
            material: {
              costPerUnit: 0.5,
            },
            secondaryMaterial: null,
          },
        ],
      })
    ).toBeCloseTo(13);
  });
});
