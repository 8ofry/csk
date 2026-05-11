import { listMerchandise } from "@/application/merchandise/service";
import { jsonResponse } from "@/lib/api";

// GET /api/v1/public/merchandise
// Returns active items with stock > 0 — no internal cost prices.
export async function GET() {
  const items = (await listMerchandise({ activeOnly: true }))
    .filter((i) => i.stockLevel > 0)
    .map((i) => ({
      id: i.id,
      nameAr: i.nameAr,
      nameEn: i.nameEn,
      description: i.description,
      category: i.category,
      photos: i.photos,
      variants: i.variants,
      salePrice: Number(i.salePrice),
    }));
  return jsonResponse({ items });
}
