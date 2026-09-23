import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CodeOverride, PreOverride } from "./CodeRenderer";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-img:rounded-xl">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
        components={{
          pre: PreOverride,
          code: CodeOverride,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
