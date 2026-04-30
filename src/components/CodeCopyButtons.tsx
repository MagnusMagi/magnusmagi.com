"use client";

import { useEffect } from "react";

const COPIED_TIMEOUT = 1500;

export function CodeCopyButtons() {
  useEffect(() => {
    const figures = document.querySelectorAll<HTMLElement>(
      "figure[data-rehype-pretty-code-figure]",
    );
    const cleanups: Array<() => void> = [];

    for (const figure of Array.from(figures)) {
      const pre = figure.querySelector("pre");
      if (!pre) continue;
      if (figure.querySelector("button[data-copy-code]")) continue;

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.copyCode = "true";
      button.setAttribute("aria-label", "Copy code");
      button.textContent = "Copy";
      button.className =
        "absolute right-2 top-2 inline-flex h-7 items-center rounded-md border border-border bg-background/80 px-2 font-mono text-[11px] uppercase tracking-wider text-muted opacity-0 transition-opacity duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent group-hover:opacity-100 focus-visible:opacity-100";

      figure.style.position = "relative";
      figure.classList.add("group");
      figure.appendChild(button);

      const onClick = async () => {
        const code = pre.querySelector("code");
        const text = code?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "Copied";
          button.dataset.state = "copied";
          window.setTimeout(() => {
            button.textContent = "Copy";
            delete button.dataset.state;
          }, COPIED_TIMEOUT);
        } catch {
          button.textContent = "Failed";
          window.setTimeout(() => {
            button.textContent = "Copy";
          }, COPIED_TIMEOUT);
        }
      };
      button.addEventListener("click", onClick);
      cleanups.push(() => {
        button.removeEventListener("click", onClick);
        button.remove();
      });
    }

    return () => {
      for (const c of cleanups) c();
    };
  }, []);

  return null;
}
