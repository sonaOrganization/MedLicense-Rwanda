// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
import bcrypt from "bcryptjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma: any = new PrismaClient();

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "anatomy" }, update: {}, create: { nameEn: "Anatomy", nameFr: "Anatomie", name: "Anatomy", slug: "anatomy", icon: "🫀" } }),
    prisma.category.upsert({ where: { slug: "physiology" }, update: {}, create: { nameEn: "Physiology", nameFr: "Physiologie", name: "Physiology", slug: "physiology", icon: "🧬" } }),
    prisma.category.upsert({ where: { slug: "pharmacology" }, update: {}, create: { nameEn: "Pharmacology", nameFr: "Pharmacologie", name: "Pharmacology", slug: "pharmacology", icon: "💊" } }),
    prisma.category.upsert({ where: { slug: "pathology" }, update: {}, create: { nameEn: "Pathology", nameFr: "Pathologie", name: "Pathology", slug: "pathology", icon: "🔬" } }),
    prisma.category.upsert({ where: { slug: "clinical-medicine" }, update: {}, create: { nameEn: "Clinical Medicine", nameFr: "Médecine Clinique", name: "Clinical Medicine", slug: "clinical-medicine", icon: "🏥" } }),
  ]);

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@rmdcprep.rw" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@rmdcprep.rw",
      password: adminPassword,
      emailVerified: new Date(),
      role: "ADMIN",
    },
  });

  // Create sample exam
  const anatomyCategory = categories[0];
  const sampleQuestions = [
    { textEn: "Which bone is the longest in the human body?", answers: [{ textEn: "Femur", isCorrect: true }, { textEn: "Tibia", isCorrect: false }, { textEn: "Humerus", isCorrect: false }, { textEn: "Fibula", isCorrect: false }], explanationEn: "The femur (thigh bone) is the longest and strongest bone in the human body." },
    { textEn: "The normal resting heart rate in adults is:", answers: [{ textEn: "60-100 bpm", isCorrect: true }, { textEn: "40-60 bpm", isCorrect: false }, { textEn: "100-120 bpm", isCorrect: false }, { textEn: "120-140 bpm", isCorrect: false }], explanationEn: "Normal resting heart rate for adults is 60-100 beats per minute." },
    { textEn: "Aspirin works primarily by inhibiting:", answers: [{ textEn: "COX-1 and COX-2 enzymes", isCorrect: true }, { textEn: "Lipoxygenase", isCorrect: false }, { textEn: "Phospholipase A2", isCorrect: false }, { textEn: "Thromboxane synthase", isCorrect: false }], explanationEn: "Aspirin irreversibly inhibits cyclooxygenase (COX-1 and COX-2) enzymes." },
  ];

  for (const q of sampleQuestions) {
    const question = await prisma.question.create({
      data: {
        textEn: q.textEn,
        categoryId: anatomyCategory.id,
        isApproved: true,
        explanationEn: q.explanationEn,
        answers: { create: q.answers.map((a, i) => ({ ...a, order: i })) },
      },
    });
  }

  // Create sample exam
  const allQuestions = await prisma.question.findMany({ where: { isApproved: true } });
  await prisma.exam.upsert({
    where: { id: "sample-exam-1" },
    update: {},
    create: {
      id: "sample-exam-1",
      title: "RMDC Sample Exam 1",
      titleEn: "RMDC Sample Exam 1",
      categoryId: anatomyCategory.id,
      durationMinutes: 60,
      passingScore: 70,
      totalQuestions: allQuestions.length,
      isPublished: true,
      isFree: true,
      questions: {
        create: allQuestions.map((q, i) => ({ questionId: q.id, order: i })),
      },
    },
  });

  console.log("✅ Database seeded successfully");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
