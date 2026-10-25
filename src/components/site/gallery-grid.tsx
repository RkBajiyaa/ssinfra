"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { GalleryItem } from "@/content/gallery";
import { ChevronIcon, CloseIcon, ExpandIcon } from "@/components/ui/icons";

type Category = { id: string; label: string };

export function GalleryGrid({ items, categories }: { items: GalleryItem[]; categories: Category[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<{ item: GalleryItem; index: number } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);
  const label = (id: string) => categories.find((c) => c.id === id)?.label ?? id;

  function open(item: GalleryItem) {
    setActive({ item, index: 0 });
    dialogRef.current?.showModal();
  }

  const photos = active ? [active.item.image, ...(active.item.more ?? [])] : [];
  const photo = active ? photos[active.index] : null;

  return (
    <>
      {categories.length > 1 && (
        <div role="group" aria-label="Filter projects" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {[{ id: "all", label: "All work" }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={`min-h-11 shrink-0 rounded-[3px] border px-4 text-[0.95rem] font-medium transition-colors ${
                filter === c.id ? "border-navy bg-navy text-white" : "border-line text-navy hover:border-navy"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? "project" : "projects"}
      </p>

      <ul className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {visible.map((item) => (
          <li key={item.id} className="mb-8 break-inside-avoid">
            <button type="button" onClick={() => open(item)} className="group block w-full text-left">
              <span className="relative block overflow-hidden rounded-[3px] bg-paper">
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  sizes="(min-width:1024px) 31vw, (min-width:640px) 47vw, 100vw"
                  className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
                  placeholder="blur"
                />
                <span className="absolute right-3 bottom-3 inline-flex size-9 items-center justify-center rounded-[3px] bg-white/90 text-navy opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ExpandIcon className="size-4" />
                </span>
              </span>
              <span className="mt-3 block text-sm text-muted">
                {label(item.category)}
                {item.location ? `, ${item.location}` : ""}
                {item.status === "in_progress" && item.category !== "installation" ? " (in progress)" : ""}
              </span>
              <span className="mt-0.5 block font-display text-[1.4rem] leading-tight font-semibold text-navy">{item.title}</span>
              <span className="mt-1 block leading-relaxed text-muted">{item.description}</span>
              {item.more && item.more.length > 0 && (
                <span className="mt-1 block text-sm font-medium text-turf">{item.more.length + 1} photos</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={active?.item.title ?? "Project photo"}
        onClose={() => setActive(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-auto max-h-[100dvh] w-full max-w-6xl bg-transparent p-3 backdrop:bg-char/90 sm:p-6"
      >
        {active && photo && (
          <figure className="bg-white">
            <div className="relative bg-char">
              <Image
                src={photo.src}
                alt={photo.alt}
                sizes="100vw"
                className="mx-auto h-auto max-h-[72dvh] w-auto object-contain"
                placeholder="blur"
              />
            </div>
            <figcaption className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="font-display text-[1.5rem] leading-tight font-semibold text-navy">{active.item.title}</p>
                <p className="mt-1 text-muted">{active.item.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous photo"
                      onClick={() => setActive({ ...active, index: (active.index - 1 + photos.length) % photos.length })}
                      className="inline-flex size-11 items-center justify-center border border-line text-navy hover:border-navy"
                    >
                      <ChevronIcon className="size-5 rotate-180" />
                    </button>
                    <span className="min-w-12 text-center text-sm text-muted">
                      {active.index + 1} / {photos.length}
                    </span>
                    <button
                      type="button"
                      aria-label="Next photo"
                      onClick={() => setActive({ ...active, index: (active.index + 1) % photos.length })}
                      className="inline-flex size-11 items-center justify-center border border-line text-navy hover:border-navy"
                    >
                      <ChevronIcon className="size-5" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  autoFocus
                  onClick={() => dialogRef.current?.close()}
                  className="inline-flex min-h-11 items-center gap-2 bg-navy px-4 font-semibold text-white"
                >
                  <CloseIcon className="size-5" />
                  Close
                </button>
              </div>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}
