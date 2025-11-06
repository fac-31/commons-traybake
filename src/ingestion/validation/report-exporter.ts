import type { ValidationResults } from './chunk-quality-validator.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Export validation results to files
 */
export class ValidationReportExporter {
  /**
   * Export validation results to JSON and Markdown formats
   * @param results - The validation results to export
   * @param outputDir - Directory to save reports (default: ./validation-reports)
   * @param debateName - Name of the debate for the report filename
   * @returns Object containing paths to generated files
   */
  export(
    results: ValidationResults,
    outputDir: string = './validation-reports',
    debateName: string = 'debate'
  ): { jsonPath: string; markdownPath: string } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const safeDebateName = debateName
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      .substring(0, 50);

    const jsonPath = join(outputDir, `${safeDebateName}-${timestamp}.json`);
    const markdownPath = join(outputDir, `${safeDebateName}-${timestamp}.md`);

    // Export JSON
    this.exportJSON(results, jsonPath);

    // Export Markdown
    this.exportMarkdown(results, markdownPath, debateName);

    return { jsonPath, markdownPath };
  }

  /**
   * Export results as JSON
   */
  private exportJSON(results: ValidationResults, filepath: string): void {
    const json = JSON.stringify(results, null, 2);
    writeFileSync(filepath, json, 'utf-8');
  }

  /**
   * Export results as Markdown report
   */
  private exportMarkdown(results: ValidationResults, filepath: string, debateName: string): void {
    const lines: string[] = [];

    // Header
    lines.push(`# Chunk Quality Validation Report`);
    lines.push(``);
    lines.push(`**Debate:** ${debateName}`);
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(`**Total Chunks Analyzed:** ${results.summary.totalChunksAnalyzed}`);
    lines.push(`**Strategies Compared:** ${results.summary.strategiesCompared.join(', ')}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    // Table of Contents
    lines.push(`## Table of Contents`);
    lines.push(``);
    lines.push(`1. [Chunk Overlap Analysis](#1-chunk-overlap-analysis)`);
    lines.push(`2. [Speaker Diversity Analysis](#2-speaker-diversity-analysis)`);
    lines.push(`3. [Temporal Accuracy Analysis](#3-temporal-accuracy-analysis)`);
    lines.push(`4. [Party Balance Analysis](#4-party-balance-analysis)`);
    lines.push(`5. [Metadata Integrity Analysis](#5-metadata-integrity-analysis)`);
    lines.push(`6. [Overall Summary](#6-overall-summary)`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    // 1. Chunk Overlap Analysis
    lines.push(`## 1. Chunk Overlap Analysis`);
    lines.push(``);
    lines.push(`### Text Overlap Percentages`);
    lines.push(``);
    lines.push(`| Comparison | Overlap % |`);
    lines.push(`|------------|-----------|`);
    for (const [comparison, percentage] of Object.entries(results.chunkOverlap.textOverlapPercentages)) {
      lines.push(`| ${comparison.replace(/_/g, ' ')} | ${percentage.toFixed(2)}% |`);
    }
    lines.push(``);

    lines.push(`### Identical Chunks`);
    lines.push(``);
    lines.push(`| Comparison | Count |`);
    lines.push(`|------------|-------|`);
    for (const [comparison, count] of Object.entries(results.chunkOverlap.identicalChunks)) {
      lines.push(`| ${comparison.replace(/_/g, ' ')} | ${count} |`);
    }
    lines.push(``);

    lines.push(`### Average Similarity (Word Overlap)`);
    lines.push(``);
    lines.push(`| Comparison | Similarity |`);
    lines.push(`|------------|------------|`);
    for (const [comparison, similarity] of Object.entries(results.chunkOverlap.averageSimilarity)) {
      lines.push(`| ${comparison.replace(/_/g, ' ')} | ${(similarity * 100).toFixed(2)}% |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    // 2. Speaker Diversity Analysis
    lines.push(`## 2. Speaker Diversity Analysis`);
    lines.push(``);

    for (const [strategy, metrics] of Object.entries(results.speakerDiversity.byStrategy)) {
      lines.push(`### Strategy: ${strategy.replace(/_/g, ' ')}`);
      lines.push(``);
      lines.push(`- **Unique Speakers:** ${metrics.uniqueSpeakers}`);
      lines.push(`- **Dominant Speaker:** ${metrics.dominantSpeaker.name} (${metrics.dominantSpeaker.percentage.toFixed(1)}%)`);
      lines.push(``);
      lines.push(`**Top Speakers by Chunk Count:**`);
      lines.push(``);
      lines.push(`| Speaker | Chunks |`);
      lines.push(`|---------|--------|`);
      const sortedSpeakers = Object.entries(metrics.chunksPerSpeaker)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      for (const [speaker, count] of sortedSpeakers) {
        lines.push(`| ${speaker} | ${count} |`);
      }
      lines.push(``);
    }

    lines.push(`### Speaker Favoritism Across Strategies`);
    lines.push(``);
    lines.push(`| Speaker | ${results.summary.strategiesCompared.map(s => s.replace(/_/g, ' ')).join(' | ')} |`);
    lines.push(`|---------|${results.summary.strategiesCompared.map(() => '---').join('|')}|`);
    for (const [speaker, strategyCounts] of Object.entries(results.speakerDiversity.speakerFavoritism)) {
      const counts = results.summary.strategiesCompared.map(s => strategyCounts[s] || 0);
      lines.push(`| ${speaker} | ${counts.join(' | ')} |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    // 3. Temporal Accuracy Analysis
    lines.push(`## 3. Temporal Accuracy Analysis`);
    lines.push(``);

    lines.push(`### Date Consistency`);
    lines.push(``);
    lines.push(`| Strategy | Chunks w/ Dates | Invalid Dates | Consistency % |`);
    lines.push(`|----------|----------------|---------------|---------------|`);
    for (const [strategy, metrics] of Object.entries(results.temporalAccuracy.byStrategy)) {
      lines.push(`| ${strategy.replace(/_/g, ' ')} | ${metrics.chunksWithDates} | ${metrics.chunksWithInvalidDates} | ${metrics.dateConsistency.toFixed(2)}% |`);
    }
    lines.push(``);

    lines.push(`### Sequence Integrity`);
    lines.push(``);
    lines.push(`| Strategy | Sequence Breaks | Avg Gap |`);
    lines.push(`|----------|----------------|---------|`);
    for (const [strategy, metrics] of Object.entries(results.temporalAccuracy.sequenceIntegrity)) {
      lines.push(`| ${strategy.replace(/_/g, ' ')} | ${metrics.totalSequenceBreaks} | ${metrics.averageSequenceGap.toFixed(2)} |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    // 4. Party Balance Analysis
    lines.push(`## 4. Party Balance Analysis`);
    lines.push(``);

    lines.push(`### Government/Opposition Ratio`);
    lines.push(``);
    lines.push(`| Strategy | Gov/Opp Ratio | Dominant Party | Dominant % |`);
    lines.push(`|----------|---------------|----------------|------------|`);
    for (const [strategy, metrics] of Object.entries(results.partyBalance.byStrategy)) {
      lines.push(`| ${strategy.replace(/_/g, ' ')} | ${metrics.governmentOppositionRatio.toFixed(2)} | ${metrics.dominantParty.name} | ${metrics.dominantParty.percentage.toFixed(1)}% |`);
    }
    lines.push(``);

    lines.push(`### Party Distribution by Strategy`);
    lines.push(``);

    for (const [strategy, metrics] of Object.entries(results.partyBalance.byStrategy)) {
      lines.push(`#### ${strategy.replace(/_/g, ' ')}`);
      lines.push(``);
      lines.push(`| Party | Chunks | Percentage |`);
      lines.push(`|-------|--------|------------|`);
      const totalChunks = Object.values(metrics.partyDistribution).reduce((a, b) => a + b, 0);
      const sortedParties = Object.entries(metrics.partyDistribution).sort((a, b) => b[1] - a[1]);
      for (const [party, count] of sortedParties) {
        const percentage = totalChunks > 0 ? (count / totalChunks) * 100 : 0;
        lines.push(`| ${party} | ${count} | ${percentage.toFixed(1)}% |`);
      }
      lines.push(``);
    }

    lines.push(`### Systematic Bias Detection`);
    lines.push(``);
    lines.push(`| Party | Overrepresented In | Underrepresented In |`);
    lines.push(`|-------|-------------------|---------------------|`);
    for (const [party, bias] of Object.entries(results.partyBalance.systematicBias)) {
      const over = bias.overrepresentedIn.length > 0 ? bias.overrepresentedIn.map(s => s.replace(/_/g, ' ')).join(', ') : 'None';
      const under = bias.underrepresentedIn.length > 0 ? bias.underrepresentedIn.map(s => s.replace(/_/g, ' ')).join(', ') : 'None';
      lines.push(`| ${party} | ${over} | ${under} |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    // 5. Metadata Integrity Analysis
    lines.push(`## 5. Metadata Integrity Analysis`);
    lines.push(``);

    lines.push(`### Completeness by Strategy`);
    lines.push(``);
    lines.push(`| Strategy | Total Chunks | Missing Metadata | Completeness % | Invalid Hansard Refs |`);
    lines.push(`|----------|--------------|------------------|----------------|---------------------|`);
    for (const [strategy, metrics] of Object.entries(results.metadataIntegrity.byStrategy)) {
      lines.push(`| ${strategy.replace(/_/g, ' ')} | ${metrics.totalChunks} | ${metrics.chunksWithMissingMetadata} | ${metrics.metadataCompleteness.toFixed(2)}% | ${metrics.invalidHansardReferences} |`);
    }
    lines.push(``);

    lines.push(`### Field-Level Validation (All Strategies)`);
    lines.push(``);
    lines.push(`| Field | Valid | Invalid | Success Rate |`);
    lines.push(`|-------|-------|---------|--------------|`);
    for (const [field, counts] of Object.entries(results.metadataIntegrity.fieldValidation)) {
      const total = counts.valid + counts.invalid;
      const successRate = total > 0 ? (counts.valid / total) * 100 : 0;
      lines.push(`| ${field} | ${counts.valid} | ${counts.invalid} | ${successRate.toFixed(2)}% |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    // 6. Overall Summary
    lines.push(`## 6. Overall Summary`);
    lines.push(``);
    lines.push(`- **Total Chunks Analyzed:** ${results.summary.totalChunksAnalyzed}`);
    lines.push(`- **Strategies Compared:** ${results.summary.strategiesCompared.map(s => s.replace(/_/g, ' ')).join(', ')}`);
    lines.push(`- **Overall Divergence:** ${results.summary.overallDivergence.toFixed(2)}%`);
    lines.push(``);

    if (results.summary.significantDifferences.length > 0) {
      lines.push(`### ⚠️ Significant Differences Detected`);
      lines.push(``);
      for (const diff of results.summary.significantDifferences) {
        lines.push(`- ${diff}`);
      }
      lines.push(``);
    }

    if (results.summary.recommendations.length > 0) {
      lines.push(`### 💡 Recommendations`);
      lines.push(``);
      for (const rec of results.summary.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(``);
    lines.push(`*Report generated by Commons Traybake Chunk Quality Validator*`);

    writeFileSync(filepath, lines.join('\n'), 'utf-8');
  }
}
