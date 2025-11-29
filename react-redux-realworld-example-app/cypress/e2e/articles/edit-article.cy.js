describe('Article Editing', () => {
  let articleSlug;

  beforeEach(() => {
    // Login and create article for each test
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
      window.localStorage.setItem('jwt', token);
      
      const timestamp = Date.now();
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/articles`,
        headers: {
          'Authorization': `Token ${token}`
        },
        body: {
          article: {
            title: `Editable Article ${timestamp}`,
            description: 'Description to edit',
            body: 'Body to edit',
            tagList: ['edit', 'test']
          }
        }
      }).then((response) => {
        articleSlug = response.body.article.slug;
        cy.visit(`/article/${articleSlug}`);
      });
    });
  });

  it('should show edit button for own article', () => {
    cy.contains('Edit Article').should('be.visible');
  });

  it('should navigate to editor when clicking edit', () => {
    cy.contains('Edit Article').click();
    cy.url().should('include', '/editor/');
  });

  it('should pre-populate editor with article data', () => {
    cy.contains('Edit Article').click();

    cy.get('input[placeholder="Article Title"]').should('have.value', 'Editable Article');
    cy.get('input[placeholder="What\'s this article about?"]').should('have.value', 'Description to edit');
    cy.get('textarea').should('contain.value', 'Body to edit');
  });

  it('should successfully update article', () => {
    cy.contains('Edit Article').click();

    // Modify content
    cy.get('input[placeholder="Article Title"]').clear().type('Updated Title');
    cy.get('textarea').clear().type('Updated body content');
    cy.get('button[type="submit"]').click();

    // Should show updated content
    cy.contains('Updated Title').should('be.visible');
    cy.contains('Updated body content').should('be.visible');
  });

  it('should successfully delete article', () => {
    cy.contains('Delete Article').click();

    // Should redirect to home
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
  });
});
