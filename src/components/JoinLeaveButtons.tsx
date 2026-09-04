"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinTournamentAction, leaveTournamentAction } from "@/app/actions/tournaments";

type Props = {
  tournamentId: string;
  joined: boolean;
  canLeave: boolean;
  isOpen: boolean;
};

export function JoinLeaveButtons({ tournamentId, joined, canLeave, isOpen }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {joined ? (
        <>
          <p className="text-sm text-emerald-300">参加予定に登録済みです</p>
          {canLeave && (
            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await leaveTournamentAction(tournamentId);
                  setMessage(result.error ?? result.success ?? null);
                  router.refresh();
                });
              }}
            >
              参加予定を取り消す
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          className="btn-primary"
          disabled={!isOpen || pending}
          onClick={() => {
            startTransition(async () => {
              const result = await joinTournamentAction(tournamentId);
              setMessage(result.error ?? result.success ?? null);
              router.refresh();
            });
          }}
        >
          参加予定に登録
        </button>
      )}
      {message && <p className="text-sm text-slate-300">{message}</p>}
    </div>
  );
}
