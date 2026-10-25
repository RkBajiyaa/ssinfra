"use client";

import { useActionState, useRef, useState } from "react";
import { deletePackageAction, savePackageAction } from "@/lib/admin/actions";
import { PACKAGE_CATEGORIES, PRICE_MODES, priceLine, type PriceMode, type ServicePackage } from "@/lib/packages/schema";
import { buttonClass } from "@/components/ui/button";

const field =
  "mt-1.5 block min-h-11 w-full rounded-[3px] border bg-white px-3 text-[0.95rem] focus:outline-2 focus:outline-offset-0 focus:outline-turf";

export function PackageForm({ pkg, saved }: { pkg: ServicePackage | null; saved?: boolean }) {
  const [state, action, pending] = useActionState(savePackageAction, null);
  const [mode, setMode] = useState<PriceMode>(pkg?.priceMode ?? "contact");
  const [amount, setAmount] = useState(pkg?.priceAmount?.toString() ?? "");
  const [unit, setUnit] = useState(pkg?.priceUnit ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(pkg));
  const slugRef = useRef<HTMLInputElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const err = state?.fieldErrors ?? {};
  const needsAmount = PRICE_MODES.find((m) => m.id === mode)?.needsAmount ?? false;
  const amountNum = Number(amount.replace(/[,\s₹]/g, ""));
  const preview = priceLine({
    priceMode: mode,
    priceAmount: needsAmount && amount && Number.isFinite(amountNum) && amountNum > 0 ? amountNum : null,
    priceUnit: unit || null,
  });

  const cls = (name: string) => `${field} ${err[name] ? "border-danger" : "border-line"}`;
  const errorText = (name: string) =>
    err[name] ? <p id={`${name}-err`} className="mt-1 text-sm font-medium text-danger">{err[name]}</p> : null;
  const aria = (name: string) => ({ "aria-invalid": err[name] ? true : undefined, "aria-describedby": err[name] ? `${name}-err` : undefined });

  return (
    <>
      <form action={action} className="grid gap-6">
        {pkg && <input type="hidden" name="id" value={pkg.id} />}

        {(state || saved) && (
          <p role="status" className={`border-l-2 px-4 py-2.5 text-sm ${state && !state.ok ? "border-danger bg-danger/[0.06] text-danger" : "border-ok bg-ok/[0.06] text-ok"}`}>
            {state ? state.message : "Package created. The website now shows this version if it's active."}
          </p>
        )}

        <section className="grid gap-4 border border-line bg-white p-5 sm:grid-cols-2">
          <h2 className="font-semibold text-navy sm:col-span-2">Basics</h2>
          <label className="text-sm font-semibold text-navy">
            Package name
            <input
              name="name"
              required
              maxLength={80}
              defaultValue={pkg?.name}
              onChange={(e) => {
                if (!slugTouched && slugRef.current) {
                  slugRef.current.value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
                }
              }}
              className={cls("name")}
              {...aria("name")}
            />
            {errorText("name")}
          </label>
          <label className="text-sm font-semibold text-navy">
            URL name
            <input ref={slugRef} name="slug" required maxLength={60} defaultValue={pkg?.slug} onChange={() => setSlugTouched(true)} className={cls("slug")} {...aria("slug")} />
            <span className="mt-1 block text-xs font-normal text-muted">Used in enquiry links, e.g. padel-standard</span>
            {errorText("slug")}
          </label>
          <label className="text-sm font-semibold text-navy">
            Category
            <select name="serviceCategory" defaultValue={pkg?.serviceCategory ?? "padel"} className={cls("serviceCategory")}>
              {PACKAGE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy">
            Display order
            <input name="displayOrder" type="number" min={0} max={999} defaultValue={pkg?.displayOrder ?? 10} className={cls("displayOrder")} {...aria("displayOrder")} />
            <span className="mt-1 block text-xs font-normal text-muted">Lower numbers appear first</span>
            {errorText("displayOrder")}
          </label>
          <label className="text-sm font-semibold text-navy sm:col-span-2">
            Short description
            <textarea name="shortDescription" rows={2} maxLength={300} defaultValue={pkg?.shortDescription} className={`${cls("shortDescription")} py-2.5`} {...aria("shortDescription")} />
            {errorText("shortDescription")}
          </label>
        </section>

        <section className="grid gap-4 border border-line bg-white p-5 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <h2 className="font-semibold text-navy">Scope</h2>
            <p className="text-sm text-muted">One item per line. Empty lists are hidden on the website.</p>
          </div>
          {([
            ["includedFeatures", "Included", pkg?.includedFeatures],
            ["optionalFeatures", "Optional extras", pkg?.optionalFeatures],
            ["exclusions", "Excluded", pkg?.exclusions],
          ] as const).map(([name, label, list]) => (
            <label key={name} className="text-sm font-semibold text-navy">
              {label}
              <textarea name={name} rows={7} defaultValue={list?.join("\n")} className={`${cls(name)} py-2.5`} {...aria(name)} />
              {errorText(name)}
            </label>
          ))}
        </section>

        <section className="grid gap-4 border border-line bg-white p-5 sm:grid-cols-2">
          <h2 className="font-semibold text-navy sm:col-span-2">Price display</h2>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold text-navy">How should the price appear?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {PRICE_MODES.map((m) => (
                <label key={m.id} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[3px] border border-line px-3 text-sm has-[:checked]:border-navy has-[:checked]:font-semibold has-[:checked]:text-navy">
                  <input type="radio" name="priceMode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} className="size-4 accent-navy" />
                  {m.label}
                </label>
              ))}
            </div>
          </fieldset>
          {needsAmount && (
            <>
              <label className="text-sm font-semibold text-navy">
                Price (₹)
                <input name="priceAmount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1500000" className={cls("priceAmount")} {...aria("priceAmount")} />
                {errorText("priceAmount")}
              </label>
              <label className="text-sm font-semibold text-navy">
                Price unit <span className="font-normal text-muted">(optional)</span>
                <input name="priceUnit" maxLength={40} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. per court" className={cls("priceUnit")} />
              </label>
            </>
          )}
          <div className="border-l-2 border-turf bg-turf-wash px-4 py-3 sm:col-span-2">
            <p className="text-xs font-semibold text-muted">Website preview</p>
            <p className="text-sm text-muted">{preview.label}</p>
            <p className="font-display text-2xl font-bold text-navy">
              {preview.amount ? `${preview.amount}${preview.unit ? ` ${preview.unit}` : ""}` : "Priced for your project"}
            </p>
          </div>
          <label className="text-sm font-semibold text-navy">
            Button text
            <input name="ctaLabel" required maxLength={40} defaultValue={pkg?.ctaLabel ?? "Request a Quote"} className={cls("ctaLabel")} {...aria("ctaLabel")} />
            {errorText("ctaLabel")}
          </label>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm font-semibold text-navy">
            <input type="checkbox" name="isActive" defaultChecked={pkg?.isActive ?? false} className="size-5 accent-navy" />
            Show on website
          </label>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
            {pending ? "Saving…" : pkg ? "Save changes" : "Create package"}
          </button>
          {pkg && (
            <button type="button" onClick={() => deleteDialog.current?.showModal()} className={buttonClass("outline", "md", "text-danger border-danger/30 hover:border-danger")}>
              Delete package
            </button>
          )}
        </div>
      </form>

      {pkg && (
        <dialog ref={deleteDialog} aria-labelledby="del-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[3px] bg-white p-6 backdrop:bg-char/60">
          <h2 id="del-title" className="font-display text-2xl font-bold text-navy">Delete &ldquo;{pkg.name}&rdquo;?</h2>
          <p className="mt-2 text-muted">
            It will be removed from the website and can&rsquo;t be restored. To take it off the website temporarily, hide it instead.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" autoFocus onClick={() => deleteDialog.current?.close()} className={buttonClass("outline", "md")}>
              Keep package
            </button>
            <form action={deletePackageAction}>
              <input type="hidden" name="id" value={pkg.id} />
              <button type="submit" className={buttonClass("primary", "md", "bg-danger hover:bg-danger/90")}>
                Delete package
              </button>
            </form>
          </div>
        </dialog>
      )}
    </>
  );
}
