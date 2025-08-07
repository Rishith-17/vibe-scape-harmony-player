// Custom types for profiles table with gesture_controls
export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  gesture_controls: boolean;
  created_at: string;
  updated_at: string;
}