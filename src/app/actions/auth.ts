"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeXHandle } from "@/lib/x-account";

const credentialsSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
  displayName: z.string().min(1, "表示名を入力してください").max(40).optional(),
});

export type ActionState = {
  error?: string;
  success?: string;
};

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  if (!parsed.data.displayName) {
    return { error: "表示名を入力してください" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      displayName: parsed.data.displayName,
    },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });

  redirect("/dashboard");
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return { error: "メールアドレスまたはパスワードが違います" };
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "メールアドレスまたはパスワードが違います" };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const displayName = String(formData.get("displayName") ?? "").trim();
    const lrigs = String(formData.get("lrigs") ?? "").trim();
    const achievements = String(formData.get("achievements") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const xRaw = String(formData.get("xAccount") ?? "").trim();

    if (!displayName) {
      return { error: "表示名を入力してください" };
    }

    const { handle: xAccount, error: xError } = normalizeXHandle(xRaw);
    if (xError) {
      return { error: xError };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { displayName, lrigs, achievements, bio, xAccount },
    });

    return { success: "プロフィールを更新しました" };
  } catch {
    return { error: "ログインが必要です" };
  }
}
