export interface Wallpaper { name: string; css: string; animated?: boolean }
export const WALLPAPERS: Wallpaper[] = [
  { name: "void", css: "radial-gradient(1200px 800px at 70% 20%, #17171c 0%, #0e0e10 60%)" },
  { name: "ember", css: "linear-gradient(160deg, #0e0e10 0%, #1c1214 55%, #241016 100%)" },
  { name: "glacier", css: "linear-gradient(200deg, #0e1116 0%, #101820 55%, #0e0e10 100%)" },
  { name: "moss", css: "linear-gradient(140deg, #0e100e 0%, #131a13 60%, #0e0e10 100%)" },
  { name: "bone", css: "linear-gradient(180deg, #171614 0%, #0e0e10 70%)" },
  { name: "violet", css: "radial-gradient(1000px 700px at 30% 80%, #191225 0%, #0e0e10 65%)" },
  { name: "plain", css: "#0e0e10" },
  { name: "live", css: "radial-gradient(900px 600px at 40% 30%, #14141a 0%, #0e0e10 70%)", animated: true },
  { name: "matrix", css: "#0a0f0a", animated: true },
  { name: "drift", css: "radial-gradient(900px 600px at 20% 30%, #14141a 0%, transparent 60%), radial-gradient(900px 600px at 80% 70%, #181016 0%, #0e0e10 70%)", animated: true },
];
