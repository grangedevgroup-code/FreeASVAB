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
  timer = window.setTimeout(async () => {
    const v = pending;
    pending = null;
    if (v === null) return;
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: KEY, value: v });
    } catch {
      return;
    }
  }, 300);
}

export async function shareBackup(name: string, json: string) {
  const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  const { uri } = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: "FreeASVAB backup", files: [uri] });
}
