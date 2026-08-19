import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Languages, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

const capabilities = [
  "Theory and practical exam preparation",
  "English and French learning experience",
  "Progress analytics by competency area",
];

export function HeroSection() {
  return <section className="relative isolate overflow-hidden bg-[#061b28] text-white">
    <div className="absolute inset-0 hero-grid opacity-50" />
    <div className="absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-teal-500/15 blur-[110px]" />
    <div className="absolute bottom-[-40%] left-[20%] h-96 w-96 rounded-full bg-sky-500/10 blur-[100px]" />
    <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:py-32">
      <div className="max-w-2xl">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-white/[.06] px-3.5 py-2 text-xs font-semibold tracking-wide text-teal-100">
          <ShieldCheck className="h-4 w-4" /> Structured preparation for medical licensure
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl lg:text-[4rem]">
          Prepare for your medical licensing exam with clarity.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
          Focused mock exams, practical clinical cases, and useful performance insight—all in one professional learning environment.
        </p>
        <div className="mt-8 space-y-3">
          {capabilities.map((item) => <div key={item} className="flex items-center gap-3 text-sm text-slate-200 sm:text-base">
            <CheckCircle2 className="h-4.5 w-4.5 text-teal-300" /> {item}
          </div>)}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/register"><Button size="lg" className="w-full rounded-xl bg-teal-500 px-6 text-slate-950 shadow-lg shadow-teal-950/30 hover:bg-teal-400 sm:w-auto">Create free account <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/free-trial"><Button size="lg" variant="outline" className="w-full rounded-xl border-white/15 bg-white/[.04] px-6 text-white hover:bg-white/10 sm:w-auto">Explore a demo exam</Button></Link>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-xs text-slate-400">
          <span className="flex items-center gap-2"><Languages className="h-4 w-4 text-teal-300" /> English & French</span>
          <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-teal-300" /> Timed simulations</span>
          <span className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-teal-300" /> Clinical practice</span>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-teal-400/20 to-sky-500/5 blur-2xl" />
        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/75 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div><p className="text-xs text-slate-500">Clinical Medicine</p><p className="mt-1 text-sm font-semibold">Focused practice session</p></div>
            <span className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 font-mono text-xs text-amber-200">24:18</span>
          </div>
          <div className="px-5 py-5 sm:px-7 sm:py-7">
            <div className="mb-6 flex items-center gap-3"><div className="h-1.5 flex-1 rounded-full bg-slate-800"><div className="h-full w-[62%] rounded-full bg-teal-400" /></div><span className="text-xs text-slate-500">31 / 50</span></div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-teal-300">Question 31</p>
            <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-[15px]">A patient presents with sudden central chest pain and diaphoresis. Which investigation should be performed first?</p>
            <div className="mt-6 space-y-2.5">
              {["12-lead ECG", "Chest radiograph", "Echocardiography", "CT pulmonary angiography"].map((answer, index) => <div key={answer} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${index === 0 ? "border-teal-400/50 bg-teal-400/10 text-teal-50" : "border-white/[.08] bg-white/[.03] text-slate-400"}`}><span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${index === 0 ? "bg-teal-400 text-slate-950" : "bg-slate-800"}`}>{String.fromCharCode(65 + index)}</span>{answer}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
