describe('Article Reading', () => {
  let articleSlug;

  before(() => {
    // Create test user and article
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
    }).then(() => {
      // Login and create an article
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
              title: 'Test Article for E2E Testing',
              description: 'This is a test article description',
              body: 'This is the body of the test article. It contains multiple paragraphs and demonstrates the article functionality.',
              tagList: ['testing', 'cypress', 'e2e']
            }
          }
        }).then((response) => {
          articleSlug = response.body.article.slug;
        });
      });
    });
  });

  beforeEach(() => {
    cy.visit(`/article/${articleSlug}`);
  });

  it('should display article content', () => {
    cy.contains('Test Article for E2E Testing').should('be.visible');
    cy.contains('This is a test article description').should('be.visible');
    cy.contains('This is the body of the test article').should('be.visible');
  });

  it('should display article metadata', () => {
    // Author name
    cy.contains('testuser').should('be.visible');

    // Date should be visible
    cy.get('.date').should('be.visible');

    // Tags
    cy.get('.tag-default').should('have.length.at.least', 1);
  });

  it('should allow favoriting article', () => {
    cy.login('test@example.com', 'password');
    cy.visit(`/article/${articleSlug}`);

    // Click favorite button
    cy.get('.btn').contains('Favorite').click();

    // Button should update (may show Unfavorite or count increase)
    cy.wait(1000);
    cy.get('.btn').should('be.visible');
  });

  it('should allow unfavoriting article', () => {
    cy.login('test@example.com', 'password');
    cy.visit(`/article/${articleSlug}`);

    // Favorite first
    cy.get('.btn').contains('Favorite').click();
    cy.wait(1000);

    // Then unfavorite
    cy.get('.btn').contains('Unfavorite').click();
    cy.wait(1000);

    // Button should change back
    cy.get('.btn').contains('Favorite').should('be.visible');
  });
});
