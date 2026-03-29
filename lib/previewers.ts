/**
 * Previewer registry.
 *
 * A Previewer handles one or more file extensions and exposes a React
 * component that receives a decrypted object URL.
 *
 * To add a new format:
 *   1. Create a component in components/dashboard/previewers/
 *   2. Add an entry to PREVIEWERS below.
 */
import type { ComponentType } from "react";
import { ImagePreviewer } from "@/components/dashboard/previewers/image-previewer";

export type PreviewProps = {
  objectUrl: string;
  filename: string;
};

export type Previewer = {
  /** Lowercase extensions (with leading dot) this previewer handles. */
  extensions: readonly string[];
  Component: ComponentType<PreviewProps>;
};

const PREVIEWERS: Previewer[] = [
  {
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    Component: ImagePreviewer,
  },
];

export function findPreviewer(filename: string): Previewer | null {
  const lower = filename.toLowerCase();
  return PREVIEWERS.find((p) => p.extensions.some((ext) => lower.endsWith(ext))) ?? null;
}

export function canPreview(filename: string): boolean {
  return findPreviewer(filename) !== null;
}
