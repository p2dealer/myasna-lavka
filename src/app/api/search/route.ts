import { NextResponse } from 'next/server';
import { searchSuggestions } from '@/services/catalog';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  if (q.trim().length < 2) return NextResponse.json([]);
  try {
    const items = await searchSuggestions(q);
    return NextResponse.json(
      items.map((p) => ({
        id: p.id, slug: p.slug, name: p.name, price: p.price,
        category: { name: p.category.name }, images: p.images,
      })),
      { headers: { 'cache-control': 'private, max-age=30' } },
    );
  } catch {
    return NextResponse.json([]);
  }
}
