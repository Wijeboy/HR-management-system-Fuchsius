import apiClient from './api';

export const searchService = {
  search: (q) => apiClient.get('/search', { params: { q } }),
};
