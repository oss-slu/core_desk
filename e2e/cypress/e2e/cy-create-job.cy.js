describe("Create Job", () => {
  beforeEach(() => {
    // Reset DB via Prisma task running in Cypress Node process
    cy.task("db:reset");

    // Create a shop
    cy.task("cy:createShop", "Test Shop");

    // Create user and pre-authenticate before first visit
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
  });

  it("creates a very minimal shop", () => {
    cy.wait(10000);
    /* ==== Generated with Cypress Studio ==== */
    cy.get('[href="/shops"]').click();
    cy.get('.card-body').click();
    cy.get('[href="/shops/cmfvryah00002o2sjs35ksvu0/jobs"]').click();
    cy.get('[style="display: flex; flex-flow: row; gap: 0px; justify-content: space-between; align-items: center;"] > .btn').click();
    cy.get('.modal-body > :nth-child(1) > :nth-child(1) > .form-control').clear('M');
    cy.get('.modal-body > :nth-child(1) > :nth-child(1) > .form-control').type('My new Job');
    cy.get(':nth-child(1) > :nth-child(2) > .form-control').clear('T');
    cy.get(':nth-child(1) > :nth-child(2) > .form-control').type('Test for my new job');
    cy.get(':nth-child(1) > :nth-child(3) > .form-control').click();
    cy.get('.modal-body > :nth-child(1)').click();
    cy.get('.modal-body > :nth-child(1) > .btn').click();
    /* ==== End Cypress Studio ==== */
  });
});
