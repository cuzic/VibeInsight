import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextInput } from '../TextInput';

describe('TextInput', () => {
  it('テキストが正しく表示される', () => {
    const mockOnChange = vi.fn();
    render(
      <TextInput 
        value="テストテキスト" 
        onChange={mockOnChange} 
        placeholder="プレースホルダー"
      />
    );
    
    const textarea = screen.getByDisplayValue('テストテキスト');
    expect(textarea).toBeInTheDocument();
  });

  it('テキスト変更時にonChangeが呼ばれる', () => {
    const mockOnChange = vi.fn();
    render(
      <TextInput 
        value="" 
        onChange={mockOnChange} 
        placeholder="プレースホルダー"
      />
    );
    
    const textarea = screen.getByPlaceholderText('プレースホルダー');
    fireEvent.change(textarea, { target: { value: '新しいテキスト' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('新しいテキスト');
  });

  it('ラベルが正しく表示される', () => {
    const mockOnChange = vi.fn();
    render(
      <TextInput 
        value="" 
        onChange={mockOnChange} 
        label="カスタムラベル"
      />
    );
    
    expect(screen.getByText('カスタムラベル')).toBeInTheDocument();
  });
});