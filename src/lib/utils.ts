import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getPlayerAvatar({
  playerName,
  reverse = false,
  playerColor,
}: {
  playerName: string;
  reverse?: boolean;
  playerColor?: string;
}) {
  // Use local SVG data URI as fallback if API fails
  // Create a simple colored avatar with player initials
  const color = playerColor || "808080";
  const initials = playerName.slice(0, 2).toUpperCase();

  const svgFallback = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#${color}" rx="12"/>
      <text x="50" y="65" font-size="40" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold">${initials}</text>
    </svg>
  `)}`;

  // Try dicebear API first, but provide fallback
  try {
    const url = new URL("https://api.dicebear.com/9.x/thumbs/svg");
    url.searchParams.set("seed", playerName);
    url.searchParams.set("flip", String(reverse));
    if (playerColor) {
      url.searchParams.set("shapeColor", playerColor);
    }
    return url.toString();
  } catch {
    return svgFallback;
  }
}

// Simple hash function for consistent emoji selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getPlayerColor(id: number) {
  switch (id) {
    case 1:
      return "db5c4c";
    case 2:
      return "4187a0";
    case 3:
      return "f9c64b";
    case 4:
      return "629e76";
  }
}
