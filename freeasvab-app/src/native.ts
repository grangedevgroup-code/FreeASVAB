import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

const KEY = "freeasvab:v1";

export async function restoreNative() {
  if (!isNative) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key: KEY });
    if (value && !localStorage.getItem(KEY)) localStorage.setItem(KEY, value);
  } catch {
    return;
  }
}

let pending: string | null = null;
let timer: number | undefined;

export function mirrorNative(json: string) {
  if (!isNative) return;
  pending = json;
  clearTimeout(timer);
  timer = window.setTimeout(flushNative, 300);
}

export async function flushNative() {
  clearTimeout(timer);
  const v = pending;
  pending = null;
  if (v === null) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: KEY, value: v });
  } catch {
    return;
  }
}

function bottomInset() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;bottom:0;width:0;height:0;visibility:hidden;padding-bottom:var(--sab)";
  document.body.append(probe);
  const px = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return px;
}

export async function syncSystemBars(dark: boolean) {
  if (!isNative) return;
  try {
    const { SystemBars, SystemBarsStyle, SystemBarType } = await import("@capacitor/core");
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark, bar: SystemBarType.StatusBar });
    const pageUnderGestureBar = bottomInset() > 0;
    await SystemBars.setStyle({ style: pageUnderGestureBar && !dark ? SystemBarsStyle.Light : SystemBarsStyle.Dark, bar: SystemBarType.NavigationBar });
  } catch {
    return;
  }
}

export async function shareBackup(name: string, json: string) {
  const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  const { uri } = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: "FreeASVAB backup", files: [uri] });
}
