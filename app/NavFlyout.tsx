'use client';

import { useLayoutEffect, useRef, type CSSProperties, type MouseEvent } from 'react';

/*
 * The panel that drops out of the header when a section is hovered, as on
 * apple.com: one column of large primary destinations, then smaller columns.
 * The panel's height follows its content, so moving between sections morphs
 * one height into the next instead of closing and reopening.
 */

export type FlyLink = { label: string; note?: string; href: string; external?: boolean; run?: () => void };
export type FlyMenu = { title: string; primary: FlyLink[]; columns: { title: string; links: FlyLink[] }[] };

function FlyAnchor({ link, i, onDone }: { link: FlyLink; i: number; onDone: () => void }) {
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (!plain) return;
    if (link.run) {
      event.preventDefault();
      link.run();
    }
    onDone();
  };
  return (
    <li style={{ '--i': i } as CSSProperties}>
      <a href={link.href} onClick={click} {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}>
        {link.label}
        {link.note && <small>{link.note}</small>}
      </a>
    </li>
  );
}

export function NavFlyout({ menu, open, onDone }: { menu: FlyMenu | null; open: boolean; onDone: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!panel || !inner) return;
    const measure = () => panel.style.setProperty('--fly-h', `${inner.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [menu]);

  let i = 0;
  return (
    <div id="nav-flyout" ref={panelRef} className={open ? 'flyout open' : 'flyout'} inert={!open}>
      {menu && (
        <div className="flyInner" ref={innerRef} key={menu.title}>
          <div className="flyCol flyPrimary">
            <h2 className="flyTitle">{menu.title}</h2>
            <ul>
              {menu.primary.map((link) => (
                <FlyAnchor key={link.label} link={link} i={i++} onDone={onDone} />
              ))}
            </ul>
          </div>
          {menu.columns.map((col) => (
            <div className="flyCol" key={col.title}>
              <h3 className="flyTitle">{col.title}</h3>
              <ul>
                {col.links.map((link) => (
                  <FlyAnchor key={link.label} link={link} i={i++} onDone={onDone} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
