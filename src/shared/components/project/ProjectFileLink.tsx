import { FileText } from 'lucide-react';

type ProjectFile = {
  archivo_url?: string | null;
  archivo_nombre?: string | null;
  archivo_tamano?: number | null;
};

function formatBytes(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFileLink({ project }: { project: ProjectFile }) {
  if (!project.archivo_url) return null;

  return (
    <a
      href={project.archivo_url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
    >
      <FileText size={13} className="flex-shrink-0" />
      <span className="truncate">{project.archivo_nombre ?? 'Archivo del proyecto'}</span>
      {project.archivo_tamano ? <span className="text-indigo-400">({formatBytes(project.archivo_tamano)})</span> : null}
    </a>
  );
}
