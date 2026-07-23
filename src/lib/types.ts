export type PortfolioCategory = "tiktok" | "clients";

export type PortfolioClip = {
  id: string;
  title: string;
  category: PortfolioCategory;
  video_url: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  review_rating: number | null;
  review_comment: string | null;
  review_discord_username: string | null;
};

export type PortfolioSectionVisibility = {
  category: PortfolioCategory;
  hidden: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  preview_image_url: string;
  buy_url: string;
  price_label: string;
  sort_order: number;
  published: boolean;
  created_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
};

export type Database = {
  public: {
    Tables: {
      portfolio_clips: {
        Row: PortfolioClip;
        Insert: Omit<PortfolioClip, "id" | "created_at">;
        Update: Partial<Omit<PortfolioClip, "id" | "created_at">>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at">;
        Update: Partial<Omit<Product, "id" | "created_at">>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: Omit<ContactMessage, "id" | "created_at" | "read">;
        Update: Partial<Omit<ContactMessage, "id" | "created_at">>;
        Relationships: [];
      };
      portfolio_section_visibility: {
        Row: PortfolioSectionVisibility;
        Insert: PortfolioSectionVisibility;
        Update: Partial<PortfolioSectionVisibility>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
