import { RiskLevel } from '../types';
import { getRiskColor, getRiskBgClass } from '../utils/formatters';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
}

export default function RiskGauge({ score, level }: RiskGaugeProps) {
  const color = getRiskColor(level);
  
  // Semicircle gauge calculation
  // Radius = 80, Circumference = 2 * PI * 80 = ~502.65
  // For a semicircle, arc length = PI * 80 = ~251.33
  const radius = 80;
  const strokeWidth = 12;
  const arcLength = Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = arcLength - (progress / 100) * arcLength;

  const levelLabels: Record<RiskLevel, { text: string; desc: string }> = {
    low: { text: 'LOW RISK', desc: 'Few or no risk indicators detected' },
    medium: { text: 'SUSPICIOUS', desc: 'Multiple indicators suggest caution' },
    high: { text: 'HIGH RISK', desc: 'Strong phishing or threat indicators' },
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#111827] rounded-xl border border-[#1e293b] text-center" data-testid="risk-gauge">
      <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
        <svg
          className="w-48 h-48 -rotate-180 transform"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          {/* Background track arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${arcLength}`}
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${arcLength}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#f1f5f9]" data-testid="score-value">
            {score}
          </span>
          <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">
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
