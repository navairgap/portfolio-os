import { useMemo } from "react";
import { marked } from "marked";

export default function MarkdownView({ md, className = "" }: { md: string; className?: string }) {
  const html = useMemo(() => marked.parse(md, { async: false }) as string, [md]);
  return (
    <div className={`markdown text-[13.5px] leading-[1.75] text-[rgba(244,244,245,.88)] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }} />
  );
}
