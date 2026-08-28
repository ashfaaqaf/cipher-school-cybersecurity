import type { SVGProps } from 'react';

export type InterfaceIcon =
  | 'learn'
  | 'missions'
  | 'review'
  | 'paths'
  | 'proof'
  | 'words'
  | 'sources'
  | 'settings'
  | 'more';

export function InterfaceIcon({ name, ...props }: { name: InterfaceIcon } & SVGProps<SVGSVGElement>) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    focusable: false,
    'aria-hidden': true,
    ...props,
  };

  switch (name) {
    case 'learn':
      return <svg {...common}><path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h5v16H7a2.5 2.5 0 0 0-2.5 2z" /><path d="M19.5 5.5A2.5 2.5 0 0 0 17 3h-5v16h5a2.5 2.5 0 0 1 2.5 2z" /></svg>;
    case 'missions':
      return <svg {...common}><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="2.5" /><path d="M12 1.75v3M12 19.25v3M1.75 12h3M19.25 12h3" /></svg>;
    case 'review':
      return <svg {...common}><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.1 8.2A7.5 7.5 0 0 1 20 12M4 12a7.5 7.5 0 0 0 13.9 3.8" /></svg>;
    case 'paths':
      return <svg {...common}><circle cx="6" cy="5" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="12" cy="19" r="2" /><path d="M6 7v2.5A2.5 2.5 0 0 0 8.5 12H12m6-5v2.5a2.5 2.5 0 0 1-2.5 2.5H12m0 0v5" /></svg>;
    case 'proof':
      return <svg {...common}><path d="M12 2.5 19 5v5.6c0 4.6-2.8 8.7-7 10.9-4.2-2.2-7-6.3-7-10.9V5z" /><path d="m8.6 12 2.2 2.2 4.6-4.7" /></svg>;
    case 'words':
      return <svg {...common}><path d="M5 4h14M12 4v16M8.5 20h7" /><path d="M4 9h5M15 9h5" /></svg>;
    case 'sources':
      return <svg {...common}><path d="M6 3.5h10.5A1.5 1.5 0 0 1 18 5v15.5l-6-3-6 3z" /><path d="M9 7h6M9 10h5" /></svg>;
    case 'settings':
      return <svg {...common}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="13" cy="18" r="2" /></svg>;
    case 'more':
      return <svg {...common}><circle cx="5" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.1" fill="currentColor" stroke="none" /></svg>;
  }
}
