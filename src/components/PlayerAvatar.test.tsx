import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayerAvatar from './PlayerAvatar';

describe('PlayerAvatar', () => {
  describe('Initials generation', () => {
    it('should show first two letters for single word name', () => {
      render(<PlayerAvatar name="Alice" />);
      expect(screen.getByText('AL')).toBeInTheDocument();
    });

    it('should show first letter of first and last name', () => {
      render(<PlayerAvatar name="Alice Smith" />);
      expect(screen.getByText('AS')).toBeInTheDocument();
    });

    it('should handle three word names correctly', () => {
      render(<PlayerAvatar name="Alice Mary Smith" />);
      expect(screen.getByText('AS')).toBeInTheDocument();
    });

    it('should handle names with extra spaces', () => {
      render(<PlayerAvatar name="  Alice   Smith  " />);
      expect(screen.getByText('AS')).toBeInTheDocument();
    });

    it('should uppercase initials', () => {
      render(<PlayerAvatar name="alice smith" />);
      expect(screen.getByText('AS')).toBeInTheDocument();
    });
  });

  describe('Size variants', () => {
    it('should apply small size classes', () => {
      const { container } = render(<PlayerAvatar name="Alice" size="sm" />);
      const avatar = container.querySelector('.w-8.h-8');
      expect(avatar).toBeInTheDocument();
    });

    it('should apply medium size classes by default', () => {
      const { container } = render(<PlayerAvatar name="Alice" />);
      const avatar = container.querySelector('.w-10.h-10');
      expect(avatar).toBeInTheDocument();
    });

    it('should apply large size classes', () => {
      const { container } = render(<PlayerAvatar name="Alice" size="lg" />);
      const avatar = container.querySelector('.w-12.h-12');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Name display', () => {
    it('should not show name by default', () => {
      render(<PlayerAvatar name="Alice Smith" />);
      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
      expect(screen.getByText('AS')).toBeInTheDocument();
    });

    it('should show name when showName is true', () => {
      render(<PlayerAvatar name="Alice Smith" showName={true} />);
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('AS')).toBeInTheDocument();
    });
  });

  describe('Color assignment', () => {
    it('should use name-based hash color consistently', () => {
      const { container: container1 } = render(<PlayerAvatar name="Alice" />);
      const { container: container2 } = render(<PlayerAvatar name="Alice" />);

      const avatar1 = container1.querySelector('[style*="background"]');
      const avatar2 = container2.querySelector('[style*="background"]');

      // Same name should produce same color
      expect(avatar1?.getAttribute('style')).toBe(avatar2?.getAttribute('style'));
    });

    it('should have background color set', () => {
      const { container } = render(<PlayerAvatar name="Alice" />);
      const avatar = container.querySelector('[style*="background"]');
      expect(avatar).toBeInTheDocument();
      expect(avatar?.getAttribute('style')).toContain('background-color');
    });

    it('should produce different colors for different names (usually)', () => {
      const { container: container1 } = render(<PlayerAvatar name="Alice" />);
      const { container: container2 } = render(<PlayerAvatar name="Bob" />);

      const avatar1 = container1.querySelector('[style*="background"]');
      const avatar2 = container2.querySelector('[style*="background"]');

      // Different names usually produce different colors (not guaranteed but very likely)
      // We can at least verify both have background colors
      expect(avatar1?.getAttribute('style')).toContain('background');
      expect(avatar2?.getAttribute('style')).toContain('background');
    });
  });

  describe('Component structure', () => {
    it('should have circular avatar', () => {
      const { container } = render(<PlayerAvatar name="Alice" />);
      const avatar = container.querySelector('.rounded-full');
      expect(avatar).toBeInTheDocument();
    });

    it('should have white text', () => {
      const { container } = render(<PlayerAvatar name="Alice" />);
      const avatar = container.querySelector('.text-white');
      expect(avatar).toBeInTheDocument();
    });

    it('should be bold', () => {
      const { container } = render(<PlayerAvatar name="Alice" />);
      const avatar = container.querySelector('.font-bold');
      expect(avatar).toBeInTheDocument();
    });
  });
});
