<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let disabled = false;

  let query = '';
  const dispatch = createEventDispatcher<{ search: { query: string } }>();

  const exampleQueries = [
    "What is the government's position on NHS funding?",
    'How did the opposition respond to the Prime Minister?',
    'What are the concerns about education policy?',
    'What was said about climate change and net zero?'
  ];

  function handleSubmit() {
    if (query.trim()) {
      dispatch('search', { query: query.trim() });
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function useExample(example: string) {
    query = example;
  }
</script>

<div class="query-input">
  <div class="input-container">
    <textarea
      bind:value={query}
      on:keydown={handleKeydown}
      placeholder="Ask a question about UK Parliamentary debates..."
      {disabled}
      rows="3"
    />
    <button on:click={handleSubmit} {disabled} class="search-button">
      Search All Strategies
    </button>
  </div>

  <div class="examples">
    <p class="examples-label">Example queries:</p>
    <div class="examples-list">
      {#each exampleQueries as example}
        <button
          class="example-button"
          on:click={() => useExample(example)}
          {disabled}
        >
          {example}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .query-input {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-container {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  textarea {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    resize: vertical;
    min-height: 80px;
    transition: border-color 0.2s;
  }

  textarea:focus {
    outline: none;
    border-color: #4a9eff;
  }

  textarea:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .search-button {
    padding: 0.75rem 1.5rem;
    background: #4a9eff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .search-button:hover:not(:disabled) {
    background: #3a8eef;
  }

  .search-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .examples {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .examples-label {
    margin: 0;
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
  }

  .examples-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .example-button {
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.875rem;
    color: #333;
    transition: all 0.2s;
  }

  .example-button:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #4a9eff;
    color: #4a9eff;
  }

  .example-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
