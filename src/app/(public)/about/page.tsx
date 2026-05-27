import type { Metadata } from "next";
import { CheckCircle, Target, Users, Award } from "lucide-react";

export const metadata: Metadata = { title: "About MedLicense" };

const values = [
  { icon: Target, title: "Our Mission", desc: "Make professional medical license preparation accessible, effective, and affordable for every Rwandan healthcare candidate." },
  { icon: Users, title: "Our Team", desc: "Built by experienced medical educators and technologists who have gone through the medical licensing process themselves." },
  { icon: Award, title: "Our Results", desc: "98% of students who complete our premium preparation program pass the medical licensing exam on their first attempt." },
];

export default function AboutPage() {
  return (
    <div className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">About MedLicense</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          We are Rwanda's leading platform dedicated to helping medical professionals achieve their license through smart, data-driven exam preparation.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-20">
        {values.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="inline-flex p-4 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
              <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-8 md:p-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What is the Medical Licensing Exam?</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          The professional licensing examination is a mandatory exam for all healthcare professionals seeking to practice in Rwanda. It covers core medical knowledge, clinical skills, and professional ethics, and is administered by the relevant health professions council for each category.
        </p>
        <ul className="space-y-2">
          {["Comprehensive written and clinical assessment", "Required for all medical graduates", "Covers anatomy, physiology, pharmacology and more", "Administered multiple times per year"].map((item) => (
            <li key={item} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
