"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityRunner } from "@/components/ActivityRunner";
import { LAB_BY_SLUG } from "@/data/visualLabs";
import { Screen, TopBar } from "@/components/ui";

function Inner() {
  const sp = useSearchParams();
  const lab = LAB_BY_SLUG[sp.get("lab") ?? ""];
  const id = sp.get("id") ?? lab?.id;
  if (!lab) {
    return (
      <Screen>
        <TopBar back="/visual" title="Not found" />
        <p className="text-muted">That lab doesn&apos;t exist.</p>
      </Screen>
    );
  }
  const back = sp.get("back");
  return <ActivityRunner key={lab.slug} kind={lab.kind} initialId={id} back={back && back.startsWith("/") ? back : "/visual"} filter={lab.prefix ? (a) => a.id.startsWith(lab.prefix!) : undefined} />;
}

export default function VisualPlayPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
