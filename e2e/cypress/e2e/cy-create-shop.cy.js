describe("Create Shop", () => {
  beforeEach(() => {
    // Reset DB via Prisma task running in Cypress Node process
    cy.task("db:reset");
  });

  it("loads the app", () => {
    // Create user and pre-authenticate before first visit to avoid
    // any unauthenticated redirects that might touch cross-origin frames.
    cy.task("db:createUser", {
      email: "e2e@example.com",
      firstName: "E2E",
      lastName: "Test",
      admin: true,
    })
      .then((user) => cy.authenticateUser(user.id))
      .then((jwt) => {
        cy.visit("/", {
          onBeforeLoad(win) {
            win.localStorage.setItem("token", jwt);
          },
        });
      });

    cy.wait(250);
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
    cy.wait(250);
    cy.screenshot("created-shop");
  });
});
