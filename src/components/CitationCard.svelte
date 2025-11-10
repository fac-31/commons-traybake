<script lang="ts">
  import type { SearchResult } from '$lib/types';

  export let result: SearchResult;
  export let strategyName: string;

  const { chunk, score, rank } = result;

  // Format strategy name for display
  const strategyDisplay = strategyName
    .replace('_', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace('Semantic', 'Early Chunking');

  // Truncate text if too long
  function truncateText(text: string, maxLength: number = 300): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Get party color
  function getPartyColor(party: string): string {
    const colors: Record<string, string> = {
      Conservative: '#0087DC',
      Labour: '#E4003B',
      'Liberal Democrat': '#FAA61A',
      'Scottish National Party': '#FFF95D',
      'Green Party': '#6AB023',
      'Democratic Unionist Party': '#D46A4C',
      'Sinn Féin': '#326760',
      'Plaid Cymru': '#005B54'
    };
    return colors[party] || '#666';
  }
</script>

<article class="citation-card">
  <div class="card-header">
    <div class="rank">#{rank}</div>
    <div
      class="score"
      style="--score-width: {score * 100}%"
      title="Cosine similarity between chunk embedding and query embedding. Higher scores indicate semantically similar content."
    >
      <div class="score-bar"></div>
      <span class="score-text">{(score * 100).toFixed(1)}%</span>
    </div>
  </div>

  <div class="speaker-info">
    <h3 class="speaker-name">{chunk.speaker}</h3>
    <span class="party-badge" style="--party-color: {getPartyColor(chunk.speakerParty)}">
      {chunk.speakerParty}
    </span>
    {#if chunk.speakerRole}
      <span class="role">{chunk.speakerRole}</span>
    {/if}
  </div>

  <blockquote class="chunk-text">
    "{truncateText(chunk.text)}"
  </blockquote>

  <div class="metadata">
    <div class="metadata-row">
      <strong>Debate:</strong>
      <span>{chunk.debate}</span>
    </div>
    <div class="metadata-row">
      <strong>Date:</strong>
      <span>{new Date(chunk.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}</span>
    </div>
    {#if chunk.hansardReference}
      <div class="metadata-row">
        <strong>Hansard:</strong>
        <span class="hansard-ref">{chunk.hansardReference}</span>
      </div>
    {/if}
    <div class="metadata-row">
      <strong>Strategy:</strong>
      <span class="strategy-badge">{strategyDisplay}</span>
    </div>
    {#if chunk.tokenCount}
      <div class="metadata-row">
        <strong>Tokens:</strong>
        <span>{chunk.tokenCount}</span>
      </div>
    {/if}
  </div>
</article>

<style>
  .citation-card {
    background: white;
    border-radius: 8px;
    padding: 1.25rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
    transition: box-shadow 0.2s;
  }

  .citation-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .rank {
    font-size: 1.25rem;
    font-weight: 700;
    color: #4a9eff;
    min-width: 40px;
  }

  .score {
    flex: 1;
    position: relative;
    height: 24px;
    background: #f0f0f0;
    border-radius: 12px;
    overflow: hidden;
    cursor: help;
  }

  .score-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: var(--score-width);
    background: linear-gradient(90deg, #4a9eff, #3a8eef);
    transition: width 0.3s ease;
  }

  .score-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.75rem;
    font-weight: 600;
    color: #333;
    z-index: 1;
  }

  .speaker-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .speaker-name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }

  .party-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--party-color);
    color: white;
    white-space: nowrap;
  }

  .role {
    font-size: 0.875rem;
    color: #666;
  }

  .chunk-text {
    margin: 0;
    padding: 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #333;
    border-left: 3px solid #4a9eff;
    padding-left: 1rem;
    font-style: italic;
  }

  .metadata {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-top: 1px solid #eee;
    padding-top: 1rem;
  }

  .metadata-row {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .metadata-row strong {
    color: #666;
    min-width: 80px;
  }

  .metadata-row span {
    color: #333;
  }

  .hansard-ref {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
  }

  .strategy-badge {
    padding: 0.125rem 0.5rem;
    background: #e3f2fd;
    color: #1565c0;
    border-radius: 4px;
    font-weight: 500;
  }
</style>
