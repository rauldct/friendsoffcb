export interface TicketOption {
  label: string;
  priceFrom: number;
  currency: string;
  affiliateUrl: string;
  provider: string;
}

export interface HotelOption {
  label: string;
  priceFrom: number;
  affiliateUrl: string;
  nights: number;
}

export interface ActivityOption {
  label: string;
  priceFrom: number;
  affiliateUrl: string;
}

export interface MatchPackage {
  id: string;
  slug: string;
  matchTitle: string;
  matchTitleEs?: string | null;
  competition: string;
  matchDate: string;
  matchTime: string;
  opponent: string;
  opponentLogo: string;
  heroImage: string;
  description: string;
  descriptionEs?: string | null;
  tickets: TicketOption[];
  hotels: HotelOption[];
  activities: ActivityOption[];
  tips: string[];
  tipsEs?: string[];
  meetupInfo?: string | null;
  meetupInfoEs?: string | null;
  metaTitle: string;
  metaTitleEs?: string | null;
  metaDescription: string;
  metaDescriptionEs?: string | null;
  status: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  titleEs?: string | null;
  excerpt: string;
  excerptEs?: string | null;
  content: string;
  contentEs?: string | null;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  metaTitle: string;
  metaTitleEs?: string | null;
  metaDescription: string;
  metaDescriptionEs?: string | null;
  canonicalUrl?: string | null;
  relatedPackageSlug?: string | null;
  publishedAt: string;
  updatedAt: string;
  status: string;
}

export interface Lead {
  id: string;
  email: string;
  name?: string;
  matchInterested?: string;
  groupSize?: number;
  country?: string;
  message?: string;
  source: string;
  createdAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  language: string;
  subscribedAt: string;
  source: string;
  active: boolean;
}

export interface MatchData {
  id: string;
  date: string;
  time: string;
  opponent: string;
  opponentLogo: string;
  competition: string;
  venue: string;
  packageSlug?: string | null;
}

export interface Photo {
  id: string;
  filename: string;
  thumbnailName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  takenAt: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  uploaderName: string;
  uploaderEmail: string;
  status: string;
  rejectionReason: string | null;
  moderatedAt: string | null;
  reportCount: number;
  createdAt: string;
}
