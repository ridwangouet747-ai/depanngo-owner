import { MapPin } from "lucide-react";

const QUARTIERS = [
  { name: "Bardot", x: 35, y: 25 },
  { name: "Cité", x: 55, y: 20 },
  { name: "Kpwesso", x: 75, y: 30 },
  { name: "Moro", x: 25, y: 50 },
  { name: "Lac", x: 60, y: 55 },
  { name: "Zone Ind.", x: 80, y: 65 },
  { name: "Port", x: 50, y: 75 },
];

interface SanPedroMapProps {
  activeQuartier?: string;
  onSelect?: (quartier: string) => void;
  className?: string;
  interactive?: boolean;
}

export default function SanPedroMap({
  activeQuartier,
  onSelect,
  className = "",
  interactive = false,
}: SanPedroMapProps) {
  return (
    <div className={`relative w-full aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl overflow-hidden ${className}`}>
      {/* SVG map background */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Water/sea area */}
        <path
          d="M0 85 Q25 80 50 82 Q75 84 100 78 L100 100 L0 100 Z"
          fill="rgb(186 230 253)"
          opacity="0.5"
        />

        {/* Roads */}
        <line x1="10" y1="40" x2="90" y2="40" stroke="rgb(209 213 219)" strokeWidth="0.5" strokeDasharray="2 1" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="rgb(209 213 219)" strokeWidth="0.5" strokeDasharray="2 1" />
        <line x1="20" y1="20" x2="80" y2="70" stroke="rgb(209 213 219)" strokeWidth="0.3" strokeDasharray="1.5 1" />

        {/* Neighborhoods */}
        {QUARTIERS.map((q) => (
          <g key={q.name}>
            <circle
              cx={q.x}
              cy={q.y}
              r={activeQuartier === q.name ? 6 : 4}
              fill={activeQuartier === q.name ? "rgb(249 115 22)" : "rgb(251 146 60)"}
              opacity={activeQuartier === q.name ? 0.9 : 0.3}
              className={interactive ? "cursor-pointer transition-all" : ""}
              onClick={() => interactive && onSelect?.(q.name)}
            />
            <text
              x={q.x}
              y={q.y - 7}
              textAnchor="middle"
              fontSize="3"
              fontWeight="bold"
              fill={activeQuartier === q.name ? "rgb(249 115 22)" : "rgb(156 163 175)"}
            >
              {q.name}
            </text>
          </g>
        ))}

        {/* City label */}
        <text
          x="50"
          y="92"
          textAnchor="middle"
          fontSize="4"
          fontWeight="900"
          fill="rgb(209 213 219)"
          letterSpacing="0.5"
        >
          SAN PEDRO
        </text>
      </svg>

      {/* Active quartier indicator */}
      {activeQuartier && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
          <MapPin size={12} className="text-orange-500" />
          <span className="text-xs font-bold text-gray-700">{activeQuartier}</span>
        </div>
      )}
    </div>
  );
}
