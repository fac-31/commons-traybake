export class ProceduralExtractor {
  extract(text: string): string {
    const markers: string[] = [];
    
    const parenthetical = text.match(/\([^)]+\)/g) || [];
    const brackets = text.match(/\[[^\]]+\]/g) || [];
    
    markers.push(...parenthetical, ...brackets);
    
    return markers.join(' ');
  }

  extractAll(text: string): string[] {
    const parenthetical = text.match(/\([^)]+\)/g) || [];
    const brackets = text.match(/\[[^\]]+\]/g) || [];
    return [...parenthetical, ...brackets];
  }
}