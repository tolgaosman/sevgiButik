<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\ProductResource;
use App\Models\OrderItem;
use App\Models\Product;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    /**
     * Adds the `in_stock` exists-subquery every ProductResource::collection()
     * call needs — a single EXISTS per row, not an N+1 — so cards can show a
     * "Tükendi" badge without eager-loading every variant on list endpoints.
     */
    private function withStock(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->withExists(['variants as in_stock' => fn ($q) => $q->where('is_active', true)->where('stock', '>', 0)]);
    }

    /**
     * Backs getProductsByCategory() and getNewArrivals(). Category/subcategory
     * filters are separate whereHas() calls — an intersection, matching the
     * frontend's `tags.includes(a) && tags.includes(b)`. A single whereIn
     * would be a union and silently return the wrong products.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'sometimes|string|max:64',
            'subcategory' => 'sometimes|string|max:64',
            'is_new' => 'sometimes|boolean',
            'search' => 'sometimes|string|max:255',
            'sort' => 'sometimes|in:position,price_asc,price_desc,newest,rating',
            'limit' => 'sometimes|integer|min:1|max:100',
        ]);

        $cacheKey = 'products_index_v' . CatalogCache::version() . '_' . md5(json_encode($validated));

        $payload = Cache::remember($cacheKey, 600, function () use ($validated) {
            $query = Product::query()->where('is_active', true)->with('categories');

            if (! empty($validated['category'])) {
                $slug = $validated['category'];
                $category = \App\Models\Category::where('slug', $slug)->first();
                $matchSlugs = $category
                    ? $category->subcategories()->pluck('slug')->push($slug)
                    : collect([$slug]);
                $query->whereHas('categories', fn ($q) => $q->whereIn('slug', $matchSlugs));
            }

            if (! empty($validated['subcategory'])) {
                $slug = $validated['subcategory'];
                $query->whereHas('categories', fn ($q) => $q->where('slug', $slug));
            }

            if (array_key_exists('is_new', $validated)) {
                $query->where('is_new', (bool) $validated['is_new']);
            }

            if (! empty($validated['search'])) {
                $term = $validated['search'];
                $isMysql = $query->getConnection()->getDriverName() === 'mysql';

                // MySQL has a fulltext index on name only (see the products
                // migration) — description search stays a LIKE either way,
                // fine for a catalog this size. SQLite (the test driver)
                // doesn't support whereFullText at all, hence the branch.
                $query->where(function ($q) use ($term, $isMysql) {
                    $isMysql ? $q->whereFullText('name', $term) : $q->where('name', 'like', "%{$term}%");
                    $q->orWhere('description', 'like', "%{$term}%");
                });
            }

            match ($validated['sort'] ?? 'position') {
                'price_asc' => $query->orderBy('price_minor'),
                'price_desc' => $query->orderByDesc('price_minor'),
                'newest' => $query->orderByDesc('created_at'),
                'rating' => $query->orderByDesc('rating_avg'),
                default => $query->orderBy('position'),
            };

            $query = $this->withStock($query);

            return ProductResource::collection($query->limit($validated['limit'] ?? 60)->get())->resolve();
        });

        return response()->json($payload);
    }

    /**
     * Backs getProductById(). Returns 404 for inactive/missing products so the
     * frontend's fetch wrapper can translate that into `undefined` for notFound().
     */
    public function show(string $slug): JsonResponse
    {
        $payload = Cache::remember('product_detail_v' . CatalogCache::version() . "_{$slug}", 600, function () use ($slug) {
            $product = Product::where('slug', $slug)
                ->where('is_active', true)
                ->with(['categories', 'images', 'variants' => fn ($q) => $q->where('is_active', true)])
                ->first();

            return $product ? (new ProductDetailResource($product))->resolve() : null;
        });

        if (! $payload) {
            return response()->json(['message' => 'Ürün bulunamadı.'], 404);
        }

        return response()->json($payload);
    }

    /**
     * Backs getRelatedProducts(). Uses tags[0] (pivot position 0), matching
     * the frontend's `product.tags[0]` semantics, ordered by seed-file position
     * to reproduce the original array order.
     */
    public function related(Request $request, string $slug): JsonResponse
    {
        $limit = min(20, max(1, (int) $request->query('limit', 4)));

        $product = Product::where('slug', $slug)->with('categories')->first();

        if (! $product) {
            return response()->json(['message' => 'Ürün bulunamadı.'], 404);
        }

        $primaryCategory = $product->categories->first();

        if (! $primaryCategory) {
            return response()->json([]);
        }

        $cacheKey = 'products_related_v' . CatalogCache::version() . "_{$product->id}_{$limit}";

        $payload = Cache::remember($cacheKey, 600, function () use ($product, $primaryCategory, $limit) {
            $related = $this->withStock(
                Product::where('is_active', true)
                    ->where('id', '!=', $product->id)
                    ->whereHas('categories', fn ($q) => $q->where('categories.id', $primaryCategory->id))
                    ->with('categories')
                    ->orderBy('position')
            )->limit($limit)->get();

            return ProductResource::collection($related)->resolve();
        });

        return response()->json($payload);
    }

    /**
     * Backs getAllProductIds() for generateStaticParams().
     */
    public function slugs(): JsonResponse
    {
        $slugs = Product::where('is_active', true)->pluck('slug');

        return response()->json($slugs);
    }

    /**
     * Backs getBestSellers(). Ranked by units sold in the trailing 90 days
     * (cancelled/refunded orders excluded) rather than a seeded category —
     * there's no "cok-satanlar" category in the DB, only a leftover seed tag,
     * so the section this fed used to render nothing. Pads with the
     * highest-rated active products when sales history doesn't fill the
     * limit, which is always true right after launch.
     */
    public function bestSellers(Request $request): JsonResponse
    {
        $limit = min(20, max(1, (int) $request->query('limit', 8)));

        $payload = Cache::remember('products_best_sellers_v' . CatalogCache::version() . "_{$limit}", 600, function () use ($limit) {
            $rankedIds = OrderItem::query()
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.created_at', '>=', now()->subDays(90))
                ->whereNotIn('orders.status', ['cancelled', 'refunded'])
                ->selectRaw('order_items.product_id as product_id, SUM(order_items.quantity) as sold')
                ->groupBy('order_items.product_id')
                ->orderByDesc('sold')
                ->limit($limit)
                ->pluck('product_id');

            $byId = $this->withStock(
                Product::where('is_active', true)
                    ->whereIn('id', $rankedIds)
                    ->with('categories')
            )->get()->keyBy('id');

            $products = $rankedIds->map(fn ($id) => $byId->get($id))->filter()->values();

            if ($products->count() < $limit) {
                $fallback = $this->withStock(
                    Product::where('is_active', true)
                        ->whereNotIn('id', $products->pluck('id'))
                        ->with('categories')
                        ->inRandomOrder()
                )->limit($limit - $products->count())->get();

                $products = $products->concat($fallback);
            }

            return ProductResource::collection($products)->resolve();
        });

        return response()->json($payload);
    }
}
