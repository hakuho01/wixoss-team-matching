"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { likeUser } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/app/actions/auth";

const tournamentSchema = z.object({
  title: z.string().min(1, "大会名を入力してください").max(100),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startsAt: z.string().min(1, "開催日時を入力してください"),
  teamSizeLimit: z.coerce.number().int().min(2).max(8),
  isOpen: z.coerce.boolean().optional(),
});

export async function createTournamentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "管理者のみ操作できます" };
  }

  const parsed = tournamentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    location: formData.get("location") || "",
    startsAt: formData.get("startsAt"),
    teamSizeLimit: formData.get("teamSizeLimit"),
    isOpen: formData.get("isOpen") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "開催日時の形式が正しくありません" };
  }

  await prisma.tournament.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      location: parsed.data.location ?? "",
      startsAt,
      teamSizeLimit: parsed.data.teamSizeLimit,
      isOpen: formData.get("isOpen") === "on",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/tournaments");
  return { success: "大会を作成しました" };
}

export async function updateTournamentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "管理者のみ操作できます" };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "大会IDがありません" };

  const parsed = tournamentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    location: formData.get("location") || "",
    startsAt: formData.get("startsAt"),
    teamSizeLimit: formData.get("teamSizeLimit"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "開催日時の形式が正しくありません" };
  }

  await prisma.tournament.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      location: parsed.data.location ?? "",
      startsAt,
      teamSizeLimit: parsed.data.teamSizeLimit,
      isOpen: formData.get("isOpen") === "on",
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/tournaments/${id}`);
  revalidatePath("/tournaments");
  return { success: "大会を更新しました" };
}

export async function joinTournamentAction(tournamentId: string): Promise<ActionState> {
  try {
    const user = await requireUser();
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || !tournament.isOpen) {
      return { error: "この大会には参加できません" };
    }

    await prisma.tournamentEntry.upsert({
      where: {
        userId_tournamentId: { userId: user.id, tournamentId },
      },
      create: { userId: user.id, tournamentId },
      update: {},
    });

    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath("/dashboard");
    return { success: "大会への参加予定を登録しました" };
  } catch {
    return { error: "ログインが必要です" };
  }
}

export async function leaveTournamentAction(tournamentId: string): Promise<ActionState> {
  try {
    const user = await requireUser();
    const membership = await prisma.teamMember.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId } },
    });
    if (membership) {
      return { error: "チームに所属中は参加予定を取り下げできません" };
    }

    await prisma.tournamentEntry.deleteMany({
      where: { userId: user.id, tournamentId },
    });
    await prisma.like.deleteMany({
      where: {
        tournamentId,
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      },
    });

    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath("/dashboard");
    return { success: "参加予定を取り消しました" };
  } catch {
    return { error: "ログインが必要です" };
  }
}

export async function likeUserAction(
  toUserId: string,
  tournamentId: string,
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const result = await likeUser({
      fromUserId: user.id,
      toUserId,
      tournamentId,
    });

    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath("/dashboard");

    if (result.matched && result.team) {
      return { success: `マッチ成立！ チーム「${result.team.name}」に入りました` };
    }
    if (result.matched) {
      return { success: "相互いいねになりました" };
    }
    return { success: "いいねを送りました" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "いいねに失敗しました" };
  }
}

export async function renameTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const teamId = String(formData.get("teamId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!teamId || !name) return { error: "チーム名を入力してください" };

    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId: user.id },
    });
    if (!membership) return { error: "このチームのメンバーではありません" };

    await prisma.team.update({ where: { id: teamId }, data: { name } });
    revalidatePath(`/tournaments/${membership.tournamentId}`);
    revalidatePath("/dashboard");
    return { success: "チーム名を更新しました" };
  } catch {
    return { error: "ログインが必要です" };
  }
}
