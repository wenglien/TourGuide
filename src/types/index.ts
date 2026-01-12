// ==========================================
// Core Type Definitions for Theme Trails App
// ==========================================

// === Place Types ===
export type PlaceType = 
  | 'cafe'
  | 'restaurant'
  | 'exhibition'
  | 'market'
  | 'nightview'
  | 'park'
  | 'temple'
  | 'shop'
  | 'street'
  | 'landmark';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type WalkingLevel = 'low' | 'medium' | 'high';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
  } | null;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Place {
  id: string;
  name: string;
  nameEn?: string;
  type: PlaceType;
  tags: string[];
  openingHours: OpeningHours;
  avgStayTime: number; // in minutes
  priceRange: PriceRange;
  bestTimeOfDay: TimeOfDay[];
  transportTags: string[];
  location: Location;
  description: string;
  photos: string[];
  popularityScore?: number; // 0-100
}

// === Trail Types ===
export interface Trail {
  id: string;
  title: string;
  theme: string;
  orderedPlaces: string[]; // Place IDs
  totalTime: number; // in minutes
  walkingLevel: WalkingLevel;
  seasonTags: Season[];
  timeTags: TimeOfDay[];
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  rainAlternative?: string; // Alternative trail ID
  coverImage: string;
  description: string;
  highlights: string[];
}

// === Itinerary Types ===
export interface Adjustment {
  type: 'skip' | 'add' | 'reorder' | 'time';
  placeId?: string;
  value?: string | number;
}

export interface ItinerarySlot {
  trailId: string;
  timeSlot: TimeOfDay;
  startTime: string;
  places: string[];
}

export interface Itinerary {
  id: string;
  userId: string;
  date: string;
  city: string;
  slots: ItinerarySlot[];
  customAdjustments: Adjustment[];
  weatherMode: 'normal' | 'rain';
  createdAt: string;
  updatedAt: string;
}

// === User Preferences ===
export type PreferenceCategory = 
  | 'food'
  | 'walking'
  | 'exhibition'
  | 'photography'
  | 'nightlife'
  | 'shopping'
  | 'culture';

export type TravelPace = 'relaxed' | 'moderate' | 'packed';

export interface UserPreferences {
  city: string;
  date: string;
  categories: PreferenceCategory[];
  pace: TravelPace;
  startTime?: string;
  maxWalkingLevel?: WalkingLevel;
  proximity?: 'close' | 'far';
}

// === Q&A Types ===
export type QuestionType = 
  | 'queue'
  | 'safety'
  | 'weather'
  | 'solo'
  | 'family'
  | 'general';

export interface QAQuestion {
  id: string;
  trailId: string;
  type: QuestionType;
  content: string;
  userId: string;
  createdAt: string;
  answerCount: number;
}

export interface QAAnswer {
  id: string;
  questionId: string;
  content: string;
  userId: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  isVerified: boolean;
}

export interface UserCredibility {
  userId: string;
  score: number;
  answersAccepted: number;
  totalVotes: number;
}

// === Scoring Engine Types ===
export interface ScoringWeights {
  preferenceMatch: number;
  timeMatch: number;
  walkingPenalty: number;
  popularityPenalty: number;
}

export interface TrailScore {
  trailId: string;
  totalScore: number;
  breakdown: {
    preferenceMatch: number;
    timeMatch: number;
    walkingScore: number;
    popularityScore: number;
  };
}

// === UI State Types ===
export interface FilterState {
  themes: string[];
  timeTags: TimeOfDay[];
  walkingLevel: WalkingLevel | null;
  priceRange: PriceRange | null;
  rainFriendly: boolean;
}

export interface SavedTrail {
  trailId: string;
  savedAt: string;
}

// === API Response Types ===
export interface GeneratedItinerary {
  morning?: TrailScore;
  afternoon?: TrailScore;
  evening?: TrailScore;
  night?: TrailScore;
  alternatives: TrailScore[];
}

// === Multi-Day Itinerary Types ===
export interface DayItinerary {
  dayNumber: number;
  date: string;
  itinerary: GeneratedItinerary;
}

export interface MultiDayItinerary {
  id?: string;
  userId?: string;
  city: string;
  startDate: string;
  endDate: string;
  days: DayItinerary[];
  preferences: UserPreferences;
  createdAt?: string;
}

export type TripDuration = '1' | '2' | '3' | '4' | '5' | '7';
