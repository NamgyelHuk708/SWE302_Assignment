import authReducer from './auth';
import {
  LOGIN,
  REGISTER,
  LOGIN_PAGE_UNLOADED,
  REGISTER_PAGE_UNLOADED,
  ASYNC_START,
  UPDATE_FIELD_AUTH
} from '../constants/actionTypes';

describe('Auth Reducer', () => {
  
  const initialState = {};

  // Test 1: Returns initial state
  test('should return initial state', () => {
    expect(authReducer(undefined, {})).toEqual({});
  });

  // Test 2: Handle LOGIN action success
  test('handles LOGIN action on success', () => {
    const action = {
      type: LOGIN,
      error: false,
      payload: {
        user: {
          email: 'test@example.com',
          token: 'jwt-token-here',
          username: 'testuser'
        }
      }
    };

    const newState = authReducer(initialState, action);
    expect(newState.inProgress).toBe(false);
    expect(newState.errors).toBe(null);
  });

  // Test 3: Handle LOGIN action failure
  test('handles LOGIN action on error', () => {
    const action = {
      type: LOGIN,
      error: true,
      payload: {
        errors: {
          'email or password': ['is invalid']
        }
      }
    };

    const newState = authReducer(initialState, action);
    expect(newState.inProgress).toBe(false);
    expect(newState.errors).toEqual({ 'email or password': ['is invalid'] });
  });

  // Test 4: Handle REGISTER action success
  test('handles REGISTER action on success', () => {
    const action = {
      type: REGISTER,
      error: false,
      payload: {
        user: {
          email: 'newuser@example.com',
          token: 'new-jwt-token',
          username: 'newuser'
        }
      }
    };

    const newState = authReducer(initialState, action);
    expect(newState.inProgress).toBe(false);
    expect(newState.errors).toBe(null);
  });

  // Test 5: Handle REGISTER action failure
  test('handles REGISTER action on error', () => {
    const action = {
      type: REGISTER,
      error: true,
      payload: {
        errors: {
          email: ['has already been taken'],
          username: ['has already been taken']
        }
      }
    };

    const newState = authReducer(initialState, action);
    expect(newState.inProgress).toBe(false);
    expect(newState.errors).toEqual({
      email: ['has already been taken'],
      username: ['has already been taken']
    });
  });

  // Test 6: Handle LOGIN_PAGE_UNLOADED
  test('handles LOGIN_PAGE_UNLOADED action', () => {
    const currentState = {
      email: 'test@example.com',
      password: 'password123',
      errors: { email: ['is invalid'] }
    };

    const action = { type: LOGIN_PAGE_UNLOADED };
    const newState = authReducer(currentState, action);
    
    expect(newState).toEqual({});
  });

  // Test 7: Handle REGISTER_PAGE_UNLOADED
  test('handles REGISTER_PAGE_UNLOADED action', () => {
    const currentState = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const action = { type: REGISTER_PAGE_UNLOADED };
    const newState = authReducer(currentState, action);
    
    expect(newState).toEqual({});
  });

  // Test 8: Handle UPDATE_FIELD_AUTH for email
  test('handles UPDATE_FIELD_AUTH action for email', () => {
    const action = {
      type: UPDATE_FIELD_AUTH,
      key: 'email',
      value: 'newemail@example.com'
    };

    const newState = authReducer(initialState, action);
    expect(newState.email).toBe('newemail@example.com');
  });

  // Test 9: Handle UPDATE_FIELD_AUTH for password
  test('handles UPDATE_FIELD_AUTH action for password', () => {
    const action = {
      type: UPDATE_FIELD_AUTH,
      key: 'password',
      value: 'newpassword123'
    };

    const newState = authReducer(initialState, action);
    expect(newState.password).toBe('newpassword123');
  });

  // Test 10: Handle UPDATE_FIELD_AUTH for username
  test('handles UPDATE_FIELD_AUTH action for username', () => {
    const action = {
      type: UPDATE_FIELD_AUTH,
      key: 'username',
      value: 'newusername'
    };

    const newState = authReducer(initialState, action);
    expect(newState.username).toBe('newusername');
  });

  // Test 11: Handle ASYNC_START for LOGIN
  test('handles ASYNC_START action for LOGIN subtype', () => {
    const action = {
      type: ASYNC_START,
      subtype: LOGIN
    };

    const newState = authReducer(initialState, action);
    expect(newState.inProgress).toBe(true);
  });

  // Test 12: Handle ASYNC_START for REGISTER
  test('handles ASYNC_START action for REGISTER subtype', () => {
    const action = {
      type: ASYNC_START,
      subtype: REGISTER
    };

    const newState = authReducer(initialState, action);
    expect(newState.inProgress).toBe(true);
  });

  // Test 13: Preserve existing state when updating field
  test('preserves existing state when updating a field', () => {
    const currentState = {
      email: 'old@example.com',
      password: 'oldpass'
    };

    const action = {
      type: UPDATE_FIELD_AUTH,
      key: 'email',
      value: 'new@example.com'
    };

    const newState = authReducer(currentState, action);
    expect(newState.email).toBe('new@example.com');
    expect(newState.password).toBe('oldpass');
  });

  // Test 14: Handle LOGIN without errors in payload
  test('handles LOGIN action without errors when error flag is false', () => {
    const action = {
      type: LOGIN,
      error: false,
      payload: {
        user: { email: 'test@test.com', token: 'token' }
      }
    };

    const newState = authReducer(initialState, action);
    expect(newState.errors).toBe(null);
  });

});
