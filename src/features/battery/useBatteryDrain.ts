import { useEffect, useRef, useState } from "react";
import { useSettings } from "../../store/useSettingsStore";
import { useNotifications } from "../../store/useNotificationStore";

export function useBatteryDrain() {
  const drain = useSettings((s) => s.powerDrain);
  const [level, setLevel] = useState(() => Number(localStorage.getItem("os.battery") || 100));
  const [plugged, setPlugged] = useState(false);
  const warned = useRef<{ [k: number]: boolean }>({});
  useEffect(() => { localStorage.setItem("os.battery", String(level)); }, [level]);
  useEffect(() => {
    if (!drain || plugged) return;
    const i = setInterval(() => setLevel((l) => Math.max(0, l - 0.35)), 60000);
    return () => clearInterval(i);
  }, [drain, plugged]);
  useEffect(() => {
    if (plugged) return;
    const n = useNotifications.getState().push;
    for (const [th, msg] of [[20, "Low battery — 12 minutes remaining"], [10, "Critical battery — plug in to continue"]] as const) {
      if (level <= th && !warned.current[th]) { warned.current[th] = true; n({ appId: "settings", title: "Battery", body: msg }); }
      if (level > th) warned.current[th] = false;
    }
  }, [level, plugged]);
  useEffect(() => {
    if (plugged || level > 5) return;
    const n = useNotifications.getState().push;
    const t = setInterval(() => n({ appId: "settings", title: "Plug in", body: "Battery at 5% — plug in to continue" }), 30000);
    return () => clearInterval(t);
  }, [level, plugged]);
  const status = !drain ? "Full" : plugged ? "Charging" : level <= 5 ? "Critical" : level <= 20 ? "Low" : "Discharging";
  return { level: Math.round(level), plugged, status, setPlugged, drain };
}
