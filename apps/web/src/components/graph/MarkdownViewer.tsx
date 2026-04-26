import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string | null;
  emptyMessage?: string;
}

export function MarkdownViewer({ content, emptyMessage = 'No content available' }: MarkdownViewerProps) {
  if (!content) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="prose prose-invert max-w-none px-6 py-4 prose-headings:text-gray-200 prose-p:text-gray-400 prose-strong:text-gray-300 prose-code:text-harness-accent prose-pre:bg-harness-sidebar prose-a:text-harness-accent prose-li:text-gray-400">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
