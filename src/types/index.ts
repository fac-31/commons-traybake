// Core types for parliamentary data
export type DebateType = 
  | "PMQs" 
  | "General Debate" 
  | "Committee" 
  | "Written Questions";

export type ContributionType = 
  | "speech" 
  | "intervention" 
  | "question" 
  | "answer";

export interface Speaker {
  name: string;
  constituency?: string;
  party: string;
  role: string; // "Minister", "Shadow Minister", "Backbencher"
}

export interface HansardReference {
  reference: string; // "HC Deb 12 May 2023 vol 732 c45"
  volume: string;
  columnNumber: string;
  url: string;
}

export interface Contribution {
  id: string;
  debateId: string;
  speaker: Speaker;
  text: string;
  type: ContributionType;
  proceduralContext: string;
  timestamp: Date;
  columnNumber: string;
  previousSpeakerId?: string;
  addressingId?: string;
  questionNumber?: string;
}

export interface Debate {
  id: string;
  title: string;
  date: Date;
  type: DebateType;
  parliamentarySession: string;
  fullText: string;
  contributions: Contribution[];
  hansardReference: HansardReference;
}

export interface DateRange {
  start: Date;
  end: Date;
}