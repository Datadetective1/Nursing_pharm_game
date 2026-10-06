"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";

/**
 * Touch-first drag-and-drop with a TAP fallback:
 *  • drag a card onto a zone, OR
 *  • tap a card (it lifts/highlights), then tap a zone.
 * Cards use `touch-action: none`, so dragging never scrolls the page; everything else scrolls normally.
 * Zones are any element with data-drop-zone; the drop target is resolved with elementsFromPoint.
 */
interface DndState {
  selected: string | null;
  hover: string | null;
  select: (id: string | null) => void;
  setHover: (id: string | null) => void;
  drop: (item: string, zone: string) => boolean;
}

const Ctx = createContext<DndState | null>(null);

export function useDnd() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDnd outside DndProvider");
  return c;
}

/** onDrop returns true when the drop is accepted (correct); false = rejected (card returns). */
export function DndProvider({ onDrop, children }: { onDrop: (item: string, zone: string) => boolean; children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const drop = useCallback(
    (item: string, zone: string) => {
      const ok = onDrop(item, zone);
      setSelected(null);
      setHover(null);
      return ok;
    },
    [onDrop],
  );
  const value = useMemo(() => ({ selected, hover, select: setSelected, setHover, drop }), [selected, hover, drop]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function pointFrom(e: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } | null {
  if ("changedTouches" in e && e.changedTouches?.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  if ("clientX" in e) return { x: e.clientX, y: e.clientY };
  return null;
}

function zoneAt(x: number, y: number): string | null {
  if (typeof document === "undefined") return null;
  for (const el of document.elementsFromPoint(x, y)) {
    const z = (el as HTMLElement).closest?.("[data-drop-zone]") as HTMLElement | null;
    if (z?.dataset.dropZone) return z.dataset.dropZone;
  }
  return null;
}

export function DragItem({
  id,
  children,
  className,
  disabled,
  shake,
  testId,
  layoutId,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  /** change this value to trigger a "wrong" shake */
  shake?: number;
  testId?: string;
  layoutId?: string;
}) {
  const { selected, select, setHover, drop } = useDnd();
  const isSel = selected === id;
  return (
    <motion.div
      layoutId={layoutId}
      drag={!disabled}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.9}
      whileDrag={{ scale: 1.06, zIndex: 60, boxShadow: "0 18px 40px -12px rgba(0,0,0,0.35)" }}
      onDragStart={() => {
        select(id);
        haptic(8);
      }}
      onDrag={(e) => {
        const p = pointFrom(e);
        if (p) setHover(zoneAt(p.x, p.y));
      }}
      onDragEnd={(e) => {
        const p = pointFrom(e);
        const z = p ? zoneAt(p.x, p.y) : null;
        setHover(null);
        if (z) drop(id, z);
        else select(null);
      }}
      onTap={() => {
        if (disabled) return;
        playSound("tap");
        select(isSel ? null : id);
      }}
      animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
      transition={{ duration: 0.35 }}
      key={shake ? `s${shake}` : undefined}
      style={{ touchAction: "none" }}
      role="button"
      aria-pressed={isSel}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select(isSel ? null : id);
        }
      }}
      data-testid={testId}
      data-drag-id={id}
      className={cx(
        "relative cursor-grab select-none active:cursor-grabbing",
        isSel && "ring-4 ring-brand/60 ring-offset-2 ring-offset-bg",
        disabled && "cursor-default opacity-90",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function DropZone({ id, children, className, activeClassName, testId, label }: { id: string; children?: ReactNode; className?: string; activeClassName?: string; testId?: string; label?: string }) {
  const { selected, hover, drop } = useDnd();
  const active = hover === id;
  const armed = selected !== null;
  return (
    <div
      data-drop-zone={id}
      data-testid={testId}
      role="button"
      aria-label={label ?? `Drop zone ${id}`}
      tabIndex={armed ? 0 : -1}
      onClick={() => {
        if (selected) drop(selected, id);
      }}
      onKeyDown={(e) => {
        if (selected && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          drop(selected, id);
        }
      }}
      className={cx("transition-all duration-150", armed && "cursor-pointer", active && (activeClassName ?? "scale-[1.02] ring-4 ring-brand/50"), className)}
    >
      {children}
    </div>
  );
}
