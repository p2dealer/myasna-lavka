import { NextResponse } from 'next/server';

/**
 * Процедурні зображення товарів у кольорах бренду.
 * Коли з'являться справжні фотографії, у ProductImage.url підставляється
 * шлях до завантаженого файлу — решта коду не змінюється.
 */
const TONE: Record<string, [string, string]> = {
  beef: ['#94413A', '#3B1512'], pork: ['#B57169', '#5C2C27'], chicken: ['#C8A070', '#6D4826'],
  turkey: ['#B98D62', '#5F4024'], lamb: ['#A24F42', '#48211C'], sausage: ['#8E5031', '#44211A'],
  smoked: ['#7E4229', '#371B13'], semi: ['#A87A52', '#4C3222'], bbq: ['#A94A33', '#3F1B15'],
  set: ['#7A2028', '#2B0E12'],
};

const MARKS: Record<string, string> = {
  ribeye: '<path d="M112 168c-4-42 34-74 84-76 44-2 88 22 94 60 6 40-24 78-74 84-48 6-100-26-104-68Z"/><path d="M286 148c16-6 24-24 16-40"/><path d="M138 172c18-20 36-34 56-44M148 200c24-26 48-46 76-58M168 220c24-28 50-48 78-58M196 232c22-26 44-42 66-50"/>',
  tbone: '<path d="M108 164c-2-44 40-72 88-72 52 0 96 26 98 68 2 44-40 76-92 76-50 0-94-30-94-72Z"/><path d="M178 96v136" stroke-width="9"/><path d="M178 150h84" stroke-width="9"/><path d="M124 186c14-16 28-28 44-36"/>',
  drumstick: '<path d="M238 114c30 12 40 54 16 80-26 28-70 24-88 0-16-22-6-56 22-70 15-8 33-14 50-10Z"/><path d="m166 196-34 34" stroke-width="9"/><path d="M128 236a10 10 0 1 1-.1 0M144 248a9 9 0 1 1-.1 0"/><path d="M212 140c14-8 24 4 34-4"/>',
  sausage: '<path d="M132 220c-24-44 0-96 48-108 50-13 92 18 96 64 3 34-16 58-44 62" stroke-width="24" stroke-linecap="round"/><path d="M150 132c-8-8-6-18 2-22M240 236c8 6 18 2 20-8"/>',
  ribs: '<path d="M120 128 274 112l16 88-154 18Z"/><path d="M156 122v84M192 118v86M228 114v86M262 116v84"/>',
  mince: '<path d="M124 218c4-50 38-80 78-80 42 0 74 30 76 80Z"/><path d="M146 206c10-14 20-22 32-28M172 208c12-16 24-26 38-32M200 206c12-16 24-26 38-30M228 204c10-12 20-20 30-24"/>',
  chop: '<path d="M146 124c36-18 82-10 100 20 18 32 2 70-32 82-36 12-74-4-86-34-10-26-2-54 18-68Z"/><path d="m150 216-26 28" stroke-width="9"/><path d="M120 250a9 9 0 1 1-.1 0"/><path d="M168 176c14-16 30-28 46-36M186 196c14-16 30-28 46-34"/>',
  smoked: '<path d="M204 108c46 2 76 42 70 86-5 38-38 56-74 56s-68-20-72-58c-5-44 30-86 76-84Z"/><path d="M138 156c40 16 88 20 132 8M144 196c40 14 84 16 124 6"/><path d="M204 108c-2-14-10-20-22-22"/>',
  skewer: '<path d="M104 240 296 92" stroke-width="4"/><rect x="140" y="158" width="44" height="44" rx="7" transform="rotate(-38 162 180)"/><rect x="188" y="122" width="44" height="44" rx="7" transform="rotate(-38 210 144)"/><rect x="236" y="86" width="44" height="44" rx="7" transform="rotate(-38 258 108)"/>',
  box: '<path d="M128 138 200 110l72 28v72l-72 28-72-28Z"/><path d="m128 138 72 28 72-28M200 166v72"/><path d="M164 124l72 28"/>',
  bird: '<path d="M204 106c48 2 80 36 78 76-2 34-30 54-84 54-52 0-80-22-80-56 0-40 36-76 86-74Z"/><path d="M172 236v18M222 236v18"/><path d="M146 152c26 22 60 32 100 28"/>',
  fillet: '<path d="M110 178c-2-34 44-62 96-62 50 0 94 26 92 60-2 32-42 58-94 58s-92-24-94-56Z"/><path d="M144 196c18-22 38-38 60-48M176 210c20-24 42-40 66-50M212 214c18-20 36-34 56-42"/>',
};

export async function GET(_req: Request, ctx: { params: Promise<{ params: string[] }> }) {
  const { params } = await ctx.params;
  const [kindRaw = 'ribeye', toneRaw = 'beef', seedRaw = '1'] = params;
  const kind = kindRaw in MARKS ? kindRaw : 'ribeye';
  const tone = toneRaw in TONE ? toneRaw : 'beef';
  const seed = Math.abs(Number.parseInt(seedRaw, 10) || 1);
  const [a, b] = TONE[tone];
  const dx = (seed * 13) % 26 - 13;
  const dy = (seed * 7) % 18 - 9;
  const rot = (seed * 11) % 16 - 8;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 340" width="400" height="340" role="img">
<defs>
<radialGradient id="g" cx="38%" cy="30%" r="82%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed}"/><feColorMatrix type="saturate" values="0"/></filter>
</defs>
<rect width="400" height="340" fill="url(#g)"/>
<rect width="400" height="340" filter="url(#n)" opacity="0.13"/>
<g transform="translate(${dx} ${dy}) rotate(${rot} 200 170)" fill="none" stroke="#FFF4E8" stroke-opacity="0.8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${MARKS[kind]}</g>
<path d="M0 340 L400 60 L400 0 L260 0 Z" fill="#FFFFFF" opacity="0.05"/>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
