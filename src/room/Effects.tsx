import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { useMemo } from "react";
import { Vector2 } from "three";

export default function Effects() {
  const off = useMemo(() => new Vector2(0.0005, 0.0005), []);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  return (
    <EffectComposer>
      <Bloom intensity={0.3} luminanceThreshold={0.7} mipmapBlur />
      <ChromaticAberration offset={off} />
      <Vignette offset={0.3} darkness={0.6} />
      <Noise opacity={0.03} />
    </EffectComposer>
  );
}
