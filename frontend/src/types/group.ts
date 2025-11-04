export type Group = {
  id: string;
  uuid: string;
  name: string;
  description?: string | null;
  role_type?: string | null;
  tags?: string[] | null;
  items: {
    "bag": string
    "cape": string
    "weapon": string
    "off_hand": string
    "head": string
    "armor": string
    "shoes": string
    "potion": string
    "food": string
    "mount": string
  }
  creator_id: string;
  created_at?: string;
};
