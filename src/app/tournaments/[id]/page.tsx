import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { LikeButton } from "@/components/LikeButton";
import { JoinLeaveButtons } from "@/components/JoinLeaveButtons";
import { ActionForm } from "@/components/ActionForm";
import { renameTeamAction } from "@/app/actions/tournaments";
import { getSession } from "@/lib/auth";
import { getMembershipForTournament, getRecommendations } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: {
        include: {
          members: {
            include: { user: { select: { id: true, displayName: true, lrigs: true } } },
            orderBy: { joinedAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { entries: true } },
    },
  });
  if (!tournament) notFound();

  const entry = await prisma.tournamentEntry.findUnique({
    where: {
      userId_tournamentId: { userId: session.userId, tournamentId: id },
    },
  });

  const membership = await getMembershipForTournament(session.userId, id);
  const recommendations = entry ? await getRecommendations(session.userId, id) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <Link href="/tournaments" className="text-sm text-[#7dd3c7] underline">
          ← 大会一覧
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f2d08b]">
          {tournament.title}
        </h1>
        <p className="mt-2 text-slate-300">
          {format(tournament.startsAt, "yyyy年M月d日 HH:mm", { locale: ja })}
          {tournament.location ? ` · ${tournament.location}` : ""}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          チーム人数上限 {tournament.teamSizeLimit}人 · 参加予定 {tournament._count.entries}人 ·{" "}
          {tournament.isOpen ? "受付中" : "受付終了"}
        </p>
        {tournament.description && (
          <p className="mt-4 whitespace-pre-wrap text-slate-200">{tournament.description}</p>
        )}
      </div>

      <section className="panel">
        <h2 className="text-lg font-medium text-white">参加予定</h2>
        <JoinLeaveButtons
          tournamentId={id}
          joined={Boolean(entry)}
          canLeave={!membership}
          isOpen={tournament.isOpen}
        />
      </section>

      {membership && (
        <section className="panel">
          <h2 className="text-lg font-medium text-white">あなたのチーム</h2>
          <p className="mt-1 text-[#f2d08b]">{membership.team.name}</p>
          <p className="text-sm text-slate-400">
            {membership.team.members.length}/{tournament.teamSizeLimit}人
            {membership.team.recruiting ? " · 募集中" : " · 募集終了（定員到達）"}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-200">
            {membership.team.members.map((m) => (
              <li key={m.id}>
                {m.user.displayName}
                {m.user.lrigs ? `（${m.user.lrigs}）` : ""}
              </li>
            ))}
          </ul>
          <ActionForm action={renameTeamAction} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="teamId" value={membership.teamId} />
            <input
              className="field max-w-xs"
              name="name"
              defaultValue={membership.team.name}
              maxLength={60}
              required
            />
            <button type="submit" className="btn-secondary">
              チーム名を変更
            </button>
          </ActionForm>
        </section>
      )}

      {entry && (
        <section className="panel">
          <h2 className="text-lg font-medium text-white">おすすめセレクター</h2>
          <p className="mt-1 text-sm text-slate-400">
            同じ大会の参加者です。相互いいねでマッチ／チーム加入になります。
          </p>
          {recommendations.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              {membership && !membership.team.recruiting
                ? "チームが定員に達したため、新しいおすすめはありません。"
                : "いま表示できる候補がいません。"}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recommendations.map((rec) => (
                <li
                  key={rec.user.id}
                  className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{rec.user.displayName}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      ルリグ: {rec.user.lrigs || "未設定"}
                    </p>
                    {rec.user.achievements && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">
                        実績: {rec.user.achievements}
                      </p>
                    )}
                    {rec.user.bio && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">{rec.user.bio}</p>
                    )}
                    {rec.team && (
                      <p className="mt-2 text-xs text-[#7dd3c7]">
                        チーム「{rec.team.name}」募集中 — 相互いいねで加入
                      </p>
                    )}
                  </div>
                  <LikeButton
                    toUserId={rec.user.id}
                    tournamentId={id}
                    alreadyLiked={rec.alreadyLiked}
                    disabled={Boolean(membership && !membership.team.recruiting)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="panel">
        <h2 className="text-lg font-medium text-white">この大会のチーム</h2>
        {tournament.teams.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">まだチームはありません。</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {tournament.teams.map((team) => (
              <li key={team.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="font-medium text-[#f2d08b]">{team.name}</p>
                <p className="text-xs text-slate-400">
                  {team.members.length}/{tournament.teamSizeLimit}
                  {team.recruiting ? " · 募集中" : " · 募集終了"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {team.members.map((m) => m.user.displayName).join(" / ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
