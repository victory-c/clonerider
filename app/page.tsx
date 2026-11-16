// architecture placeholder — the landing page is designed and built in Kiro (spec `haunted-ui`).
import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">{APP_NAME}</h1>
      <p>Race your past self, even on a different route.</p>
      <Link href="/ride" className="underline">
        Open the ride page (placeholder)
      </Link>
    </main>
  );
}
