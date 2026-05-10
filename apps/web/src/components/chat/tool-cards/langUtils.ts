const LANG_MAP: Record<string, string> = {
  ts: 'tsx', tsx: 'tsx', js: 'jsx', jsx: 'jsx',
  json: 'json', css: 'css', html: 'html', md: 'markdown',
  py: 'python', rs: 'rust', go: 'go', yaml: 'yaml', yml: 'yaml',
};

export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop() ?? '';
  return LANG_MAP[ext] ?? 'tsx';
}
