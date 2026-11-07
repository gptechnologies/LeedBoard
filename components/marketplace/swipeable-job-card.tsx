"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { Trash2 } from "lucide-react";
import styles from "./swipeable-job-card.module.css";

const REVEAL_WIDTH = 72;

export function SwipeableJobCard({ id, label, canDelete, disabled, pending, onDelete, children }: {
  id: string;
  label: string;
  canDelete: boolean;
  disabled: boolean;
  pending: boolean;
  onDelete: () => void;
  children: ReactNode;
}) {
  const x = useMotionValue(0);
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const dragging = useRef(false);
  const resetClick = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const controls = useRef<ReturnType<typeof animate> | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const allowed = canDelete && !disabled && !pending;

  function reveal(next: boolean) {
    setRevealed(next);
    controls.current?.stop();
    controls.current = animate(x, next ? REVEAL_WIDTH : 0, { duration: reducedMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] });
  }

  function closeOptions() {
    reveal(false);
    articleRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!allowed) {
      controls.current?.stop();
      x.set(0);
      setRevealed(false);
    }
  }, [allowed, x]);
  useEffect(() => () => { clearTimeout(resetClick.current); controls.current?.stop(); }, []);

  return (
    <div className={styles.swipe} onKeyDown={(event) => { if (event.key === "Escape") closeOptions(); }}>
      {allowed && <div id={`delete-options-${id}`} className={styles.actions} aria-hidden={!revealed} inert={!revealed}>
        <button className={styles.delete} type="button" onClick={() => { reveal(false); onDelete(); }} aria-label={`Delete posting for ${label}`} aria-haspopup="dialog"><Trash2 aria-hidden="true" /></button>
      </div>}
      <motion.article
        ref={articleRef}
        className={`hk-job-card ${styles.card}`}
        id={id}
        style={{ x, touchAction: "pan-y" }}
        drag={allowed ? "x" : false}
        dragConstraints={{ left: 0, right: REVEAL_WIDTH }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragStart={() => { clearTimeout(resetClick.current); dragging.current = true; }}
        onDragEnd={() => {
          reveal(x.get() >= REVEAL_WIDTH / 2);
          resetClick.current = setTimeout(() => { dragging.current = false; }, 100);
        }}
        onClickCapture={(event) => { if (dragging.current) { event.preventDefault(); event.stopPropagation(); } }}
        aria-busy={pending}
      >
        {children}
        {canDelete && <div className={styles.footer}>
          <button type="button" className={styles.toggle} disabled={disabled || pending} onClick={onDelete} aria-haspopup="dialog">
            <Trash2 aria-hidden="true" />{pending ? "Deleting…" : "Delete posting"}
          </button>
        </div>}
      </motion.article>
    </div>
  );
}
