'use client';

import { useEffect } from 'react';

/**
 * Last line of defence. Without this, one bad render replaces the whole app
 * with a blank white page and no explanation — which for an offline-capable
 * study app could look permanent.
 *
 * Progress lives in localStorage and is untouched by a render failure, so the
 * most useful thing this can do is say so before offering a reload.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Cipher School crashed:', error);
  }, [error]);

  return (
    <div className="crash">
      <div className="crashCard">
        <div className="crashMark">!</div>
        <h1>Something broke.</h1>
        <p>
          Your progress is safe — it is stored in this browser and a display error cannot touch it. Reloading almost
          always fixes this.
        </p>
        <div className="crashActions">
          <button className="btn primary" onClick={reset}>
            Try again
          </button>
          <button className="btn ghost" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </div>
        {error.digest && <p className="crashCode">Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
