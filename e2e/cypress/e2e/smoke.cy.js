describe("Smoke", () => {
  beforeEach(() => {
    // Reset DB via Prisma task running in Cypress Node process
    cy.task("db:reset");
  });

  it("loads the app and API is healthy", () => {
    cy.visit("/");
    // Adjust selectors/text to your app
    cy.contains(/welcome|home|app/i).should("exist");
    // API serves /health
    cy.request("/health").its("status").should("eq", 200);
  });

  it("can create a user fixture directly in DB", async () => {
    const user = await cy.task("db:createUser", {
      email: "e2e@example.com",
      firstName: "E2E",
      lastName: "Test",
    });

    const users = await cy.task("db:findAllUsers");

    cy.log(users);
  });
});
