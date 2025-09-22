describe("Create Shop", () => {
  beforeEach(() => {
    // Reset DB via Prisma task running in Cypress Node process
    cy.task("db:reset");
  });

  it("creates a very minimal shop", () => {
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

  it("creates a shop with number, description, and color", () => {
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
    cy.get('input[placeholder="e.g. 123-456-7890"]').type("1234567890");
    cy.get('input[placeholder="e.g. Description"]').type("Test Description");
    cy.get('input[placeholder="e.g. purple"]').type("PURPLE");

    cy.screenshot("create-shop-inputs");
    cy.contains("Submit").click();
    cy.wait(250);
    cy.screenshot("created-shop");
  });

  it("gracefully handles an invalid color", () => {
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
    cy.get('input[placeholder="e.g. 123-456-7890"]').type("1234567890");
    cy.get('input[placeholder="e.g. Description"]').type("Test Description");
    cy.get('input[placeholder="e.g. purple"]').type("NOT_A_COLOR");

    cy.screenshot("create-shop-inputs");
    cy.contains("Submit").click();
    cy.wait(250);
    cy.screenshot("created-shop");
  });

  it("gracefully handles no data being supplied", () => {
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
    cy.contains("Create Shop").click();

    cy.contains("Submit").should("be.disabled");
  });

  describe("Stress Test", () => {
    Cypress._.times(15, () => {
      it("[stress test] creates a very minimal shop", () => {
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
        cy.get('input[placeholder="e.g. 24 N Grand Blvd"]').type(
          "123 Main St."
        );
        cy.get('input[placeholder="e.g. shop@slu.edu"]').type(
          "test@example.com"
        );

        cy.screenshot("create-shop-inputs");
        cy.contains("Submit").click();
        cy.wait(250);
        cy.screenshot("created-shop");
      });
    });
  });
});
