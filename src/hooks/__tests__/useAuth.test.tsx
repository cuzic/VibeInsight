import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';

const mockAuth = {
  getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } }
  })),
  signUp: vi.fn(() => Promise.resolve({ data: null, error: null })),
  signInWithPassword: vi.fn(() => Promise.resolve({ data: null, error: null })),
  signOut: vi.fn(() => Promise.resolve({ error: null }))
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: mockAuth
  }
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態でローディングが true', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('セッション取得後にローディングが false になる', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('サインアップ関数が正しく動作する', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await result.current.signUp('test@example.com', 'password');
    
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });
});