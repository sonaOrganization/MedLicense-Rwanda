"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame } from "lucide-react";
import { getLicenseCategoryLabel } from "@/lib/license-categories";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";

interface WelcomeBannerProps {
  name: string;
  streak: number;
  subscriptionStatus: string;
  licenseCategory?: string | null;
}

const TITLE_PREFIX: Record<string, string> = {
  medical_doctor:       "Dr.",
  specialist_doctor:    "Dr.",
  dentist:              "Dr.",
  pharmacist:           "Pharm.",
  nurse_a0:             "Nurse",
  nurse_a1:             "Nurse",
  nurse_a2:             "Nurse",
  midwife:              "Mid.",
  physiotherapist:      "PT",
  lab_technician:       "Lab Tech",
  radiology_technician: "RT",
  dental_technician:    "DT",
  pharmacy_technician:  "PT",
  nutritionist:         "Nutr.",
  env_health:           "EHO",
  orthopedic_technician:"OT",
};

const motivations: Record<string, { EN: string[]; FR: string[] }> = {
  dentist: {
    EN: [
      "Rwanda's oral health relies on skilled dental surgeons. Every practice case sharpens your clinical eye.",
      "Each question you master today brings Rwanda's communities closer to comprehensive dental care.",
      "The Rwanda Dental Council exam is your gateway — precision and knowledge are your tools.",
      "Oral health is a window to overall health. Your expertise will change lives in Rwanda.",
    ],
    FR: [
      "La santé bucco-dentaire du Rwanda repose sur des chirurgiens-dentistes compétents. Chaque cas pratique affine votre œil clinique.",
      "Chaque question que vous maîtrisez rapproche les communautés rwandaises de soins dentaires complets.",
      "L'examen du Conseil dentaire du Rwanda est votre porte d'entrée — la précision et la connaissance sont vos outils.",
      "La santé bucco-dentaire est un miroir de la santé globale. Votre expertise changera des vies au Rwanda.",
    ],
  },
  medical_doctor: {
    EN: [
      "Rwanda's health system needs skilled physicians. Your knowledge will serve thousands of patients.",
      "Vision 2050: A healthy Rwanda built by doctors like you. Keep studying — the country is watching.",
      "Every clinical scenario you master makes you a stronger physician for your future patients.",
      "The patients of Kigali, Musanze, Huye and beyond are waiting for skilled doctors like you.",
    ],
    FR: [
      "Le système de santé du Rwanda a besoin de médecins compétents. Vos connaissances serviront des milliers de patients.",
      "Vision 2050 : Un Rwanda en bonne santé construit par des médecins comme vous. Continuez d'étudier.",
      "Chaque scénario clinique que vous maîtrisez vous rend plus fort pour vos futurs patients.",
      "Les patients de Kigali, Musanze, Huye et au-delà attendent des médecins compétents comme vous.",
    ],
  },
  default: {
    EN: [
      "Rwanda's health system needs you. Every question you master brings you closer to serving your community.",
      "Vision 2050: A healthy, prosperous Rwanda. Your license is the first step toward that vision.",
      "Be among the healthcare heroes building Rwanda's tomorrow. Keep pushing forward.",
      "The patients of Kigali, Musanze, Huye and beyond are waiting for skilled professionals like you.",
    ],
    FR: [
      "Le système de santé du Rwanda a besoin de vous. Chaque question maîtrisée vous rapproche de votre communauté.",
      "Vision 2050 : Un Rwanda sain et prospère. Votre licence est le premier pas vers cette vision.",
      "Soyez parmi les héros de la santé qui construisent le Rwanda de demain. Continuez à avancer.",
      "Les patients de Kigali, Musanze, Huye et au-delà attendent des professionnels compétents comme vous.",
    ],
  },
};

export function WelcomeBanner({ name, streak, subscriptionStatus, licenseCategory }: WelcomeBannerProps) {
  const { language } = useLanguage();
  const T = useT(language);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? T("wb_morning") : hour < 17 ? T("wb_afternoon") : T("wb_evening");

  const pool = (licenseCategory && motivations[licenseCategory]) ?? motivations.default;
  const quote = pool[language][new Date().getDay() % pool[language].length];

  const isPremium = subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIAL";
  const prefix = licenseCategory ? (TITLE_PREFIX[licenseCategory] ?? "") : "Dr.";
  const licenseLabel = licenseCategory ? getLicenseCategoryLabel(licenseCategory) : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 text-white px-5 py-5 sm:p-8">
      {/* Decorative blobs */}
      <div className="absolute right-0 top-0 w-52 h-52 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

      {/* Rwanda flag stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 flex pointer-events-none">
        <div className="flex-1 bg-blue-400" />
        <div className="flex-[2] bg-yellow-400" />
        <div className="flex-1 bg-green-400" />
      </div>

      <div className="relative">
        {/* Top row: greeting chips */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <p className="text-indigo-200 text-xs sm:text-sm font-medium">{greeting},</p>
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/30 border border-orange-400/40 rounded-full px-2 py-0.5 text-[11px] font-bold text-orange-200">
              <Flame className="w-3 h-3" />
              {streak} {T("wb_day_streak")}
            </div>
          )}
          {licenseLabel && (
            <div className="border border-white/20 bg-white/10 rounded-full px-2 py-0.5 text-[11px] font-semibold text-indigo-100">
              {licenseLabel}
            </div>
          )}
        </div>

        {/* Name */}
        <h1 className="text-xl sm:text-3xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">
          {prefix && <span className="opacity-80 font-semibold">{prefix} </span>}{name}
        </h1>

        {/* Quote — 2 lines max on mobile */}
        <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none mb-4 sm:mb-5 max-w-lg">{quote}</p>

        {/* CTA buttons — side by side on mobile */}
        <div className="flex items-center gap-2">
          <Link href="/exams" className="flex-1 sm:flex-none">
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50 gap-2 w-full sm:w-auto text-sm py-2">
              {T("wb_start")} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          {!isPremium && (
            <Link href="/subscription" className="flex-1 sm:flex-none">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto text-xs py-2">
                {T("wb_unlock")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
