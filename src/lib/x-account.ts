/**
 * Accepts @handle, bare handle, or x.com / twitter.com URL.
 * Returns a cleaned handle without @, or "" if empty/invalid.
 */
export function normalizeXHandle(input: string): { handle: string; error?: string } {
  const raw = input.trim();
  if (!raw) return { handle: "" };

  let candidate = raw;

  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      if (host !== "x.com" && host !== "twitter.com") {
        return { handle: "", error: "X (x.com / twitter.com) のURLを入力してください" };
      }
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
    }
  } catch {
    return { handle: "", error: "Xアカウントの形式が正しくありません" };
  }

  candidate = candidate.replace(/^@/, "").split(/[/?#]/)[0] ?? "";

  if (!/^[A-Za-z0-9_]{1,15}$/.test(candidate)) {
    return {
      handle: "",
      error: "Xのユーザー名は英数字とアンダースコア1〜15文字で入力してください",
    };
  }

  return { handle: candidate };
}

export function xProfileUrl(handle: string): string | null {
  const { handle: normalized } = normalizeXHandle(handle);
  if (!normalized) return null;
  return `https://x.com/${normalized}`;
}
