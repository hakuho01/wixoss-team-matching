import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TournamentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tournaments = await prisma.tournament.findMany({
    orderBy: { startsAt: "asc" },
    include: {
      _count: { select: { entries: true, teams: true } },
      entries: {
        where: { userId: session.userId },
        select: { id: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f2d08b]">
        大会一覧
      </h1>
      <p className="mt-2 text-slate-300">参加予定を登録すると、同じ大会のプレイヤーとマッチングできます。</p>

      <ul className="mt-8 space-y-4">
        {tournaments.map((t) => (
          <li key={t.id} className="panel flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-medium text-white">{t.title}</h2>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    t.isOpen ? "bg-emerald-900/60 text-emerald-200" : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {t.isOpen ? "受付中" : "受付終了"}
                </span>
                {t.entries.length > 0 && (
                  <span className="rounded bg-[#c44536]/30 px-2 py-0.5 text-xs text-[#f2d08b]">
                    参加予定
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {format(t.startsAt, "yyyy年M月d日 HH:mm", { locale: ja })}
                {t.location ? ` · ${t.location}` : ""} · チーム上限 {t.teamSizeLimit}人 · 参加者{" "}
                {t._count.entries}人 · チーム {t._count.teams}
              </p>
              {t.description && <p className="mt-2 text-sm text-slate-300">{t.description}</p>}
            </div>
            <Link href={`/tournaments/${t.id}`} className="btn-primary shrink-0 text-center">
              詳細・マッチング
            </Link>
          </li>
        ))}
        {tournaments.length === 0 && (
          <li className="panel text-slate-400">大会がまだ登録されていません。管理者の設定をお待ちください。</li>
        )}
      </ul>
    </div>
  );
}
