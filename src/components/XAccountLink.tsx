import { xProfileUrl } from "@/lib/x-account";

type Props = {
  handle: string;
  className?: string;
};

export function XAccountLink({ handle, className }: Props) {
  const url = xProfileUrl(handle);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "text-[#7dd3c7] underline"}
    >
      @{handle.replace(/^@/, "")}
    </a>
  );
}
