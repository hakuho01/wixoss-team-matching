import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { XAccountLink } from "@/components/XAccountLink";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    include: {
      entries: {
        include: { tournament: true },
        orderBy: { createdAt: "desc" },
      },
      memberships: {
        include: {
          team: {
            include: {
              tournament: true,
              members: {
                include: { user: { select: { id: true, displayName: true } } },
                orderBy: { joinedAt: "asc" },
              },
            },
          },
        },
      },
    },
  });

  const openTournaments = await prisma.tournament.findMany({
    where: { isOpen: true },
    orderBy: { startsAt: "asc" },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f2d08b]">
          ようこそ、{user.displayName}
        </h1>
        <p className="mt-2 text-slate-300">参加予定大会からおすすめセレクターを見つけてチームを組みましょう。</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel">
          <h2 className="text-lg font-medium text-white">あなたのプロフィール</h2>
          <dl className="mt-3 space-y-2 text-sm text-slate-300">
            <div>
              <dt className="text-slate-500">Xアカウント</dt>
              <dd>
                {user.xAccount ? <XAccountLink handle={user.xAccount} /> : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">使用ルリグ</dt>
              <dd>{user.lrigs || "未設定"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">実績</dt>
              <dd className="whitespace-pre-wrap">{user.achievements || "未設定"}</dd>
            </div>
          </dl>
          <Link href="/profile" className="mt-4 inline-block text-sm text-[#7dd3c7] underline">
            プロフィールを編集
          </Link>
        </div>

        <div className="panel">
          <h2 className="text-lg font-medium text-white">所属チーム</h2>
          {user.memberships.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">まだチームはありません。相互いいねで結成されます。</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {user.memberships.map((m) => (
                <li key={m.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="font-medium text-[#f2d08b]">{m.team.name}</p>
                  <p className="text-xs text-slate-400">{m.team.tournament.title}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {m.team.members.map((mem) => mem.user.displayName).join(" / ")}
                    {m.team.recruiting ? " · 募集中" : " · 募集終了"}
                  </p>
                  <Link
                    href={`/tournaments/${m.team.tournamentId}`}
                    className="mt-2 inline-block text-xs text-[#7dd3c7] underline"
                  >
                    大会ページへ
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-white">参加予定の大会</h2>
          <Link href="/tournaments" className="text-sm text-[#7dd3c7] underline">
            大会一覧
          </Link>
        </div>
        {user.entries.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">参加予定はまだありません。</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {user.entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-white">{entry.tournament.title}</p>
                  <p className="text-xs text-slate-400">
                    {format(entry.tournament.startsAt, "yyyy/MM/dd HH:mm", { locale: ja })} · 定員{" "}
                    {entry.tournament.teamSizeLimit}人
                  </p>
                </div>
                <Link href={`/tournaments/${entry.tournamentId}`} className="btn-secondary text-sm">
                  マッチング
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="text-lg font-medium text-white">受付中の大会</h2>
        <ul className="mt-3 space-y-2">
          {openTournaments.map((t) => (
            <li key={t.id}>
              <Link href={`/tournaments/${t.id}`} className="text-[#7dd3c7] underline">
                {t.title}
              </Link>
              <span className="ml-2 text-xs text-slate-500">
                {format(t.startsAt, "M/d HH:mm", { locale: ja })}
              </span>
            </li>
          ))}
          {openTournaments.length === 0 && (
            <li className="text-sm text-slate-400">現在受付中の大会はありません。</li>
          )}
        </ul>
      </section>
    </div>
  );
}
