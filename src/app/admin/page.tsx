import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ActionForm } from "@/components/ActionForm";
import {
  createTournamentAction,
  updateTournamentAction,
} from "@/app/actions/tournaments";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/dashboard");

  const tournaments = await prisma.tournament.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      _count: { select: { entries: true, teams: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f2d08b]">
          管理画面
        </h1>
        <p className="mt-2 text-slate-300">大会の作成・編集は管理者のみ可能です。</p>
      </div>

      <section className="panel">
        <h2 className="text-lg font-medium text-white">大会を作成</h2>
        <ActionForm action={createTournamentAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label" htmlFor="title">
              大会名
            </label>
            <input className="field" id="title" name="title" required maxLength={100} />
          </div>
          <div>
            <label className="label" htmlFor="startsAt">
              開催日時
            </label>
            <input className="field" id="startsAt" name="startsAt" type="datetime-local" required />
          </div>
          <div>
            <label className="label" htmlFor="teamSizeLimit">
              チーム人数上限
            </label>
            <input
              className="field"
              id="teamSizeLimit"
              name="teamSizeLimit"
              type="number"
              min={2}
              max={8}
              defaultValue={3}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="location">
              会場
            </label>
            <input className="field" id="location" name="location" />
          </div>
          <div className="flex items-end gap-2 pb-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="isOpen" defaultChecked />
              参加受付中にする
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="description">
              説明
            </label>
            <textarea className="field min-h-24" id="description" name="description" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">
              作成する
            </button>
          </div>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">登録済み大会</h2>
        {tournaments.map((t) => (
          <div key={t.id} className="panel">
            <p className="text-xs text-slate-500">
              ID: {t.id} · 参加者 {t._count.entries} · チーム {t._count.teams} · 作成{" "}
              {format(t.createdAt, "yyyy/MM/dd")}
            </p>
            <ActionForm action={updateTournamentAction} className="mt-3 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={t.id} />
              <div className="md:col-span-2">
                <label className="label">大会名</label>
                <input className="field" name="title" defaultValue={t.title} required />
              </div>
              <div>
                <label className="label">開催日時</label>
                <input
                  className="field"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={toLocalInputValue(t.startsAt)}
                  required
                />
              </div>
              <div>
                <label className="label">チーム人数上限</label>
                <input
                  className="field"
                  name="teamSizeLimit"
                  type="number"
                  min={2}
                  max={8}
                  defaultValue={t.teamSizeLimit}
                  required
                />
              </div>
              <div>
                <label className="label">会場</label>
                <input className="field" name="location" defaultValue={t.location} />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" name="isOpen" defaultChecked={t.isOpen} />
                  参加受付中
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="label">説明</label>
                <textarea
                  className="field min-h-20"
                  name="description"
                  defaultValue={t.description}
                />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="btn-secondary">
                  更新する
                </button>
              </div>
            </ActionForm>
          </div>
        ))}
        {tournaments.length === 0 && (
          <p className="text-sm text-slate-400">まだ大会がありません。</p>
        )}
      </section>
    </div>
  );
}
