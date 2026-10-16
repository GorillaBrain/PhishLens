export default function LoadingSpinner({ message = 'Analyzing URL...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4" role="status">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 rounded-full border-4 border-[#1e293b]" />
        {/* Spinning arc */}
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-[#06b6d4] animate-spin" />
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#06b6d4] animate-pulse" />
        </div>
      </div>
      <p className="text-[#94a3b8] text-sm font-medium animate-pulse">{message}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}
