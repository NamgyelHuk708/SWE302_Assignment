import { promiseMiddleware, localStorageMiddleware } from './middleware';
import {
  ASYNC_START,
  ASYNC_END,
  LOGIN,
  LOGOUT,
  REGISTER,
  ARTICLE_SUBMITTED
} from './constants/actionTypes';
import agent from './agent';

// Mock the agent module
jest.mock('./agent', () => ({
  setToken: jest.fn()
}));

describe('promiseMiddleware', () => {
  let store;
  let next;

  beforeEach(() => {
    // Reset mocks
    store = {
      dispatch: jest.fn(),
      getState: jest.fn(() => ({ viewChangeCounter: 0 }))
    };
    next = jest.fn();
  });

  // Test 1: Pass through non-promise actions
  test('passes through non-promise actions', () => {
    const action = { type: 'SOME_ACTION', payload: { data: 'test' } };
    
    promiseMiddleware(store)(next)(action);
    
    expect(next).toHaveBeenCalledWith(action);
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  // Test 2: Handle promise actions - dispatch ASYNC_START
  test('dispatches ASYNC_START when promise action received', () => {
    const payload = Promise.resolve({ data: 'test' });
    const action = { type: ARTICLE_SUBMITTED, payload };
    
    promiseMiddleware(store)(next)(action);
    
    expect(store.dispatch).toHaveBeenCalledWith({
      type: ASYNC_START,
      subtype: ARTICLE_SUBMITTED
    });
  });

  // Test 3: Handle successful promise resolution
  test('dispatches ASYNC_END and action on promise success', async () => {
    const resolvedData = { article: { title: 'Test' } };
    const payload = Promise.resolve(resolvedData);
    const action = { type: ARTICLE_SUBMITTED, payload };
    
    promiseMiddleware(store)(next)(action);
    
    // Wait for promise to resolve
    await payload;
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(store.dispatch).toHaveBeenCalledWith({
      type: ASYNC_END,
      promise: resolvedData
    });
    expect(store.dispatch).toHaveBeenCalledWith({
      type: ARTICLE_SUBMITTED,
      payload: resolvedData
    });
  });

  // Test 4: Handle promise rejection
  test('dispatches error action on promise rejection', async () => {
    const error = {
      response: {
        body: { errors: { title: ["can't be blank"] } }
      }
    };
    const payload = Promise.reject(error);
    const action = { type: ARTICLE_SUBMITTED, payload };
    
    promiseMiddleware(store)(next)(action);
    
    // Wait for promise to reject
    await payload.catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(store.dispatch).toHaveBeenCalledWith({
      type: ASYNC_END,
      promise: error.response.body
    });
    expect(store.dispatch).toHaveBeenCalledWith({
      type: ARTICLE_SUBMITTED,
      payload: error.response.body,
      error: true
    });
  });

  // Test 5: Cancel outdated requests (viewChangeCounter changed)
  test('does not dispatch if viewChangeCounter changed', async () => {
    const resolvedData = { article: { title: 'Test' } };
    const payload = Promise.resolve(resolvedData);
    const action = { type: ARTICLE_SUBMITTED, payload };
    
    // Mock state change
    store.getState = jest.fn()
      .mockReturnValueOnce({ viewChangeCounter: 0 })  // Initial call
      .mockReturnValueOnce({ viewChangeCounter: 1 }); // After promise resolves
    
    promiseMiddleware(store)(next)(action);
    
    await payload;
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Should dispatch ASYNC_START but not ASYNC_END or final action
    expect(store.dispatch).toHaveBeenCalledWith({
      type: ASYNC_START,
      subtype: ARTICLE_SUBMITTED
    });
    
    // Filter out ASYNC_START calls
    const dispatches = store.dispatch.mock.calls;
    const hasAsyncEnd = dispatches.some(call => call[0].type === ASYNC_END);
    expect(hasAsyncEnd).toBe(false);
  });

  // Test 6: Skip tracking when skipTracking is true
  test('skips viewChangeCounter tracking when skipTracking is true', async () => {
    const resolvedData = { article: { title: 'Test' } };
    const payload = Promise.resolve(resolvedData);
    const action = { type: ARTICLE_SUBMITTED, payload, skipTracking: true };
    
    // Change viewChangeCounter
    store.getState = jest.fn()
      .mockReturnValueOnce({ viewChangeCounter: 0 })
      .mockReturnValueOnce({ viewChangeCounter: 999 });
    
    promiseMiddleware(store)(next)(action);
    
    await payload;
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Should still dispatch even though viewChangeCounter changed
    expect(store.dispatch).toHaveBeenCalledWith({
      type: ASYNC_END,
      promise: resolvedData
    });
  });

  // Test 7: Handle error without response body
  test('handles error without response body', async () => {
    const error = new Error('Network error');
    const payload = Promise.reject(error);
    const action = { type: ARTICLE_SUBMITTED, payload };
    
    promiseMiddleware(store)(next)(action);
    
    await payload.catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ARTICLE_SUBMITTED,
        error: true,
        payload: { errors: { body: ['Server error occurred'] } }
      })
    );
  });
});

describe('localStorageMiddleware', () => {
  let store;
  let next;
  let originalLocalStorage;

  beforeEach(() => {
    store = { dispatch: jest.fn(), getState: jest.fn() };
    next = jest.fn();
    
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn()
    };
    
    // Clear agent mock
    agent.setToken.mockClear();
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  // Test 8: Save JWT token on successful LOGIN
  test('saves JWT token to localStorage on successful LOGIN', () => {
    const action = {
      type: LOGIN,
      payload: {
        user: {
          token: 'test-jwt-token',
          username: 'testuser'
        }
      },
      error: false
    };
    
    localStorageMiddleware(store)(next)(action);
    
    expect(localStorage.setItem).toHaveBeenCalledWith('jwt', 'test-jwt-token');
    expect(agent.setToken).toHaveBeenCalledWith('test-jwt-token');
    expect(next).toHaveBeenCalledWith(action);
  });

  // Test 9: Save JWT token on successful REGISTER
  test('saves JWT token to localStorage on successful REGISTER', () => {
    const action = {
      type: REGISTER,
      payload: {
        user: {
          token: 'new-user-token',
          username: 'newuser'
        }
      },
      error: false
    };
    
    localStorageMiddleware(store)(next)(action);
    
    expect(localStorage.setItem).toHaveBeenCalledWith('jwt', 'new-user-token');
    expect(agent.setToken).toHaveBeenCalledWith('new-user-token');
  });

  // Test 10: Do not save token on LOGIN error
  test('does not save token on LOGIN error', () => {
    const action = {
      type: LOGIN,
      payload: {
        errors: { 'email or password': ['is invalid'] }
      },
      error: true
    };
    
    localStorageMiddleware(store)(next)(action);
    
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(agent.setToken).not.toHaveBeenCalled();
  });

  // Test 11: Clear JWT token on LOGOUT
  test('clears JWT token from localStorage on LOGOUT', () => {
    const action = { type: LOGOUT };
    
    localStorageMiddleware(store)(next)(action);
    
    expect(localStorage.setItem).toHaveBeenCalledWith('jwt', '');
    expect(agent.setToken).toHaveBeenCalledWith(null);
    expect(next).toHaveBeenCalledWith(action);
  });

  // Test 12: Pass through unrelated actions
  test('passes through unrelated actions without localStorage interaction', () => {
    const action = {
      type: ARTICLE_SUBMITTED,
      payload: { article: { title: 'Test' } }
    };
    
    localStorageMiddleware(store)(next)(action);
    
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(agent.setToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });
});
