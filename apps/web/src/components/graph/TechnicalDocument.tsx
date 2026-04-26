import { useGraphStore } from '@/stores/graphStore';
import { MarkdownViewer } from './MarkdownViewer';

export function TechnicalDocument() {
  const document = useGraphStore((s) => s.architectData?.document);
  return <MarkdownViewer content={document ?? null} emptyMessage="No technical document available" />;
}
