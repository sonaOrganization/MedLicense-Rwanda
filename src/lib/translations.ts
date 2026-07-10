import type { Language } from "./language";

const T = {
  // ── Navigation ───────────────────────────────────────────────
  nav_dashboard:    { EN: "Dashboard",           FR: "Tableau de bord" },
  nav_exams:        { EN: "My Exams",            FR: "Mes examens" },
  nav_results:      { EN: "Results",             FR: "Résultats" },
  nav_analytics:    { EN: "Progress Analytics",  FR: "Analyses" },
  nav_saved:        { EN: "Saved Questions",     FR: "Questions sauvegardées" },
  nav_subscription: { EN: "Subscription Status", FR: "Abonnement" },
  nav_profile:      { EN: "Profile Settings",    FR: "Paramètres du profil" },
  nav_logout:       { EN: "Sign Out",            FR: "Se déconnecter" },
  nav_section:      { EN: "Navigation",          FR: "Navigation" },

  // ── Page subtitles (header) ───────────────────────────────────
  sub_dashboard:    { EN: "Your exam readiness at a glance",     FR: "Votre état de préparation en un coup d'œil" },
  sub_exams:        { EN: "Browse and start practice sessions",  FR: "Parcourir et démarrer des sessions d'entraînement" },
  sub_results:      { EN: "Review your past exam attempts",      FR: "Consultez vos tentatives d'examen passées" },
  sub_analytics:    { EN: "Track your performance over time",    FR: "Suivez vos performances dans le temps" },
  sub_saved:        { EN: "Your personal question bank",         FR: "Votre banque de questions personnelle" },
  sub_subscription: { EN: "Manage your plan",                    FR: "Gérez votre abonnement" },
  sub_profile:      { EN: "Manage your account details",         FR: "Gérez les détails de votre compte" },

  // ── Notifications ─────────────────────────────────────────────
  notif_title:      { EN: "Notifications",       FR: "Notifications" },
  notif_new:        { EN: "new",                 FR: "nouveau" },
  notif_mark_all:   { EN: "Mark all read",       FR: "Tout marquer comme lu" },
  notif_empty:      { EN: "No notifications yet",FR: "Aucune notification" },
  notif_just_now:   { EN: "just now",            FR: "à l'instant" },
  notif_m_ago:      { EN: "m ago",               FR: "min" },
  notif_h_ago:      { EN: "h ago",               FR: "h" },
  notif_d_ago:      { EN: "d ago",               FR: "j" },

  // ── Dashboard stat cards ──────────────────────────────────────
  dash_exams_taken: { EN: "Exams Taken",         FR: "Examens passés" },
  dash_avg_score:   { EN: "Avg Score",           FR: "Score moyen" },
  dash_pass_rate:   { EN: "Pass Rate",           FR: "Taux de réussite" },
  dash_passed:      { EN: "Passed",              FR: "Réussis" },
  dash_readiness:   { EN: "Exam Readiness",      FR: "Préparation à l'examen" },
  dash_readiness_sub: { EN: "Based on your performance history", FR: "Basé sur votre historique de performance" },
  dash_recent:      { EN: "Recent Exams",        FR: "Examens récents" },
  dash_recent_sub:  { EN: "Your last 5 practice sessions",       FR: "Vos 5 dernières sessions d'entraînement" },
  dash_quick:       { EN: "Quick Actions",       FR: "Actions rapides" },
  dash_streak:      { EN: "Study Streak",        FR: "Série d'étude" },
  dash_streak_sub:  { EN: "Keep the momentum going",             FR: "Continuez sur votre lancée" },
  dash_top:         { EN: "Top Students",        FR: "Meilleurs étudiants" },
  dash_top_sub:     { EN: "This month's leaderboard",            FR: "Classement du mois" },

  // ── Welcome banner ────────────────────────────────────────────
  wb_morning:       { EN: "Good morning",        FR: "Bonjour" },
  wb_afternoon:     { EN: "Good afternoon",      FR: "Bon après-midi" },
  wb_evening:       { EN: "Good evening",        FR: "Bonsoir" },
  wb_day_streak:    { EN: "day streak",          FR: "jours de suite" },
  wb_in_progress:   { EN: "(in progress)",       FR: "(en cours)" },
  wb_start:         { EN: "Start Exam",          FR: "Commencer l'examen" },
  wb_unlock:        { EN: "Unlock Full Access",  FR: "Accès complet" },

  // ── Session type modal ─────────────────────────────────────────
  session_modal_title:     { EN: "Welcome to MedLicense",                         FR: "Bienvenue sur MedLicense" },
  session_modal_subtitle:  { EN: "How would you like to prepare today?",          FR: "Comment souhaitez-vous vous préparer aujourd'hui ?" },
  session_theory_title:    { EN: "Theory Session",                                FR: "Session théorique" },
  session_theory_desc:     { EN: "Practice exam questions across all your license categories.", FR: "Entraînez-vous avec des questions d'examen dans toutes vos catégories de licence." },
  session_theory_badge:    { EN: "Available Now",                                 FR: "Disponible" },
  session_practical_title: { EN: "Practical Session",                             FR: "Session pratique" },
  session_practical_desc:  { EN: "Hands-on clinical scenarios and skills stations.", FR: "Mises en situation cliniques et ateliers de compétences pratiques." },
  session_practical_badge: { EN: "Coming Soon",                                   FR: "Bientôt disponible" },
  session_practical_toast: { EN: "Practical sessions are coming soon — we'll let you know when they're ready!", FR: "Les sessions pratiques arrivent bientôt — nous vous préviendrons dès qu'elles seront prêtes !" },
  session_modal_footer:    { EN: "You can change this anytime from your dashboard.", FR: "Vous pouvez changer ceci à tout moment depuis votre tableau de bord." },
  session_modal_later:     { EN: "Maybe later",                                   FR: "Plus tard" },
  session_current_theory:  { EN: "Session: Theory",                               FR: "Session : Théorique" },
  session_current_practical:{ EN: "Session: Practical (waitlisted)",              FR: "Session : Pratique (liste d'attente)" },
  session_change:          { EN: "Change",                                       FR: "Changer" },

  // ── Quick Actions ─────────────────────────────────────────────
  qa_daily:         { EN: "Daily Quiz",          FR: "Quiz quotidien" },
  qa_daily_desc:    { EN: "5-min practice",      FR: "5 min d'entraînement" },
  qa_mock:          { EN: "Mock Exam",           FR: "Examen simulé" },
  qa_mock_desc:     { EN: "Full simulation",     FR: "Simulation complète" },
  qa_saved:         { EN: "Saved",               FR: "Sauvegardés" },
  qa_saved_desc:    { EN: "questions",           FR: "questions" },
  qa_tutorials:     { EN: "Tutorials",           FR: "Tutoriels" },
  qa_tutorials_desc:{ EN: "Watch & learn",       FR: "Regarder et apprendre" },
  qa_analytics:     { EN: "Analytics",           FR: "Analyses" },
  qa_analytics_desc:{ EN: "Your progress",       FR: "Votre progression" },
  qa_premium:       { EN: "Go Premium",          FR: "Passer Premium" },
  qa_subscription:  { EN: "Subscription",        FR: "Abonnement" },
  qa_active_plan:   { EN: "Active plan",         FR: "Abonnement actif" },
  qa_unlock_all:    { EN: "Unlock all",          FR: "Tout débloquer" },

  // ── Exams listing ─────────────────────────────────────────────
  exams_title:      { EN: "Mock Exams",          FR: "Examens simulés" },
  exams_sub:        { EN: "Choose an exam to start practicing",  FR: "Choisissez un examen pour commencer" },
  exams_free:       { EN: "Free",                FR: "Gratuit" },
  exams_questions:  { EN: "questions",           FR: "questions" },
  exams_min:        { EN: "min",                 FR: "min" },
  exams_upgrade:    { EN: "Upgrade to Unlock",   FR: "Mettre à niveau" },
  exams_start:      { EN: "Start Exam",          FR: "Commencer l'examen" },
  exams_empty:      { EN: "No exams available yet. Check back soon!", FR: "Aucun examen disponible. Revenez bientôt !" },

  // ── Results listing ───────────────────────────────────────────
  results_title:    { EN: "My Results",          FR: "Mes résultats" },
  results_sub:      { EN: "completed exams",     FR: "examens complétés" },
  results_empty:    { EN: "No exam results yet.", FR: "Aucun résultat d'examen." },
  results_first:    { EN: "Take Your First Exam", FR: "Passez votre premier examen" },
  results_passed:   { EN: "Passed",              FR: "Réussi" },
  results_failed:   { EN: "Failed",              FR: "Échoué" },
  results_correct:  { EN: "correct",             FR: "correct" },
  results_wrong:    { EN: "wrong",               FR: "incorrect" },
  results_skipped:  { EN: "skipped",             FR: "ignoré" },
  results_review:   { EN: "Review",              FR: "Réviser" },

  // ── Analytics ─────────────────────────────────────────────────
  analytics_title:  { EN: "Performance Analytics",  FR: "Analyses de performance" },
  analytics_sub:    { EN: "Track your progress and identify areas for improvement", FR: "Suivez votre progression et identifiez vos axes d'amélioration" },
  analytics_total:  { EN: "Total Exams",         FR: "Total examens" },
  analytics_avg:    { EN: "Average Score",       FR: "Score moyen" },
  analytics_rate:   { EN: "Pass Rate",           FR: "Taux de réussite" },
  analytics_passed: { EN: "Exams Passed",        FR: "Examens réussis" },
  analytics_by_cat: { EN: "Performance by Category",  FR: "Performance par catégorie" },
  analytics_empty:  { EN: "Take some exams to see your category performance.", FR: "Passez des examens pour voir vos performances par catégorie." },
  analytics_exams:  { EN: "exams",               FR: "examens" },
  analytics_pr:     { EN: "pass rate",           FR: "taux de réussite" },
  analytics_prog:   { EN: "Score Progression",   FR: "Progression des scores" },
  analytics_last:   { EN: "Last",                FR: "Derniers" },
  analytics_scores: { EN: "exam scores",         FR: "scores d'examens" },

  // ── Saved questions ───────────────────────────────────────────
  saved_title:      { EN: "Saved Questions",     FR: "Questions sauvegardées" },
  saved_sub:        { EN: "questions",           FR: "questions" },
  saved_empty:      { EN: "No saved questions yet.",  FR: "Aucune question sauvegardée." },
  saved_go_exam:    { EN: "Take an Exam to Save Questions", FR: "Passez un examen pour sauvegarder des questions" },
  saved_explanation:{ EN: "Explanation:",        FR: "Explication :" },

  // ── Result detail ─────────────────────────────────────────────
  rd_back:          { EN: "Back",                FR: "Retour" },
  rd_results:       { EN: "Results",             FR: "Résultats" },
  rd_passing:       { EN: "Passing score:",      FR: "Score de passage :" },
  rd_badge_passed:  { EN: "PASSED",              FR: "RÉUSSI" },
  rd_badge_failed:  { EN: "FAILED",              FR: "ÉCHOUÉ" },
  rd_correct:       { EN: "Correct",             FR: "Correct" },
  rd_wrong:         { EN: "Wrong",               FR: "Incorrect" },
  rd_skipped:       { EN: "Skipped",             FR: "Ignoré" },
  rd_time:          { EN: "Time",                FR: "Temps" },
  rd_retake:        { EN: "Retake Exam",         FR: "Repasser l'examen" },
  rd_review:        { EN: "Question Review",     FR: "Révision des questions" },
  rd_explanation:   { EN: "Explanation:",        FR: "Explication :" },

  // ── Exam engine ───────────────────────────────────────────────
  exam_question:    { EN: "Question",            FR: "Question" },
  exam_answered:    { EN: "answered",            FR: "répondu" },
  exam_passing:     { EN: "Passing",             FR: "Score de passage" },
  exam_submit:      { EN: "Submit Exam",         FR: "Soumettre l'examen" },
  exam_flagged:     { EN: "Flagged",             FR: "Marquée" },
  exam_flag:        { EN: "Flag",                FR: "Marquer" },
  exam_previous:    { EN: "Previous",            FR: "Précédent" },
  exam_next:        { EN: "Next",                FR: "Suivant" },
  exam_finish:      { EN: "Finish",              FR: "Terminer" },
  exam_navigator:   { EN: "Navigator",           FR: "Navigateur" },
  exam_remaining:   { EN: "Remaining",           FR: "Restant" },
  exam_unanswered:  { EN: "Unanswered",          FR: "Sans réponse" },
  exam_continue:    { EN: "Continue Exam",       FR: "Continuer l'examen" },
  exam_submitting:  { EN: "Submitting…",         FR: "Envoi en cours…" },
  exam_submit_my:   { EN: "Submit My Exam",      FR: "Soumettre mon examen" },
  exam_timeout_msg: { EN: "Your allotted time has expired. Your answers will be submitted now.", FR: "Votre temps imparti est expiré. Vos réponses vont être soumises." },
  exam_unanswered_warning: { EN: "question(s) left unanswered.", FR: "question(s) sans réponse." },
  exam_current:     { EN: "Current",             FR: "Actuelle" },

  // ── Common ────────────────────────────────────────────────────
  lbl_loading:      { EN: "Loading…",            FR: "Chargement…" },
  lbl_student:      { EN: "Student",             FR: "Étudiant" },
} satisfies Record<string, { EN: string; FR: string }>;

export type TranslationKey = keyof typeof T;

export function useT(lang: Language) {
  return (key: TranslationKey): string => T[key][lang];
}

export function tr(key: TranslationKey, lang: Language): string {
  return T[key][lang];
}
