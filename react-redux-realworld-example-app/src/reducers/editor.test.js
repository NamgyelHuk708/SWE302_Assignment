import editorReducer from './editor';
import {
  EDITOR_PAGE_LOADED,
  EDITOR_PAGE_UNLOADED,
  ARTICLE_SUBMITTED,
  ASYNC_START,
  ADD_TAG,
  REMOVE_TAG,
  UPDATE_FIELD_EDITOR
} from '../constants/actionTypes';

describe('Editor Reducer', () => {
  
  const initialState = {};

  // Test 1: Returns initial state
  test('should return initial state', () => {
    expect(editorReducer(undefined, {})).toEqual({});
  });

  // Test 2: Handle EDITOR_PAGE_LOADED for new article
  test('handles EDITOR_PAGE_LOADED for new article (null payload)', () => {
    const action = {
      type: EDITOR_PAGE_LOADED,
      payload: null
    };

    const newState = editorReducer(initialState, action);
    expect(newState.articleSlug).toBe('');
    expect(newState.title).toBe('');
    expect(newState.description).toBe('');
    expect(newState.body).toBe('');
    expect(newState.tagInput).toBe('');
    expect(newState.tagList).toEqual([]);
  });

  // Test 3: Handle EDITOR_PAGE_LOADED for editing existing article
  test('handles EDITOR_PAGE_LOADED for existing article', () => {
    const action = {
      type: EDITOR_PAGE_LOADED,
      payload: {
        article: {
          slug: 'existing-article',
          title: 'Existing Title',
          description: 'Existing Description',
          body: 'Existing Body',
          tagList: ['react', 'testing']
        }
      }
    };

    const newState = editorReducer(initialState, action);
    expect(newState.articleSlug).toBe('existing-article');
    expect(newState.title).toBe('Existing Title');
    expect(newState.description).toBe('Existing Description');
    expect(newState.body).toBe('Existing Body');
    expect(newState.tagList).toEqual(['react', 'testing']);
  });

  // Test 4: Handle EDITOR_PAGE_UNLOADED
  test('handles EDITOR_PAGE_UNLOADED action', () => {
    const currentState = {
      title: 'Some Title',
      description: 'Some Description',
      body: 'Some Body',
      tagList: ['tag1']
    };

    const action = { type: EDITOR_PAGE_UNLOADED };
    const newState = editorReducer(currentState, action);
    
    expect(newState).toEqual({});
  });

  // Test 5: Handle UPDATE_FIELD_EDITOR for title
  test('handles UPDATE_FIELD_EDITOR for title', () => {
    const action = {
      type: UPDATE_FIELD_EDITOR,
      key: 'title',
      value: 'New Article Title'
    };

    const newState = editorReducer(initialState, action);
    expect(newState.title).toBe('New Article Title');
  });

  // Test 6: Handle UPDATE_FIELD_EDITOR for description
  test('handles UPDATE_FIELD_EDITOR for description', () => {
    const action = {
      type: UPDATE_FIELD_EDITOR,
      key: 'description',
      value: 'Article description here'
    };

    const newState = editorReducer(initialState, action);
    expect(newState.description).toBe('Article description here');
  });

  // Test 7: Handle UPDATE_FIELD_EDITOR for body
  test('handles UPDATE_FIELD_EDITOR for body', () => {
    const action = {
      type: UPDATE_FIELD_EDITOR,
      key: 'body',
      value: 'Article body content'
    };

    const newState = editorReducer(initialState, action);
    expect(newState.body).toBe('Article body content');
  });

  // Test 8: Handle UPDATE_FIELD_EDITOR for tagInput
  test('handles UPDATE_FIELD_EDITOR for tagInput', () => {
    const action = {
      type: UPDATE_FIELD_EDITOR,
      key: 'tagInput',
      value: 'newtag'
    };

    const newState = editorReducer(initialState, action);
    expect(newState.tagInput).toBe('newtag');
  });

  // Test 9: Handle ADD_TAG
  test('handles ADD_TAG action', () => {
    const currentState = {
      tagInput: 'javascript',
      tagList: ['react']
    };

    const action = { type: ADD_TAG };
    const newState = editorReducer(currentState, action);
    
    expect(newState.tagList).toEqual(['react', 'javascript']);
    expect(newState.tagInput).toBe('');
  });

  // Test 10: Handle REMOVE_TAG
  test('handles REMOVE_TAG action', () => {
    const currentState = {
      tagList: ['react', 'javascript', 'testing']
    };

    const action = {
      type: REMOVE_TAG,
      tag: 'javascript'
    };

    const newState = editorReducer(currentState, action);
    expect(newState.tagList).toEqual(['react', 'testing']);
    expect(newState.tagList).not.toContain('javascript');
  });

  // Test 11: Handle ARTICLE_SUBMITTED success
  test('handles ARTICLE_SUBMITTED on success', () => {
    const action = {
      type: ARTICLE_SUBMITTED,
      error: false,
      payload: {
        article: {
          slug: 'new-article',
          title: 'New Article'
        }
      }
    };

    const newState = editorReducer(initialState, action);
    expect(newState.inProgress).toBe(null);
    expect(newState.errors).toBe(null);
  });

  // Test 12: Handle ARTICLE_SUBMITTED with errors
  test('handles ARTICLE_SUBMITTED with errors', () => {
    const action = {
      type: ARTICLE_SUBMITTED,
      error: true,
      payload: {
        errors: {
          title: ["can't be blank"],
          body: ["can't be blank"]
        }
      }
    };

    const newState = editorReducer(initialState, action);
    expect(newState.inProgress).toBe(null);
    expect(newState.errors).toEqual({
      title: ["can't be blank"],
      body: ["can't be blank"]
    });
  });

  // Test 13: Handle ASYNC_START for ARTICLE_SUBMITTED
  test('handles ASYNC_START for ARTICLE_SUBMITTED subtype', () => {
    const action = {
      type: ASYNC_START,
      subtype: ARTICLE_SUBMITTED
    };

    const newState = editorReducer(initialState, action);
    expect(newState.inProgress).toBe(true);
  });

  // Test 14: Add multiple tags sequentially
  test('adds multiple tags sequentially', () => {
    let state = {
      tagInput: 'tag1',
      tagList: []
    };

    // Add first tag
    state = editorReducer(state, { type: ADD_TAG });
    expect(state.tagList).toEqual(['tag1']);
    expect(state.tagInput).toBe('');

    // Add second tag
    state = { ...state, tagInput: 'tag2' };
    state = editorReducer(state, { type: ADD_TAG });
    expect(state.tagList).toEqual(['tag1', 'tag2']);
  });

  // Test 15: Preserve other fields when updating one field
  test('preserves other fields when updating one field', () => {
    const currentState = {
      title: 'Existing Title',
      description: 'Existing Description',
      body: 'Existing Body'
    };

    const action = {
      type: UPDATE_FIELD_EDITOR,
      key: 'title',
      value: 'Updated Title'
    };

    const newState = editorReducer(currentState, action);
    expect(newState.title).toBe('Updated Title');
    expect(newState.description).toBe('Existing Description');
    expect(newState.body).toBe('Existing Body');
  });

});
