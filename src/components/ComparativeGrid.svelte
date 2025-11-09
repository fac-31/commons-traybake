<script lang="ts">
  import type { ComparativeSearchResults, DivergenceAnalysis } from '$lib/types';
  import CitationCard from './CitationCard.svelte';

  export let results: ComparativeSearchResults;

  const strategies = [
    { key: 'semantic_1024', name: 'Semantic 1024', description: 'Standard semantic chunking, max 1024 tokens' },
    { key: 'semantic_256', name: 'Semantic 256', description: 'Aggressive semantic chunking, max 256 tokens' },
    { key: 'late_1024', name: 'Late Chunking 1024', description: 'Context-aware with debate embedding (70/30 blend)' },
    { key: 'late_256', name: 'Late Chunking 256', description: 'Context-aware with 256 token chunks' }
  ] as const;

  // Calculate divergence analysis
  function analyzeDivergence(): DivergenceAnalysis {
    const chunksByStrategy: Record<string, Set<string>> = {
      semantic_1024: new Set(),
      semantic_256: new Set(),
      late_1024: new Set(),
      late_256: new Set()
    };

    const uniqueChunkIds = new Set<string>();

    for (const strategy of strategies) {
      for (const result of results[strategy.key as keyof ComparativeSearchResults] as any[]) {
        const chunkId = result.chunk.id;
        uniqueChunkIds.add(chunkId);
        chunksByStrategy[strategy.key].add(chunkId);
      }
    }

    const totalResults = strategies.reduce((sum, s) => {
      const stratResults = results[s.key as keyof ComparativeSearchResults] as any[];
      return sum + stratResults.length;
    }, 0);

    const overlapPercentage = totalResults > 0
      ? ((totalResults - uniqueChunkIds.size) / totalResults) * 100
      : 0;

    // Calculate pairwise overlaps
    const strategyOverlaps: DivergenceAnalysis['strategyOverlaps'] = [];
    for (let i = 0; i < strategies.length; i++) {
      for (let j = i + 1; j < strategies.length; j++) {
        const s1 = strategies[i].key;
        const s2 = strategies[j].key;
        const intersection = [...chunksByStrategy[s1]].filter(id =>
          chunksByStrategy[s2].has(id)
        );

        if (intersection.length > 0) {
          strategyOverlaps.push({
            strategies: [strategies[i].name, strategies[j].name],
            sharedChunks: intersection.length
          });
        }
      }
    }

    return {
      totalUniqueChunks: uniqueChunkIds.size,
      overlapPercentage,
      strategyOverlaps
    };
  }

  $: divergence = analyzeDivergence();
  $: isDivergent = divergence.overlapPercentage < 75;
</script>

<div class="comparative-grid">
  <div class="grid-header">
    <h2>Comparative Results</h2>
    <div class="query-info">
      <p class="query-text">"{results.query}"</p>
      <p class="execution-time">Completed in {results.executionTime}ms</p>
    </div>
  </div>

  <div class="divergence-summary" class:divergent={isDivergent}>
    <h3>
      {#if isDivergent}
        ⚠️ Significant Divergence Detected
      {:else}
        ✓ Strategies Show Similar Results
      {/if}
    </h3>
    <div class="divergence-stats">
      <div class="stat">
        <strong>{divergence.totalUniqueChunks}</strong>
        <span>Unique chunks retrieved</span>
      </div>
      <div class="stat">
        <strong>{(100 - divergence.overlapPercentage).toFixed(1)}%</strong>
        <span>Divergence rate</span>
      </div>
      <div class="stat">
        <strong>{divergence.overlapPercentage.toFixed(1)}%</strong>
        <span>Overlap</span>
      </div>
    </div>

    {#if divergence.strategyOverlaps.length > 0}
      <details class="overlaps-detail">
        <summary>View strategy overlaps</summary>
        <ul>
          {#each divergence.strategyOverlaps as overlap}
            <li>
              {overlap.strategies[0]} ↔ {overlap.strategies[1]}: {overlap.sharedChunks} shared
            </li>
          {/each}
        </ul>
      </details>
    {:else}
      <p class="complete-divergence">
        ✨ Complete divergence! All strategies retrieved different chunks.
      </p>
    {/if}

    <p class="divergence-explanation">
      {#if isDivergent}
        This demonstrates how chunking choices shape what gets retrieved. Different
        strategies are surfacing different parts of the parliamentary record for the
        <strong>same query</strong>.
      {:else}
        These strategies produced similar results, suggesting the query has clear,
        unambiguous matches in the data.
      {/if}
    </p>
  </div>

  <div class="strategies-grid">
    {#each strategies as strategy}
      {@const strategyResults = results[strategy.key]}
      <div class="strategy-column">
        <div class="strategy-header">
          <h3>{strategy.name}</h3>
          <p class="strategy-description">{strategy.description}</p>
          <div class="result-count">
            {strategyResults.length} {strategyResults.length === 1 ? 'result' : 'results'}
          </div>
        </div>

        <div class="results-list">
          {#if strategyResults.length === 0}
            <div class="no-results">
              <p>No results found for this strategy</p>
            </div>
          {:else}
            {#each strategyResults as result}
              <CitationCard {result} strategyName={strategy.key} />
            {/each}
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .comparative-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .grid-header {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .grid-header h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
  }

  .query-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .query-text {
    margin: 0;
    font-size: 1.1rem;
    font-style: italic;
    color: #333;
  }

  .execution-time {
    margin: 0;
    font-size: 0.875rem;
    color: #666;
  }

  .divergence-summary {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #4a9eff;
  }

  .divergence-summary.divergent {
    border-left-color: #ff9800;
    background: #fff8f0;
  }

  .divergence-summary h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: #333;
  }

  .divergence-stats {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat strong {
    font-size: 1.5rem;
    color: #4a9eff;
  }

  .divergence-summary.divergent .stat strong {
    color: #ff9800;
  }

  .stat span {
    font-size: 0.875rem;
    color: #666;
  }

  .overlaps-detail {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
  }

  .overlaps-detail summary {
    cursor: pointer;
    font-weight: 600;
    color: #666;
  }

  .overlaps-detail ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.5rem;
  }

  .overlaps-detail li {
    font-size: 0.875rem;
    color: #666;
    margin: 0.25rem 0;
  }

  .complete-divergence {
    margin: 1rem 0 0 0;
    padding: 0.75rem;
    background: rgba(255, 152, 0, 0.1);
    border-radius: 4px;
    font-weight: 600;
    color: #ff9800;
  }

  .divergence-explanation {
    margin: 1rem 0 0 0;
    font-size: 0.95rem;
    color: #666;
    line-height: 1.6;
  }

  .strategies-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 1024px) {
    .strategies-grid {
      grid-template-columns: 1fr;
    }
  }

  .strategy-column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .strategy-header {
    background: white;
    border-radius: 8px;
    padding: 1.25rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .strategy-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #333;
  }

  .strategy-description {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    color: #666;
    line-height: 1.4;
  }

  .result-count {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: #e3f2fd;
    color: #1565c0;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .no-results {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .no-results p {
    margin: 0;
    color: #999;
  }
</style>
