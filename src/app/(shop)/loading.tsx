export default function Loading() {
  return (
    <div className="wrap py-16">
      <div className="skeleton mb-4 h-8 w-64" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl2 border border-line bg-paper">
            <div className="skeleton aspect-[1/0.86] rounded-none" />
            <div className="flex flex-col gap-2 p-4">
              <div className="skeleton h-3 w-1/3" />
              <div className="skeleton h-4 w-4/5" />
              <div className="skeleton h-6 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
