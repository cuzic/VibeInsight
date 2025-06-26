import { supabase } from '../lib/supabase';
import type { TextEntry } from '../types';

export const textEntriesService = {
  async fetchEntries(): Promise<TextEntry[]> {
    const { data, error } = await supabase
      .from('japanese_text_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
    
    return data || [];
  },

  async saveEntry(content: string): Promise<TextEntry> {
    const { data, error } = await supabase
      .from('japanese_text_entries')
      .insert([{ content }])
      .select()
      .single();

    if (error) {
      console.error('❌ Save error:', error);
      throw error;
    }
    
    return data;
  },

  async deleteEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('japanese_text_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  }
};