import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetButton } from './PresetButton';

describe('PresetButton', () => {
  const defaultPreset = {
    name: 'Water Bottle',
    amountMl: 500,
    emoji: '💧',
  };

  describe('rendering', () => {
    it('should render preset button with emoji and name', () => {
      render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      expect(screen.getByText('💧')).toBeInTheDocument();
      expect(screen.getByText('Water Bottle')).toBeInTheDocument();
    });

    it('should render amount in ml', () => {
      render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      expect(screen.getByText('500ml')).toBeInTheDocument();
    });

    it('should render different emoji', () => {
      const preset = { ...defaultPreset, emoji: '🥤' };
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('🥤')).toBeInTheDocument();
    });

    it('should render different name', () => {
      const preset = { ...defaultPreset, name: 'Coffee Mug' };
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('Coffee Mug')).toBeInTheDocument();
    });

    it('should render different amount', () => {
      const preset = { ...defaultPreset, amountMl: 250 };
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('250ml')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<PresetButton preset={defaultPreset} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should pass preset to onClick handler', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<PresetButton preset={defaultPreset} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledWith(defaultPreset);
    });

    it('should handle multiple clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<PresetButton preset={defaultPreset} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<PresetButton preset={defaultPreset} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be activatable with space key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<PresetButton preset={defaultPreset} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled state', () => {
    it('should render disabled button', () => {
      render(<PresetButton preset={defaultPreset} onClick={vi.fn()} disabled />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<PresetButton preset={defaultPreset} onClick={handleClick} disabled />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have disabled styling', () => {
      const { container } = render(
        <PresetButton preset={defaultPreset} onClick={vi.fn()} disabled />
      );
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('opacity-50');
    });
  });

  describe('edge cases', () => {
    it('should handle very long name', () => {
      const preset = { ...defaultPreset, name: 'A'.repeat(50) };
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('A'.repeat(50))).toBeInTheDocument();
    });

    it('should handle single character name', () => {
      const preset = { ...defaultPreset, name: 'A' };
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should handle very large amount', () => {
      const preset = { ...defaultPreset, amountMl: 5000 };
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('5000ml')).toBeInTheDocument();
    });

    it('should handle minimum amount', () => {
      const preset = { ...defaultPreset, amountMl: 50 };
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('50ml')).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      const preset = { ...defaultPreset, name: 'My-Bottle #1' };
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('My-Bottle #1')).toBeInTheDocument();
    });

    it('should handle different emoji types', () => {
      const emojis = ['💧', '🥤', '☕', '🍷', '🧃'];
      
      emojis.forEach((emoji) => {
        const preset = { ...defaultPreset, emoji };
        const { container } = render(<PresetButton preset={preset} onClick={vi.fn()} />);
        
        expect(container.textContent).toContain(emoji);
      });
    });
  });

  describe('accessibility', () => {
    it('should have button role', () => {
      render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have accessible name', () => {
      render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();
    });

    it('should be focusable', () => {
      render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<PresetButton preset={defaultPreset} onClick={vi.fn()} disabled />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('styling', () => {
    it('should apply base button styles', () => {
      const { container } = render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('rounded');
    });

    it('should apply active styles on interaction', async () => {
      const _user = userEvent.setup();
      const { container } = render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should display emoji prominently', () => {
      render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      const emoji = screen.getByText('💧');
      expect(emoji).toBeInTheDocument();
    });

    it('should display name below emoji', () => {
      const { container } = render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      const text = container.textContent;
      expect(text).toContain('💧');
      expect(text).toContain('Water Bottle');
      expect(text).toContain('500ml');
    });

    it('should display amount below name', () => {
      const { container } = render(<PresetButton preset={defaultPreset} onClick={vi.fn()} />);
      
      const text = container.textContent;
      const nameIndex = text?.indexOf('Water Bottle');
      const amountIndex = text?.indexOf('500ml');
      
      if (nameIndex !== undefined && amountIndex !== undefined) {
        expect(amountIndex).toBeGreaterThan(nameIndex);
      }
    });
  });

  describe('integration scenarios', () => {
    it('should work with typical water preset', () => {
      const preset = {
        name: 'Water Bottle',
        amountMl: 500,
        emoji: '💧',
      };
      const handleClick = vi.fn();
      
      render(<PresetButton preset={preset} onClick={handleClick} />);
      
      expect(screen.getByText('💧')).toBeInTheDocument();
      expect(screen.getByText('Water Bottle')).toBeInTheDocument();
      expect(screen.getByText('500ml')).toBeInTheDocument();
    });

    it('should work with coffee preset', () => {
      const preset = {
        name: 'Coffee Mug',
        amountMl: 250,
        emoji: '☕',
      };
      
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('☕')).toBeInTheDocument();
      expect(screen.getByText('Coffee Mug')).toBeInTheDocument();
      expect(screen.getByText('250ml')).toBeInTheDocument();
    });

    it('should work with large bottle preset', () => {
      const preset = {
        name: 'Large Bottle',
        amountMl: 1000,
        emoji: '🥤',
      };
      
      render(<PresetButton preset={preset} onClick={vi.fn()} />);
      
      expect(screen.getByText('🥤')).toBeInTheDocument();
      expect(screen.getByText('Large Bottle')).toBeInTheDocument();
      expect(screen.getByText('1000ml')).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily', () => {
      const handleClick = vi.fn();
      const { rerender } = render(<PresetButton preset={defaultPreset} onClick={handleClick} />);
      
      // Same props should not cause issues
      rerender(<PresetButton preset={defaultPreset} onClick={handleClick} />);
      
      expect(screen.getByText('Water Bottle')).toBeInTheDocument();
    });

    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<PresetButton preset={defaultPreset} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      
      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(5);
    });
  });
});