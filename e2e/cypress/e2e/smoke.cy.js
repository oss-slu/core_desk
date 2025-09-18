describe("Smoke", () => {
  it("loads the app and API is healthy", () => {
    cy.visit("/");
    // Adjust selectors/text to your app
    cy.contains(/welcome|home|app/i).should("exist");
    cy.request("/api/health").its("status").should("eq", 200);
  });
});
