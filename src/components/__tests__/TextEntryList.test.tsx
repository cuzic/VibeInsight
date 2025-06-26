import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextEntryList } from '../TextEntryList';

const mockEntries = [
  {
    id: '1',
    content: 'テストエントリー1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    content: 'テストエントリー2',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

describe('TextEntryList', () => {
  it('エントリーが正しく表示される', () => {
    const mockOnDelete = vi.fn();
    render(
      <TextEntryList 
        entries={mockEntries} 
        onDelete={mockOnDelete} 
        loading={false}
      />
    );
    
    expect(screen.getByText('テストエントリー1')).toBeInTheDocument();
    expect(screen.getByText('テストエントリー2')).toBeInTheDocument();
  });

  it('エントリーがない場合のメッセージが表示される', () => {
    const mockOnDelete = vi.fn();
    render(
      <TextEntryList 
        entries={[]} 
        onDelete={mockOnDelete} 
        loading={false}
      />
    );
    
    expect(screen.getByText('まだテキストが保存されていません')).toBeInTheDocument();
  });

  it('削除ボタンクリック時にonDeleteが呼ばれる', () => {
    const mockOnDelete = vi.fn();
    render(
      <TextEntryList 
        entries={mockEntries} 
        onDelete={mockOnDelete} 
        loading={false}
      />
    );
    
    const deleteButtons = screen.getAllByTitle('削除');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('ローディング状態でスケルトンが表示される', () => {
    const mockOnDelete = vi.fn();
    render(
      <TextEntryList 
        entries={[]} 
        onDelete={mockOnDelete} 
        loading={true}
      />
    );
    
    expect(screen.getByText('保存されたテキスト')).toBeInTheDocument();
    // スケルトンローダーの確認
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});