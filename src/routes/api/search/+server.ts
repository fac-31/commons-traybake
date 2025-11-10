import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { VectorSearch } from '../../../storage/vector-search.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { query, limit } = await request.json();

    if (!query || typeof query !== 'string') {
      throw error(400, 'Query is required and must be a string');
    }

    if (query.trim().length === 0) {
      throw error(400, 'Query cannot be empty');
    }

    // Validate limit parameter
    const searchLimit = limit && typeof limit === 'number' && limit > 0 ? limit : 3;
    if (searchLimit > 20) {
      throw error(400, 'Limit cannot exceed 20');
    }

    // Perform comparative search across all 4 strategies
    const vectorSearch = new VectorSearch();
    const results = await vectorSearch.comparativeSearch(query.trim(), searchLimit);

    return json(results);
  } catch (err) {
    console.error('Search API error:', err);

    if (err && typeof err === 'object' && 'status' in err) {
      // Re-throw SvelteKit errors
      throw err;
    }

    // Handle other errors
    throw error(500, {
      message: err instanceof Error ? err.message : 'Search failed'
    });
  }
};
