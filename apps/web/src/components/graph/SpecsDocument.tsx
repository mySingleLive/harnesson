import { useGraphStore } from '@/stores/graphStore';
import { MarkdownViewer } from './MarkdownViewer';

export function SpecsDocument() {
  const document = useGraphStore((s) => s.specsData?.document);
  return <MarkdownViewer content={document ?? null} emptyMessage="No specs document available" />;
}
