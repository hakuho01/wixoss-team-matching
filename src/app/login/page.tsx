import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { loginAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f2d08b]">
        ログイン
      </h1>
      <div className="panel mt-6">
        <ActionForm action={loginAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              メールアドレス
            </label>
            <input className="field" id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              パスワード
            </label>
            <input className="field" id="password" name="password" type="password" required minLength={8} />
          </div>
          <button type="submit" className="btn-primary w-full">
            ログイン
          </button>
        </ActionForm>
      </div>
      <p className="mt-4 text-sm text-slate-400">
        アカウント未作成の方は{" "}
        <Link href="/register" className="text-[#7dd3c7] underline">
          新規登録
        </Link>
      </p>
    </div>
  );
}
