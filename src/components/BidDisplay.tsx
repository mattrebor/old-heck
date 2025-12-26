type BidDisplayProps = {
  bid: number;
  isBlind?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  waiting?: boolean;
  suffix?: React.ReactNode;
};

export default function BidDisplay({
  bid,
  isBlind = false,
  size = "md",
  showLabel = true,
  waiting = false,
  suffix,
}: BidDisplayProps) {
  // Size-specific styling
  const sizeStyles = {
    sm: {
      badgeContainer: "h-4",
      badge: "px-1.5 py-0.5 text-xs",
      text: "text-xs",
    },
    md: {
      badgeContainer: "h-5",
      badge: "px-2 py-0.5 text-xs",
      text: "text-sm",
    },
    lg: {
      badgeContainer: "h-6",
      badge: "px-2 py-1 text-xs sm:text-sm",
      text: "text-sm sm:text-base",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Badge container - always reserves space for consistent height */}
      <div className={`${styles.badgeContainer} flex items-center justify-center`}>
        {isBlind && (
          <span
            className={`${styles.badge} bg-purple-600 text-white rounded-lg font-bold inline-block`}
          >
            ⚡ BLIND
          </span>
        )}
      </div>

      {/* Bid text */}
      <div className={`${styles.text} font-semibold text-center`}>
        {waiting ? (
          <span className="text-gray-400 italic">Bid: waiting...</span>
        ) : (
          <span className="text-gray-700">
            {showLabel ? "Bid: " : ""}
            {bid}
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
