describe('User Login', () => {
  before(() => {
    // Create a test user first
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/users`,
      body: {
        user: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password'
        }
      },
      failOnStatusCode: false
    });
  });

  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.contains('Sign in').should('be.visible');
    cy.get('input[placeholder="Email"]').should('be.visible');
    cy.get('input[placeholder="Password"]').should('be.visible');
  });

  it('should successfully login with valid credentials', () => {
    cy.get('input[placeholder="Email"]').type('test@example.com');
    cy.get('input[placeholder="Password"]').type('password');
    cy.get('button[type="submit"]').click();

    // Should redirect to home
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);

    // Should show user's name in header
    cy.get('.nav-link').contains('testuser').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[placeholder="Email"]').type('wrong@example.com');
    cy.get('input[placeholder="Password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message or remain on login page
    cy.wait(1000);
    cy.url().should('include', '/login');
  });

  it('should persist login after page refresh', () => {
    cy.get('input[placeholder="Email"]').type('test@example.com');
    cy.get('input[placeholder="Password"]').type('password');
    cy.get('button[type="submit"]').click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/`);

    // Refresh page
    cy.reload();

    // User should still be logged in
    cy.get('.nav-link').contains('testuser').should('be.visible');
  });

  it('should logout successfully', () => {
    // Login first
    cy.login('test@example.com', 'password');
    cy.visit('/');

    // Click settings and logout
    cy.contains('Settings').click();
    cy.contains('Or click here to logout').click();

    // Should redirect to home and show sign in link
    cy.contains('Sign in').should('be.visible');
  });
});
