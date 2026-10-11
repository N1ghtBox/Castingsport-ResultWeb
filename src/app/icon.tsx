import { appIcon } from "@/lib/app-icon";

// Served at /icon/192 and /icon/512: the favicon and the installed app's icons
export function generateImageMetadata() {
  return [192, 512].map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return appIcon(Number(await id));
}
