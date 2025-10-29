export class TextCleaner {
  clean(text: string): string {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  stripProceduralMarkers(text: string): string {
    return text
      .replace(/\([^)]+\)/g, '')
      .replace(/\[[^\]]+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}