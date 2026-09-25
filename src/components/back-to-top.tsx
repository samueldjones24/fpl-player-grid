"use client";

import { useEffect, useState } from "react";
import styles from "./back-to-top.module.css";

const SCROLL_THRESHOLD = 400;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className={styles.backToTop}
      aria-label="Scroll back to top"
      title="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span className={styles.arrow} aria-hidden="true" />
    </button>
  );
}
