import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { useMemo } from "react";
import { Vector2 } from "three";

export default function Effects() {
  const off = useMemo(() => new Vector2(0.0005, 0.0005), []);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  return (
    <EffectComposer>
      <Bloom intensity={0.25} luminanceThreshold={0.75} mipmapBlur />
      <Vignette offset={0.25} darkness={0.55} />
    </EffectComposer>
  );
}
