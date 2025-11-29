package common

import (
	"bytes"
	"errors"
	"time"

	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestConnectingDatabase(t *testing.T) {
	asserts := assert.New(t)
	db := Init()
	// Test create & close DB
	_, err := os.Stat("./../gorm.db")
	asserts.NoError(err, "Db should exist")
	asserts.NoError(db.DB().Ping(), "Db should be able to ping")

	// Test get a connecting from connection pools
	connection := GetDB()
	asserts.NoError(connection.DB().Ping(), "Db should be able to ping")
	db.Close()

	// Test DB exceptions
	os.Chmod("./../gorm.db", 0000)
	db = Init()
	asserts.Error(db.DB().Ping(), "Db should not be able to ping")
	db.Close()
	os.Chmod("./../gorm.db", 0644)
}

func TestConnectingTestDatabase(t *testing.T) {
	asserts := assert.New(t)
	// Test create & close DB
	db := TestDBInit()
	_, err := os.Stat("./../gorm_test.db")
	asserts.NoError(err, "Db should exist")
	asserts.NoError(db.DB().Ping(), "Db should be able to ping")
	db.Close()

	// Test testDB exceptions
	os.Chmod("./../gorm_test.db", 0000)
	db = TestDBInit()
	_, err = os.Stat("./../gorm_test.db")
	asserts.NoError(err, "Db should exist")
	asserts.Error(db.DB().Ping(), "Db should not be able to ping")
	os.Chmod("./../gorm_test.db", 0644)

	// Test close delete DB
	TestDBFree(db)
	_, err = os.Stat("./../gorm_test.db")

	asserts.Error(err, "Db should not exist")
}

func TestRandString(t *testing.T) {
	asserts := assert.New(t)

	var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	str := RandString(0)
	asserts.Equal(str, "", "length should be ''")

	str = RandString(10)
	asserts.Equal(len(str), 10, "length should be 10")
	for _, ch := range str {
		asserts.Contains(letters, ch, "char should be a-z|A-Z|0-9")
	}
}

func TestGenToken(t *testing.T) {
	asserts := assert.New(t)

	token := GenToken(2)

	asserts.IsType(token, string("token"), "token type should be string")
	asserts.Len(token, 115, "JWT's length should be 115")
}

func TestNewValidatorError(t *testing.T) {
	asserts := assert.New(t)

	type Login struct {
		Username string `form:"username" json:"username" binding:"required,alphanum,min=4,max=255"`
		Password string `form:"password" json:"password" binding:"required,min=8,max=255"`
	}

	var requestTests = []struct {
		bodyData       string
		expectedCode   int
		responseRegexg string
		msg            string
	}{
		{
			`{"username": "wangzitian0","password": "0123456789"}`,
			http.StatusOK,
			`{"status":"you are logged in"}`,
			"valid data and should return StatusCreated",
		},
		{
			`{"username": "wangzitian0","password": "01234567866"}`,
			http.StatusUnauthorized,
			`{"errors":{"user":"wrong username or password"}}`,
			"wrong login status should return StatusUnauthorized",
		},
		{
			`{"username": "wangzitian0","password": "0122"}`,
			http.StatusUnprocessableEntity,
			`{"errors":{"Password":"{min: 8}"}}`,
			"invalid password of too short and should return StatusUnprocessableEntity",
		},
		{
			`{"username": "_wangzitian0","password": "0123456789"}`,
			http.StatusUnprocessableEntity,
			`{"errors":{"Username":"{key: alphanum}"}}`,
			"invalid username of non alphanum and should return StatusUnprocessableEntity",
		},
	}

	r := gin.Default()

	r.POST("/login", func(c *gin.Context) {
		var json Login
		if err := Bind(c, &json); err == nil {
			if json.Username == "wangzitian0" && json.Password == "0123456789" {
				c.JSON(http.StatusOK, gin.H{"status": "you are logged in"})
			} else {
				c.JSON(http.StatusUnauthorized, NewError("user", errors.New("wrong username or password")))
			}
		} else {
			c.JSON(http.StatusUnprocessableEntity, NewValidatorError(err))
		}
	})

	for _, testData := range requestTests {
		bodyData := testData.bodyData
		req, err := http.NewRequest("POST", "/login", bytes.NewBufferString(bodyData))
		req.Header.Set("Content-Type", "application/json")
		asserts.NoError(err)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		asserts.Equal(testData.expectedCode, w.Code, "Response Status - "+testData.msg)
		asserts.Regexp(testData.responseRegexg, w.Body.String(), "Response Content - "+testData.msg)
	}
}

func TestNewError(t *testing.T) {
	assert := assert.New(t)

	db := TestDBInit()
	type NotExist struct {
		heheda string
	}
	db.AutoMigrate(NotExist{})

	commenError := NewError("database", db.Find(NotExist{heheda: "heheda"}).Error)
	assert.IsType(commenError, commenError, "commenError should have right type")
	assert.Equal(map[string]interface{}(map[string]interface{}{"database": "no such table: not_exists"}),
		commenError.Errors, "commenError should have right error info")
}

// ==================== ADDITIONAL TESTS ====================

// Test 1: JWT Token Generation with Different User IDs
func TestJWTTokenGenerationWithDifferentUserIDs(t *testing.T) {
	asserts := assert.New(t)

	// Test with user ID 1
	token1 := GenToken(1)
	asserts.NotEmpty(token1, "Token for user ID 1 should not be empty")
	asserts.True(len(token1) > 100, "Token length should be greater than 100")

	// Test with user ID 2
	token2 := GenToken(2)
	asserts.NotEmpty(token2, "Token for user ID 2 should not be empty")
	asserts.True(len(token2) > 100, "Token length should be greater than 100")

	// Test with user ID 100
	token100 := GenToken(100)
	asserts.NotEmpty(token100, "Token for user ID 100 should not be empty")
	asserts.True(len(token100) > 100, "Token length should be greater than 100")

	// Tokens should be different for different user IDs
	asserts.NotEqual(token1, token2, "Tokens for different users should be different")
	asserts.NotEqual(token1, token100, "Tokens for different users should be different")
	asserts.NotEqual(token2, token100, "Tokens for different users should be different")
}

// Test 2: JWT Token Expiration
func TestJWTTokenExpiration(t *testing.T) {
	asserts := assert.New(t)

	// Generate a token
	token := GenToken(1)
	asserts.NotEmpty(token, "Token should be generated")

	// Parse the token to check expiration
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(NBSecretPassword), nil
	})

	asserts.NoError(err, "Token should be parsable")
	asserts.True(parsedToken.Valid, "Token should be valid")

	// Check claims
	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	asserts.True(ok, "Claims should be extractable")

	// Check if expiration exists
	exp, exists := claims["exp"]
	asserts.True(exists, "Expiration should exist in claims")

	// Check if expiration is in the future
	expTime := int64(exp.(float64))
	asserts.True(time.Now().Unix() < expTime, "Token should not be expired")

	// Check if expiration is approximately 24 hours from now
	expectedExp := time.Now().Add(time.Hour * 24).Unix()
	asserts.InDelta(expectedExp, expTime, 10, "Expiration should be approximately 24 hours from now")
}

// Test 3: JWT Token Invalid Signature
func TestJWTTokenInvalidSignature(t *testing.T) {
	asserts := assert.New(t)

	// Generate a valid token
	token := GenToken(1)
	asserts.NotEmpty(token, "Token should be generated")

	// Try to parse with wrong secret
	wrongSecret := "WrongSecretPassword"
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(wrongSecret), nil
	})

	// Should have error due to invalid signature
	asserts.Error(err, "Token parsing with wrong secret should fail")
	asserts.False(parsedToken.Valid, "Parsed token should not be valid with wrong secret")
}

// Test 4: Test RandString with Various Lengths
func TestRandStringVariousLengths(t *testing.T) {
	asserts := assert.New(t)

	// Test with length 0
	str0 := RandString(0)
	asserts.Empty(str0, "Length 0 should return empty string")

	// Test with length 1
	str1 := RandString(1)
	asserts.Equal(1, len(str1), "Length should be 1")

	// Test with length 50
	str50 := RandString(50)
	asserts.Equal(50, len(str50), "Length should be 50")

	// Test with length 100
	str100 := RandString(100)
	asserts.Equal(100, len(str100), "Length should be 100")

	// Test that random strings are different
	str1a := RandString(20)
	str1b := RandString(20)
	// They might occasionally be the same due to randomness, but very unlikely
	// So we just test they both have the right length
	asserts.Equal(20, len(str1a), "First random string should have length 20")
	asserts.Equal(20, len(str1b), "Second random string should have length 20")
}

// Test 5: Test NewError with Different Error Types
func TestNewErrorWithDifferentTypes(t *testing.T) {
	asserts := assert.New(t)

	// Test with database error
	dbErr := NewError("database", errors.New("connection failed"))
	asserts.NotNil(dbErr.Errors, "Errors map should not be nil")
	asserts.Equal("connection failed", dbErr.Errors["database"], "Error message should match")

	// Test with validation error
	validationErr := NewError("validation", errors.New("invalid input"))
	asserts.Equal("invalid input", validationErr.Errors["validation"], "Validation error should match")

	// Test with auth error
	authErr := NewError("auth", errors.New("unauthorized access"))
	asserts.Equal("unauthorized access", authErr.Errors["auth"], "Auth error should match")
}

// Test 6: Test JWT Token Contains Correct User ID
func TestJWTTokenContainsCorrectUserID(t *testing.T) {
	asserts := assert.New(t)

	// Test with different user IDs
	testUserIDs := []uint{1, 5, 10, 999, 123456}

	for _, userID := range testUserIDs {
		token := GenToken(userID)
		asserts.NotEmpty(token, "Token should be generated")

		// Parse token and verify user ID
		parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
			return []byte(NBSecretPassword), nil
		})

		asserts.NoError(err, "Token should be parsable")
		claims, ok := parsedToken.Claims.(jwt.MapClaims)
		asserts.True(ok, "Claims should be extractable")

		// Get ID from claims and convert to uint
		idFloat, exists := claims["id"]
		asserts.True(exists, "ID should exist in claims")

		extractedID := uint(idFloat.(float64))
		asserts.Equal(userID, extractedID, "User ID in token should match original")
	}
}

// Test 7: Test CommonError Structure
func TestCommonErrorStructure(t *testing.T) {
	asserts := assert.New(t)

	// Create a CommonError
	err := CommonError{}
	err.Errors = make(map[string]interface{})
	err.Errors["field1"] = "error1"
	err.Errors["field2"] = "error2"

	asserts.Equal(2, len(err.Errors), "Should have 2 errors")
	asserts.Equal("error1", err.Errors["field1"], "Field1 error should match")
	asserts.Equal("error2", err.Errors["field2"], "Field2 error should match")
}
