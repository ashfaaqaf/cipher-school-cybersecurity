import Link from 'next/link';

/**
 * Styled 404. The default is unbranded and, on a Home Screen install, looks
 * like the app itself has broken rather than a link being wrong.
 */
export default function NotFound() {
  return (
    <div className="crash">
      <div className="crashCard">
        <div className="crashMark">?</div>
        <h1>No such page.</h1>
        <p>
          That link does not point anywhere in this course. It may be from an older version, or the address may have
          been mistyped.
        </p>
        <div className="crashActions">
          <Link className="btn primary" href="/">
            Back to the course
          </Link>
        </div>
      </div>
    </div>
  );
}
