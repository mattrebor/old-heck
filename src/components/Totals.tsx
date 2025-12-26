import React, { useState } from "react";
import type { Round } from "../types";
import PlayerAvatar from "./PlayerAvatar";
import BidDisplay from "./BidDisplay";

export default function Totals({
  rounds,
  showDeltas = false,
}: {
  rounds: Round[];
  showDeltas?: boolean;
}) {
  // When showing deltas (score review mode), auto-expand the latest round
  const latestRoundNumber = rounds.length > 0 ? rounds[rounds.length - 1].roundNumber : 0;
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(
    showDeltas && latestRoundNumber > 0 ? new Set([latestRoundNumber]) : new Set()
  );

  if (rounds.length === 0) return null;

  // Get players from first round (maintains order)
  const players = rounds[0].scores.map((s) => s.name);

  const toggleRound = (roundNumber: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber);
    } else {
      newExpanded.add(roundNumber);
    }
    setExpandedRounds(newExpanded);
  };

  // Calculate totals for each player
  const totals: Record<string, number> = {};
  rounds.forEach((r) =>
    r.scores.forEach((s) => {
      totals[s.name] = (totals[s.name] ?? 0) + s.score;
    })
  );

  // Calculate running totals for each round
  // runningTotals[roundNumber][playerName] = cumulative score up to that round
  const runningTotals: Record<number, Record<string, number>> = {};
  rounds.forEach((round, idx) => {
    runningTotals[round.roundNumber] = {};
    round.scores.forEach((s) => {
      // Sum all scores from rounds 0 to current idx
      const cumulativeScore = rounds
        .slice(0, idx + 1)
        .reduce((sum, r) => {
          const playerScore = r.scores.find((ps) => ps.name === s.name);
          return sum + (playerScore?.score ?? 0);
        }, 0);
      runningTotals[round.roundNumber][s.name] = cumulativeScore;
    });
  });

  // Find the winner(s)
  const maxScore = Math.max(...Object.values(totals));

  // Sort players by total score (descending) for mobile view
  const sortedPlayers = [...players].sort((a, b) => totals[b] - totals[a]);

  // Calculate ranks for each player (players with same score get same rank)
  const playerRanks: Record<string, number> = {};
  const sortedScores = [...new Set(Object.values(totals))].sort((a, b) => b - a);
  players.forEach((name) => {
    playerRanks[name] = sortedScores.indexOf(totals[name]) + 1;
  });

  // Calculate point deltas (points from most recent round)
  const deltas: Record<string, number> = {};
  if (showDeltas && rounds.length > 0) {
    const latestRound = rounds[rounds.length - 1];
    latestRound.scores.forEach((s) => {
      deltas[s.name] = s.score;
    });
  }

  return (
    <div className="bg-gradient-to-br from-felt-300 to-felt-200 rounded-2xl p-4 md:p-8 mt-8 border-4 border-felt-500 shadow-card-hover">
      <h3 className="font-bold text-2xl md:text-3xl mb-4 md:mb-6 text-felt-600 flex items-center gap-2 md:gap-3">
        <span className="text-3xl md:text-4xl">📊</span>
        Score Breakdown
      </h3>

      {/* Mobile vertical layout */}
      <div className="md:hidden space-y-4">
        {/* Totals first on mobile - sorted by score */}
        <div className="bg-gradient-to-r from-felt-400 to-felt-300 rounded-xl p-4 shadow-card">
          <h4 className="font-bold text-white text-lg mb-3">TOTAL SCORES</h4>
          <div className="space-y-2">
            {sortedPlayers.map((name) => {
              const isWinner = totals[name] === maxScore;
              const rank = playerRanks[name];
              return (
                <div
                  key={name}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isWinner
                      ? "bg-gradient-to-br from-gold-500 to-orange-500"
                      : "bg-white/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700 w-6">#{rank}</span>
                    <PlayerAvatar name={name} size="md" showName={true} />
                    {isWinner && <span className="text-xl">👑</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Delta indicator */}
                    {showDeltas && (
                      <span
                        className={`text-sm font-bold ${
                          deltas[name] > 0
                            ? "text-green-600"
                            : deltas[name] < 0
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {deltas[name] > 0 ? `+${deltas[name]}` : deltas[name]}
                      </span>
                    )}
                    {/* Total score */}
                    <span
                      className={`font-mono text-xl font-bold ${
                        totals[name] < 0 ? "text-red-700" : "text-green-700"
                      }`}
                    >
                      {totals[name]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rounds */}
        {rounds.map((round) => {
          const isExpanded = expandedRounds.has(round.roundNumber);
          const isLatestRound = showDeltas && round.roundNumber === latestRoundNumber;
          return (
            <div
              key={round.roundNumber}
              className={`bg-white rounded-xl shadow-card overflow-hidden ${
                isLatestRound ? "ring-4 ring-green-400" : ""
              }`}
            >
              <div
                onClick={() => toggleRound(round.roundNumber)}
                className={`${
                  isLatestRound ? "bg-green-600" : "bg-felt-500"
                } text-white font-bold flex items-center justify-between cursor-pointer ${
                  isExpanded ? "p-4" : "p-2"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={isExpanded ? "text-base" : "text-sm"}>
                    {isExpanded ? "▼" : "▶"}
                  </span>
                  <span className={isExpanded ? "text-base" : "text-sm"}>
                    {isLatestRound && "📊 "}Round {round.roundNumber}{isLatestRound && " (Latest)"}
                  </span>
                </span>
              </div>
              {isExpanded ? (
                <div className="p-4 space-y-3">
                  {players.map((name) => {
                    const playerScore = round.scores.find(
                      (s) => s.name === name
                    );
                    if (!playerScore) return null;

                    const runningTotal = runningTotals[round.roundNumber][name];
                    return (
                      <div
                        key={name}
                        className="flex items-center justify-between pb-3 border-b last:border-b-0 border-gray-200"
                      >
                        <PlayerAvatar name={name} size="md" showName={true} />
                        <div className="flex items-center gap-3">
                          <BidDisplay
                            bid={playerScore.bid}
                            isBlind={playerScore.blindBid}
                            size="sm"
                            suffix={
                              <span
                                className={
                                  playerScore.met
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {playerScore.met ? " ✓" : " ✗"}
                              </span>
                            }
                          />
                          <div className="flex flex-col items-end gap-0">
                            {/* Per-round delta - less prominent */}
                            <span
                              className={`font-mono text-xs ${
                                playerScore.score < 0
                                  ? "text-danger-500"
                                  : "text-success-500"
                              }`}
                            >
                              ({playerScore.score > 0 ? "+" : ""}
                              {playerScore.score})
                            </span>
                            {/* Running total - prominent */}
                            <span className="font-mono text-xl font-bold text-gray-800">
                              {runningTotal}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-2 overflow-x-auto">
                  <div className="flex items-center gap-3 min-w-max">
                    {players.map((name) => {
                      const playerScore = round.scores.find(
                        (s) => s.name === name
                      );
                      if (!playerScore) return null;

                      const runningTotal = runningTotals[round.roundNumber][name];
                      return (
                        <div
                          key={name}
                          className="flex flex-col items-center gap-1 flex-shrink-0"
                        >
                          <PlayerAvatar name={name} size="sm" />
                          {/* Per-round delta - less prominent */}
                          <span
                            className={`font-mono text-xs ${
                              playerScore.score < 0
                                ? "text-danger-500"
                                : "text-success-500"
                            }`}
                          >
                            ({playerScore.score > 0 ? "+" : ""}
                            {playerScore.score})
                          </span>
                          {/* Running total - prominent */}
                          <span className="font-mono text-base font-bold text-gray-800">
                            {runningTotal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop/Tablet horizontal table */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-card">
        <table className="w-full">
          <thead>
            <tr className="bg-felt-500">
              <th className="text-left p-5 text-white font-bold text-lg first:rounded-tl-xl">
                Round
              </th>
              {players.map((name) => (
                <th
                  key={name}
                  className="p-5 text-center font-bold text-lg last:rounded-tr-xl align-top"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 flex items-center justify-center">
                      <PlayerAvatar name={name} size="md" />
                    </div>
                    <span className="text-white text-sm">{name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, idx) => {
              const isExpanded = expandedRounds.has(round.roundNumber);
              const isLatestRound = showDeltas && round.roundNumber === latestRoundNumber;
              return (
                <React.Fragment key={round.roundNumber}>
                  <tr
                    onClick={() => toggleRound(round.roundNumber)}
                    className={`border-t border-gray-200 cursor-pointer transition-colors ${
                      isLatestRound
                        ? "bg-green-100 hover:bg-green-200"
                        : "hover:bg-gray-100"
                    } ${
                      idx === rounds.length - 1 && !isExpanded
                        ? "border-b-2 border-felt-400"
                        : ""
                    }`}
                  >
                    <td
                      className={`font-bold ${
                        isLatestRound ? "text-green-700" : "text-gray-700"
                      } ${
                        isExpanded ? "p-5" : "py-2 px-3"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isExpanded ? "text-lg" : "text-sm"}>
                          {isExpanded ? "▼" : "▶"}
                        </span>
                        <span className={isExpanded ? "text-base" : "text-sm"}>
                          {isLatestRound && "📊 "}Round {round.roundNumber}{isLatestRound && " (Latest)"}
                        </span>
                      </div>
                    </td>
                    {players.map((name) => {
                      const playerScore = round.scores.find(
                        (s) => s.name === name
                      );
                      if (!playerScore)
                        return (
                          <td
                            key={name}
                            className={`text-center ${
                              isExpanded ? "p-5" : "py-2 px-3"
                            }`}
                          >
                            -
                          </td>
                        );

                      const runningTotal = runningTotals[round.roundNumber][name];
                      return (
                        <td
                          key={name}
                          className={`text-center ${
                            isExpanded ? "p-5" : "py-2 px-3"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            {/* Per-round delta - less prominent */}
                            <span
                              className={`font-mono text-xs ${
                                playerScore.score < 0
                                  ? "text-danger-500"
                                  : "text-success-500"
                              }`}
                            >
                              ({playerScore.score > 0 ? "+" : ""}
                              {playerScore.score})
                            </span>
                            {/* Running total - prominent */}
                            <span
                              className={`font-mono font-bold ${
                                isExpanded ? "text-xl" : "text-base"
                              } ${
                                runningTotal < 0
                                  ? "text-gray-800"
                                  : "text-gray-800"
                              }`}
                            >
                              {runningTotal}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {isExpanded && (
                    <tr
                      className={`${
                        isLatestRound ? "bg-green-50" : "bg-gray-50"
                      } ${
                        idx === rounds.length - 1
                          ? "border-b-2 border-felt-400"
                          : ""
                      }`}
                    >
                      <td className="px-5 pb-5 pt-2 text-sm text-gray-600">
                        Details:
                      </td>
                      {players.map((name) => {
                        const playerScore = round.scores.find(
                          (s) => s.name === name
                        );
                        if (!playerScore)
                          return (
                            <td key={name} className="px-5 pb-5 pt-2"></td>
                          );

                        return (
                          <td key={name} className="px-5 pb-5 pt-2 text-center">
                            <BidDisplay
                              bid={playerScore.bid}
                              isBlind={playerScore.blindBid}
                              size="sm"
                              suffix={
                                <span
                                  className={
                                    playerScore.met
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {playerScore.met ? " ✓" : " ✗"}
                                </span>
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            <tr className="bg-gradient-to-r from-felt-400 to-felt-300">
              <td className="p-5 font-bold text-white text-lg">
                TOTAL
              </td>
              {players.map((name) => {
                const isWinner = totals[name] === maxScore;
                return (
                  <td
                    key={name}
                    className={`p-5 text-center ${
                      isWinner
                        ? "bg-gradient-to-br from-gold-500 to-orange-500"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl h-8">
                        {isWinner ? "👑" : ""}
                      </span>
                      <span
                        className={`font-mono text-2xl font-bold ${
                          totals[name] < 0 ? "text-red-700" : "text-green-700"
                        }`}
                      >
                        {totals[name]}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr className="bg-gradient-to-r from-felt-500 to-felt-400">
              <td className="p-4 font-bold text-white text-base first:rounded-bl-xl">
                RANK
              </td>
              {players.map((name) => {
                const rank = playerRanks[name];
                const isWinner = totals[name] === maxScore;
                return (
                  <td
                    key={name}
                    className={`p-4 text-center last:rounded-br-xl ${
                      isWinner
                        ? "bg-gradient-to-br from-gold-500 to-orange-500"
                        : ""
                    }`}
                  >
                    <span
                      className={`font-bold text-xl ${
                        isWinner ? "text-white" : "text-white"
                      }`}
                    >
                      #{rank}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
