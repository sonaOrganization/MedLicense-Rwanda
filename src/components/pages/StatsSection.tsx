const stats = [
  { value: "2,500+", label: "Practice Questions", sub: "Across all license categories" },
  { value: "98%",    label: "Pass Rate",           sub: "Among premium students"       },
  { value: "5,000+", label: "Students Enrolled",  sub: "And growing every month"      },
  { value: "50+",    label: "Video Tutorials",     sub: "From medical experts"         },
];

export function StatsSection() {
  return (
    <section className="relative bg-[#071a2e] overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-0 lg:divide-x lg:divide-blue-700/40">
          {stats.map(({ value, label, sub }) => (
            <div key={label} className="text-center text-white lg:px-8">
              <div className="text-3xl sm:text-5xl font-extrabold mb-1 tabular-nums tracking-tight">{value}</div>
              <div className="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1">{label}</div>
              <div className="text-[11px] sm:text-xs text-blue-300">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
