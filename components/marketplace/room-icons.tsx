import { RoomType } from "@prisma/client";

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function RoomIcon({ room }: { room: RoomType }) {
  switch (room) {
    case RoomType.KITCHEN:
      return (
        <svg {...iconProps} aria-label="Kitchen">
          <path d="M12 2v6m0 0a3 3 0 0 0 3-3V2m-6 3a3 3 0 0 0 3 3Zm0 0v4" />
          <path d="M6 14h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case RoomType.BATHROOM:
      return (
        <svg {...iconProps} aria-label="Bathroom">
          <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1Z" />
          <path d="M6 12V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1" />
          <path d="M15 5v2m0-4v0m3 2v2m0-4v0" />
        </svg>
      );
    case RoomType.BEDROOM:
      return (
        <svg {...iconProps} aria-label="Bedroom">
          <path d="M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
          <path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" />
          <path d="M3 16h18" />
          <path d="M3 20h18" />
        </svg>
      );
    case RoomType.LIVING_AREA:
      return (
        <svg {...iconProps} aria-label="Living room">
          <path d="M4 11a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2" />
          <path d="M18 11V8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v3" />
          <path d="M4 18v2m16-2v2" />
        </svg>
      );
    case RoomType.DINING_ROOM:
      return (
        <svg {...iconProps} aria-label="Dining room">
          <rect x="3" y="11" width="18" height="2" rx="1" />
          <path d="M5 13v6m14-6v6" />
          <path d="M4 19h2m12 0h2" />
          <path d="M8 11V7m4-4v8m4-4v4" />
        </svg>
      );
    case RoomType.ENTRYWAY:
      return (
        <svg {...iconProps} aria-label="Entryway">
          <path d="M18 2h-6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h6" />
          <path d="M10 12h.01" />
          <path d="M14 2v20" />
          <path d="M6 6l-2 2 2 2" />
        </svg>
      );
    case RoomType.OFFICE:
      return (
        <svg {...iconProps} aria-label="Office">
          <rect x="2" y="4" width="20" height="12" rx="2" />
          <path d="M12 16v4m-4 0h8" />
        </svg>
      );
    case RoomType.LAUNDRY:
      return (
        <svg {...iconProps} aria-label="Laundry">
          <rect x="3" y="2" width="18" height="20" rx="2" />
          <circle cx="12" cy="13" r="5" />
          <circle cx="12" cy="13" r="2" />
          <path d="M7 5h2m2 0h.01" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps} aria-label="Room">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
        </svg>
      );
  }
}
