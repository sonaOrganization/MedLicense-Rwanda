export interface LicenseCategory {
  id: string;
  label: string;
  description: string;
  group: string;
}

export const LICENSE_CATEGORIES: LicenseCategory[] = [
  // Physicians
  { id: "medical_doctor",       label: "Medical Doctor (MD)",             description: "General medicine and surgery",                     group: "Medicine" },
  { id: "specialist_doctor",    label: "Specialist Physician",            description: "Specialised clinical medicine",                    group: "Medicine" },
  // Dental
  { id: "dentist",              label: "Dentist",                         description: "Dental medicine and surgery",                      group: "Dental" },
  { id: "dental_technician",    label: "Dental Technician",               description: "Dental technology and prosthetics",                group: "Dental" },
  // Pharmacy
  { id: "pharmacist",           label: "Pharmacist",                      description: "Pharmacy practice and dispensing",                 group: "Pharmacy" },
  { id: "pharmacy_technician",  label: "Pharmacy Technician",             description: "Pharmaceutical support and dispensing",            group: "Pharmacy" },
  // Nursing
  { id: "nurse_a0",             label: "Nurse — A0 (BSc)",                description: "Bachelor of Science in Nursing",                   group: "Nursing" },
  { id: "nurse_a1",             label: "Nurse — A1 (Advanced Diploma)",   description: "Advanced diploma level nursing",                   group: "Nursing" },
  { id: "nurse_a2",             label: "Nurse — A2 (Certificate)",        description: "Certificate level nursing",                        group: "Nursing" },
  { id: "midwife",              label: "Midwife",                         description: "Midwifery and maternal care",                      group: "Nursing" },
  // Allied Health
  { id: "physiotherapist",      label: "Physiotherapist",                 description: "Physical therapy and rehabilitation",              group: "Allied Health" },
  { id: "lab_technician",       label: "Medical Lab Technician",          description: "Medical laboratory sciences",                      group: "Allied Health" },
  { id: "radiology_technician", label: "Radiology Technician",            description: "Medical imaging and radiology",                    group: "Allied Health" },
  { id: "nutritionist",         label: "Nutritionist / Dietitian",        description: "Nutrition, dietetics and food science",            group: "Allied Health" },
  { id: "env_health",           label: "Environmental Health Officer",    description: "Public health and environmental health",           group: "Allied Health" },
  { id: "orthopedic_technician",label: "Orthopedic Technician",           description: "Orthopedic devices and prosthetics",               group: "Allied Health" },
];

export const LICENSE_CATEGORY_GROUPS = [
  "Medicine",
  "Dental",
  "Pharmacy",
  "Nursing",
  "Allied Health",
] as const;

export function getLicenseCategoryLabel(id: string): string {
  return LICENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
