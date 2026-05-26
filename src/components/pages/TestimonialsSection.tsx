import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Jean Pierre M.",
    role: "RMDC Graduate",
    year: "2024",
    text: "I passed the RMDC exam on my very first attempt. The exam simulation was almost identical to the real thing — same pressure, same format. I couldn't have done it without this platform.",
    rating: 5,
    initials: "JP",
    color: "bg-indigo-600",
  },
  {
    name: "Marie Claire U.",
    role: "Medical Student, CHUK",
    year: "2024",
    text: "The analytics feature helped me identify my weak areas precisely. I focused on them systematically and my scores jumped 20 points within two weeks. This is not a guess-and-check system — it works.",
    rating: 5,
    initials: "MC",
    color: "bg-purple-600",
  },
  {
    name: "Eric Nsabimana",
    role: "Clinical Officer",
    year: "2023",
    text: "Excellent video tutorials and the question bank is incredibly comprehensive. The mobile experience is smooth — I studied during commutes and it made a real difference in my preparation.",
    rating: 5,
    initials: "EN",
    color: "bg-emerald-600",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-3">
            Student Stories
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
            Trusted by Medical Professionals
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Join thousands of RMDC candidates who studied smarter and passed.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {testimonials.map(({ name, role, year, text, rating, initials, color }) => (
            <div
              key={name}
              className="relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-gray-100/60 dark:hover:shadow-none transition-all duration-300 p-7"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-gray-100 dark:text-gray-800 mb-4 flex-shrink-0" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed flex-1 mb-6">
                "{text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                  <p className="text-xs text-gray-400">{role} · {year}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof bar */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex -space-x-2">
            {["bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-emerald-500", "bg-yellow-500"].map((c, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-bold text-white`}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span>
            <strong className="text-gray-900 dark:text-white">5,000+</strong> students have already started their journey
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
            <span className="ml-1"><strong className="text-gray-900 dark:text-white">4.9</strong>/5 rating</span>
          </div>
        </div>
      </div>
    </section>
  );
}
