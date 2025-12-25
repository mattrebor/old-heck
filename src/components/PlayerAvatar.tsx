function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stringToColor(str: string): string {
  // Generate a consistent color based on the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use a set of vibrant, distinguishable colors
  const colors = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#84CC16', // lime (changed from emerald to avoid conflict with score breakdown)
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#6366F1', // indigo
    '#06B6D4', // cyan
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function PlayerAvatar({
  name,
  size = 'md',
  showName = false
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}) {
  const initials = getInitials(name);
  const color = stringToColor(name);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold`}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {showName && <span className="font-medium text-gray-700">{name}</span>}
    </div>
  );
}
