<script lang="ts">
  import QueryInput from '$components/QueryInput.svelte';
  import ComparativeGrid from '$components/ComparativeGrid.svelte';
  import type { ComparativeSearchResults } from '$lib/types';

  let results: ComparativeSearchResults | null = null;
  let loading = false;
  let error: string | null = null;

  async function handleSearch(event: CustomEvent<{ query: string; limit: number }>) {
    const { query, limit } = event.detail;

    if (!query.trim()) {
      return;
    }

    loading = true;
    error = null;
    results = null;

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, limit })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      results = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Search error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="page">
  <section class="query-section">
    <h2>Query Parliamentary Debates</h2>
    <p class="description">
      Ask a question about UK Parliament debates. Watch how different chunking
      strategies retrieve different results for the <strong>same query</strong>.
    </p>

    <QueryInput on:search={handleSearch} disabled={loading} />

    {#if loading}
      <div class="status loading">
        <div class="spinner"></div>
        <p>Searching across all 4 chunking strategies...</p>
      </div>
    {/if}

    {#if error}
      <div class="status error">
        <p><strong>Error:</strong> {error}</p>
      </div>
    {/if}
  </section>

  {#if results}
    <section class="results-section">
      <ComparativeGrid {results} />
    </section>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .query-section {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .query-section h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }

  .description {
    margin: 0 0 1.5rem 0;
    color: #666;
  }

  .status {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 4px;
  }

  .status.loading {
    background: #e3f2fd;
    color: #1565c0;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .status.error {
    background: #ffebee;
    color: #c62828;
  }

  .status p {
    margin: 0;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(21, 101, 192, 0.3);
    border-top-color: #1565c0;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .results-section {
    margin-bottom: 2rem;
  }
</style>
