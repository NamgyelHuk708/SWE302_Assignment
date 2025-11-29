describe('User Profile', () => {
  before(() => {
    // Ensure test user exists
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
    cy.login('test@example.com', 'password');
  });

  it('should view own profile', () => {
    cy.visit('/@testuser');

    cy.contains('testuser').should('be.visible');
    cy.contains('Edit Profile Settings').should('be.visible');
  });

  it('should display user articles', () => {
    // Create an article first
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/users/login`,
      body: {
        user: {
          email: 'test@example.com',
          password: 'password'
        }
      }
    }).then((loginRes) => {
      const token = loginRes.body.user.token;
      
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/articles`,
        headers: {
          'Authorization': `Token ${token}`
        },
        body: {
          article: {
            title: `Profile Article ${Date.now()}`,
            description: 'Description',
            body: 'Body',
            tagList: ['profile']
          }
        }
      });
    });

    cy.visit('/@testuser');

    cy.contains('My Articles').click();
    cy.contains('Profile Article').should('be.visible');
  });

  it('should display favorited articles', () => {
    cy.visit('/@testuser');

    cy.contains('Favorited Articles').click();
    // Should show favorited articles tab
    cy.url().should('include', 'favorites');
  });

  it('should update profile settings', () => {
    cy.visit('/settings');

    cy.get('textarea[placeholder="Short bio about you"]').clear().type('Updated bio');
    cy.contains('Update Settings').click();

    // Should redirect to profile
    cy.url().should('include', '/@testuser');
    cy.contains('Updated bio').should('be.visible');
  });
});
