import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BidCollector from './BidCollector';
import type { Round } from '../types';

describe('BidCollector', () => {
  const mockRound: Round = {
    roundNumber: 1,
    firstBidderIndex: 0,
    scores: [
      { name: 'Alice', bid: -1, met: null, score: 0, blindBid: false },
      { name: 'Bob', bid: -1, met: null, score: 0, blindBid: false },
      { name: 'Charlie', bid: -1, met: null, score: 0, blindBid: false },
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

  it('should show current bidder indicator in regular bidding phase', () => {
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

    // Alice is at index 0 (first to bid), should show pointer indicator
    const currentBidderIndicators = screen.getAllByText('👉');
    expect(currentBidderIndicators.length).toBeGreaterThan(0);
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
    vi.useFakeTimers();
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

    // Advance timers to trigger the 2-second delay
    vi.advanceTimersByTime(2000);

    expect(mockUpdate).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should show warning when total bids equal tricks', () => {
    const roundWithBids: Round = {
      ...mockRound,
      scores: [
        { name: 'Alice', bid: 1, met: null, score: 0, blindBid: false },
        { name: 'Bob', bid: 0, met: null, score: 0, blindBid: false },
        { name: 'Charlie', bid: 0, met: null, score: 0, blindBid: false },
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

  it('should display blind bids correctly when transitioning to regular bidding phase', () => {
    const mockUpdate = vi.fn();
    const mockComplete = vi.fn();

    // Create a round where Alice has a blind bid
    const roundWithBlindBid: Round = {
      roundNumber: 3,
      firstBidderIndex: 0,
      scores: [
        { name: 'Alice', bid: 2, met: null, score: 0, blindBid: true },
        { name: 'Bob', bid: -1, met: null, score: 0, blindBid: false },
        { name: 'Charlie', bid: -1, met: null, score: 0, blindBid: false },
      ],
    };

    render(
      <BidCollector
        round={roundWithBlindBid}
        tricksAvailable={3}
        onUpdate={mockUpdate}
        onComplete={mockComplete}
      />
    );

    // Should be in blind bid phase initially
    expect(screen.getByText(/Blind Bid Phase/i)).toBeInTheDocument();

    // Click continue to go to regular bidding phase
    const continueButton = screen.getByText('Continue to Regular Bidding →');
    fireEvent.click(continueButton);

    // Now in regular bidding phase
    expect(screen.getByText(/Place Your Bids/i)).toBeInTheDocument();

    // Should show blind bids summary section
    expect(screen.getByText(/Blind Bids \(already submitted\):/i)).toBeInTheDocument();

    // Alice's blind bid should be visible and show the correct value (2, not -1)
    // The blind bid should be displayed in the summary section
    const aliceElements = screen.getAllByText('Alice');
    expect(aliceElements.length).toBeGreaterThan(0);

    // Check that Alice's bid shows as "2" (the format is "Bid: 2")
    expect(screen.getByText(/Bid: 2/i)).toBeInTheDocument();
  });
});
