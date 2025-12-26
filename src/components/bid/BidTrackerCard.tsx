type BidTrackerCardProps = {
  tricksAvailable: number;
  totalBids: number;
  variant?: "blind" | "regular";
};

export default function BidTrackerCard({
  tricksAvailable,
  totalBids,
  variant = "regular",
}: BidTrackerCardProps) {
  const isBlind = variant === "blind";
  const bgColor = isBlind ? "bg-purple-300" : "bg-bid-300";
  const borderColor = isBlind ? "border-purple-500" : "border-bid-500";
  const textColor = isBlind ? "text-purple-900" : "text-white";

  return (
    <div className={`mb-6 p-5 ${bgColor} rounded-xl border-2 ${borderColor}`}>
      <div className={`flex flex-col sm:flex-row sm:flex-wrap gap-2 text-base ${textColor} font-bold`}>
        <div>
          <strong>Books available:</strong> {tricksAvailable}
        </div>
        <div>
          <strong>Total bids:</strong>{" "}
          <span
            className={
              totalBids === tricksAvailable
                ? "px-2 py-1 bg-yellow-400 text-gray-900 rounded"
                : "px-2 py-1 bg-red-600 text-white rounded"
            }
          >
            {totalBids}
          </span>
          {totalBids > tricksAvailable && (
            <span className="ml-2 px-2 py-1 bg-red-600 text-white rounded">
              ⚠ Over!
            </span>
          )}
          {totalBids < tricksAvailable && (
            <span className="ml-2 px-2 py-1 bg-red-600 text-white rounded">
              ⚠ Under!
            </span>
          )}
          {totalBids === tricksAvailable && (
            <span className="ml-2 px-2 py-1 bg-yellow-400 text-gray-900 rounded">
              ⚠ Equal!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
