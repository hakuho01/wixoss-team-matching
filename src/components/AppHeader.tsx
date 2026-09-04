import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export async function AppHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-white/10 bg-[#0b1220]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href={session ? "/dashboard" : "/"} className="font-[family-name:var(--font-display)] text-lg tracking-wide text-[#f2d08b]">
          WIXOSS Team Match
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
          {session ? (
            <>
              <Link href="/dashboard" className="hover:text-white">
                ダッシュボード
              </Link>
              <Link href="/tournaments" className="hover:text-white">
                大会一覧
              </Link>
              <Link href="/profile" className="hover:text-white">
                プロフィール
              </Link>
              {session.isAdmin && (
                <Link href="/admin" className="text-[#7dd3c7] hover:text-white">
                  管理
                </Link>
              )}
              <form action={logoutAction}>
                <button type="submit" className="text-slate-400 hover:text-white">
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-white">
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[#c44536] px-3 py-1.5 font-medium text-white hover:bg-[#a8382c]"
              >
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
