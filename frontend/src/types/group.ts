// A role as we send it when creating a group
export type RoleInputPayload = {
  uuid?: string; // optional; if present backend will version it
  name: string;
  description?: string | null;
  role_type: string;
  items: {
    bag: string | null;
    cape: string | null;
    head: string | null;
    armor: string | null;
    shoes: string | null;
    weapon: string | null;
    off_hand: string | null;
    potion: string | null;
    food: string | null;
    mount: string | null;
  };
};

// Payload for POST /groups
export type GroupCreatePayload = {
  name: string;
  description?: string | null;
  tags: string[];
  roles: RoleInputPayload[];
  creator_id: string;
};

// Group as returned from backend
export type Group = {
  id: string;
  uuid: string;
  name: string;
  description?: string | null;
  tags: string[];
  roles: string[]; // list of role UUIDs
  creator_id?: string | null;
  created_at: string;
};
