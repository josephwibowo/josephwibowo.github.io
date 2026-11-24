import type { Metadata } from "next";
import { FOUNDER_INTRO, STOKE_DESCRIPTION, STOKE_TITLE, STOKE_URL } from "@/office/content";
import OfficeScene from "./OfficeScene";

export const metadata: Metadata = {
  title: "Robot Office (prototype) | Joseph Wibowo",
  description: "A small isometric office of robots, one of whom keeps working on Stoke Money.",
  robots: { index: false },
};

export default function OfficePage() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <div className="sr-only">
        <h1>Robot office</h1>
        <p>{FOUNDER_INTRO}</p>
        <p>
          {STOKE_TITLE}: {STOKE_DESCRIPTION}
        </p>
        <a href={STOKE_URL} target="_blank" rel="noopener noreferrer">
          Visit Stoke Money
        </a>
      </div>
      <OfficeScene />
    </main>
  );
}
