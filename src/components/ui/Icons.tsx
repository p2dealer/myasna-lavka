type P = { className?: string; size?: number };
const base = (size = 18) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const IconSearch = ({ size, className }: P) => (<svg {...base(size)} className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>);
export const IconCart = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M3 4h2.2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.55L20.5 8H6.2" /><circle cx="10" cy="20" r="1.4" /><circle cx="17.5" cy="20" r="1.4" /></svg>);
export const IconHeart = ({ size, className, filled }: P & { filled?: boolean }) => (<svg {...base(size)} fill={filled ? 'currentColor' : 'none'} className={className}><path d="M12 20.2 4.6 13a4.7 4.7 0 1 1 7.4-5.7A4.7 4.7 0 1 1 19.4 13Z" /></svg>);
export const IconUser = ({ size, className }: P) => (<svg {...base(size)} className={className}><circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" /></svg>);
export const IconMenu = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconClose = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconPlus = ({ size, className }: P) => (<svg {...base(size)} strokeWidth={2} className={className}><path d="M12 5v14M5 12h14" /></svg>);
export const IconMinus = ({ size, className }: P) => (<svg {...base(size)} strokeWidth={2} className={className}><path d="M5 12h14" /></svg>);
export const IconArrow = ({ size, className }: P) => (<svg {...base(size)} strokeWidth={2.2} className={className}><path d="M5 12h13m-5-6 6 6-6 6" /></svg>);
export const IconCheck = ({ size, className }: P) => (<svg {...base(size)} strokeWidth={2.2} className={className}><path d="m5 12.5 4.5 4.5L19 7" /></svg>);
export const IconTruck = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M2 7h10v9H2zM12 10h4l3 3v3h-7z" /><circle cx="6" cy="18" r="1.6" /><circle cx="16.5" cy="18" r="1.6" /></svg>);
export const IconSnow = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" /></svg>);
export const IconShield = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M12 3 5 5.6v5.5c0 4.4 2.9 8.3 7 9.4 4.1-1.1 7-5 7-9.4V5.6Z" /><path d="m9.2 12 2 2 3.6-3.8" /></svg>);
export const IconKnife = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M3 15 15 3l4 4-8 8Z" /><path d="m11 15-3 6-5-5 6-3" /></svg>);
export const IconPack = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M12 3 4 7v10l8 4 8-4V7Z" /><path d="M4 7l8 4 8-4M12 11v10" /></svg>);
export const IconClock = ({ size, className }: P) => (<svg {...base(size)} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const IconFilter = ({ size, className }: P) => (<svg {...base(size)} strokeWidth={1.9} className={className}><path d="M3 6h18M6 12h12M10 18h4" /></svg>);
export const IconTrash = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>);
export const IconUp = ({ size, className }: P) => (<svg {...base(size)} strokeWidth={2.6} className={className}><path d="M12 19V5m-6 6 6-6 6 6" /></svg>);
export const IconDown = ({ size, className }: P) => (<svg {...base(size)} strokeWidth={2.6} className={className}><path d="M12 5v14m6-6-6 6-6-6" /></svg>);
export const IconTelegram = ({ size, className }: P) => (<svg width={size ?? 18} height={size ?? 18} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M21.6 4.3 2.9 11.5c-.9.35-.9 1.6.02 1.9l4.7 1.5 1.8 5.5c.25.75 1.2.95 1.7.35l2.5-2.9 4.7 3.45c.6.44 1.45.11 1.6-.62l3-14.6c.18-.85-.65-1.55-1.32-1.28Z" /></svg>);
export const IconInstagram = ({ size, className }: P) => (<svg {...base(size)} className={className}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></svg>);
export const IconFacebook = ({ size, className }: P) => (<svg width={size ?? 18} height={size ?? 18} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3-.04-1.3-.13-2.45-.13-2.45 0-4.1 1.5-4.1 4.23V9.9H7.4V13h2.75v8Z" /></svg>);
export const IconDashboard = ({ size, className }: P) => (<svg {...base(size)} className={className}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>);
export const IconList = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>);
export const IconBox = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M12 3 4 7v10l8 4 8-4V7Z" /><path d="m4 7 8 4 8-4" /></svg>);
export const IconTag = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M3.5 11.5V4h7.5l9 9-7.5 7.5Z" /><circle cx="7.6" cy="7.6" r="1.3" /></svg>);
export const IconUsers = ({ size, className }: P) => (<svg {...base(size)} className={className}><circle cx="9.5" cy="8" r="3.2" /><path d="M3.6 19a6 6 0 0 1 11.8 0M16.5 5.2a3.2 3.2 0 0 1 0 5.9M17.5 19a6 6 0 0 0-1.6-3.9" /></svg>);
export const IconCog = ({ size, className }: P) => (<svg {...base(size)} className={className}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8m15-6.5-1.7 1.7M7.9 16.1l-1.7 1.7m0-12.3 1.7 1.7m8.2 8.2 1.7 1.7" /></svg>);
export const IconLogout = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9M15 8l4 4-4 4M19 12H9" /></svg>);
export const IconLock = ({ size, className }: P) => (<svg {...base(size)} className={className}><rect x="4.5" y="10" width="15" height="10" rx="2.5" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /></svg>);

export function Stars({ rating, count, size = 12 }: { rating: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-px text-[11.5px] text-inkfaint">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="text-[#D9A22B]"
          fill={i <= Math.round(rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6}>
          <path d="m12 3 2.7 5.5 6 .9-4.35 4.25 1.03 6L12 16.8 6.62 19.65l1.03-6L3.3 9.4l6-.9Z" />
        </svg>
      ))}
      {count !== undefined && <span className="ml-1.5 tabular">{rating.toFixed(1)} · {count}</span>}
    </span>
  );
}

export function Logo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <circle cx="20" cy="20" r="19" className="fill-bordeaux" />
      <g fill="none" className="stroke-paper" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 19.5c-.2-5 4.6-8 9.6-7.5 5.4.5 9.6 3.4 9.4 7.9-.2 4.5-4.4 7.8-9.6 8-5.2.2-9.2-3.6-9.4-8.4Z" />
        <path d="M15.6 18c1.7-1.3 3.2.7 4.9-.4M16.5 22.4c1.9-1.1 3.2.7 5.3-.4" />
      </g>
    </svg>
  );
}
