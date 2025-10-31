export type Group = {
  id: string;        // Mongo ObjectId as string
  uuid: string;      // Stable external identifier
  name: string;
  description?: string | null;
  created_at?: string;
};
