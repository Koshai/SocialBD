export type ChannelAnalytics = {
  id: string;
  displayName: string;
  platform: string;
  pageId: string;
  followers: number | null;
  publishedPosts: number;
  error?: string;
};

export type PostAnalytics = {
  id: string;
  body: string;
  publishedAt: string;
  channelName: string;
  platform: string;
  externalPostId: string;
  pageId: string;
  reactions: number;
  comments: number;
  shares: number;
  impressions: number | null;
  engagement: number;
  error?: string;
};

export type AnalyticsSnapshot = {
  channels: ChannelAnalytics[];
  posts: PostAnalytics[];
  totals: {
    publishedPosts: number;
    reactions: number;
    comments: number;
    shares: number;
    impressions: number | null;
    engagement: number;
  };
  warnings: string[];
};
