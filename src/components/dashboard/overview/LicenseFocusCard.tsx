import Link from "next/link";
import { CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LicenseData {
  icon: string;
  label: string;
  tagline: string;
  council: string;
  examInfo: string;
  subjects: string[];
  accent: string;      // Tailwind color key used in classes below
}

const LICENSES: Record<string, LicenseData> = {
  dentist: {
    icon: "🦷",
    label: "Dentist",
    tagline: "Rwanda Dental Surgery Licensure",
    council: "Rwanda Dental Surgeons Council",
    examInfo: "~180 questions · 4 hours · 70% pass mark",
    subjects: [
      "Oral Anatomy & Physiology",
      "Dental Pathology & Diagnosis",
      "Oral Surgery & Anaesthesia",
      "Restorative & Prosthetic Dentistry",
      "Endodontics & Periodontics",
      "Preventive & Community Dentistry",
      "Dental Radiology & Imaging",
      "Dental Materials Science",
    ],
    accent: "teal",
  },
  dental_technician: {
    icon: "🔬",
    label: "Dental Technician",
    tagline: "Dental Technology Licensure",
    council: "Rwanda Health Professions Council",
    examInfo: "~120 questions · 3 hours · 70% pass mark",
    subjects: [
      "Dental Materials & Properties",
      "Removable Prosthodontics",
      "Fixed Prosthodontics",
      "Orthodontic Appliances",
      "Dental Anatomy & Occlusion",
      "Dental Laboratory Safety",
      "Quality Control Methods",
      "Dental Anatomy",
    ],
    accent: "cyan",
  },
  medical_doctor: {
    icon: "🩺",
    label: "Medical Doctor (MD)",
    tagline: "Rwanda Medical Council Licensure",
    council: "Rwanda Medical & Dental Council",
    examInfo: "~200 questions · 4 hours · 70% pass mark",
    subjects: [
      "Internal Medicine",
      "Surgery & Surgical Procedures",
      "Paediatrics & Neonatology",
      "Obstetrics & Gynaecology",
      "Community & Preventive Health",
      "Pharmacology & Therapeutics",
      "Emergency Medicine",
      "Medical Ethics & Jurisprudence",
    ],
    accent: "blue",
  },
  specialist_doctor: {
    icon: "🏥",
    label: "Specialist Physician",
    tagline: "Specialist Clinical Medicine Licensure",
    council: "Rwanda Medical & Dental Council",
    examInfo: "~200 questions · 4 hours · 75% pass mark",
    subjects: [
      "Internal Medicine",
      "Surgery & Procedures",
      "Specialty-Specific Pathology",
      "Clinical Pharmacology",
      "Evidence-Based Medicine",
      "Radiology & Imaging",
      "Critical Care",
      "Medical Ethics",
    ],
    accent: "indigo",
  },
  pharmacist: {
    icon: "💊",
    label: "Pharmacist",
    tagline: "Rwanda Pharmacy Council Licensure",
    council: "Rwanda Pharmacy Council",
    examInfo: "~160 questions · 3.5 hours · 70% pass mark",
    subjects: [
      "Pharmaceutical Chemistry",
      "Pharmacokinetics & Dynamics",
      "Clinical Pharmacy Practice",
      "Drug Dispensing & Counselling",
      "Pharmaceutical Microbiology",
      "Drug Interactions & Safety",
      "Pharmacy Law & Ethics",
      "Pharmaceutical Calculations",
    ],
    accent: "purple",
  },
  pharmacy_technician: {
    icon: "⚗️",
    label: "Pharmacy Technician",
    tagline: "Pharmaceutical Support Licensure",
    council: "Rwanda Pharmacy Council",
    examInfo: "~120 questions · 3 hours · 70% pass mark",
    subjects: [
      "Basic Pharmacology",
      "Dispensing Techniques",
      "Drug Storage & Handling",
      "Pharmaceutical Calculations",
      "Patient Safety & Error Prevention",
      "Inventory Management",
      "Pharmacy Law",
      "Aseptic Technique",
    ],
    accent: "violet",
  },
  nurse_a0: {
    icon: "🏩",
    label: "Nurse — A0 (BSc)",
    tagline: "Bachelor of Science in Nursing Licensure",
    council: "Rwanda Nursing & Midwifery Council",
    examInfo: "~160 questions · 3.5 hours · 70% pass mark",
    subjects: [
      "Advanced Clinical Nursing",
      "Research & Evidence-Based Practice",
      "Nursing Leadership & Management",
      "Advanced Pharmacology",
      "Critical Care Nursing",
      "Mental Health Nursing",
      "Community & Public Health",
      "Nursing Ethics & Law",
    ],
    accent: "rose",
  },
  nurse_a1: {
    icon: "🏩",
    label: "Nurse — A1",
    tagline: "Advanced Diploma Nursing Licensure",
    council: "Rwanda Nursing & Midwifery Council",
    examInfo: "~150 questions · 3.5 hours · 70% pass mark",
    subjects: [
      "Clinical Nursing Practice",
      "Medical-Surgical Nursing",
      "Maternal & Child Health",
      "Community Nursing",
      "Pharmacology",
      "Infection Prevention & Control",
      "Mental Health Nursing",
      "Nursing Ethics",
    ],
    accent: "pink",
  },
  nurse_a2: {
    icon: "🏩",
    label: "Nurse — A2",
    tagline: "Certificate Level Nursing Licensure",
    council: "Rwanda Nursing & Midwifery Council",
    examInfo: "~120 questions · 3 hours · 70% pass mark",
    subjects: [
      "Fundamental Nursing",
      "Basic Pharmacology",
      "Patient Care & Safety",
      "Anatomy & Physiology",
      "Infection Control",
      "Community Health",
      "First Aid & Emergency",
      "Nursing Ethics",
    ],
    accent: "fuchsia",
  },
  midwife: {
    icon: "👶",
    label: "Midwife",
    tagline: "Midwifery & Maternal Care Licensure",
    council: "Rwanda Nursing & Midwifery Council",
    examInfo: "~150 questions · 3.5 hours · 70% pass mark",
    subjects: [
      "Normal Labour & Delivery",
      "Complicated Labour Management",
      "Antenatal & Postnatal Care",
      "Neonatal Care & Assessment",
      "Family Planning Methods",
      "Reproductive Health",
      "Emergency Obstetrics",
      "Midwifery Ethics & Law",
    ],
    accent: "pink",
  },
  physiotherapist: {
    icon: "🦴",
    label: "Physiotherapist",
    tagline: "Physical Therapy & Rehabilitation Licensure",
    council: "Rwanda Allied Health Professionals Council",
    examInfo: "~140 questions · 3 hours · 70% pass mark",
    subjects: [
      "Musculoskeletal Physiotherapy",
      "Neurological Rehabilitation",
      "Cardiopulmonary Physiotherapy",
      "Paediatric Physiotherapy",
      "Assessment & Diagnosis",
      "Therapeutic Exercises",
      "Electrotherapy",
      "Professional Ethics",
    ],
    accent: "amber",
  },
  lab_technician: {
    icon: "🧪",
    label: "Medical Lab Technician",
    tagline: "Medical Laboratory Sciences Licensure",
    council: "Rwanda Allied Health Professionals Council",
    examInfo: "~140 questions · 3 hours · 70% pass mark",
    subjects: [
      "Clinical Biochemistry",
      "Haematology & Coagulation",
      "Medical Microbiology",
      "Blood Banking & Transfusion",
      "Parasitology & Mycology",
      "Histopathology",
      "Lab Safety & Quality Control",
      "Laboratory Management",
    ],
    accent: "orange",
  },
  radiology_technician: {
    icon: "🔭",
    label: "Radiology Technician",
    tagline: "Medical Imaging & Radiology Licensure",
    council: "Rwanda Allied Health Professionals Council",
    examInfo: "~130 questions · 3 hours · 70% pass mark",
    subjects: [
      "Radiographic Anatomy",
      "Imaging Techniques & Positioning",
      "Radiation Physics & Protection",
      "CT & MRI Fundamentals",
      "Pathology Recognition",
      "Patient Safety & Care",
      "Image Processing",
      "Radiation Biology",
    ],
    accent: "sky",
  },
  nutritionist: {
    icon: "🥗",
    label: "Nutritionist / Dietitian",
    tagline: "Nutrition & Dietetics Licensure",
    council: "Rwanda Allied Health Professionals Council",
    examInfo: "~130 questions · 3 hours · 70% pass mark",
    subjects: [
      "Human Nutrition & Biochemistry",
      "Clinical Dietetics",
      "Community Nutrition",
      "Food Science & Safety",
      "Nutritional Assessment",
      "Therapeutic Diets",
      "Public Health Nutrition",
      "Nutrition Research",
    ],
    accent: "green",
  },
  env_health: {
    icon: "🌿",
    label: "Environmental Health Officer",
    tagline: "Public & Environmental Health Licensure",
    council: "Rwanda Allied Health Professionals Council",
    examInfo: "~130 questions · 3 hours · 70% pass mark",
    subjects: [
      "Environmental Health Science",
      "Epidemiology & Biostatistics",
      "Water & Sanitation Management",
      "Occupational Health & Safety",
      "Vector & Disease Control",
      "Food Safety Regulation",
      "Environmental Toxicology",
      "Public Health Law & Ethics",
    ],
    accent: "emerald",
  },
  orthopedic_technician: {
    icon: "🦿",
    label: "Orthopedic Technician",
    tagline: "Orthopedic Devices & Prosthetics Licensure",
    council: "Rwanda Allied Health Professionals Council",
    examInfo: "~120 questions · 3 hours · 70% pass mark",
    subjects: [
      "Musculoskeletal Anatomy",
      "Orthotics & Prosthetics Design",
      "Cast & Splinting Techniques",
      "Rehabilitation Principles",
      "Patient Assessment",
      "Biomechanics",
      "Materials & Fabrication",
      "Clinical Documentation",
    ],
    accent: "yellow",
  },
};

const DEFAULT: LicenseData = {
  icon: "🏥",
  label: "Healthcare Professional",
  tagline: "Rwanda Health Professions Licensure",
  council: "Rwanda Health Professions Council",
  examInfo: "Questions vary by specialty",
  subjects: [
    "Clinical Sciences",
    "Pharmacology",
    "Community Health",
    "Professional Ethics",
    "Patient Safety",
    "Evidence-Based Practice",
    "Health Law",
    "Communication Skills",
  ],
  accent: "indigo",
};

const ACCENT_CLASSES: Record<string, { bg: string; border: string; badge: string; icon: string; check: string }> = {
  teal:    { bg: "from-teal-600 to-teal-700",    border: "border-teal-200 dark:border-teal-800/50",   badge: "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700/40",    icon: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",    check: "text-teal-500"    },
  cyan:    { bg: "from-cyan-600 to-cyan-700",     border: "border-cyan-200 dark:border-cyan-800/50",   badge: "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700/40",     icon: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",     check: "text-cyan-500"    },
  blue:    { bg: "from-blue-600 to-blue-700",     border: "border-blue-200 dark:border-blue-800/50",   badge: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40",     icon: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",     check: "text-blue-500"    },
  indigo:  { bg: "from-indigo-600 to-indigo-700", border: "border-indigo-200 dark:border-indigo-800/50", badge: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/40", icon: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300", check: "text-indigo-500" },
  purple:  { bg: "from-purple-600 to-purple-700", border: "border-purple-200 dark:border-purple-800/50", badge: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/40", icon: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300", check: "text-purple-500" },
  violet:  { bg: "from-violet-600 to-violet-700", border: "border-violet-200 dark:border-violet-800/50", badge: "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/40", icon: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300", check: "text-violet-500" },
  rose:    { bg: "from-rose-600 to-rose-700",     border: "border-rose-200 dark:border-rose-800/50",   badge: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/40",     icon: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",     check: "text-rose-500"    },
  pink:    { bg: "from-pink-600 to-pink-700",     border: "border-pink-200 dark:border-pink-800/50",   badge: "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700/40",     icon: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",     check: "text-pink-500"    },
  fuchsia: { bg: "from-fuchsia-600 to-fuchsia-700", border: "border-fuchsia-200 dark:border-fuchsia-800/50", badge: "bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-700/40", icon: "bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300", check: "text-fuchsia-500" },
  amber:   { bg: "from-amber-600 to-amber-700",   border: "border-amber-200 dark:border-amber-800/50", badge: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40",   icon: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",   check: "text-amber-500"   },
  orange:  { bg: "from-orange-600 to-orange-700", border: "border-orange-200 dark:border-orange-800/50", badge: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/40", icon: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300", check: "text-orange-500" },
  sky:     { bg: "from-sky-600 to-sky-700",       border: "border-sky-200 dark:border-sky-800/50",     badge: "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/40",         icon: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",         check: "text-sky-500"     },
  green:   { bg: "from-green-600 to-green-700",   border: "border-green-200 dark:border-green-800/50", badge: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/40",   icon: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",   check: "text-green-500"   },
  emerald: { bg: "from-emerald-600 to-emerald-700", border: "border-emerald-200 dark:border-emerald-800/50", badge: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/40", icon: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300", check: "text-emerald-500" },
  yellow:  { bg: "from-yellow-600 to-yellow-700", border: "border-yellow-200 dark:border-yellow-800/50", badge: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/40", icon: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300", check: "text-yellow-500" },
};

function getAccent(key: string) {
  return ACCENT_CLASSES[key] ?? ACCENT_CLASSES.indigo;
}

interface Props {
  licenseCategory?: string | null;
}

export function LicenseFocusCard({ licenseCategory }: Props) {
  if (!licenseCategory) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10 p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">No license category set</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Your dashboard, exam recommendations, and study path will be personalised once you set your target license.
          </p>
          <Link href="/settings" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline">
            Set license category <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  const data = LICENSES[licenseCategory] ?? DEFAULT;
  const ac   = getAccent(data.accent);
  const half = Math.ceil(data.subjects.length / 2);
  const col1 = data.subjects.slice(0, half);
  const col2 = data.subjects.slice(half);

  return (
    <div className={cn("rounded-xl border overflow-hidden", ac.border)}>
      {/* Coloured header */}
      <div className={cn("bg-gradient-to-r text-white px-5 py-4 flex items-center gap-3", ac.bg)}>
        <div className="text-2xl leading-none">{data.icon}</div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Your License Path</p>
          <p className="text-base font-bold leading-tight">{data.label}</p>
          <p className="text-xs text-white/70 mt-0.5">{data.council}</p>
        </div>
        <div className="ml-auto flex-shrink-0 text-right">
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Exam Format</p>
          <p className="text-xs font-semibold text-white/90 mt-0.5">{data.examInfo}</p>
        </div>
      </div>

      {/* Subjects */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Key Exam Subjects</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {col1.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <CheckCircle2 className={cn("w-3.5 h-3.5 flex-shrink-0", ac.check)} />
              <span className="text-xs text-gray-700 dark:text-gray-300">{s}</span>
            </div>
          ))}
          {col2.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <CheckCircle2 className={cn("w-3.5 h-3.5 flex-shrink-0", ac.check)} />
              <span className="text-xs text-gray-700 dark:text-gray-300">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">Practice with exams tailored to your specialty</p>
        <Link
          href="/exams"
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
            ac.badge
          )}
        >
          View {data.label} Exams <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
