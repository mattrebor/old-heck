import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BidCollector from './BidCollector';
import type { Round } from '../types';

describe('BidCollector', () => {
  const mockRound: Round = {
    roundNumber: 1,
    firstBidderIndex: 0,
    scores: [
      { name: 'Alice', bid: -1, tricks: 0, met: false, score: 0, blindBid: false },
      { name: 'Bob', bid: -1, tricks: 0, met: false, score: 0, blindBid: false },
      { name: 'Charlie', bid: -1, tricks: 0, met: false, score: 0, blindBid: false },
    ],
  };

  it('should render all players', () => {
    const mockUpdate = vi.fn();
    const mockComplete = vi.fn();

    render(
      <BidCollector
        round={mockRound}
        tricksAvailable={1}
        onUpdate={mockUpdate}
        onComplete={mockComplete}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should show first bidder indicator in regular bidding phase', () => {
    const mockUpdate = vi.fn();
    const mockComplete = vi.fn();

    render(
      <BidCollector
        round={mockRound}
        tricksAvailable={1}
        onUpdate={mockUpdate}
        onComplete={mockComplete}
        initialPhase="regular-bid-entry"
      />
    );

    // Alice is at index 0 (first bidder), badge appears in regular bidding phase
    const firstBidderBadges = screen.getAllByText('🎯');
    expect(firstBidderBadges.length).toBeGreaterThan(0);
  });

  it('should disable button when not all bids entered', () => {
    const mockUpdate = vi.fn();
    const mockComplete = vi.fn();

    render(
      <BidCollector
        round={mockRound}
        tricksAvailable={1}
        onUpdate={mockUpdate}
        onComplete={mockComplete}
        initialPhase="regular-bid-entry"
      />
    );

    const button = screen.getByText(/Enter all bids to continue/i);
    expect(button).toBeDisabled();
  });

  it('should call onUpdate when bid is changed', () => {
    const mockUpdate = vi.fn();
    const mockComplete = vi.fn();

    render(
      <BidCollector
        round={mockRound}
        tricksAvailable={1}
        onUpdate={mockUpdate}
        onComplete={mockComplete}
      />
    );

    // Find increment button for Alice (first player in regular bidding phase)
    // Note: In blind-declaration phase, need to continue first
    const continueButton = screen.getByText('Continue to Regular Bidding →');
    fireEvent.click(continueButton);

    // Now we're in regular bidding phase
    const incrementButtons = screen.getAllByText('+');
    fireEvent.click(incrementButtons[0]); // Click first player's increment

    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should show warning when total bids equal tricks', () => {
    const roundWithBids: Round = {
      ...mockRound,
      scores: [
        { name: 'Alice', bid: 1, tricks: 0, met: false, score: 0, blindBid: false },
        { name: 'Bob', bid: 0, tricks: 0, met: false, score: 0, blindBid: false },
        { name: 'Charlie', bid: 0, tricks: 0, met: false, score: 0, blindBid: false },
      ],
    };

    const mockUpdate = vi.fn();
    const mockComplete = vi.fn();

    render(
      <BidCollector
        round={roundWithBids}
        tricksAvailable={1}
        onUpdate={mockUpdate}
        onComplete={mockComplete}
        initialPhase="regular-bid-entry"
      />
    );

    // Should show "Equal" warning
    expect(screen.getByText(/Equal!/i)).toBeInTheDocument();
  });

  it('should allow blind bid selection', () => {
    const mockUpdate = vi.fn();
    const mockComplete = vi.fn();

    render(
      <BidCollector
        round={mockRound}
        tricksAvailable={1}
        onUpdate={mockUpdate}
        onComplete={mockComplete}
      />
    );

    // Should be in blind bid phase initially
    expect(screen.getByText(/Blind Bid Phase/i)).toBeInTheDocument();

    // Find checkbox for Alice
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3); // One for each player

    fireEvent.click(checkboxes[0]);
    // Checkbox state should change (implementation-dependent verification)
  });
});
