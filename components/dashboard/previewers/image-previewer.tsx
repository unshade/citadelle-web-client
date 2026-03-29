import type { PreviewProps } from "@/lib/previewers";

export function ImagePreviewer({ objectUrl, filename }: PreviewProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={objectUrl}
      alt={filename}
      className="max-h-[75vh] max-w-full rounded-lg object-contain mx-auto block"
    />
  );
}
