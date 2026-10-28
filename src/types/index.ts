export interface ExtractedColor {
  hex: string;
  rgb: string;
  hsl: string;
  category: 'primary' | 'background' | 'text' | 'accent' | 'neutral';
  contrastOnDark: number; // ratio vs #000000 or dark bg
  contrastOnLight: number; // ratio vs #ffffff
  isAccessibleOnDark: boolean;
  isAccessibleOnLight: boolean;
  count: number;
}

export interface ExtractedFont {
  family: string;
  weights: (string | number)[];
  sizes: string[];
  lineHeights: string[];
  source: 'google' | 'system' | 'custom';
  sampleText?: string;
  usageCount: number;
}

export interface ExtractedAsset {
  id: string;
  type: 'svg' | 'image' | 'video' | 'background' | 'lottie' | 'audio';
  name: string;
  url: string;
  previewUrl: string;
  poster?: string;
  content?: string; // Raw SVG or data URI
  width?: number;
  height?: number;
  format?: string;
  duration?: number;
}

export interface BoxModel {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
}

export interface InspectedElement {
  tagName: string;
  id: string;
  classList: string[];
  selectorPath: string;
  boxModel: BoxModel;
  computedStyles: {
    color: string;
    backgroundColor: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    display: string;
    position: string;
    borderRadius: string;
    boxShadow: string;
    border: string;
    opacity: string;
    zIndex: string;
  };
  html: string;
  cleanHtml: string;
  cloneHtml?: string;
  tailwindGuess: string;
  aiPrompt: string;
}

export interface DesignTokens {
  domain: string;
  title: string;
  colors: ExtractedColor[];
  fonts: ExtractedFont[];
  assets: ExtractedAsset[];
  shadows: string[];
  radii: string[];
  extractedAt: string;
  fullPageHtml?: string;
}

export type MessageType =
  | 'START_INSPECT'
  | 'STOP_INSPECT'
  | 'ELEMENT_HOVERED'
  | 'ELEMENT_SELECTED'
  | 'SCAN_PAGE'
  | 'PAGE_SCANNED'
  | 'GET_PAGE_DATA'
  | 'GET_LIVE_CLONE'
  | 'DOWNLOAD_PAGE_ZIP'
  | 'DOWNLOAD_PAGE_HTML'
  | 'INSPECTOR_STATE_UPDATE';

export interface ExtensionMessage<T = any> {
  type: MessageType;
  payload?: T;
}
