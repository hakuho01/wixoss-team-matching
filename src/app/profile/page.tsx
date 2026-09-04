import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { updateProfileAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f2d08b]">
        プロフィール
      </h1>
      <p className="mt-2 text-sm text-slate-400">使用ルリグや実績はおすすめ表示の参考になります。</p>

      <div className="panel mt-6">
        <ActionForm action={updateProfileAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="displayName">
              表示名
            </label>
            <input
              className="field"
              id="displayName"
              name="displayName"
              defaultValue={user.displayName}
              required
              maxLength={40}
            />
          </div>
          <div>
            <label className="label" htmlFor="xAccount">
              Xアカウント
            </label>
            <input
              className="field"
              id="xAccount"
              name="xAccount"
              defaultValue={user.xAccount}
              placeholder="例: username または https://x.com/username"
              maxLength={80}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-500">
              @なしのユーザー名、またはプロフィールURLを入力できます（任意）
            </p>
          </div>
          <div>
            <label className="label" htmlFor="lrigs">
              使用ルリグ（カンマ区切り）
            </label>
            <input
              className="field"
              id="lrigs"
              name="lrigs"
              defaultValue={user.lrigs}
              placeholder="例: ウリス, タマ"
            />
          </div>
          <div>
            <label className="label" htmlFor="achievements">
              実績
            </label>
            <textarea
              className="field min-h-24"
              id="achievements"
              name="achievements"
              defaultValue={user.achievements}
              placeholder="大会成績や得意構築など"
            />
          </div>
          <div>
            <label className="label" htmlFor="bio">
              自己紹介・希望条件
            </label>
            <textarea
              className="field min-h-24"
              id="bio"
              name="bio"
              defaultValue={user.bio}
              placeholder="チーム戦での役割や希望など"
            />
          </div>
          <button type="submit" className="btn-primary">
            保存する
          </button>
        </ActionForm>
      </div>
    </div>
  );
}
