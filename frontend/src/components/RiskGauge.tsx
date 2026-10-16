import { RiskLevel } from '../types';
import { getRiskColor, getRiskBgClass } from '../utils/formatters';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
}

export default function RiskGauge({ score, level }: RiskGaugeProps) {
  const color = getRiskColor(level);

  // Speedometer Arch Geometry:
  // Starts at left (25, 100), arches UP through (100, 25), ends at right (175, 100)
  // Radius = 75, Circumference of half-circle = PI * 75 = ~235.62
  const radius = 75;
  const strokeWidth = 14;
  const arcLength = Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  // As score increases, strokeDashoffset decreases from arcLength to 0
  const strokeDashoffset = arcLength * (1 - progress / 100);

  const levelLabels: Record<RiskLevel, { text: string; desc: string }> = {
    low: { text: 'LOW RISK', desc: 'Few or no risk indicators detected' },
    medium: { text: 'SUSPICIOUS', desc: 'Multiple indicators suggest caution' },
    high: { text: 'HIGH RISK', desc: 'Strong phishing or threat indicators' },
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-6 bg-[#111827] rounded-xl border border-[#1e293b] text-center"
      data-testid="risk-gauge"
    >
      <div className="relative w-52 h-32 flex flex-col items-center justify-end overflow-hidden">
        {/* Upward Arch Speedometer SVG */}
        <svg
          className="w-52 h-32"
          viewBox="0 0 200 120"
          fill="none"
          aria-hidden="true"
        >
          {/* Background track (dark arch over the top) */}
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active progress arc (fills from left to right along the top) */}
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score display positioned inside the arch */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center">
          <span
            className="text-4xl sm:text-5xl font-black tracking-tight text-[#f1f5f9] leading-none"
            data-testid="score-value"
          >
            {score}
          </span>
          <span className="text-[11px] text-[#64748b] font-semibold uppercase tracking-wider mt-1">
            out of 100
          </span>
        </div>
      </div>

      {/* Risk level badge */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getRiskBgClass(
            level
          )}`}
          data-testid="risk-level-badge"
        >
          {levelLabels[level].text}
        </span>
        <p className="text-xs text-[#94a3b8] max-w-xs">{levelLabels[level].desc}</p>
      </div>
    </div>
  );
}
