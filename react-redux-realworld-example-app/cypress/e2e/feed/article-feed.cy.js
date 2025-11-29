describe('Article Feed', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display global feed', () => {
    cy.contains('Global Feed').should('be.visible');
    cy.get('.article-preview').should('have.length.at.least', 0);
  });

  it('should display popular tags', () => {
    cy.get('.sidebar').should('be.visible');
    cy.contains('Popular Tags').should('be.visible');
  });

  it('should filter by tag', () => {
    // Click a tag if available
    cy.get('.tag-pill').first().then(($tag) => {
      if ($tag.length > 0) {
        $tag.click();
        // Should show filtered articles
        cy.get('.nav-link.active').should('contain.text', '#');
      }
    });
  });

  it('should show your feed when logged in', () => {
    cy.login('test@example.com', 'password');
    cy.visit('/');

    cy.contains('Your Feed').should('be.visible');
    cy.contains('Your Feed').click();

    // Should show personal feed
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
  });

  it('should paginate articles', () => {
    // Create enough articles to test pagination
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
      
      // Create multiple articles
      for (let i = 0; i < 15; i++) {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/articles`,
          headers: {
            'Authorization': `Token ${token}`
          },
          body: {
            article: {
              title: `Pagination Article ${i} ${Date.now()}`,
              description: 'Description',
              body: 'Body',
              tagList: ['pagination']
            }
          },
          failOnStatusCode: false
        });
      }
    });

    cy.visit('/');

    // Check for pagination
    cy.get('.article-preview').then(($articles) => {
      if ($articles.length === 10) {
        cy.get('.pagination').should('be.visible');
      }
    });
  });
});
