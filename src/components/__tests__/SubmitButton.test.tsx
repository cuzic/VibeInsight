import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SubmitButton } from '../SubmitButton';

describe('SubmitButton', () => {
  it('通常状態で保存ボタンが表示される', () => {
    render(<SubmitButton isSubmitting={false} />);
    
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('送信中状態でローディングが表示される', () => {
    render(<SubmitButton isSubmitting={true} />);
    
    expect(screen.getByText('保存中...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});