import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  is_veg: boolean;
  available: boolean;
  sort_order: number;
};

export type GalleryItem = {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export const menuQuery = queryOptions({
  queryKey: ["menu"],
  // Cache aggressively: menu changes only when the owner publishes.
  // This stops the "takes forever to read menu" refetch on every visit.
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  // Never crash a public page if the database is unreachable — show empty menu instead.
  retry: 1,
  queryFn: async (): Promise<MenuItem[]> => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name");
      if (error) throw error;
      return (data ?? []).map((d) => ({ ...d, price: Number(d.price) }));
    } catch (e) {
      console.error("menuQuery failed", e);
      return [];
    }
  },
});

const DEFAULT_SETTINGS = {
  id: 1,
  phone: null as string | null,
  whatsapp: null as string | null,
  updated_at: "",
  banner_image_url: null as string | null,
  banner_eyebrow: "Shri Rudra",
  banner_heading: "Murthal Walo Ka Dhaba",
  banner_text:
    "Murthal-style food on NH-734 near Bijnor. Fresh tandoor, white-butter parathas and chai — right on the highway.",
  banner_primary_button: "Navigate",
  banner_secondary_button: "Call Dhaba",
  banner_video_path: null as string | null,
  logo_image_url: null as string | null,
  about_heading: "A highway stop made for a proper pause",
  about_text:
    "Shri Rudra Murthal Walo Ka Dhaba welcomes diners on NH-734 near Bijnor. Visit for a dine-in break, browse the live menu, and order from your table.",
  about_image_url: null as string | null,
};

/**
 * Banner videos live under `public-media/` (public-read policy), so use a
 * permanent public URL — signed URLs expire after an hour and kill the banner.
 */
export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("public-media/")) {
    const { data } = supabase.storage.from("site-media").getPublicUrl(path);
    return data.publicUrl || null;
  }
  return null;
}

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  // Public pages must render even if Supabase is down or keys are missing.
  retry: 1,
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      const settings = data ?? DEFAULT_SETTINGS;
      // Never render blank text: an empty string saved in the DB falls back
      // to the default copy so headings and buttons can't disappear.
      const text = (value: unknown, fallback: string) => {
        const trimmed = typeof value === "string" ? value.trim() : "";
        return trimmed.length > 0 ? trimmed : fallback;
      };
      const withCopy = {
        ...settings,
        banner_eyebrow: text(settings.banner_eyebrow, DEFAULT_SETTINGS.banner_eyebrow),
        banner_heading: text(settings.banner_heading, DEFAULT_SETTINGS.banner_heading),
        banner_text: text(settings.banner_text, DEFAULT_SETTINGS.banner_text),
        banner_primary_button: text(
          settings.banner_primary_button,
          DEFAULT_SETTINGS.banner_primary_button,
        ),
        banner_secondary_button: text(
          settings.banner_secondary_button,
          DEFAULT_SETTINGS.banner_secondary_button,
        ),
        about_heading: text(settings.about_heading, DEFAULT_SETTINGS.about_heading),
        about_text: text(settings.about_text, DEFAULT_SETTINGS.about_text),
      };
      let banner_video_url: string | null = publicMediaUrl(withCopy.banner_video_path);
      if (!banner_video_url && withCopy.banner_video_path) {
        // Legacy / non-public paths: fall back to a short-lived signed URL.
        try {
          const { data: signed } = await supabase.storage
            .from("site-media")
            .createSignedUrl(withCopy.banner_video_path, 3600);
          banner_video_url = signed?.signedUrl ?? null;
        } catch {
          banner_video_url = null;
        }
      }
      return { ...withCopy, banner_video_url };
    } catch (e) {
      console.error("settingsQuery failed", e);
      return { ...DEFAULT_SETTINGS, banner_video_url: null as string | null };
    }
  },
});

export const galleryQuery = queryOptions({
  queryKey: ["gallery"],
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
  queryFn: async (): Promise<GalleryItem[]> => {
    try {
      const { data, error } = await supabase
        .from("gallery_media")
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    } catch (e) {
      console.error("galleryQuery failed", e);
      return [];
    }
  },
});
