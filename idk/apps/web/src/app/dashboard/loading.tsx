export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-white/10 rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/10" />)}
      </div>
      <div className="h-40 bg-white/5 rounded-2xl border border-white/10" />
      <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
    </div>
  )
}
