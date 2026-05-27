import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ─── helpers ───────────────────────────────────────────────────────────────

function id() {
  return crypto.randomUUID();
}

async function upsert(table: string, rows: object[], conflict: string) {
  const { error } = await supabase.from(table).upsert(rows as never[], { onConflict: conflict });
  if (error) console.error(`  ✗ ${table}:`, error.message);
  else console.log(`  ✓ ${table} (${rows.length})`);
}

// ─── IDs ───────────────────────────────────────────────────────────────────

const CAT = {
  internal:  id(),
  pediatrics: id(),
  obgyn:     id(),
  community: id(),
};

const Q: Record<string, string> = {};
for (let i = 1; i <= 40; i++) Q[`q${i}`] = id();

const EXAM = {
  internal:  id(),
  pediatrics: id(),
  mixed:     id(),
};

// ─── seed ──────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n── Users ──────────────────────────────");
  const now = new Date().toISOString();
  const hash = (pw: string) => bcrypt.hash(pw, 12);

  await upsert("users", [
    { name: "Demo Student", email: "student@demo.com", password: await hash("Demo@1234"), role: "STUDENT", email_verified: now },
    { name: "Demo Admin",   email: "admin@demo.com",   password: await hash("Admin@1234"), role: "ADMIN",   email_verified: now },
  ], "email");

  // ── Categories ──────────────────────────────────────────────────────────
  console.log("\n── Categories ─────────────────────────");
  await upsert("categories", [
    { id: CAT.internal,   name: "Internal Medicine",  name_en: "Internal Medicine",  name_fr: "Médecine Interne",    slug: "internal-medicine",  icon: "🫀" },
    { id: CAT.pediatrics, name: "Pediatrics",          name_en: "Pediatrics",          name_fr: "Pédiatrie",           slug: "pediatrics",          icon: "👶" },
    { id: CAT.obgyn,      name: "Obstetrics & Gynecology", name_en: "Obstetrics & Gynecology", name_fr: "Obstétrique & Gynécologie", slug: "obstetrics-gynecology", icon: "🤱" },
    { id: CAT.community,  name: "Community Health",   name_en: "Community Health",   name_fr: "Santé Communautaire", slug: "community-health",    icon: "🏥" },
  ], "slug");

  // ── Questions ───────────────────────────────────────────────────────────
  console.log("\n── Questions ──────────────────────────");

  const questions = [
    // ── Internal Medicine (10) ────────────────────────────────────────────
    {
      id: Q.q1, category_id: CAT.internal, difficulty: "MEDIUM", is_approved: true,
      text_en: "A 45-year-old patient presents with chest pain radiating to the left arm, diaphoresis, and shortness of breath. The most likely diagnosis is:",
      explanation_en: "ST-elevation myocardial infarction (STEMI) is characterized by chest pain radiating to the left arm, sweating, and dyspnea. Immediate ECG and troponin levels are required.",
    },
    {
      id: Q.q2, category_id: CAT.internal, difficulty: "EASY", is_approved: true,
      text_en: "Which of the following is the first-line treatment for newly diagnosed hypertension in a 55-year-old patient with no comorbidities?",
      explanation_en: "ACE inhibitors or ARBs are first-line for hypertension, especially in patients with diabetes or CKD. Thiazide diuretics are also acceptable first-line agents.",
    },
    {
      id: Q.q3, category_id: CAT.internal, difficulty: "HARD", is_approved: true,
      text_en: "A patient with known type 2 diabetes presents with polyuria, polydipsia, and a blood glucose of 38 mmol/L. Ketones are negative. The most appropriate diagnosis is:",
      explanation_en: "Hyperosmolar Hyperglycemic State (HHS) occurs in type 2 diabetes with markedly elevated glucose (>33 mmol/L), no significant ketosis, and high osmolality.",
    },
    {
      id: Q.q4, category_id: CAT.internal, difficulty: "MEDIUM", is_approved: true,
      text_en: "Which electrolyte abnormality is most commonly associated with prolonged vomiting?",
      explanation_en: "Prolonged vomiting causes loss of HCl, leading to metabolic alkalosis with hypokalemia and hypochloremia. Sodium may also be depleted.",
    },
    {
      id: Q.q5, category_id: CAT.internal, difficulty: "EASY", is_approved: true,
      text_en: "The most common cause of community-acquired pneumonia in adults is:",
      explanation_en: "Streptococcus pneumoniae (pneumococcus) is responsible for approximately 30-40% of community-acquired pneumonia cases in adults.",
    },
    {
      id: Q.q6, category_id: CAT.internal, difficulty: "MEDIUM", is_approved: true,
      text_en: "A patient presents with jaundice, dark urine, pale stools, and pruritus. These findings are most consistent with:",
      explanation_en: "Obstructive jaundice (cholestatic) is characterized by conjugated hyperbilirubinemia, dark urine (bilirubinuria), pale stools (no urobilinogen), and pruritus from bile salt deposition.",
    },
    {
      id: Q.q7, category_id: CAT.internal, difficulty: "HARD", is_approved: true,
      text_en: "Which finding on urinalysis is most specific for nephrotic syndrome?",
      explanation_en: "Massive proteinuria (>3.5g/day) is the hallmark of nephrotic syndrome, leading to hypoalbuminemia, edema, and hyperlipidemia.",
    },
    {
      id: Q.q8, category_id: CAT.internal, difficulty: "MEDIUM", is_approved: true,
      text_en: "A 60-year-old male smoker presents with hemoptysis, weight loss, and a hilar mass on chest X-ray. The most likely diagnosis is:",
      explanation_en: "Squamous cell carcinoma of the lung is the most common type associated with smoking, presenting centrally near the hilum with hemoptysis.",
    },
    {
      id: Q.q9, category_id: CAT.internal, difficulty: "EASY", is_approved: true,
      text_en: "Which of the following is NOT a feature of iron-deficiency anemia?",
      explanation_en: "Iron-deficiency anemia presents with microcytic hypochromic RBCs, low serum ferritin, low serum iron, and high TIBC. Hypersegmented neutrophils are a feature of megaloblastic anemia.",
    },
    {
      id: Q.q10, category_id: CAT.internal, difficulty: "MEDIUM", is_approved: true,
      text_en: "The most appropriate initial investigation for a patient presenting with acute upper gastrointestinal bleeding is:",
      explanation_en: "Urgent upper GI endoscopy (esophagogastroduodenoscopy) is the investigation of choice for UGIB, allowing both diagnosis and therapeutic intervention.",
    },

    // ── Pediatrics (10) ──────────────────────────────────────────────────
    {
      id: Q.q11, category_id: CAT.pediatrics, difficulty: "MEDIUM", is_approved: true,
      text_en: "A 6-month-old infant presents with fever, bulging anterior fontanelle, and neck stiffness. The most likely diagnosis is:",
      explanation_en: "Bacterial meningitis in infants presents with fever, a bulging fontanelle (due to raised ICP), and meningismus. Lumbar puncture is diagnostic.",
    },
    {
      id: Q.q12, category_id: CAT.pediatrics, difficulty: "EASY", is_approved: true,
      text_en: "According to the WHO immunization schedule, at what age should the first dose of measles vaccine be given?",
      explanation_en: "The WHO recommends the first dose of measles-containing vaccine (MCV1) at 9 months in high-burden countries, including Rwanda.",
    },
    {
      id: Q.q13, category_id: CAT.pediatrics, difficulty: "HARD", is_approved: true,
      text_en: "A 2-year-old child presents with persistent diarrhea, failure to thrive, and a distended abdomen. Stool microscopy shows no pathogens. The most likely diagnosis is:",
      explanation_en: "Celiac disease (gluten-sensitive enteropathy) presents with chronic diarrhea, abdominal distension, and failure to thrive after introduction of gluten-containing foods.",
    },
    {
      id: Q.q14, category_id: CAT.pediatrics, difficulty: "MEDIUM", is_approved: true,
      text_en: "Which of the following is the most common cause of acute respiratory distress in a neonate born at 32 weeks gestation?",
      explanation_en: "Respiratory Distress Syndrome (RDS) in premature infants is caused by surfactant deficiency. It presents with grunting, nasal flaring, intercostal retractions, and cyanosis.",
    },
    {
      id: Q.q15, category_id: CAT.pediatrics, difficulty: "EASY", is_approved: true,
      text_en: "The Apgar score is assessed at 1 and 5 minutes after birth. Which of the following is NOT included in the Apgar scoring?",
      explanation_en: "The Apgar score assesses: Appearance (color), Pulse (heart rate), Grimace (reflex irritability), Activity (muscle tone), and Respiration. Birth weight is not included.",
    },
    {
      id: Q.q16, category_id: CAT.pediatrics, difficulty: "MEDIUM", is_approved: true,
      text_en: "A child presents with a barking cough, inspiratory stridor, and low-grade fever. The most likely diagnosis is:",
      explanation_en: "Croup (laryngotracheobronchitis) is caused by parainfluenza virus and presents with the classic 'barking' or 'seal-like' cough, inspiratory stridor, and hoarseness.",
    },
    {
      id: Q.q17, category_id: CAT.pediatrics, difficulty: "HARD", is_approved: true,
      text_en: "A 3-year-old with sickle cell disease presents with sudden severe pain in the hands and feet, fever, and dactylitis. The most appropriate immediate management is:",
      explanation_en: "Vaso-occlusive crisis in SCD requires analgesia (paracetamol/NSAIDs/opioids), IV fluids, oxygen if hypoxic, and antibiotics if infection suspected.",
    },
    {
      id: Q.q18, category_id: CAT.pediatrics, difficulty: "MEDIUM", is_approved: true,
      text_en: "Which vitamin deficiency is most commonly associated with rickets in children?",
      explanation_en: "Vitamin D deficiency impairs calcium and phosphate absorption, leading to defective bone mineralization (rickets in children, osteomalacia in adults).",
    },
    {
      id: Q.q19, category_id: CAT.pediatrics, difficulty: "EASY", is_approved: true,
      text_en: "The normal respiratory rate for a 1-year-old child is:",
      explanation_en: "Normal respiratory rates by age: Neonate 40-60/min, Infant (1-12 months) 30-40/min, Toddler (1-3 years) 25-35/min, Preschool (3-6 years) 20-30/min.",
    },
    {
      id: Q.q20, category_id: CAT.pediatrics, difficulty: "MEDIUM", is_approved: true,
      text_en: "A child with kwashiorkor will most likely present with:",
      explanation_en: "Kwashiorkor (protein deficiency) presents with edema, 'flaky paint' dermatitis, hair changes (flag sign), hepatomegaly, and a normal or near-normal weight.",
    },

    // ── Obstetrics & Gynecology (10) ─────────────────────────────────────
    {
      id: Q.q21, category_id: CAT.obgyn, difficulty: "MEDIUM", is_approved: true,
      text_en: "A 28-year-old primigravida at 36 weeks gestation presents with severe headache, blurred vision, and BP of 160/110 mmHg. Urinalysis shows 3+ proteinuria. The diagnosis is:",
      explanation_en: "Severe preeclampsia is defined by BP ≥160/110 mmHg after 20 weeks with significant proteinuria, plus severe features (headache, visual disturbance, epigastric pain).",
    },
    {
      id: Q.q22, category_id: CAT.obgyn, difficulty: "EASY", is_approved: true,
      text_en: "Nagele's rule is used to calculate the expected date of delivery. The rule involves:",
      explanation_en: "Nagele's rule: Add 7 days to the first day of the last menstrual period, subtract 3 months, add 1 year. This gives the estimated date of delivery (EDD).",
    },
    {
      id: Q.q23, category_id: CAT.obgyn, difficulty: "HARD", is_approved: true,
      text_en: "A 35-year-old woman at 32 weeks gestation presents with painless bright red vaginal bleeding. Ultrasound confirms the placenta covers the internal os. The diagnosis is:",
      explanation_en: "Placenta previa presents with painless bright red antepartum hemorrhage. Complete placenta previa requires cesarean section.",
    },
    {
      id: Q.q24, category_id: CAT.obgyn, difficulty: "MEDIUM", is_approved: true,
      text_en: "The most common cause of postpartum hemorrhage is:",
      explanation_en: "Uterine atony (failure of the uterus to contract after delivery) accounts for approximately 70-80% of all postpartum hemorrhage cases. Remember the 4 Ts: Tone, Trauma, Tissue, Thrombin.",
    },
    {
      id: Q.q25, category_id: CAT.obgyn, difficulty: "EASY", is_approved: true,
      text_en: "Which of the following is considered a definitive sign of pregnancy?",
      explanation_en: "Fetal heart sounds (heard by Doppler from ~10-12 weeks) and fetal movements felt by the examiner are definitive signs. A positive pregnancy test is a probable sign.",
    },
    {
      id: Q.q26, category_id: CAT.obgyn, difficulty: "MEDIUM", is_approved: true,
      text_en: "A woman presents with amenorrhea, unilateral pelvic pain, and vaginal bleeding. Urine pregnancy test is positive. Ultrasound shows no intrauterine pregnancy. The diagnosis is:",
      explanation_en: "Ectopic pregnancy should be suspected in any woman of reproductive age with a positive pregnancy test and no intrauterine gestational sac on ultrasound.",
    },
    {
      id: Q.q27, category_id: CAT.obgyn, difficulty: "HARD", is_approved: true,
      text_en: "Which cervical cancer screening method is recommended for women aged 30-49 years in Rwanda's national program?",
      explanation_en: "Rwanda uses VIA (Visual Inspection with Acetic Acid) as the primary cervical cancer screening method, with cryotherapy for screen-and-treat in the same visit.",
    },
    {
      id: Q.q28, category_id: CAT.obgyn, difficulty: "MEDIUM", is_approved: true,
      text_en: "The Bishop score is used to assess:",
      explanation_en: "The Bishop score assesses cervical readiness for induction of labor, evaluating cervical dilation, effacement, consistency, position, and fetal station.",
    },
    {
      id: Q.q29, category_id: CAT.obgyn, difficulty: "EASY", is_approved: true,
      text_en: "The recommended duration of exclusive breastfeeding according to WHO guidelines is:",
      explanation_en: "WHO recommends exclusive breastfeeding for the first 6 months of life, followed by continued breastfeeding with complementary foods up to 2 years or beyond.",
    },
    {
      id: Q.q30, category_id: CAT.obgyn, difficulty: "MEDIUM", is_approved: true,
      text_en: "A 25-year-old woman presents with lower abdominal pain, vaginal discharge, and cervical motion tenderness. The most likely diagnosis is:",
      explanation_en: "Pelvic Inflammatory Disease (PID) presents with lower abdominal pain, purulent vaginal discharge, cervical motion tenderness (chandelier sign), and adnexal tenderness.",
    },

    // ── Community Health (10) ─────────────────────────────────────────────
    {
      id: Q.q31, category_id: CAT.community, difficulty: "EASY", is_approved: true,
      text_en: "The leading cause of under-5 mortality in sub-Saharan Africa is:",
      explanation_en: "Malaria remains the leading cause of under-5 mortality in sub-Saharan Africa, followed by pneumonia, diarrheal diseases, and neonatal conditions.",
    },
    {
      id: Q.q32, category_id: CAT.community, difficulty: "MEDIUM", is_approved: true,
      text_en: "In Rwanda, the community health worker program uses trained volunteers called:",
      explanation_en: "Rwanda's community health program relies on Community Health Workers (CHWs) called 'Inararibonye' at the community level, who provide basic health services and referrals.",
    },
    {
      id: Q.q33, category_id: CAT.community, difficulty: "MEDIUM", is_approved: true,
      text_en: "The primary mode of transmission of cholera is:",
      explanation_en: "Cholera (Vibrio cholerae) is transmitted via the fecal-oral route, primarily through contaminated water and food. It causes severe rice-water diarrhea.",
    },
    {
      id: Q.q34, category_id: CAT.community, difficulty: "HARD", is_approved: true,
      text_en: "Which indicator is used to measure the burden of disease that accounts for both years of life lost to premature death and years lived with disability?",
      explanation_en: "Disability-Adjusted Life Years (DALYs) = Years of Life Lost (YLL) + Years Lived with Disability (YLD). It measures the overall disease burden.",
    },
    {
      id: Q.q35, category_id: CAT.community, difficulty: "EASY", is_approved: true,
      text_en: "Rwanda's universal health coverage scheme that provides community-based health insurance is called:",
      explanation_en: "Mutuelle de Santé (Community Based Health Insurance) provides health coverage for most Rwandans, with premiums subsidized based on income category.",
    },
    {
      id: Q.q36, category_id: CAT.community, difficulty: "MEDIUM", is_approved: true,
      text_en: "Herd immunity against measles requires vaccination coverage of at least:",
      explanation_en: "Due to measles' high transmissibility (R0 of 12-18), herd immunity requires approximately 92-95% vaccination coverage of the population.",
    },
    {
      id: Q.q37, category_id: CAT.community, difficulty: "MEDIUM", is_approved: true,
      text_en: "The most effective method to prevent mother-to-child transmission (PMTCT) of HIV in Rwanda is:",
      explanation_en: "Option B+ (lifelong ART for all HIV-positive pregnant and breastfeeding women, regardless of CD4 count) is Rwanda's PMTCT strategy, reducing transmission to <2%.",
    },
    {
      id: Q.q38, category_id: CAT.community, difficulty: "HARD", is_approved: true,
      text_en: "In epidemiology, the attack rate during an outbreak is calculated as:",
      explanation_en: "Attack rate = (Number of people who developed the disease / Number of people at risk) × 100. It measures the probability of developing disease in an exposed population.",
    },
    {
      id: Q.q39, category_id: CAT.community, difficulty: "EASY", is_approved: true,
      text_en: "Which water purification method is most practical for household use in rural Rwanda?",
      explanation_en: "Boiling water is the most accessible and effective household water treatment method in rural settings. Chlorination and solar disinfection (SODIS) are also used.",
    },
    {
      id: Q.q40, category_id: CAT.community, difficulty: "MEDIUM", is_approved: true,
      text_en: "The Expanded Programme on Immunization (EPI) in Rwanda gives BCG vaccine primarily to prevent:",
      explanation_en: "BCG (Bacille Calmette-Guérin) vaccine is given at birth to protect against severe forms of tuberculosis, particularly TB meningitis and miliary TB in children.",
    },
  ].map((q) => ({ type: "MULTIPLE_CHOICE", is_active: true, ...q }));

  await upsert("questions", questions, "id");

  // ── Answers ──────────────────────────────────────────────────────────────
  console.log("\n── Answers ────────────────────────────");

  const answers = [
    // Q1 - STEMI
    { question_id: Q.q1, text_en: "ST-elevation myocardial infarction (STEMI)", is_correct: true,  order: 0 },
    { question_id: Q.q1, text_en: "Stable angina pectoris", is_correct: false, order: 1 },
    { question_id: Q.q1, text_en: "Aortic dissection", is_correct: false, order: 2 },
    { question_id: Q.q1, text_en: "Pulmonary embolism", is_correct: false, order: 3 },
    // Q2 - Hypertension first-line
    { question_id: Q.q2, text_en: "ACE inhibitor (e.g., enalapril)", is_correct: true,  order: 0 },
    { question_id: Q.q2, text_en: "Beta-blocker (e.g., atenolol)", is_correct: false, order: 1 },
    { question_id: Q.q2, text_en: "Calcium channel blocker (e.g., amlodipine)", is_correct: false, order: 2 },
    { question_id: Q.q2, text_en: "Thiazide diuretic (e.g., hydrochlorothiazide)", is_correct: false, order: 3 },
    // Q3 - HHS
    { question_id: Q.q3, text_en: "Hyperosmolar Hyperglycemic State (HHS)", is_correct: true,  order: 0 },
    { question_id: Q.q3, text_en: "Diabetic Ketoacidosis (DKA)", is_correct: false, order: 1 },
    { question_id: Q.q3, text_en: "Hypoglycemic coma", is_correct: false, order: 2 },
    { question_id: Q.q3, text_en: "Lactic acidosis", is_correct: false, order: 3 },
    // Q4 - Vomiting electrolyte
    { question_id: Q.q4, text_en: "Hypokalemia", is_correct: true,  order: 0 },
    { question_id: Q.q4, text_en: "Hyperkalemia", is_correct: false, order: 1 },
    { question_id: Q.q4, text_en: "Hypernatremia", is_correct: false, order: 2 },
    { question_id: Q.q4, text_en: "Hypercalcemia", is_correct: false, order: 3 },
    // Q5 - CAP organism
    { question_id: Q.q5, text_en: "Streptococcus pneumoniae", is_correct: true,  order: 0 },
    { question_id: Q.q5, text_en: "Haemophilus influenzae", is_correct: false, order: 1 },
    { question_id: Q.q5, text_en: "Klebsiella pneumoniae", is_correct: false, order: 2 },
    { question_id: Q.q5, text_en: "Mycoplasma pneumoniae", is_correct: false, order: 3 },
    // Q6 - Obstructive jaundice
    { question_id: Q.q6, text_en: "Obstructive (cholestatic) jaundice", is_correct: true,  order: 0 },
    { question_id: Q.q6, text_en: "Hemolytic jaundice", is_correct: false, order: 1 },
    { question_id: Q.q6, text_en: "Hepatocellular jaundice", is_correct: false, order: 2 },
    { question_id: Q.q6, text_en: "Neonatal physiological jaundice", is_correct: false, order: 3 },
    // Q7 - Nephrotic syndrome
    { question_id: Q.q7, text_en: "Massive proteinuria (>3.5g/day)", is_correct: true,  order: 0 },
    { question_id: Q.q7, text_en: "Hematuria", is_correct: false, order: 1 },
    { question_id: Q.q7, text_en: "Red cell casts", is_correct: false, order: 2 },
    { question_id: Q.q7, text_en: "Bacteriuria", is_correct: false, order: 3 },
    // Q8 - Lung cancer
    { question_id: Q.q8, text_en: "Squamous cell carcinoma of the lung", is_correct: true,  order: 0 },
    { question_id: Q.q8, text_en: "Small cell lung carcinoma", is_correct: false, order: 1 },
    { question_id: Q.q8, text_en: "Adenocarcinoma of the lung", is_correct: false, order: 2 },
    { question_id: Q.q8, text_en: "Pulmonary tuberculosis", is_correct: false, order: 3 },
    // Q9 - Iron deficiency NOT feature
    { question_id: Q.q9, text_en: "Hypersegmented neutrophils", is_correct: true,  order: 0 },
    { question_id: Q.q9, text_en: "Low serum ferritin", is_correct: false, order: 1 },
    { question_id: Q.q9, text_en: "Microcytic hypochromic anemia", is_correct: false, order: 2 },
    { question_id: Q.q9, text_en: "Elevated TIBC", is_correct: false, order: 3 },
    // Q10 - UGIB investigation
    { question_id: Q.q10, text_en: "Urgent upper GI endoscopy", is_correct: true,  order: 0 },
    { question_id: Q.q10, text_en: "Barium swallow", is_correct: false, order: 1 },
    { question_id: Q.q10, text_en: "CT angiography", is_correct: false, order: 2 },
    { question_id: Q.q10, text_en: "Stool occult blood test", is_correct: false, order: 3 },
    // Q11 - Meningitis infant
    { question_id: Q.q11, text_en: "Bacterial meningitis", is_correct: true,  order: 0 },
    { question_id: Q.q11, text_en: "Viral encephalitis", is_correct: false, order: 1 },
    { question_id: Q.q11, text_en: "Febrile convulsion", is_correct: false, order: 2 },
    { question_id: Q.q11, text_en: "Hydrocephalus", is_correct: false, order: 3 },
    // Q12 - Measles vaccine age
    { question_id: Q.q12, text_en: "9 months", is_correct: true,  order: 0 },
    { question_id: Q.q12, text_en: "6 months", is_correct: false, order: 1 },
    { question_id: Q.q12, text_en: "12 months", is_correct: false, order: 2 },
    { question_id: Q.q12, text_en: "18 months", is_correct: false, order: 3 },
    // Q13 - Celiac
    { question_id: Q.q13, text_en: "Celiac disease", is_correct: true,  order: 0 },
    { question_id: Q.q13, text_en: "Giardia infection", is_correct: false, order: 1 },
    { question_id: Q.q13, text_en: "Cystic fibrosis", is_correct: false, order: 2 },
    { question_id: Q.q13, text_en: "Hirschsprung disease", is_correct: false, order: 3 },
    // Q14 - RDS in preterm
    { question_id: Q.q14, text_en: "Respiratory Distress Syndrome (RDS)", is_correct: true,  order: 0 },
    { question_id: Q.q14, text_en: "Transient tachypnea of the newborn", is_correct: false, order: 1 },
    { question_id: Q.q14, text_en: "Meconium aspiration syndrome", is_correct: false, order: 2 },
    { question_id: Q.q14, text_en: "Congenital pneumonia", is_correct: false, order: 3 },
    // Q15 - Apgar NOT included
    { question_id: Q.q15, text_en: "Birth weight", is_correct: true,  order: 0 },
    { question_id: Q.q15, text_en: "Heart rate", is_correct: false, order: 1 },
    { question_id: Q.q15, text_en: "Respiratory effort", is_correct: false, order: 2 },
    { question_id: Q.q15, text_en: "Muscle tone", is_correct: false, order: 3 },
    // Q16 - Croup
    { question_id: Q.q16, text_en: "Croup (laryngotracheobronchitis)", is_correct: true,  order: 0 },
    { question_id: Q.q16, text_en: "Acute epiglottitis", is_correct: false, order: 1 },
    { question_id: Q.q16, text_en: "Bronchiolitis", is_correct: false, order: 2 },
    { question_id: Q.q16, text_en: "Asthma attack", is_correct: false, order: 3 },
    // Q17 - SCD management
    { question_id: Q.q17, text_en: "Analgesia, IV fluids, and antibiotics if febrile", is_correct: true,  order: 0 },
    { question_id: Q.q17, text_en: "Immediate blood transfusion", is_correct: false, order: 1 },
    { question_id: Q.q17, text_en: "Emergency splenectomy", is_correct: false, order: 2 },
    { question_id: Q.q17, text_en: "Hydroxyurea alone", is_correct: false, order: 3 },
    // Q18 - Rickets
    { question_id: Q.q18, text_en: "Vitamin D", is_correct: true,  order: 0 },
    { question_id: Q.q18, text_en: "Vitamin C", is_correct: false, order: 1 },
    { question_id: Q.q18, text_en: "Vitamin A", is_correct: false, order: 2 },
    { question_id: Q.q18, text_en: "Vitamin B12", is_correct: false, order: 3 },
    // Q19 - Normal RR 1yr
    { question_id: Q.q19, text_en: "25–35 breaths/minute", is_correct: true,  order: 0 },
    { question_id: Q.q19, text_en: "12–20 breaths/minute", is_correct: false, order: 1 },
    { question_id: Q.q19, text_en: "40–60 breaths/minute", is_correct: false, order: 2 },
    { question_id: Q.q19, text_en: "50–70 breaths/minute", is_correct: false, order: 3 },
    // Q20 - Kwashiorkor
    { question_id: Q.q20, text_en: "Pitting edema and 'flaky paint' dermatosis", is_correct: true,  order: 0 },
    { question_id: Q.q20, text_en: "Severe muscle wasting with no edema", is_correct: false, order: 1 },
    { question_id: Q.q20, text_en: "Scurvy and bleeding gums", is_correct: false, order: 2 },
    { question_id: Q.q20, text_en: "Night blindness and Bitot spots", is_correct: false, order: 3 },
    // Q21 - Severe preeclampsia
    { question_id: Q.q21, text_en: "Severe preeclampsia", is_correct: true,  order: 0 },
    { question_id: Q.q21, text_en: "Gestational hypertension", is_correct: false, order: 1 },
    { question_id: Q.q21, text_en: "Eclampsia", is_correct: false, order: 2 },
    { question_id: Q.q21, text_en: "HELLP syndrome", is_correct: false, order: 3 },
    // Q22 - Nagele's rule
    { question_id: Q.q22, text_en: "Add 7 days and subtract 3 months from the LMP", is_correct: true,  order: 0 },
    { question_id: Q.q22, text_en: "Add 14 days and subtract 2 months from the LMP", is_correct: false, order: 1 },
    { question_id: Q.q22, text_en: "Add 10 days and add 9 months to the LMP", is_correct: false, order: 2 },
    { question_id: Q.q22, text_en: "Subtract 7 days and add 9 months to the LMP", is_correct: false, order: 3 },
    // Q23 - Placenta previa
    { question_id: Q.q23, text_en: "Placenta previa", is_correct: true,  order: 0 },
    { question_id: Q.q23, text_en: "Placental abruption", is_correct: false, order: 1 },
    { question_id: Q.q23, text_en: "Vasa previa", is_correct: false, order: 2 },
    { question_id: Q.q23, text_en: "Uterine rupture", is_correct: false, order: 3 },
    // Q24 - PPH cause
    { question_id: Q.q24, text_en: "Uterine atony", is_correct: true,  order: 0 },
    { question_id: Q.q24, text_en: "Retained placenta", is_correct: false, order: 1 },
    { question_id: Q.q24, text_en: "Genital tract lacerations", is_correct: false, order: 2 },
    { question_id: Q.q24, text_en: "Coagulation disorders", is_correct: false, order: 3 },
    // Q25 - Definitive sign of pregnancy
    { question_id: Q.q25, text_en: "Fetal heart sounds heard on auscultation", is_correct: true,  order: 0 },
    { question_id: Q.q25, text_en: "Positive urine pregnancy test", is_correct: false, order: 1 },
    { question_id: Q.q25, text_en: "Amenorrhea", is_correct: false, order: 2 },
    { question_id: Q.q25, text_en: "Morning sickness", is_correct: false, order: 3 },
    // Q26 - Ectopic pregnancy
    { question_id: Q.q26, text_en: "Ectopic pregnancy", is_correct: true,  order: 0 },
    { question_id: Q.q26, text_en: "Threatened miscarriage", is_correct: false, order: 1 },
    { question_id: Q.q26, text_en: "Complete abortion", is_correct: false, order: 2 },
    { question_id: Q.q26, text_en: "Hydatidiform mole", is_correct: false, order: 3 },
    // Q27 - Rwanda cervical screening
    { question_id: Q.q27, text_en: "Visual Inspection with Acetic Acid (VIA)", is_correct: true,  order: 0 },
    { question_id: Q.q27, text_en: "Pap smear (cervical cytology)", is_correct: false, order: 1 },
    { question_id: Q.q27, text_en: "HPV DNA testing", is_correct: false, order: 2 },
    { question_id: Q.q27, text_en: "Colposcopy", is_correct: false, order: 3 },
    // Q28 - Bishop score
    { question_id: Q.q28, text_en: "Cervical ripeness for induction of labor", is_correct: true,  order: 0 },
    { question_id: Q.q28, text_en: "Fetal lung maturity", is_correct: false, order: 1 },
    { question_id: Q.q28, text_en: "Risk of postpartum hemorrhage", is_correct: false, order: 2 },
    { question_id: Q.q28, text_en: "Placental function", is_correct: false, order: 3 },
    // Q29 - Exclusive breastfeeding
    { question_id: Q.q29, text_en: "6 months", is_correct: true,  order: 0 },
    { question_id: Q.q29, text_en: "3 months", is_correct: false, order: 1 },
    { question_id: Q.q29, text_en: "4 months", is_correct: false, order: 2 },
    { question_id: Q.q29, text_en: "12 months", is_correct: false, order: 3 },
    // Q30 - PID
    { question_id: Q.q30, text_en: "Pelvic Inflammatory Disease (PID)", is_correct: true,  order: 0 },
    { question_id: Q.q30, text_en: "Appendicitis", is_correct: false, order: 1 },
    { question_id: Q.q30, text_en: "Ovarian torsion", is_correct: false, order: 2 },
    { question_id: Q.q30, text_en: "Endometriosis", is_correct: false, order: 3 },
    // Q31 - Under-5 mortality cause
    { question_id: Q.q31, text_en: "Malaria", is_correct: true,  order: 0 },
    { question_id: Q.q31, text_en: "Diarrheal diseases", is_correct: false, order: 1 },
    { question_id: Q.q31, text_en: "Pneumonia", is_correct: false, order: 2 },
    { question_id: Q.q31, text_en: "HIV/AIDS", is_correct: false, order: 3 },
    // Q32 - Rwanda CHW name
    { question_id: Q.q32, text_en: "Inararibonye (Community Health Workers)", is_correct: true,  order: 0 },
    { question_id: Q.q32, text_en: "Umuganda volunteers", is_correct: false, order: 1 },
    { question_id: Q.q32, text_en: "Abajyanama b'Ubuzima", is_correct: false, order: 2 },
    { question_id: Q.q32, text_en: "Imirimo y'Umuturage", is_correct: false, order: 3 },
    // Q33 - Cholera transmission
    { question_id: Q.q33, text_en: "Fecal-oral route via contaminated water", is_correct: true,  order: 0 },
    { question_id: Q.q33, text_en: "Airborne droplets", is_correct: false, order: 1 },
    { question_id: Q.q33, text_en: "Direct skin contact", is_correct: false, order: 2 },
    { question_id: Q.q33, text_en: "Mosquito bites", is_correct: false, order: 3 },
    // Q34 - DALY
    { question_id: Q.q34, text_en: "Disability-Adjusted Life Years (DALYs)", is_correct: true,  order: 0 },
    { question_id: Q.q34, text_en: "Quality-Adjusted Life Years (QALYs)", is_correct: false, order: 1 },
    { question_id: Q.q34, text_en: "Years of Potential Life Lost (YPLL)", is_correct: false, order: 2 },
    { question_id: Q.q34, text_en: "Infant Mortality Rate (IMR)", is_correct: false, order: 3 },
    // Q35 - Rwanda health insurance
    { question_id: Q.q35, text_en: "Mutuelle de Santé", is_correct: true,  order: 0 },
    { question_id: Q.q35, text_en: "RAMA (La Rwandaise d'Assurance Maladie)", is_correct: false, order: 1 },
    { question_id: Q.q35, text_en: "MMI (Military Medical Insurance)", is_correct: false, order: 2 },
    { question_id: Q.q35, text_en: "MEDIPLAN", is_correct: false, order: 3 },
    // Q36 - Measles herd immunity
    { question_id: Q.q36, text_en: "92–95%", is_correct: true,  order: 0 },
    { question_id: Q.q36, text_en: "70–75%", is_correct: false, order: 1 },
    { question_id: Q.q36, text_en: "60–65%", is_correct: false, order: 2 },
    { question_id: Q.q36, text_en: "80–85%", is_correct: false, order: 3 },
    // Q37 - PMTCT Rwanda
    { question_id: Q.q37, text_en: "Option B+ (lifelong ART for all HIV-positive pregnant women)", is_correct: true,  order: 0 },
    { question_id: Q.q37, text_en: "Single-dose nevirapine at delivery only", is_correct: false, order: 1 },
    { question_id: Q.q37, text_en: "Elective cesarean section without ART", is_correct: false, order: 2 },
    { question_id: Q.q37, text_en: "Formula feeding without ART", is_correct: false, order: 3 },
    // Q38 - Attack rate formula
    { question_id: Q.q38, text_en: "(New cases / Population at risk) × 100", is_correct: true,  order: 0 },
    { question_id: Q.q38, text_en: "(New cases / Total population) × 1000", is_correct: false, order: 1 },
    { question_id: Q.q38, text_en: "(Deaths / New cases) × 100", is_correct: false, order: 2 },
    { question_id: Q.q38, text_en: "(Exposed cases / Unexposed cases) × 100", is_correct: false, order: 3 },
    // Q39 - Water purification rural Rwanda
    { question_id: Q.q39, text_en: "Boiling", is_correct: true,  order: 0 },
    { question_id: Q.q39, text_en: "Reverse osmosis", is_correct: false, order: 1 },
    { question_id: Q.q39, text_en: "Ultraviolet irradiation", is_correct: false, order: 2 },
    { question_id: Q.q39, text_en: "Distillation", is_correct: false, order: 3 },
    // Q40 - BCG vaccine target disease
    { question_id: Q.q40, text_en: "Tuberculosis (especially TB meningitis in children)", is_correct: true,  order: 0 },
    { question_id: Q.q40, text_en: "Whooping cough (pertussis)", is_correct: false, order: 1 },
    { question_id: Q.q40, text_en: "Typhoid fever", is_correct: false, order: 2 },
    { question_id: Q.q40, text_en: "Cholera", is_correct: false, order: 3 },
  ].map((a) => ({ id: id(), ...a }));

  await upsert("answers", answers, "id");

  // ── Exams ────────────────────────────────────────────────────────────────
  console.log("\n── Exams ──────────────────────────────");

  await upsert("exams", [
    {
      id: EXAM.internal,
      title: "Internal Medicine — Mock Exam",
      title_en: "Internal Medicine — Mock Exam",
      title_fr: "Médecine Interne — Examen Simulé",
      description: "A 10-question timed simulation covering core Internal Medicine topics tested in the medical licensing exam.",
      category_id: CAT.internal,
      duration_minutes: 20,
      passing_score: 70,
      total_questions: 10,
      is_published: true,
      is_free: true,
      shuffle_questions: true,
      shuffle_answers: true,
    },
    {
      id: EXAM.pediatrics,
      title: "Pediatrics — Mock Exam",
      title_en: "Pediatrics — Mock Exam",
      title_fr: "Pédiatrie — Examen Simulé",
      description: "A 10-question timed simulation covering Pediatrics topics tested in the medical licensing exam.",
      category_id: CAT.pediatrics,
      duration_minutes: 20,
      passing_score: 70,
      total_questions: 10,
      is_published: true,
      is_free: true,
      shuffle_questions: true,
      shuffle_answers: true,
    },
    {
      id: EXAM.mixed,
      title: "MedLicense Full Mixed Mock — 40 Questions",
      title_en: "MedLicense Full Mixed Mock — 40 Questions",
      title_fr: "Simulé Complet MedLicense — 40 Questions",
      description: "A comprehensive 40-question mock exam across Internal Medicine, Pediatrics, Obstetrics & Gynecology, and Community Health.",
      category_id: CAT.internal,
      duration_minutes: 60,
      passing_score: 70,
      total_questions: 40,
      is_published: true,
      is_free: false,
      shuffle_questions: true,
      shuffle_answers: true,
    },
  ], "id");

  // ── Exam Questions ────────────────────────────────────────────────────────
  console.log("\n── Exam Questions ─────────────────────");

  const examQuestions = [
    // Internal Medicine exam (Q1–Q10)
    ...Array.from({ length: 10 }, (_, i) => ({
      id: id(),
      exam_id: EXAM.internal,
      question_id: Q[`q${i + 1}`],
      order: i,
    })),
    // Pediatrics exam (Q11–Q20)
    ...Array.from({ length: 10 }, (_, i) => ({
      id: id(),
      exam_id: EXAM.pediatrics,
      question_id: Q[`q${i + 11}`],
      order: i,
    })),
    // Mixed exam (all 40)
    ...Array.from({ length: 40 }, (_, i) => ({
      id: id(),
      exam_id: EXAM.mixed,
      question_id: Q[`q${i + 1}`],
      order: i,
    })),
  ];

  await upsert("exam_questions", examQuestions, "id");

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Seed complete!

  Credentials
  ───────────────────────────────────────
  Student  →  student@demo.com  /  Demo@1234
  Admin    →  admin@demo.com    /  Admin@1234

  Exams available
  ───────────────────────────────────────
  • Internal Medicine Mock        (10 Qs, 20 min, FREE)
  • Pediatrics Mock               (10 Qs, 20 min, FREE)
  • MedLicense Full Mixed Mock    (40 Qs, 60 min, Premium)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

seed().catch(console.error);
