import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { TextEntry, TextEntriesHookReturn } from '../types';

export const useTextEntries = (): TextEntriesHookReturn => {
  const [entries, setEntries] = useState<TextEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      console.log('📋 Fetching japanese text entries...');
      setLoading(true);
      setError(null);
      
      // タイムアウト付きでデータを取得
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('japanese_text_entries')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }
      
      console.log('✅ Entries fetched successfully:', data?.length || 0, 'entries');
      setEntries(data || []);
    } catch (err) {
      console.error('❌ Error fetching entries:', err);
      const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(errorMessage);
      setEntries([]);
    } finally {
      console.log('🏁 Setting entries loading to false');
      setLoading(false);
    }
  };

  const saveEntry = async (content: string): Promise<TextEntry> => {
    try {
      console.log('💾 Saving entry:', content.substring(0, 50) + '...');
      setError(null);
      
      // タイムアウト付きで保存
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('保存がタイムアウトしました')), 15000)
      );
      
      const savePromise = supabase
        .from('japanese_text_entries')
        .insert([{ content }])
        .select()
        .single();

      const { data, error } = await Promise.race([savePromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Save error:', error);
        throw error;
      }
      
      console.log('✅ Entry saved successfully:', data.id);
      
      setEntries(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('❌ Error saving entry:', err);
      const errorMessage = err instanceof Error ? err.message : 'エントリーの保存に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteEntry = async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting entry with ID:', id);
      setDeleteLoading(id);
      setError(null);
      
      // タイムアウト付きで削除
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('削除がタイムアウトしました')), 10000)
      );
      
      const deletePromise = supabase
        .from('japanese_text_entries')
        .delete()
        .eq('id', id);

      const { error } = await Promise.race([deletePromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }
      
      console.log('✅ Entry deleted successfully');
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (err) {
      console.error('❌ Error deleting entry:', err);
      const errorMessage = err instanceof Error ? err.message : 'エントリーの削除に失敗しました';
      setError(errorMessage);
      alert(`削除に失敗しました: ${errorMessage}`);
    } finally {
      console.log('🏁 Setting delete loading to null');
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    console.log('🚀 useTextEntries effect triggered');
    fetchEntries();
  }, []);

  console.log('📋 TextEntries hook state:', { 
    entriesCount: entries.length, 
    loading, 
    error: !!error,
    deleteLoading 
  });

  return {
    entries,
    loading,
    error,
    deleteLoading,
    saveEntry,
    deleteEntry,
    refetch: fetchEntries
  };
};