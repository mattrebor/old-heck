import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Totals from './Totals';
import type { Round } from '../types';

describe('Totals', () => {
  const mockRounds: Round[] = [
    {
      roundNumber: 1,
      firstBidderIndex: 0,
      scores: [
        { name: 'Alice', bid: 1, met: true, score: 11, blindBid: false },
        { name: 'Bob', bid: 0, met: true, score: 10, blindBid: false },
      ],
    },
    {
      roundNumber: 2,
      firstBidderIndex: 1,
      scores: [
        { name: 'Alice', bid: 2, met: true, score: 14, blindBid: false },
        { name: 'Bob', bid: 1, met: false, score: -1, blindBid: false },
      ],
    },
  ];

  it('should return null when no rounds are provided', () => {
    const { container } = render(<Totals rounds={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display score breakdown heading', () => {
    render(<Totals rounds={mockRounds} />);
    expect(screen.getByText(/Score Breakdown/i)).toBeInTheDocument();
  });

  it('should show total scores for all players', () => {
    render(<Totals rounds={mockRounds} />);

    // Alice total: 11 + 14 = 25
    // Bob total: 10 + (-1) = 9
    // Scores appear in both mobile and desktop views
    expect(screen.getAllByText('25').length).toBeGreaterThan(0);
    expect(screen.getAllByText('9').length).toBeGreaterThan(0);
  });

  it('should display winner crown for highest score', () => {
    render(<Totals rounds={mockRounds} />);

    // Winner (Alice with 25 points) should have crown
    const crowns = screen.getAllByText('👑');
    expect(crowns.length).toBeGreaterThan(0);
  });

  it('should display player rankings', () => {
    render(<Totals rounds={mockRounds} />);

    // Should show ranks #1 and #2 in both mobile and desktop views
    expect(screen.getAllByText('#1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('#2').length).toBeGreaterThan(0);
  });

  it('should show round numbers', () => {
    render(<Totals rounds={mockRounds} />);

    // Round headers appear in both mobile and desktop views
    expect(screen.getAllByText(/Round 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Round 2/i).length).toBeGreaterThan(0);
  });

  it('should display point deltas when showDeltas is true', () => {
    render(<Totals rounds={mockRounds} showDeltas={true} />);

    // Latest round (round 2) deltas: Alice +14, Bob -1
    const deltaTexts = screen.getAllByText((content, element) => {
      return !!(element?.className?.includes('font-bold') &&
             (content === '+14' || content === '-1'));
    });
    expect(deltaTexts.length).toBeGreaterThan(0);
  });

  it('should not display point deltas when showDeltas is false', () => {
    render(<Totals rounds={mockRounds} showDeltas={false} />);

    // Delta indicators have specific styling: text-sm font-bold with color classes
    // Round scores have different styling: font-mono
    // Check that no delta-style elements exist (text-sm with green-600/red-600)
    const deltaTexts = screen.queryAllByText((_content, element) => {
      const className = element?.className || '';
      return className.includes('text-sm') &&
             className.includes('font-bold') &&
             (className.includes('text-green-600') || className.includes('text-red-600'));
    });
    expect(deltaTexts.length).toBe(0);
  });

  it('should calculate ranks correctly with tied scores', () => {
    const tiedRounds: Round[] = [
      {
        roundNumber: 1,
        firstBidderIndex: 0,
        scores: [
          { name: 'Alice', bid: 1, met: true, score: 11, blindBid: false },
          { name: 'Bob', bid: 1, met: true, score: 11, blindBid: false },
          { name: 'Charlie', bid: 0, met: true, score: 10, blindBid: false },
        ],
      },
    ];

    render(<Totals rounds={tiedRounds} />);

    // Both Alice and Bob should be #1 (tied)
    const rank1Elements = screen.getAllByText('#1');
    expect(rank1Elements.length).toBeGreaterThanOrEqual(2);

    // Charlie should be #2 (appears in both mobile and desktop views)
    expect(screen.getAllByText('#2').length).toBeGreaterThan(0);
  });
});
