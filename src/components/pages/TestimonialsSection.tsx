import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Jean Pierre M.",
    role: "License Graduate",
    year: "2024",
    text: "I passed the medical licensing exam on my very first attempt. The exam simulation was almost identical to the real thing — same pressure, same format. I couldn't have done it without this platform.",
    rating: 5,
    initials: "JP",
    color: "bg-blue-700",
  },
  {
    name: "Marie Claire U.",
    role: "Medical Student, CHUK",
    year: "2024",
    text: "The analytics feature helped me identify my weak areas precisely. My scores jumped 20 points within two weeks. This is not a guess-and-check system — it works.",
    rating: 5,
    initials: "MC",
    color: "bg-purple-600",
  },
  {
    name: "Eric Nsabimana",
    role: "Clinical Officer",
    year: "2023",
    text: "Excellent video tutorials and the question bank is incredibly comprehensive. The mobile experience is smooth — I studied during commutes and it made a real difference.",
    rating: 5,
    initials: "EN",
    color: "bg-emerald-600",
  },
];

function TestimonialCard({
  name, role, year, text, rating, initials, color,
}: (typeof testimonials)[0]) {
  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-7 h-full">
      <Quote className="w-7 h-7 sm:w-8 sm:h-8 text-gray-100 dark:text-gray-800 mb-3 sm:mb-4 flex-shrink-0" />
      <div className="flex gap-0.5 mb-3 sm:mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-[13px] sm:text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed flex-1 mb-5 sm:mb-6">
        "{text}"
      </p>
      <div className="flex items-center gap-3 pt-4 sm:pt-5 border-t border-gray-100 dark:border-gray-800">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${color} flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0`}>
          {initials}
        </div>
        <div>
          <p className="text-[13px] sm:text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
          <p className="text-[11px] sm:text-xs text-gray-400">{role} · {year}</p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-14 sm:py-20 lg:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400 mb-2 sm:mb-3">
            Student Stories
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-900 dark:text-white leading-tight mb-3 sm:mb-4">
            Trusted by Medical Professionals
          </h2>
          <p className="text-sm sm:text-lg text-gray-500 dark:text-gray-400">
            Join thousands of medical license candidates who studied smarter and passed.
          </p>
        </div>

        {/* Mobile: horizontal scroll carousel */}
        <div className="sm:hidden flex gap-4 overflow-x-auto -mx-4 px-4 pb-4 snap-x snap-mandatory">
          {testimonials.map((t) => (
            <div key={t.name} className="flex-none w-[82vw] snap-start">
              <TestimonialCard {...t} />
            </div>
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>

        {/* Social proof bar */}
        <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex -space-x-2">
            {["bg-blue-600", "bg-cyan-600", "bg-teal-600", "bg-emerald-500", "bg-sky-500"].map((c, i) => (
              <div key={i} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${c} border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white`}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className="text-center text-[13px] sm:text-sm">
            <strong className="text-gray-900 dark:text-white">5,000+</strong> students have already started their journey
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
            ))}
            <span className="ml-1 text-[13px] sm:text-sm">
              <strong className="text-gray-900 dark:text-white">4.9</strong>/5 rating
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
