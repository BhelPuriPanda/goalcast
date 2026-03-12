import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/matches',
  headers: { 'Content-Type': 'application/json' },
});

export const fetchMatches = (limit = 50) =>
  client.get('/', { params: { limit } }).then((r) => r.data.data);

export const fetchMatch = (matchId) =>
  client.get(`/${matchId}`).then((r) => r.data.data);

export const fetchCommentary = (matchId, limit = 100) =>
  client.get(`/${matchId}/commentary`, { params: { limit } }).then((r) => r.data);
