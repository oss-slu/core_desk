describe("Cyprus setup confirmation", () => {
  beforeEach(() => {
    // Reset DB via Prisma task running in Cypress Node process
    cy.task("db:reset");
  });

  it("loads the app", () => {
    cy.visit("/");
    // Adjust selectors/text to your app
    cy.contains("Welcome to SLU Open Project").should("exist");
  });

  it("can create a user fixture directly in DB sync", () => {
    cy.task("db:createUser", {
      email: "e2e@example.com",
      firstName: "E2E",
      lastName: "Test",
    });

    cy.task("db:findAllUsers").should((users) => {
      expect(users.some((u) => u.email === "e2e@example.com")).to.eq(true);
    });
  });
});
