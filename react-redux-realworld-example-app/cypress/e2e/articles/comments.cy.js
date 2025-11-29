describe('Article Comments', () => {
  let articleSlug;

  before(() => {
    // Create article to test with
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
            title: 'Article with Comments',
            description: 'Testing comments',
            body: 'Comment testing article',
            tagList: ['comments']
          }
        }
      }).then((response) => {
        articleSlug = response.body.article.slug;
      });
    });
  });

  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit(`/article/${articleSlug}`);
  });

  it('should display comment form when logged in', () => {
    cy.get('textarea[placeholder="Write a comment..."]').should('be.visible');
    cy.contains('Post Comment').should('be.visible');
  });

  it('should add a comment successfully', () => {
    const commentText = `Test comment ${Date.now()}`;

    cy.get('textarea[placeholder="Write a comment..."]').type(commentText);
    cy.contains('Post Comment').click();

    // Comment should appear
    cy.contains(commentText).should('be.visible');
  });

  it('should display multiple comments', () => {
    cy.get('textarea').type('Comment 1{enter}');
    cy.contains('Post Comment').click();
    cy.wait(500);

    cy.reload();
    cy.get('textarea').type('Comment 2{enter}');
    cy.contains('Post Comment').click();

    cy.wait(500);
    cy.get('.card').should('have.length.at.least', 2);
  });

  it('should delete own comment', () => {
    const commentText = `Comment to delete ${Date.now()}`;

    cy.get('textarea').type(commentText);
    cy.contains('Post Comment').click();
    cy.wait(1000);

    // Find and click delete button for this comment
    cy.contains(commentText).parent().parent().find('.mod-options').click();

    // Comment should be removed
    cy.wait(500);
    cy.contains(commentText).should('not.exist');
  });
});
