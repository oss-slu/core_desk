import { describe, expect, it } from "vitest";
import { selectInvoiceCustomer } from "../docgen/invoice.js";

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
