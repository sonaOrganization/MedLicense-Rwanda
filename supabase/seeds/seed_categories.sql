-- ─────────────────────────────────────────────────────────────────────────────
-- Seed specialty-specific categories for all 16 license types
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps license_category in sync
-- Run AFTER migration 003
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO categories (id, name, name_en, name_fr, slug, license_category)
VALUES
  -- ── Dentist ──────────────────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Oral Anatomy & Physiology',       'Oral Anatomy & Physiology',       'Anatomie et Physiologie Buccale',          'dentist-oral-anatomy-physiology',      'dentist'),
  (gen_random_uuid()::text, 'Dental Pathology & Diagnosis',    'Dental Pathology & Diagnosis',    'Pathologie et Diagnostic Dentaire',        'dentist-dental-pathology-diagnosis',   'dentist'),
  (gen_random_uuid()::text, 'Oral Surgery & Anaesthesia',      'Oral Surgery & Anaesthesia',      'Chirurgie Buccale et Anesthésie',          'dentist-oral-surgery-anaesthesia',     'dentist'),
  (gen_random_uuid()::text, 'Restorative & Prosthetic Dentistry', 'Restorative & Prosthetic Dentistry', 'Dentisterie Restauratrice et Prothétique', 'dentist-restorative-prosthetic',       'dentist'),
  (gen_random_uuid()::text, 'Endodontics & Periodontics',      'Endodontics & Periodontics',      'Endodontie et Parodontologie',             'dentist-endodontics-periodontics',     'dentist'),
  (gen_random_uuid()::text, 'Preventive & Community Dentistry','Preventive & Community Dentistry','Dentisterie Préventive et Communautaire',  'dentist-preventive-community',         'dentist'),
  (gen_random_uuid()::text, 'Dental Radiology & Imaging',      'Dental Radiology & Imaging',      'Radiologie et Imagerie Dentaire',          'dentist-dental-radiology-imaging',     'dentist'),
  (gen_random_uuid()::text, 'Dental Materials Science',        'Dental Materials Science',        'Science des Matériaux Dentaires',          'dentist-dental-materials-science',     'dentist'),

  -- ── Dental Technician ────────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Dental Materials & Properties',   'Dental Materials & Properties',   'Matériaux et Propriétés Dentaires',        'dental-tech-materials-properties',     'dental_technician'),
  (gen_random_uuid()::text, 'Removable Prosthodontics',        'Removable Prosthodontics',        'Prothèse Amovible',                        'dental-tech-removable-prosthodontics', 'dental_technician'),
  (gen_random_uuid()::text, 'Fixed Prosthodontics',            'Fixed Prosthodontics',            'Prothèse Fixe',                            'dental-tech-fixed-prosthodontics',     'dental_technician'),
  (gen_random_uuid()::text, 'Orthodontic Appliances',          'Orthodontic Appliances',          'Appareils Orthodontiques',                 'dental-tech-orthodontic-appliances',   'dental_technician'),
  (gen_random_uuid()::text, 'Dental Anatomy & Occlusion',      'Dental Anatomy & Occlusion',      'Anatomie Dentaire et Occlusion',           'dental-tech-anatomy-occlusion',        'dental_technician'),
  (gen_random_uuid()::text, 'Dental Laboratory Safety',        'Dental Laboratory Safety',        'Sécurité en Laboratoire Dentaire',         'dental-tech-laboratory-safety',        'dental_technician'),
  (gen_random_uuid()::text, 'Quality Control Methods',         'Quality Control Methods',         'Méthodes de Contrôle de Qualité',          'dental-tech-quality-control',          'dental_technician'),
  (gen_random_uuid()::text, 'Dental Anatomy',                  'Dental Anatomy',                  'Anatomie Dentaire',                        'dental-tech-dental-anatomy',           'dental_technician'),

  -- ── Medical Doctor ───────────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Internal Medicine',               'Internal Medicine',               'Médecine Interne',                         'md-internal-medicine',                 'medical_doctor'),
  (gen_random_uuid()::text, 'Surgery & Surgical Procedures',   'Surgery & Surgical Procedures',   'Chirurgie et Procédures Chirurgicales',    'md-surgery-procedures',                'medical_doctor'),
  (gen_random_uuid()::text, 'Paediatrics & Neonatology',       'Paediatrics & Neonatology',       'Pédiatrie et Néonatologie',                'md-paediatrics-neonatology',           'medical_doctor'),
  (gen_random_uuid()::text, 'Obstetrics & Gynaecology',        'Obstetrics & Gynaecology',        'Obstétrique et Gynécologie',               'md-obstetrics-gynaecology',            'medical_doctor'),
  (gen_random_uuid()::text, 'Community & Preventive Health',   'Community & Preventive Health',   'Santé Communautaire et Préventive',        'md-community-preventive-health',       'medical_doctor'),
  (gen_random_uuid()::text, 'Pharmacology & Therapeutics',     'Pharmacology & Therapeutics',     'Pharmacologie et Thérapeutique',           'md-pharmacology-therapeutics',         'medical_doctor'),
  (gen_random_uuid()::text, 'Emergency Medicine',              'Emergency Medicine',              'Médecine d''Urgence',                      'md-emergency-medicine',                'medical_doctor'),
  (gen_random_uuid()::text, 'Medical Ethics & Jurisprudence',  'Medical Ethics & Jurisprudence',  'Éthique Médicale et Jurisprudence',        'md-medical-ethics-jurisprudence',      'medical_doctor'),

  -- ── Specialist Physician ─────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Internal Medicine',               'Internal Medicine',               'Médecine Interne',                         'spec-internal-medicine',               'specialist_doctor'),
  (gen_random_uuid()::text, 'Surgery & Procedures',            'Surgery & Procedures',            'Chirurgie et Procédures',                  'spec-surgery-procedures',              'specialist_doctor'),
  (gen_random_uuid()::text, 'Specialty-Specific Pathology',    'Specialty-Specific Pathology',    'Pathologie Spécifique à la Spécialité',    'spec-specialty-pathology',             'specialist_doctor'),
  (gen_random_uuid()::text, 'Clinical Pharmacology',           'Clinical Pharmacology',           'Pharmacologie Clinique',                   'spec-clinical-pharmacology',           'specialist_doctor'),
  (gen_random_uuid()::text, 'Evidence-Based Medicine',         'Evidence-Based Medicine',         'Médecine Fondée sur les Preuves',          'spec-evidence-based-medicine',         'specialist_doctor'),
  (gen_random_uuid()::text, 'Radiology & Imaging',             'Radiology & Imaging',             'Radiologie et Imagerie',                   'spec-radiology-imaging',               'specialist_doctor'),
  (gen_random_uuid()::text, 'Critical Care',                   'Critical Care',                   'Soins Intensifs',                          'spec-critical-care',                   'specialist_doctor'),
  (gen_random_uuid()::text, 'Medical Ethics',                  'Medical Ethics',                  'Éthique Médicale',                         'spec-medical-ethics',                  'specialist_doctor'),

  -- ── Pharmacist ───────────────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Pharmaceutical Chemistry',        'Pharmaceutical Chemistry',        'Chimie Pharmaceutique',                    'pharm-pharmaceutical-chemistry',       'pharmacist'),
  (gen_random_uuid()::text, 'Pharmacokinetics & Dynamics',     'Pharmacokinetics & Dynamics',     'Pharmacocinétique et Dynamique',           'pharm-pharmacokinetics-dynamics',      'pharmacist'),
  (gen_random_uuid()::text, 'Clinical Pharmacy Practice',      'Clinical Pharmacy Practice',      'Pratique de la Pharmacie Clinique',        'pharm-clinical-pharmacy',              'pharmacist'),
  (gen_random_uuid()::text, 'Drug Dispensing & Counselling',   'Drug Dispensing & Counselling',   'Dispensation et Conseil en Médicaments',  'pharm-drug-dispensing',                'pharmacist'),
  (gen_random_uuid()::text, 'Pharmaceutical Microbiology',     'Pharmaceutical Microbiology',     'Microbiologie Pharmaceutique',             'pharm-pharmaceutical-microbiology',    'pharmacist'),
  (gen_random_uuid()::text, 'Drug Interactions & Safety',      'Drug Interactions & Safety',      'Interactions Médicamenteuses et Sécurité', 'pharm-drug-interactions',              'pharmacist'),
  (gen_random_uuid()::text, 'Pharmacy Law & Ethics',           'Pharmacy Law & Ethics',           'Droit et Éthique Pharmaceutiques',         'pharm-pharmacy-law-ethics',            'pharmacist'),
  (gen_random_uuid()::text, 'Pharmaceutical Calculations',     'Pharmaceutical Calculations',     'Calculs Pharmaceutiques',                  'pharm-pharmaceutical-calculations',    'pharmacist'),

  -- ── Pharmacy Technician ──────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Basic Pharmacology',              'Basic Pharmacology',              'Pharmacologie de Base',                    'pharm-tech-basic-pharmacology',        'pharmacy_technician'),
  (gen_random_uuid()::text, 'Dispensing Techniques',           'Dispensing Techniques',           'Techniques de Dispensation',               'pharm-tech-dispensing',                'pharmacy_technician'),
  (gen_random_uuid()::text, 'Drug Storage & Handling',         'Drug Storage & Handling',         'Stockage et Manipulation des Médicaments', 'pharm-tech-drug-storage',              'pharmacy_technician'),
  (gen_random_uuid()::text, 'Pharmaceutical Calculations',     'Pharmaceutical Calculations',     'Calculs Pharmaceutiques',                  'pharm-tech-calculations',              'pharmacy_technician'),
  (gen_random_uuid()::text, 'Patient Safety & Error Prevention','Patient Safety & Error Prevention','Sécurité du Patient et Prévention des Erreurs','pharm-tech-patient-safety',         'pharmacy_technician'),
  (gen_random_uuid()::text, 'Inventory Management',            'Inventory Management',            'Gestion des Stocks',                       'pharm-tech-inventory',                 'pharmacy_technician'),
  (gen_random_uuid()::text, 'Pharmacy Law',                    'Pharmacy Law',                    'Droit Pharmaceutique',                     'pharm-tech-pharmacy-law',              'pharmacy_technician'),
  (gen_random_uuid()::text, 'Aseptic Technique',               'Aseptic Technique',               'Technique Aseptique',                      'pharm-tech-aseptic-technique',         'pharmacy_technician'),

  -- ── Nurse A0 (BSc) ───────────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Advanced Clinical Nursing',       'Advanced Clinical Nursing',       'Soins Infirmiers Cliniques Avancés',       'nurse-a0-advanced-clinical',           'nurse_a0'),
  (gen_random_uuid()::text, 'Research & Evidence-Based Practice','Research & Evidence-Based Practice','Recherche et Pratique Fondée sur les Preuves','nurse-a0-research',               'nurse_a0'),
  (gen_random_uuid()::text, 'Nursing Leadership & Management', 'Nursing Leadership & Management', 'Leadership et Gestion Infirmiers',         'nurse-a0-leadership',                  'nurse_a0'),
  (gen_random_uuid()::text, 'Advanced Pharmacology',           'Advanced Pharmacology',           'Pharmacologie Avancée',                    'nurse-a0-advanced-pharmacology',       'nurse_a0'),
  (gen_random_uuid()::text, 'Critical Care Nursing',           'Critical Care Nursing',           'Soins Infirmiers en Soins Intensifs',      'nurse-a0-critical-care',               'nurse_a0'),
  (gen_random_uuid()::text, 'Mental Health Nursing',           'Mental Health Nursing',           'Soins Infirmiers en Santé Mentale',        'nurse-a0-mental-health',               'nurse_a0'),
  (gen_random_uuid()::text, 'Community & Public Health',       'Community & Public Health',       'Santé Communautaire et Publique',          'nurse-a0-community-health',            'nurse_a0'),
  (gen_random_uuid()::text, 'Nursing Ethics & Law',            'Nursing Ethics & Law',            'Éthique et Droit Infirmiers',              'nurse-a0-ethics-law',                  'nurse_a0'),

  -- ── Nurse A1 ─────────────────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Clinical Nursing Practice',       'Clinical Nursing Practice',       'Pratique des Soins Infirmiers Cliniques',  'nurse-a1-clinical-practice',           'nurse_a1'),
  (gen_random_uuid()::text, 'Medical-Surgical Nursing',        'Medical-Surgical Nursing',        'Soins Infirmiers Médico-Chirurgicaux',     'nurse-a1-medical-surgical',            'nurse_a1'),
  (gen_random_uuid()::text, 'Maternal & Child Health',         'Maternal & Child Health',         'Santé Maternelle et Infantile',            'nurse-a1-maternal-child',              'nurse_a1'),
  (gen_random_uuid()::text, 'Community Nursing',               'Community Nursing',               'Soins Infirmiers Communautaires',          'nurse-a1-community',                   'nurse_a1'),
  (gen_random_uuid()::text, 'Pharmacology',                    'Pharmacology',                    'Pharmacologie',                            'nurse-a1-pharmacology',                'nurse_a1'),
  (gen_random_uuid()::text, 'Infection Prevention & Control',  'Infection Prevention & Control',  'Prévention et Contrôle des Infections',   'nurse-a1-infection-control',           'nurse_a1'),
  (gen_random_uuid()::text, 'Mental Health Nursing',           'Mental Health Nursing',           'Soins Infirmiers en Santé Mentale',        'nurse-a1-mental-health',               'nurse_a1'),
  (gen_random_uuid()::text, 'Nursing Ethics',                  'Nursing Ethics',                  'Éthique Infirmière',                       'nurse-a1-ethics',                      'nurse_a1'),

  -- ── Nurse A2 ─────────────────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Fundamental Nursing',             'Fundamental Nursing',             'Soins Infirmiers Fondamentaux',            'nurse-a2-fundamental',                 'nurse_a2'),
  (gen_random_uuid()::text, 'Basic Pharmacology',              'Basic Pharmacology',              'Pharmacologie de Base',                    'nurse-a2-basic-pharmacology',          'nurse_a2'),
  (gen_random_uuid()::text, 'Patient Care & Safety',           'Patient Care & Safety',           'Soins et Sécurité du Patient',             'nurse-a2-patient-care',                'nurse_a2'),
  (gen_random_uuid()::text, 'Anatomy & Physiology',            'Anatomy & Physiology',            'Anatomie et Physiologie',                  'nurse-a2-anatomy-physiology',          'nurse_a2'),
  (gen_random_uuid()::text, 'Infection Control',               'Infection Control',               'Contrôle des Infections',                  'nurse-a2-infection-control',           'nurse_a2'),
  (gen_random_uuid()::text, 'Community Health',                'Community Health',                'Santé Communautaire',                      'nurse-a2-community-health',            'nurse_a2'),
  (gen_random_uuid()::text, 'First Aid & Emergency',           'First Aid & Emergency',           'Premiers Secours et Urgences',             'nurse-a2-first-aid',                   'nurse_a2'),
  (gen_random_uuid()::text, 'Nursing Ethics',                  'Nursing Ethics',                  'Éthique Infirmière',                       'nurse-a2-ethics',                      'nurse_a2'),

  -- ── Midwife ──────────────────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Normal Labour & Delivery',        'Normal Labour & Delivery',        'Travail et Accouchement Normal',           'midwife-normal-labour',                'midwife'),
  (gen_random_uuid()::text, 'Complicated Labour Management',   'Complicated Labour Management',   'Gestion du Travail Compliqué',             'midwife-complicated-labour',           'midwife'),
  (gen_random_uuid()::text, 'Antenatal & Postnatal Care',      'Antenatal & Postnatal Care',      'Soins Prénataux et Postnataux',            'midwife-antenatal-postnatal',          'midwife'),
  (gen_random_uuid()::text, 'Neonatal Care & Assessment',      'Neonatal Care & Assessment',      'Soins et Évaluation Néonataux',            'midwife-neonatal-care',                'midwife'),
  (gen_random_uuid()::text, 'Family Planning Methods',         'Family Planning Methods',         'Méthodes de Planification Familiale',      'midwife-family-planning',              'midwife'),
  (gen_random_uuid()::text, 'Reproductive Health',             'Reproductive Health',             'Santé Reproductive',                       'midwife-reproductive-health',          'midwife'),
  (gen_random_uuid()::text, 'Emergency Obstetrics',            'Emergency Obstetrics',            'Obstétrique d''Urgence',                   'midwife-emergency-obstetrics',         'midwife'),
  (gen_random_uuid()::text, 'Midwifery Ethics & Law',          'Midwifery Ethics & Law',          'Éthique et Droit en Maïeutique',           'midwife-ethics-law',                   'midwife'),

  -- ── Physiotherapist ──────────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Musculoskeletal Physiotherapy',   'Musculoskeletal Physiotherapy',   'Physiothérapie Musculo-Squelettique',      'physio-musculoskeletal',               'physiotherapist'),
  (gen_random_uuid()::text, 'Neurological Rehabilitation',     'Neurological Rehabilitation',     'Réadaptation Neurologique',               'physio-neurological',                  'physiotherapist'),
  (gen_random_uuid()::text, 'Cardiopulmonary Physiotherapy',   'Cardiopulmonary Physiotherapy',   'Physiothérapie Cardiopulmonaire',          'physio-cardiopulmonary',               'physiotherapist'),
  (gen_random_uuid()::text, 'Paediatric Physiotherapy',        'Paediatric Physiotherapy',        'Physiothérapie Pédiatrique',               'physio-paediatric',                    'physiotherapist'),
  (gen_random_uuid()::text, 'Assessment & Diagnosis',          'Assessment & Diagnosis',          'Évaluation et Diagnostic',                 'physio-assessment-diagnosis',          'physiotherapist'),
  (gen_random_uuid()::text, 'Therapeutic Exercises',           'Therapeutic Exercises',           'Exercices Thérapeutiques',                 'physio-therapeutic-exercises',         'physiotherapist'),
  (gen_random_uuid()::text, 'Electrotherapy',                  'Electrotherapy',                  'Électrothérapie',                          'physio-electrotherapy',                'physiotherapist'),
  (gen_random_uuid()::text, 'Professional Ethics',             'Professional Ethics',             'Éthique Professionnelle',                  'physio-ethics',                        'physiotherapist'),

  -- ── Medical Lab Technician ───────────────────────────────────────────────
  (gen_random_uuid()::text, 'Clinical Biochemistry',           'Clinical Biochemistry',           'Biochimie Clinique',                       'lab-tech-biochemistry',                'lab_technician'),
  (gen_random_uuid()::text, 'Haematology & Coagulation',       'Haematology & Coagulation',       'Hématologie et Coagulation',               'lab-tech-haematology',                 'lab_technician'),
  (gen_random_uuid()::text, 'Medical Microbiology',            'Medical Microbiology',            'Microbiologie Médicale',                   'lab-tech-microbiology',                'lab_technician'),
  (gen_random_uuid()::text, 'Blood Banking & Transfusion',     'Blood Banking & Transfusion',     'Banque de Sang et Transfusion',            'lab-tech-blood-banking',               'lab_technician'),
  (gen_random_uuid()::text, 'Parasitology & Mycology',         'Parasitology & Mycology',         'Parasitologie et Mycologie',               'lab-tech-parasitology',                'lab_technician'),
  (gen_random_uuid()::text, 'Histopathology',                  'Histopathology',                  'Histopathologie',                          'lab-tech-histopathology',              'lab_technician'),
  (gen_random_uuid()::text, 'Lab Safety & Quality Control',    'Lab Safety & Quality Control',    'Sécurité et Contrôle Qualité en Labo',    'lab-tech-safety-quality',              'lab_technician'),
  (gen_random_uuid()::text, 'Laboratory Management',           'Laboratory Management',           'Gestion de Laboratoire',                   'lab-tech-management',                  'lab_technician'),

  -- ── Radiology Technician ─────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Radiographic Anatomy',            'Radiographic Anatomy',            'Anatomie Radiographique',                  'rad-tech-anatomy',                     'radiology_technician'),
  (gen_random_uuid()::text, 'Imaging Techniques & Positioning','Imaging Techniques & Positioning','Techniques d''Imagerie et Positionnement', 'rad-tech-imaging-techniques',          'radiology_technician'),
  (gen_random_uuid()::text, 'Radiation Physics & Protection',  'Radiation Physics & Protection',  'Physique des Rayonnements et Protection',  'rad-tech-radiation-physics',           'radiology_technician'),
  (gen_random_uuid()::text, 'CT & MRI Fundamentals',           'CT & MRI Fundamentals',           'Fondamentaux du TDM et de l''IRM',         'rad-tech-ct-mri',                      'radiology_technician'),
  (gen_random_uuid()::text, 'Pathology Recognition',           'Pathology Recognition',           'Reconnaissance des Pathologies',           'rad-tech-pathology',                   'radiology_technician'),
  (gen_random_uuid()::text, 'Patient Safety & Care',           'Patient Safety & Care',           'Sécurité et Soins du Patient',             'rad-tech-patient-safety',              'radiology_technician'),
  (gen_random_uuid()::text, 'Image Processing',                'Image Processing',                'Traitement d''Images',                     'rad-tech-image-processing',            'radiology_technician'),
  (gen_random_uuid()::text, 'Radiation Biology',               'Radiation Biology',               'Biologie des Rayonnements',                'rad-tech-radiation-biology',           'radiology_technician'),

  -- ── Nutritionist / Dietitian ─────────────────────────────────────────────
  (gen_random_uuid()::text, 'Human Nutrition & Biochemistry',  'Human Nutrition & Biochemistry',  'Nutrition Humaine et Biochimie',           'nutrition-biochemistry',               'nutritionist'),
  (gen_random_uuid()::text, 'Clinical Dietetics',              'Clinical Dietetics',              'Diététique Clinique',                       'nutrition-clinical-dietetics',         'nutritionist'),
  (gen_random_uuid()::text, 'Community Nutrition',             'Community Nutrition',             'Nutrition Communautaire',                  'nutrition-community',                  'nutritionist'),
  (gen_random_uuid()::text, 'Food Science & Safety',           'Food Science & Safety',           'Sciences Alimentaires et Sécurité',        'nutrition-food-science',               'nutritionist'),
  (gen_random_uuid()::text, 'Nutritional Assessment',          'Nutritional Assessment',          'Évaluation Nutritionnelle',                'nutrition-assessment',                 'nutritionist'),
  (gen_random_uuid()::text, 'Therapeutic Diets',               'Therapeutic Diets',               'Régimes Thérapeutiques',                   'nutrition-therapeutic-diets',          'nutritionist'),
  (gen_random_uuid()::text, 'Public Health Nutrition',         'Public Health Nutrition',         'Nutrition en Santé Publique',              'nutrition-public-health',              'nutritionist'),
  (gen_random_uuid()::text, 'Nutrition Research',              'Nutrition Research',              'Recherche en Nutrition',                   'nutrition-research',                   'nutritionist'),

  -- ── Environmental Health Officer ─────────────────────────────────────────
  (gen_random_uuid()::text, 'Environmental Health Science',    'Environmental Health Science',    'Sciences de la Santé Environnementale',    'env-health-science',                   'env_health'),
  (gen_random_uuid()::text, 'Epidemiology & Biostatistics',    'Epidemiology & Biostatistics',    'Épidémiologie et Biostatistiques',         'env-epidemiology',                     'env_health'),
  (gen_random_uuid()::text, 'Water & Sanitation Management',   'Water & Sanitation Management',   'Gestion de l''Eau et de l''Assainissement','env-water-sanitation',                 'env_health'),
  (gen_random_uuid()::text, 'Occupational Health & Safety',    'Occupational Health & Safety',    'Santé et Sécurité au Travail',             'env-occupational-health',              'env_health'),
  (gen_random_uuid()::text, 'Vector & Disease Control',        'Vector & Disease Control',        'Contrôle des Vecteurs et des Maladies',   'env-vector-disease',                   'env_health'),
  (gen_random_uuid()::text, 'Food Safety Regulation',          'Food Safety Regulation',          'Réglementation de la Sécurité Alimentaire','env-food-safety',                      'env_health'),
  (gen_random_uuid()::text, 'Environmental Toxicology',        'Environmental Toxicology',        'Toxicologie Environnementale',             'env-toxicology',                       'env_health'),
  (gen_random_uuid()::text, 'Public Health Law & Ethics',      'Public Health Law & Ethics',      'Droit et Éthique en Santé Publique',       'env-law-ethics',                       'env_health'),

  -- ── Orthopedic Technician ────────────────────────────────────────────────
  (gen_random_uuid()::text, 'Musculoskeletal Anatomy',         'Musculoskeletal Anatomy',         'Anatomie Musculo-Squelettique',            'ortho-tech-anatomy',                   'orthopedic_technician'),
  (gen_random_uuid()::text, 'Orthotics & Prosthetics Design',  'Orthotics & Prosthetics Design',  'Conception d''Orthèses et Prothèses',      'ortho-tech-orthotics-prosthetics',     'orthopedic_technician'),
  (gen_random_uuid()::text, 'Cast & Splinting Techniques',     'Cast & Splinting Techniques',     'Techniques de Plâtrage et d''Attelle',     'ortho-tech-casting',                   'orthopedic_technician'),
  (gen_random_uuid()::text, 'Rehabilitation Principles',       'Rehabilitation Principles',       'Principes de Réadaptation',               'ortho-tech-rehabilitation',            'orthopedic_technician'),
  (gen_random_uuid()::text, 'Patient Assessment',              'Patient Assessment',              'Évaluation du Patient',                    'ortho-tech-assessment',                'orthopedic_technician'),
  (gen_random_uuid()::text, 'Biomechanics',                    'Biomechanics',                    'Biomécanique',                             'ortho-tech-biomechanics',              'orthopedic_technician'),
  (gen_random_uuid()::text, 'Materials & Fabrication',         'Materials & Fabrication',         'Matériaux et Fabrication',                 'ortho-tech-materials',                 'orthopedic_technician'),
  (gen_random_uuid()::text, 'Clinical Documentation',          'Clinical Documentation',          'Documentation Clinique',                   'ortho-tech-documentation',             'orthopedic_technician')

ON CONFLICT (slug) DO UPDATE SET license_category = EXCLUDED.license_category;

-- Confirm counts per license type
SELECT license_category, count(*) as total
FROM categories
WHERE license_category IS NOT NULL
GROUP BY license_category
ORDER BY license_category;
