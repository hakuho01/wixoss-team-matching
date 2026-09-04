import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { registerAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f2d08b]">
        新規登録
      </h1>
      <div className="panel mt-6">
        <ActionForm action={registerAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="displayName">
              表示名
            </label>
            <input className="field" id="displayName" name="displayName" required maxLength={40} />
          </div>
          <div>
            <label className="label" htmlFor="email">
              メールアドレス
            </label>
            <input className="field" id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              パスワード（8文字以上）
            </label>
            <input className="field" id="password" name="password" type="password" required minLength={8} />
          </div>
          <button type="submit" className="btn-primary w-full">
            登録する
          </button>
        </ActionForm>
      </div>
      <p className="mt-4 text-sm text-slate-400">
        既にアカウントがある方は{" "}
        <Link href="/login" className="text-[#7dd3c7] underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
