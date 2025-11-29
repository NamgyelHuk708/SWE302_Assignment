import articleListReducer from './articleList';
import {
  ARTICLE_FAVORITED,
  ARTICLE_UNFAVORITED,
  SET_PAGE,
  APPLY_TAG_FILTER,
  HOME_PAGE_LOADED,
  HOME_PAGE_UNLOADED,
  CHANGE_TAB
} from '../constants/actionTypes';

describe('ArticleList Reducer', () => {
  
  const initialState = {};

  // Test 1: Returns initial state
  test('should return initial state', () => {
    expect(articleListReducer(undefined, {})).toEqual({});
  });

  // Test 2: Handle ARTICLE_FAVORITED
  test('handles ARTICLE_FAVORITED action', () => {
    const currentState = {
      articles: [
        { slug: 'article-1', title: 'Article 1', favorited: false, favoritesCount: 5 },
        { slug: 'article-2', title: 'Article 2', favorited: false, favoritesCount: 3 }
      ]
    };

    const action = {
      type: ARTICLE_FAVORITED,
      payload: {
        article: {
          slug: 'article-1',
          favorited: true,
          favoritesCount: 6
        }
      }
    };

    const newState = articleListReducer(currentState, action);
    expect(newState.articles[0].favorited).toBe(true);
    expect(newState.articles[0].favoritesCount).toBe(6);
    expect(newState.articles[1].favorited).toBe(false); // unchanged
  });

  // Test 3: Handle ARTICLE_UNFAVORITED
  test('handles ARTICLE_UNFAVORITED action', () => {
    const currentState = {
      articles: [
        { slug: 'article-1', title: 'Article 1', favorited: true, favoritesCount: 10 },
        { slug: 'article-2', title: 'Article 2', favorited: false, favoritesCount: 5 }
      ]
    };

    const action = {
      type: ARTICLE_UNFAVORITED,
      payload: {
        article: {
          slug: 'article-1',
          favorited: false,
          favoritesCount: 9
        }
      }
    };

    const newState = articleListReducer(currentState, action);
    expect(newState.articles[0].favorited).toBe(false);
    expect(newState.articles[0].favoritesCount).toBe(9);
  });

  // Test 4: Handle SET_PAGE
  test('handles SET_PAGE action', () => {
    const action = {
      type: SET_PAGE,
      page: 2,
      payload: {
        articles: [
          { slug: 'page-2-article', title: 'Page 2 Article' }
        ],
        articlesCount: 25
      }
    };

    const newState = articleListReducer(initialState, action);
    expect(newState.articles).toHaveLength(1);
    expect(newState.articlesCount).toBe(25);
    expect(newState.currentPage).toBe(2);
  });

  // Test 5: Handle APPLY_TAG_FILTER
  test('handles APPLY_TAG_FILTER action', () => {
    const action = {
      type: APPLY_TAG_FILTER,
      tag: 'react',
      pager: jest.fn(),
      payload: {
        articles: [
          { slug: 'react-article', title: 'React Article', tagList: ['react'] }
        ],
        articlesCount: 10
      }
    };

    const newState = articleListReducer(initialState, action);
    expect(newState.tag).toBe('react');
    expect(newState.articles).toHaveLength(1);
    expect(newState.articlesCount).toBe(10);
    expect(newState.tab).toBe(null);
    expect(newState.currentPage).toBe(0);
  });

  // Test 6: Handle HOME_PAGE_LOADED
  test('handles HOME_PAGE_LOADED action', () => {
    const action = {
      type: HOME_PAGE_LOADED,
      payload: [
        { tags: ['react', 'javascript', 'testing'] },
        {
          articles: [
            { slug: 'home-article-1', title: 'Home Article 1' },
            { slug: 'home-article-2', title: 'Home Article 2' }
          ],
          articlesCount: 15
        }
      ],
      tab: 'all',
      pager: jest.fn()
    };

    const newState = articleListReducer(initialState, action);
    expect(newState.articles).toHaveLength(2);
    expect(newState.articlesCount).toBe(15);
    expect(newState.tab).toBe('all');
    expect(newState.tags).toEqual(['react', 'javascript', 'testing']);
  });

  // Test 7: Handle HOME_PAGE_UNLOADED
  test('handles HOME_PAGE_UNLOADED action', () => {
    const currentState = {
      articles: [{ slug: 'article-1' }],
      articlesCount: 10,
      tab: 'all',
      tags: ['react']
    };

    const action = { type: HOME_PAGE_UNLOADED };
    const newState = articleListReducer(currentState, action);
    
    expect(newState).toEqual({});
  });

  // Test 8: Handle CHANGE_TAB
  test('handles CHANGE_TAB action', () => {
    const action = {
      type: CHANGE_TAB,
      tab: 'feed',
      payload: {
        articles: [{ slug: 'feed-article', title: 'Feed Article' }],
        articlesCount: 5
      },
      pager: jest.fn()
    };

    const newState = articleListReducer(initialState, action);
    expect(newState.tab).toBe('feed');
    expect(newState.articles).toHaveLength(1);
    expect(newState.articlesCount).toBe(5);
  });

  // Test 9: Don't mutate other articles when favoriting
  test('does not mutate other articles when favoriting one', () => {
    const currentState = {
      articles: [
        { slug: 'article-1', favorited: false, favoritesCount: 1 },
        { slug: 'article-2', favorited: false, favoritesCount: 2 },
        { slug: 'article-3', favorited: false, favoritesCount: 3 }
      ]
    };

    const action = {
      type: ARTICLE_FAVORITED,
      payload: {
        article: {
          slug: 'article-2',
          favorited: true,
          favoritesCount: 3
        }
      }
    };

    const newState = articleListReducer(currentState, action);
    expect(newState.articles[0].favorited).toBe(false);
    expect(newState.articles[1].favorited).toBe(true);
    expect(newState.articles[2].favorited).toBe(false);
  });

  // Test 10: Pagination resets when applying tag filter
  test('resets current page to 0 when applying tag filter', () => {
    const currentState = {
      currentPage: 5,
      articles: [],
      articlesCount: 100
    };

    const action = {
      type: APPLY_TAG_FILTER,
      tag: 'javascript',
      pager: jest.fn(),
      payload: {
        articles: [],
        articlesCount: 20
      }
    };

    const newState = articleListReducer(currentState, action);
    expect(newState.currentPage).toBe(0);
  });

});
