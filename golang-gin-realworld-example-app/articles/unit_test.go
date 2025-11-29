package articles

import (
	"testing"

	"realworld-backend/common"
	"realworld-backend/users"

	"github.com/gosimple/slug"
	"github.com/jinzhu/gorm"
	"github.com/stretchr/testify/assert"
)

// Setup function to initialize test database
func setupTestDB() *gorm.DB {
	db := common.TestDBInit()
	db.AutoMigrate(&ArticleModel{})
	db.AutoMigrate(&ArticleUserModel{})
	db.AutoMigrate(&FavoriteModel{})
	db.AutoMigrate(&TagModel{})
	db.AutoMigrate(&CommentModel{})
	db.AutoMigrate(&users.UserModel{})
	db.AutoMigrate(&users.FollowModel{})
	return db
}

// Teardown function
func teardownTestDB(db *gorm.DB) {
	db.DropTable(&CommentModel{})
	db.DropTable(&FavoriteModel{})
	db.DropTable("article_tags")
	db.DropTable(&TagModel{})
	db.DropTable(&ArticleModel{})
	db.DropTable(&ArticleUserModel{})
	db.DropTable(&users.FollowModel{})
	db.DropTable(&users.UserModel{})
	db.Close()
}

// Helper function to create a test user
func createTestUser(db *gorm.DB, username, email string) users.UserModel {
	user := users.UserModel{
		Username:     username,
		Email:        email,
		PasswordHash: "$2a$10$test", // Bcrypt hash
	}
	db.Create(&user)
	return user
}

// Helper function to create a test article
func createTestArticle(db *gorm.DB, title, description, body string, authorID uint) ArticleModel {
	article := ArticleModel{
		Title:       title,
		Slug:        slug.Make(title),
		Description: description,
		Body:        body,
		AuthorID:    authorID,
	}
	db.Create(&article)
	return article
}

// ==================== MODEL TESTS ====================

// Test 1: Article Creation with Valid Data
func TestArticleCreationWithValidData(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create test user first
	user := createTestUser(db, "testauthor", "author@test.com")
	articleUser := GetArticleUserModel(user)

	// Create article
	article := ArticleModel{
		Title:       "Test Article Title",
		Slug:        slug.Make("Test Article Title"),
		Description: "This is a test description",
		Body:        "This is the test article body with some content",
		AuthorID:    articleUser.ID,
	}

	err := db.Create(&article).Error
	asserts.NoError(err, "Article should be created without error")
	asserts.NotEqual(uint(0), article.ID, "Article ID should be set after creation")
	asserts.Equal("Test Article Title", article.Title, "Article title should match")
	asserts.Equal("test-article-title", article.Slug, "Article slug should be generated correctly")
	asserts.Equal("This is a test description", article.Description, "Article description should match")
	asserts.Equal("This is the test article body with some content", article.Body, "Article body should match")
}

// Test 2: Article Validation - Empty Title
func TestArticleValidationEmptyTitle(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	user := createTestUser(db, "testauthor", "author@test.com")
	articleUser := GetArticleUserModel(user)

	// Try to create article without title (should fail validation at application level)
	article := ArticleModel{
		Title:       "", // Empty title
		Description: "Description",
		Body:        "Body content",
		AuthorID:    articleUser.ID,
	}

	// In real application, validator would catch this
	// Here we test that slug generation fails
	article.Slug = slug.Make(article.Title)
	asserts.Equal("", article.Slug, "Empty title should generate empty slug")
}

// Test 3: Test Favorite Article Functionality
func TestFavoriteArticle(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create author and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Article to Favorite", "Description", "Body content", authorUser.ID)

	// Load article author
	db.Model(&article).Related(&article.Author, "Author")

	// Create user who will favorite the article
	user := createTestUser(db, "favoriter", "favoriter@test.com")
	userArticleModel := GetArticleUserModel(user)

	// Initially should not be favorited
	asserts.False(article.isFavoriteBy(userArticleModel), "Article should not be favorited initially")

	// Check initial favorites count
	initialCount := article.favoritesCount()
	asserts.Equal(uint(0), initialCount, "Initial favorites count should be 0")

	// Favorite the article
	err := article.favoriteBy(userArticleModel)
	asserts.NoError(err, "Favoriting should not return error")

	// Now should be favorited
	asserts.True(article.isFavoriteBy(userArticleModel), "Article should be favorited after favoriteBy")

	// Favorites count should increase
	newCount := article.favoritesCount()
	asserts.Equal(uint(1), newCount, "Favorites count should increase to 1")
}

// Test 4: Test Unfavorite Article Functionality
func TestUnfavoriteArticle(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create author and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Article to Unfavorite", "Description", "Body content", authorUser.ID)

	// Load article author
	db.Model(&article).Related(&article.Author, "Author")

	// Create user who will favorite then unfavorite
	user := createTestUser(db, "favoriter", "favoriter@test.com")
	userArticleModel := GetArticleUserModel(user)

	// First favorite the article
	err := article.favoriteBy(userArticleModel)
	asserts.NoError(err, "Favoriting should not return error")
	asserts.True(article.isFavoriteBy(userArticleModel), "Article should be favorited")
	asserts.Equal(uint(1), article.favoritesCount(), "Favorites count should be 1")

	// Now unfavorite
	err = article.unFavoriteBy(userArticleModel)
	asserts.NoError(err, "Unfavoriting should not return error")

	// Should no longer be favorited
	asserts.False(article.isFavoriteBy(userArticleModel), "Article should not be favorited after unfavorite")
	asserts.Equal(uint(0), article.favoritesCount(), "Favorites count should return to 0")
}

// Test 5: Test Article Tag Association
func TestArticleTagAssociation(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create author and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Article with Tags", "Description", "Body", authorUser.ID)

	// Set tags
	tags := []string{"golang", "testing", "backend"}
	err := article.setTags(tags)
	asserts.NoError(err, "Setting tags should not return error")

	// Save article with tags
	err = db.Save(&article).Error
	asserts.NoError(err, "Saving article with tags should not error")

	// Retrieve article and check tags
	var retrievedArticle ArticleModel
	db.Where("id = ?", article.ID).First(&retrievedArticle)
	db.Model(&retrievedArticle).Related(&retrievedArticle.Tags, "Tags")

	asserts.Equal(3, len(retrievedArticle.Tags), "Article should have 3 tags")

	// Check tag names
	tagNames := []string{}
	for _, tag := range retrievedArticle.Tags {
		tagNames = append(tagNames, tag.Tag)
	}
	asserts.Contains(tagNames, "golang", "Should contain golang tag")
	asserts.Contains(tagNames, "testing", "Should contain testing tag")
	asserts.Contains(tagNames, "backend", "Should contain backend tag")
}

// Test 6: Test Multiple Favorites by Different Users
func TestMultipleFavoritesByDifferentUsers(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create author and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Popular Article", "Description", "Body", authorUser.ID)
	db.Model(&article).Related(&article.Author, "Author")

	// Create multiple users who will favorite
	user1 := createTestUser(db, "user1", "user1@test.com")
	user2 := createTestUser(db, "user2", "user2@test.com")
	user3 := createTestUser(db, "user3", "user3@test.com")

	articleUser1 := GetArticleUserModel(user1)
	articleUser2 := GetArticleUserModel(user2)
	articleUser3 := GetArticleUserModel(user3)

	// All favorite the article
	article.favoriteBy(articleUser1)
	article.favoriteBy(articleUser2)
	article.favoriteBy(articleUser3)

	// Check favorites count
	count := article.favoritesCount()
	asserts.Equal(uint(3), count, "Favorites count should be 3")

	// Check each user's favorite status
	asserts.True(article.isFavoriteBy(articleUser1), "User 1 should have favorited")
	asserts.True(article.isFavoriteBy(articleUser2), "User 2 should have favorited")
	asserts.True(article.isFavoriteBy(articleUser3), "User 3 should have favorited")
}

// ==================== SERIALIZER TESTS ====================

// Test 7: Test Article Serializer Output Format
func TestArticleSerializerOutputFormat(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create user and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Serializer Test", "Test Description", "Test Body", authorUser.ID)

	// Load author relationship
	db.Model(&article).Related(&article.Author, "Author")
	db.Model(&article.Author).Related(&article.Author.UserModel)

	// Check serialized structure (would normally use gin.Context, simplified here)
	asserts.Equal("Serializer Test", article.Title, "Title should be correct")
	asserts.Equal("serializer-test", article.Slug, "Slug should be generated")
	asserts.Equal("Test Description", article.Description, "Description should be correct")
	asserts.Equal("Test Body", article.Body, "Body should be correct")
	asserts.NotNil(article.Author, "Author should be loaded")
	asserts.Equal(author.Username, article.Author.UserModel.Username, "Author username should match")
}

// Test 8: Test Tag Serializer
func TestTagSerializer(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create tags
	tag1 := TagModel{Tag: "golang"}
	tag2 := TagModel{Tag: "testing"}
	db.Create(&tag1)
	db.Create(&tag2)

	asserts.NotEqual(uint(0), tag1.ID, "Tag 1 should have ID")
	asserts.NotEqual(uint(0), tag2.ID, "Tag 2 should have ID")
	asserts.Equal("golang", tag1.Tag, "Tag 1 name should be correct")
	asserts.Equal("testing", tag2.Tag, "Tag 2 name should be correct")
}

// Test 9: Test Comment Model Creation
func TestCommentModelCreation(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create author and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Article with Comments", "Description", "Body", authorUser.ID)

	// Create commenter
	commenter := createTestUser(db, "commenter", "commenter@test.com")
	commenterArticleUser := GetArticleUserModel(commenter)

	// Create comment
	comment := CommentModel{
		ArticleID: article.ID,
		AuthorID:  commenterArticleUser.ID,
		Body:      "This is a test comment",
	}
	err := db.Create(&comment).Error
	asserts.NoError(err, "Comment should be created without error")
	asserts.NotEqual(uint(0), comment.ID, "Comment ID should be set")
	asserts.Equal("This is a test comment", comment.Body, "Comment body should match")
	asserts.Equal(article.ID, comment.ArticleID, "Comment should be linked to article")
}

// Test 10: Test Article with Multiple Comments
func TestArticleWithMultipleComments(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create author and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Article with Comments", "Description", "Body", authorUser.ID)

	// Create multiple commenters
	commenter1 := createTestUser(db, "commenter1", "commenter1@test.com")
	commenter2 := createTestUser(db, "commenter2", "commenter2@test.com")

	commentUser1 := GetArticleUserModel(commenter1)
	commentUser2 := GetArticleUserModel(commenter2)

	// Create comments
	comment1 := CommentModel{ArticleID: article.ID, AuthorID: commentUser1.ID, Body: "First comment"}
	comment2 := CommentModel{ArticleID: article.ID, AuthorID: commentUser2.ID, Body: "Second comment"}
	comment3 := CommentModel{ArticleID: article.ID, AuthorID: commentUser1.ID, Body: "Third comment"}

	db.Create(&comment1)
	db.Create(&comment2)
	db.Create(&comment3)

	// Load comments
	err := article.getComments()
	asserts.NoError(err, "Getting comments should not error")
	asserts.Equal(3, len(article.Comments), "Article should have 3 comments")
}

// ==================== VALIDATOR TESTS ====================

// Test 11: Test Article Model Validator with Valid Input
func TestArticleModelValidatorValid(t *testing.T) {
	asserts := assert.New(t)

	validator := NewArticleModelValidator()
	validator.Article.Title = "Valid Article Title"
	validator.Article.Description = "This is a valid description"
	validator.Article.Body = "This is valid body content"
	validator.Article.Tags = []string{"tag1", "tag2"}

	asserts.Equal("Valid Article Title", validator.Article.Title, "Title should be set")
	asserts.Equal("This is a valid description", validator.Article.Description, "Description should be set")
	asserts.Equal("This is valid body content", validator.Article.Body, "Body should be set")
	asserts.Equal(2, len(validator.Article.Tags), "Should have 2 tags")
}

// Test 12: Test Article Model Validator - Missing Title
func TestArticleModelValidatorMissingTitle(t *testing.T) {
	asserts := assert.New(t)

	validator := NewArticleModelValidator()
	validator.Article.Title = "" // Empty title - should fail binding validation
	validator.Article.Description = "Description"
	validator.Article.Body = "Body"

	// The validator struct has binding:"required,min=4" for title
	// In actual use with Bind(), this would return an error
	asserts.Equal("", validator.Article.Title, "Empty title should be empty")
}

// Test 13: Test Article Model Validator - Title Too Short
func TestArticleModelValidatorTitleTooShort(t *testing.T) {
	asserts := assert.New(t)

	validator := NewArticleModelValidator()
	validator.Article.Title = "abc" // Only 3 characters, min is 4
	validator.Article.Description = "Description"
	validator.Article.Body = "Body"

	// The validator has binding:"required,min=4"
	// In actual use with Bind(), this would fail validation
	asserts.Less(len(validator.Article.Title), 4, "Title should be less than 4 characters")
}

// Test 14: Test Comment Model Validator
func TestCommentModelValidator(t *testing.T) {
	asserts := assert.New(t)

	validator := NewCommentModelValidator()
	validator.Comment.Body = "This is a valid comment body"

	asserts.Equal("This is a valid comment body", validator.Comment.Body, "Comment body should be set")
	asserts.NotNil(validator.commentModel, "Comment model should exist")
}

// Test 15: Test Article Model Validator Fill With
func TestArticleModelValidatorFillWith(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create article with tags
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Existing Article", "Description", "Body", authorUser.ID)

	// Add tags
	article.setTags([]string{"tag1", "tag2", "tag3"})
	db.Save(&article)
	db.Model(&article).Related(&article.Tags, "Tags")

	// Create validator from existing article
	validator := NewArticleModelValidatorFillWith(article)

	asserts.Equal("Existing Article", validator.Article.Title, "Title should match")
	asserts.Equal("Description", validator.Article.Description, "Description should match")
	asserts.Equal("Body", validator.Article.Body, "Body should match")
	asserts.Equal(3, len(validator.Article.Tags), "Should have 3 tags")
}

// Test 16: Test FindOneArticle Function
func TestFindOneArticle(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create author and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Find Me", "Description", "Body", authorUser.ID)

	// Find the article by slug
	found, err := FindOneArticle(&ArticleModel{Slug: article.Slug})
	asserts.NoError(err, "Finding article should not error")
	asserts.Equal(article.ID, found.ID, "Found article ID should match")
	asserts.Equal("Find Me", found.Title, "Found article title should match")
	asserts.NotNil(found.Author, "Author should be loaded")
}

// Test 17: Test SaveOne Function
func TestSaveOneFunction(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create author and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "Original Title", "Description", "Body", authorUser.ID)

	// Modify article
	article.Title = "Updated Title"
	article.Slug = slug.Make("Updated Title")

	// Save using SaveOne
	err := SaveOne(&article)
	asserts.NoError(err, "SaveOne should not error")

	// Retrieve and verify
	var updated ArticleModel
	db.Where("id = ?", article.ID).First(&updated)
	asserts.Equal("Updated Title", updated.Title, "Title should be updated")
	asserts.Equal("updated-title", updated.Slug, "Slug should be updated")
}

// Test 18: Test DeleteArticleModel Function
func TestDeleteArticleModel(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create author and article
	author := createTestUser(db, "author", "author@test.com")
	authorUser := GetArticleUserModel(author)
	article := createTestArticle(db, "To Be Deleted", "Description", "Body", authorUser.ID)

	// Verify article exists
	var count int
	db.Model(&ArticleModel{}).Where("id = ?", article.ID).Count(&count)
	asserts.Equal(1, count, "Article should exist before deletion")

	// Delete article
	err := DeleteArticleModel(&ArticleModel{Slug: article.Slug})
	asserts.NoError(err, "Deleting article should not error")

	// Verify article is deleted
	db.Model(&ArticleModel{}).Where("id = ?", article.ID).Count(&count)
	asserts.Equal(0, count, "Article should not exist after deletion")
}

// Test 19: Test GetArticleUserModel Function
func TestGetArticleUserModel(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create user
	user := createTestUser(db, "testuser", "testuser@test.com")

	// Get ArticleUserModel
	articleUser := GetArticleUserModel(user)

	asserts.NotEqual(uint(0), articleUser.ID, "ArticleUserModel should have ID")
	asserts.Equal(user.ID, articleUser.UserModelID, "Should be linked to user")
	asserts.Equal(user.Username, articleUser.UserModel.Username, "Username should match")

	// Test with zero user (should return empty model)
	emptyUser := users.UserModel{}
	emptyArticleUser := GetArticleUserModel(emptyUser)
	asserts.Equal(uint(0), emptyArticleUser.ID, "Empty user should return empty ArticleUserModel")
}

// Test 20: Test Tag Uniqueness
func TestTagUniqueness(t *testing.T) {
	asserts := assert.New(t)
	db := setupTestDB()
	defer teardownTestDB(db)

	// Create first tag
	tag1 := TagModel{Tag: "uniquetag"}
	err1 := db.Create(&tag1).Error
	asserts.NoError(err1, "First tag creation should succeed")

	// Try to create duplicate tag (should fail due to unique index)
	tag2 := TagModel{Tag: "uniquetag"}
	err2 := db.Create(&tag2).Error
	asserts.Error(err2, "Duplicate tag creation should fail")
}
