export type SubAppId = 'brand-builder' | 'script-writer' | 'script-optimizer' | 'content-scanner';

export interface SubAppConfig {
  id: SubAppId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  iconName: string; // name of lucide-react icon
  colorClass: string; // Tailwind styling accent, e.g. 'emerald'
  gradientFrom: string;
  gradientTo: string;
}

// 1. Brand Builder Types
export interface BrandBuilderInputs {
  niche: string;
  factors: {
    personalName?: string;
    company?: string;
    location?: string;
    expertise?: string;
    custom?: string;
  };
  style?: string;
}

export interface SVGLogoItem {
  id: string;
  title: string;
  style: string;
  svgCode: string;
  concept: string;
}

export interface BrandBuilderResult {
  namesSuggestions: {
    name: string;
    style: string;
    reason: string;
  }[];
  selectedName?: string;
  logos?: SVGLogoItem[];
  tiktok?: {
    name: string;
    bio: string;
  };
  youtube?: {
    name: string;
    description: string;
    keywords: string[];
    hashtags: string[];
  };
  facebook_instagram?: {
    name: string;
    bio: string;
    hashtags: string[];
  };
}

export interface BrandBuilderProject {
  id: string;
  title: string;
  createdAt: string;
  inputs: BrandBuilderInputs;
  result: BrandBuilderResult;
}

// 2. Script Writer Types
export interface ScriptWriterInputs {
  images?: string[]; // 1 to 4 base64 images
  quantity: string; // "1" | "3" | "5" | "10" | "20" | "30" | custom
  phoneticVietnamese: boolean;
  stripCTA: boolean;
  removeShopName: boolean;
  removeMediaPartner: boolean;
  removePrice: boolean;
  eachStrengthOneScript: boolean;
  speaker: string;
  listener: string;
  duration: string;
  context: string;
  ideas: string;
  warnings: string;
  scannedProduct?: {
    productName: string;
    brand: string;
    keyPoints: string[];
  };
}

export interface TikTokScriptItem {
  id: string;
  title: string;
  hook: string;
  content: string; // full script lines
  scenes?: {
    sceneId: number;
    visual: string;
    audio: string;
  }[];
}

export interface ScriptWriterResult {
  productSummary?: {
    productName: string;
    brand: string;
    keyPoints: string[];
  };
  scripts: TikTokScriptItem[];
}

export interface ScriptWriterProject {
  id: string;
  title: string;
  createdAt: string;
  inputs: ScriptWriterInputs;
  result: ScriptWriterResult;
}

// 3. Script Optimizer Types
export interface ScriptOptimizerInputs {
  originalScript: string;
  currentIssues: string;
  improvementFocus: string;
}

export interface ScriptOptimizerResult {
  optimizedScript: string;
  explanationOfChanges: {
    point: string;
    reason: string;
  }[];
  ctaEnhancement: string;
  predictedImpact: string;
}

export interface ScriptOptimizerProject {
  id: string;
  title: string;
  createdAt: string;
  inputs: ScriptOptimizerInputs;
  result: ScriptOptimizerResult;
}

// 4. Content Scanner Types
export interface ContentScannerInputs {
  scriptText: string;
}

export interface BannedWordWarning {
  word: string;
  category: 'policy' | 'cliche' | 'spam';
  explanation: string;
  suggestion: string;
}

export interface ContentScannerResult {
  uniquenessScore: number;
  warnings: BannedWordWarning[];
  overallRating: string;
  rewriteVersion: string;
  seoKeywords: string[];
}

export interface ContentScannerProject {
  id: string;
  title: string;
  createdAt: string;
  inputs: ContentScannerInputs;
  result: ContentScannerResult;
}

// Global Projects State mapped by sub-app
export interface AppHistory {
  'brand-builder': BrandBuilderProject[];
  'script-writer': ScriptWriterProject[];
  'script-optimizer': ScriptOptimizerProject[];
  'content-scanner': ContentScannerProject[];
}
