describe("Create Shop", () => {
  beforeEach(() => {
    // Reset DB via Prisma task running in Cypress Node process
    cy.task("db:reset");
  });

  it("loads the app", () => {
    cy.visit("/")
      .task("db:createUser", {
        email: "e2e@example.com",
        firstName: "E2E",
        lastName: "Test",
        admin: true,
      })
      .then((user) => cy.authenticateUser(user.id))
      .then((jwt) => cy.task("log", jwt));
  });
});
