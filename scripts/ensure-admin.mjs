import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("[ensure-admin] ADMIN_EMAIL / ADMIN_PASSWORD 未設定のためスキップ");
    return;
  }

  if (password.length < 8) {
    console.error("[ensure-admin] ADMIN_PASSWORD は8文字以上にしてください");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isAdmin: true,
    },
    create: {
      email,
      passwordHash,
      displayName: "管理者",
      isAdmin: true,
    },
  });

  console.log(`[ensure-admin] 管理者を同期しました: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error("[ensure-admin] 失敗", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
