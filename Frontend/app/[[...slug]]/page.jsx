"use client";

import dynamic from "next/dynamic";

const LegacyApp = dynamic(() => import("../../src/App.jsx"), {
  ssr: false,
});

export default function LegacyAppShell() {
  return <LegacyApp />;
}
