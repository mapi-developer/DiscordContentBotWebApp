export type Group = {
  id: string;
  uuid: string;
  name: string;
  description?: string | null;
  tags?: string[] | null;
  // List of role uuids that belong to this group
  roles: string[];
  creator_id: string;
  created_at?: string;
};

// Payload we send when creating a new group together with its roles
export type RoleInputPayload = {
  uuid?: string; // if present we try to reuse / update this role
  name: string;
  description?: string | null;
  role_type: string;
  items: {
    bag: string | null;
    cape: string | null;
    weapon: string | null;
    off_hand: string | null;
    head: string | null;
    armor: string | null;
    shoes: string | null;
    potion: string | null;
    food: string | null;
    mount: string | null;
  };
};

export type GroupCreatePayload = {
  name: string;
  description?: string | null;
  tags?: string[];
  roles: RoleInputPayload[];
};
