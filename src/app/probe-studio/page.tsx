"use client";

import { useEffect, useState } from "react";
import { OperatorScene } from "@/components/operators/OperatorScene";
import { fireScene, type SceneValues } from "@/lib/rive/operatorsHost";

export default function Probe() {
  const [values, setValues] = useState<SceneValues | null>(null);
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("v");
    setValues(raw ? (JSON.parse(raw) as SceneValues) : { mode: 2 });
    const t = new URLSearchParams(window.location.search).get("t");
    if (t) window.setTimeout(() => { fireScene((new URLSearchParams(window.location.search).get("s") ?? "studio") as "studio" | "intro", t as "correct" | "wrong"); (window as unknown as { __fired?: number }).__fired = performance.now(); }, 2500);
  }, []);
  if (!values) return null;
  return (
    <div style={{ width: 390, background: "#fff" }}>
      <OperatorScene scene={(new URLSearchParams(window.location.search).get("s") ?? "studio") as "studio" | "intro"} values={values} texts={JSON.parse(new URLSearchParams(window.location.search).get("x") ?? "{}")} />
    </div>
  );
}
