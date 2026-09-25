"use client";

import Image from "next/image";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="state-page">
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
          <p className="heading-tagline">A better way to compare FPL players</p>
        </div>
      </div>
      <h1>Player data is temporarily unavailable.</h1>
      <p className="lede">Check the FPL API connection, then try again.</p>
      <button onClick={reset}>Retry</button>
    </main>
  );
}
