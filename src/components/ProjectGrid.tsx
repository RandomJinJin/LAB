import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";

import type { Project } from "../data/projects";
import {
  IsoCard,
  IsoCardAction,
  IsoCardContent,
  IsoCardDescription,
  IsoCardFooter,
  IsoCardHeader,
  IsoCardTitle,
} from "./ui/iso-card";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-3.5">
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.18-1.49 3.14-1.18 3.14-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function handleCopy() {
    await writeClipboard(prompt);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      data-variant="solid"
      onClick={handleCopy}
      aria-label={copied ? "Prompt 已复制" : "复制 Prompt"}
      className="iso-button z-30"
    >
      {copied ? (
        <Check size={14} strokeWidth={2} aria-hidden="true" />
      ) : (
        <Copy size={14} strokeWidth={1.75} aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? "已复制" : "复制 Prompt"}</span>
    </button>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const hasActions = Boolean(project.github || project.prompt);

  return (
    <IsoCard className="h-full">
      <a
        href={project.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`打开 ${project.title}`}
        className="absolute inset-0 z-20 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      />
      <IsoCardHeader>
        <IsoCardTitle className="text-lg">{project.title}</IsoCardTitle>
        <IsoCardDescription className="line-clamp-2 leading-6">
          {project.description}
        </IsoCardDescription>
        <IsoCardAction>
          <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </IsoCardAction>
      </IsoCardHeader>
      <IsoCardContent className="flex-1" />
      {hasActions ? (
        <IsoCardFooter className="justify-end">
          {project.github ? (
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} 的 GitHub 仓库`}
              className="iso-button z-30"
            >
              <GithubIcon />
              <span>GitHub</span>
            </a>
          ) : null}
          {project.prompt ? <CopyPromptButton prompt={project.prompt} /> : null}
        </IsoCardFooter>
      ) : null}
    </IsoCard>
  );
}

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={`${project.title}-${project.url}`} project={project} />
      ))}
    </div>
  );
}
