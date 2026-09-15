export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl animate-pulse ${className}`}>
      <div className="h-full w-full bg-gray-100 rounded-2xl" />
    </div>
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 bg-gray-200 rounded-full animate-pulse ${className}`} />
  );
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col px-5 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <SkeletonLine className="w-24 h-3" />
          <SkeletonLine className="w-36 h-6" />
        </div>
        <div className="w-11 h-11 bg-gray-200 rounded-full animate-pulse" />
      </div>

      {/* Search bar */}
      <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-6" />

      {/* Banner */}
      <div className="h-40 bg-orange-200 rounded-3xl animate-pulse mb-8" />

      {/* Categories */}
      <div className="mb-8">
        <SkeletonLine className="w-28 h-5 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-full aspect-square bg-gray-200 rounded-2xl animate-pulse" />
              <SkeletonLine className="w-14 h-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Repairers */}
      <div>
        <SkeletonLine className="w-40 h-5 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function RepairerCardSkeleton() {
  return (
    <div className="h-20 bg-white rounded-2xl animate-pulse flex items-center gap-3 p-4">
      <div className="w-14 h-14 rounded-2xl bg-gray-200 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="w-28 h-4" />
        <SkeletonLine className="w-20 h-3" />
        <SkeletonLine className="w-16 h-3" />
      </div>
      <div className="w-10 h-6 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col pb-40">
      {/* Banner */}
      <div className="w-full h-48 bg-gray-200 animate-pulse" />
      {/* Card */}
      <div className="px-5 -mt-20 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse -mt-16 mb-4" />
          <SkeletonLine className="w-32 h-5 mb-2" />
          <SkeletonLine className="w-20 h-3 mb-5" />
          <div className="w-full h-20 bg-gray-100 rounded-2xl animate-pulse mb-5" />
          <div className="w-full grid grid-cols-3 gap-2 py-4 border-t border-gray-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <SkeletonLine className="w-10 h-5" />
                <SkeletonLine className="w-12 h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MissionDetailSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-12 pb-32 space-y-4">
      <SkeletonLine className="w-40 h-6 mb-6" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}
