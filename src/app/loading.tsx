import Image from "next/image";
import styles from "@/components/player-grid.module.css";

export default function Loading() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <div className="heading-lockup">
            <Image
              src="/logo.svg"
              alt=""
              width={72}
              height={68}
              className="heading-logo"
            />
            <div className="heading-copy">
              <h1>FPL Player Grid</h1>
              <p className="heading-tagline">
                A better way to compare FPL players
              </p>
            </div>
          </div>
          <p className="lede">Fetching the latest FPL data.</p>
        </div>
      </header>
      <div className={styles.tableWrap} aria-hidden="true">
        <div className={styles.skeletonHeader}>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className={styles.skeletonCell} />
          ))}
        </div>
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className={styles.skeletonRow}>
            {Array.from({ length: 8 }, (_, cellIndex) => (
              <span key={cellIndex} className={styles.skeletonCell} />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
