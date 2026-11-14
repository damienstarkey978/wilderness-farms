"use client";

import { useState } from "react";

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-beige border-y border-beige">
      {items.map((item, index) => {
        const expanded = open === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-4 py-5 text-left"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
              >
                <span className="font-serif text-2xl text-forest md:text-3xl">{item.question}</span>
                <span aria-hidden className="text-2xl text-gold">
                  {expanded ? "–" : "+"}
                </span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded}>
              <p className="max-w-2xl pb-6 text-base leading-relaxed text-ink/80">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
