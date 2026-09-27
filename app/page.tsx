import Nav, { Wordmark } from "@/components/Nav";
import Transformation from "@/components/Transformation";
import ContactForm from "@/components/ContactForm";
import WorldMount from "@/components/world/WorldMount";
import Intro from "@/components/Intro";
import Cursor from "@/components/fx/Cursor";
import { RevealText } from "@/components/fx/TextFx";
import JourneyHud from "@/components/journey/JourneyHud";
import {
  ContactScene,
  EcosystemChapter,
  GoldChapter,
  PillarsChapter,
  ProcessChapter,
  StackChapter,
  SwissChapter,
} from "@/components/journey/Chapters";

export default function Home() {
  return (
    <>
      <Intro />
      <Cursor />
      <a href="#main" className="skip-link">Skip to content</a>
      <WorldMount />
      <Nav />
      <JourneyHud />
      <main id="main" className="relative z-[1]">
        <div id="top" />
        <Transformation />
        <PillarsChapter />
        <StackChapter />

        <GoldChapter />
        <ProcessChapter />
        <EcosystemChapter />
        <SwissChapter />

        <ContactScene>
          <div className="wrap relative grid gap-14 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-24">
            <div>
              <RevealText className="h-section" lines={["Bring your first", "asset on-chain."]} />
              <p className="mt-6 text-lg text-ash">Tell us what you&rsquo;d like to tokenise.</p>
            </div>
            <ContactForm />
          </div>
        </ContactScene>
      </main>

      <footer className="relative z-[1] border-t border-line bg-obsidian">
        <div className="wrap flex flex-col gap-10 py-14 md:flex-row md:items-end md:justify-between">
          <div>
            <Wordmark className="text-[0.9375rem]" />
            <p className="mt-4 max-w-[32ch] text-ash">Infrastructure for the tokenised economy.</p>
          </div>
          <div className="flex flex-col gap-2 text-[0.875rem] text-dim md:items-end">
            <p>ComTech GmbH · Bahnhofstrasse 27, 6300 Zug, Switzerland</p>
            <p>© 2026 ComTech GmbH</p>
          </div>
        </div>
      </footer>
    </>
  );
}
