import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "adminpass123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isAdmin: true,
      displayName: "管理者",
    },
    create: {
      email: adminEmail,
      passwordHash,
      displayName: "管理者",
      isAdmin: true,
      lrigs: "ウリス",
      achievements: "運営アカウント",
      bio: "大会設定用の管理者です",
    },
  });

  const demoUsers = [
    {
      email: "alice@example.com",
      displayName: "アリス",
      lrigs: "タマ, ヒラナ",
      achievements: "店舗大会優勝",
      bio: "アグロ寄り。コミュニケーション重視で組みたいです",
    },
    {
      email: "bob@example.com",
      displayName: "ボブ",
      lrigs: "ウリス, アト",
      achievements: "チーム戦ベスト4",
      bio: "コントロール担当できます",
    },
    {
      email: "carol@example.com",
      displayName: "キャロル",
      lrigs: "ピルルク, ウムル",
      achievements: "初心者歓迎イベント多数参加",
      bio: "初めてのチーム戦です。優しくしてください",
    },
  ];

  const password = await bcrypt.hash("password123", 10);
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        displayName: u.displayName,
        lrigs: u.lrigs,
        achievements: u.achievements,
        bio: u.bio,
      },
      create: {
        ...u,
        passwordHash: password,
      },
    });
  }

  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 14);
  startsAt.setHours(13, 0, 0, 0);

  const existing = await prisma.tournament.findFirst({
    where: { title: "サンプルチーム戦カップ" },
  });

  const tournament =
    existing ??
    (await prisma.tournament.create({
      data: {
        title: "サンプルチーム戦カップ",
        description: "3人チームのサンプル大会です。相互いいねでチームを結成してください。",
        location: "サンプル会場",
        startsAt,
        teamSizeLimit: 3,
        isOpen: true,
      },
    }));

  const users = await prisma.user.findMany({
    where: { email: { in: demoUsers.map((u) => u.email) } },
  });

  for (const user of users) {
    await prisma.tournamentEntry.upsert({
      where: {
        userId_tournamentId: { userId: user.id, tournamentId: tournament.id },
      },
      create: { userId: user.id, tournamentId: tournament.id },
      update: {},
    });
  }

  console.log("Seed completed");
  console.log(`Admin: ${admin.email} / ${adminPassword}`);
  console.log("Demo users: alice@example.com, bob@example.com, carol@example.com / password123");
  console.log(`Tournament: ${tournament.title} (${tournament.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
