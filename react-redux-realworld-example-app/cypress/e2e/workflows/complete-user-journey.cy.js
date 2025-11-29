describe('Complete User Journeys', () => {
  it('should complete new user registration and article creation flow', () => {
    const timestamp = Date.now();
    const username = `newuser${timestamp}`;
    const email = `newuser${timestamp}@example.com`;

    // 1. Register
    cy.visit('/register');
    cy.get('input[placeholder="Username"]').type(username);
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    // 2. Should be logged in
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);

    // 3. Navigate to editor
    cy.contains('New Article').click();

    // 4. Create article
    cy.get('input[placeholder="Article Title"]').type('My First Article');
    cy.get('input[placeholder="What\'s this article about?"]').type('Learning Cypress');
    cy.get('textarea').type('This is my first article!');
    cy.get('input[placeholder="Enter tags"]').type('first{enter}');
    cy.get('button[type="submit"]').click();

    // 5. Article should be published
    cy.contains('My First Article').should('be.visible');

    // 6. Go to profile
    cy.get('.nav-link').contains(username).click();

    // 7. Article should appear in profile
    cy.contains('My First Article').should('be.visible');
  });

  it('should complete article interaction flow', () => {
    // Login
    cy.login('test@example.com', 'password');
    
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
            title: `Interaction Article ${Date.now()}`,
            description: 'Description',
            body: 'Body',
            tagList: ['interaction']
          }
        }
      }).then((response) => {
        const slug = response.body.article.slug;
        
        cy.visit('/');

        // Find and click the article
        cy.contains('Interaction Article').click();

        // Favorite the article
        cy.get('.btn').contains('Favorite').click();
        cy.wait(1000);

        // Add a comment
        const comment = `Great article! ${Date.now()}`;
        cy.get('textarea[placeholder="Write a comment..."]').type(comment);
        cy.contains('Post Comment').click();

        // Comment should appear
        cy.contains(comment).should('be.visible');

        // View author profile
        cy.get('.author').first().click();

        // Should be on author's profile
        cy.url().should('include', '/@');
      });
    });
  });

  it('should complete settings update flow', () => {
    cy.login('test@example.com', 'password');
    cy.visit('/');

    // Go to settings
    cy.contains('Settings').click();

    // Update profile
    cy.get('textarea[placeholder="Short bio about you"]').clear().type('E2E Testing Expert');
    cy.contains('Update Settings').click();

    // Should redirect to profile
    cy.url().should('include', '/@');
    cy.contains('E2E Testing Expert').should('be.visible');
  });
});
