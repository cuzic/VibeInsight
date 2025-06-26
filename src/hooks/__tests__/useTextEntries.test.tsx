import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTextEntries } from '../useTextEntries';

// Supabaseのモックを更新
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({ 
        data: [
          { id: '1', content: 'テスト', created_at: '2024-01-01T00:00:00Z' }
        ], 
        error: null 
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ 
          data: { id: '2', content: '新しいテスト', created_at: '2024-01-02T00:00:00Z' }, 
          error: null 
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
};

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('useTextEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態でエントリーを取得する', async () => {
    const { result } = renderHook(() => useTextEntries());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].content).toBe('テスト');
  });

  it('新しいエントリーを保存できる', async () => {
    const { result } = renderHook(() => useTextEntries());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await result.current.saveEntry('新しいテスト');
    
    expect(mockSupabase.from).toHaveBeenCalledWith('text_entries');
  });
});