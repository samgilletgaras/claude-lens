export function prettifyProjectName(str: string): string {
  if (!str) return 'Unknown Project';
  const folderName = str.split('/').pop() || str;
  return folderName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
