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

export type PricingTier = {
  id: string;
  slug: string;
  name: string;
  price_label: string;
  price_note: string;
  description: string;
  cta_label: string;
  cta_url: string;
  highlighted: boolean;
  sort_order: number;
  published: boolean;
  created_at: string;
};

export type PricingFeature = {
  id: string;
  label: string;
  note: string;
  /** Tier slug -> value. "yes"/"no"/"-" render as marks, anything else verbatim. */
  values: Record<string, string>;
  sort_order: number;
  published: boolean;
  created_at: string;
};

export type PricingSettings = {
  id: number;
  heading: string;
  subheading: string;
  description: string;
  payment_note: string;
  footnote: string;
  updated_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
};

export type BoAdmin = {
  user_id: string;
  created_at: string;
};

export type MessageSender = "user" | "admin";

export type BoMessage = {
  id: string;
  user_id: string;
  user_email: string;
  sender: MessageSender;
  body: string;
  read: boolean;
  created_at: string;
};

export type BoScript = {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
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
      pricing_tiers: {
        Row: PricingTier;
        Insert: Omit<PricingTier, "id" | "created_at">;
        Update: Partial<Omit<PricingTier, "id" | "created_at">>;
        Relationships: [];
      };
      pricing_features: {
        Row: PricingFeature;
        Insert: Omit<PricingFeature, "id" | "created_at">;
        Update: Partial<Omit<PricingFeature, "id" | "created_at">>;
        Relationships: [];
      };
      pricing_settings: {
        Row: PricingSettings;
        Insert: Partial<Omit<PricingSettings, "updated_at">>;
        Update: Partial<Omit<PricingSettings, "id">>;
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
      bo_admins: {
        Row: BoAdmin;
        Insert: Omit<BoAdmin, "created_at">;
        Update: Partial<Omit<BoAdmin, "created_at">>;
        Relationships: [];
      };
      bo_messages: {
        Row: BoMessage;
        Insert: Omit<BoMessage, "id" | "created_at" | "read"> & { read?: boolean };
        Update: Partial<Omit<BoMessage, "id" | "created_at">>;
        Relationships: [];
      };
      bo_scripts: {
        Row: BoScript;
        Insert: Omit<BoScript, "id" | "created_at" | "updated_at" | "content"> &
          Partial<Pick<BoScript, "content">>;
        Update: Partial<Omit<BoScript, "id" | "created_at" | "owner_id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      /**
       * Script access is routed through these instead of querying bo_scripts
       * directly: the table itself is owner-only, and knowing a script's uuid
       * is what "having the share link" means. See migration 0009.
       */
      bo_script_get: {
        Args: { p_id: string };
        Returns: BoScript[];
      };
      bo_script_save: {
        Args: { p_id: string; p_content: string };
        Returns: undefined;
      };
      bo_script_rename: {
        Args: { p_id: string; p_title: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
