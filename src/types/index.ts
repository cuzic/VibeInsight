export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface TextEntry {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface LoginSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  login_time: string;
  last_activity: string;
  is_active: boolean;
  logout_time?: string;
  device_type: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export interface TextEntriesState {
  entries: TextEntry[];
  loading: boolean;
  error: string | null;
  deleteLoading: string | null;
}

export interface AuthHookReturn extends AuthState {
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

export interface TextEntriesHookReturn extends TextEntriesState {
  saveEntry: (content: string) => Promise<TextEntry>;
  deleteEntry: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  email: string;
  login_type: 'signin' | 'signup';
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}