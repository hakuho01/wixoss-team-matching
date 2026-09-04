"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { likeUserAction } from "@/app/actions/tournaments";

type Props = {
  toUserId: string;
  tournamentId: string;
  alreadyLiked: boolean;
  disabled?: boolean;
};

export function LikeButton({ toUserId, tournamentId, alreadyLiked, disabled }: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(alreadyLiked);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={liked || disabled || pending}
        onClick={() => {
          startTransition(async () => {
            const result = await likeUserAction(toUserId, tournamentId);
            if (result.error) {
              setMessage(result.error);
              return;
            }
            setLiked(true);
            setMessage(result.success ?? null);
            router.refresh();
          });
        }}
        className="rounded-md bg-[#c44536] px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-600"
      >
        {liked ? "いいね済" : pending ? "送信中…" : "いいね"}
      </button>
      {message && <p className="max-w-[14rem] text-right text-xs text-slate-300">{message}</p>}
    </div>
  );
}
