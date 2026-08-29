import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <Compass className="w-6 h-6 text-[var(--text-faint)]" />
      <h1 className="font-serif text-3xl text-[var(--text)]">
        Nothing charted here
      </h1>
      <p className="max-w-md text-sm text-[var(--text-dim)]">
        That page is not part of Nebula.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
      >
        Back to the dashboard
      </Link>
    </div>
  );
}
