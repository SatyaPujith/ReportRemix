export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  type?: 'text' | 'image';
  timestamp: number;
}

export interface DocumentState {
  file: File | null;
  name: string;
  htmlContent: string; // The full HTML of the doc
  isProcessing: boolean;
  isLoaded: boolean;
  lastUpdated: number;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface TextStyle {
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isSerif: boolean;
}