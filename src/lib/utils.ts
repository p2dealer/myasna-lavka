export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function slugify(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
    и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
    р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'shch', ь: '', ю: 'iu', я: 'ia', ъ: '', ы: 'y', э: 'e', ё: 'e',
  };
  return input
    .toLowerCase()
    .split('')
    .map((ch) => (ch in map ? map[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^380?/, '');
  const d = digits.slice(0, 9);
  if (d.length < 4) return d ? `+38 (0${d}` : '';
  if (d.length < 7) return `+38 (0${d.slice(0, 2)}) ${d.slice(2)}`;
  return `+38 (0${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7, 9)}`;
}

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d);
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

/** Шлях до адмін-панелі, як його бачить браузер. */
export function adminPath(sub = ''): string {
  const base = process.env.NEXT_PUBLIC_ADMIN_PATH || 'admin';
  const clean = sub.replace(/^\/+/, '');
  return `/${base}${clean ? `/${clean}` : ''}`;
}
