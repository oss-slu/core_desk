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
      .then((jwt) => localStorage.setItem("token", jwt))
      .visit("/");

    cy.contains("Shops").click();
    cy.screenshot("shops-page");

    cy.contains("Create Shop").click();
    cy.screenshot("create-shop");

    cy.get('input[placeholder="e.g. South Campus Shop"]').type(
      "Test Shop Name"
    );
    cy.get('input[placeholder="e.g. 24 N Grand Blvd"]').type("123 Main St.");
    cy.get('input[placeholder="e.g. shop@slu.edu"]').type("test@example.com");

    cy.screenshot("create-shop-inputs");
    cy.contains("Submit").click();

    cy.timeout(1000);
    cy.screenshot("created-shop");
  });
});
