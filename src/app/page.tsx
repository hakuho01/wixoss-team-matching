import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-5xl flex-col justify-center px-4 py-16">
        <p className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.35em] text-[#7dd3c7]">
          Selector Network
        </p>
        <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-5xl font-bold leading-tight tracking-wide text-[#f2d08b] md:text-6xl">
          WIXOSS Team Match
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-300">
          同じ大会を目指すセレクターとつながり、相互いいねからチームを結成するマッチングアプリです。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="btn-primary">
            はじめる
          </Link>
          <Link href="/login" className="btn-secondary">
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}
