"use client";

import dynamic from "next/dynamic";

// three.js loads after the hero, so the first viewport stays light.
const JourneyWorld = dynamic(() => import("./JourneyWorld"), { ssr: false });

export default function WorldMount() {
  return <JourneyWorld />;
}
