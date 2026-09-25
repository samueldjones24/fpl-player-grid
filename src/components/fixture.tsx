import { memo } from "react";
import type { Fixture } from "@/lib/fpl/types";
import styles from "./player-grid.module.css";

function FixtureStripImpl({ fixtures }: { fixtures: Fixture[] }) {
  if (fixtures.length === 0)
    return <span className={styles.muted}>No fixtures</span>;
  return (
    <div className={styles.fixtureStrip} aria-label={"Fixtures"}>
      {fixtures.map((fixture) => (
        <span
          key={fixture.id}
          className={styles.fixture}
          tabIndex={0}
          aria-label={`GW${fixture.gameweek}, ${fixture.opponent}, ${fixture.isHome ? "Home" : "Away"}, FDR ${fixture.difficulty}`}
          title={`GW${fixture.gameweek} ${fixture.opponent} ${fixture.isHome ? "Home" : "Away"}, FDR ${fixture.difficulty}`}
        >
          <strong className={styles.fixtureDetails}>
            {fixture.opponent} {fixture.isHome ? "(H)" : "(A)"}
          </strong>
          <small
            className={styles.fixtureRating}
            data-difficulty={fixture.difficulty}
          >
            {fixture.difficulty > 0 ? fixture.difficulty : "-"}
          </small>
        </span>
      ))}
    </div>
  );
}

/** Fixtures array is a stable reference per player, so this skips re-rendering on unrelated state changes. */
export const FixtureStrip = memo(FixtureStripImpl);
