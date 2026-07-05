import { useState } from "react";
import { useLocation } from "wouter";
import { useListProducts, useListCategories, ListProductsSort } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

export default function Shop() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") ? parseInt(searchParams.get("category") as string) : undefined;

  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategory);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<ListProductsSort>("newest");
  const [page, setPage] = useState(1);

  const { data: categories } = useListCategories();
  const { data: productsData, isLoading } = useListProducts({
    categoryId,
    search: debouncedSearch || undefined,
    sort,
    page,
    limit: 12
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  const handleClearFilters = () => {
    setCategoryId(undefined);
    setSearch("");
    setDebouncedSearch("");
    setSort("newest");
    setPage(1);
  };

  const FiltersContent = () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="font-serif text-lg font-medium mb-4 text-foreground">Categories</h3>
        <div className="flex flex-col gap-2">
          <button 
            className={`text-left text-sm py-1 transition-colors ${!categoryId ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setCategoryId(undefined); setPage(1); }}
          >
            All Pieces
          </button>
          {categories?.map((cat) => (
            <button 
              key={cat.id}
              className={`text-left text-sm py-1 transition-colors ${categoryId === cat.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setCategoryId(cat.id); setPage(1); }}
            >
              {cat.name} ({cat.productCount})
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg font-medium mb-4 text-foreground">Search</h3>
        <form onSubmit={handleSearch} className="relative">
          <Input 
            type="search" 
            placeholder="Search pieces..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-8 rounded-none border-border focus-visible:ring-primary"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <Button variant="outline" className="rounded-none mt-4 w-full" onClick={handleClearFilters}>
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="pt-32 pb-24 px-4 md:px-6 container mx-auto">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-foreground font-medium mb-4">The Collection</h1>
        <p className="text-muted-foreground font-light">
          Discover our curated selection of exceptional pieces, designed to elevate your everyday wardrobe with uncompromising quality.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-32">
            <FiltersContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
            <p className="text-sm text-muted-foreground">
              {productsData?.total || 0} Pieces {categoryId && categories?.find(c => c.id === categoryId) && `in ${categories?.find(c => c.id === categoryId)?.name}`}
            </p>

            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden rounded-none flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] pt-12">
                  <SheetHeader className="mb-8">
                    <SheetTitle className="font-serif">Filter Collection</SheetTitle>
                    <SheetDescription>Refine your search</SheetDescription>
                  </SheetHeader>
                  <FiltersContent />
                </SheetContent>
              </Sheet>

              <Select value={sort} onValueChange={(val: any) => { setSort(val); setPage(1); }}>
                <SelectTrigger className="w-[180px] rounded-none border-none shadow-none bg-transparent hover:bg-secondary/50 focus:ring-0 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-sm" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-5 w-1/4 mt-2" />
                </div>
              ))}
            </div>
          ) : productsData?.products.length === 0 ? (
            <div className="py-24 text-center">
              <h3 className="font-serif text-2xl text-foreground mb-2">No pieces found</h3>
              <p className="text-muted-foreground mb-8">Try adjusting your filters or search term.</p>
              <Button onClick={handleClearFilters} variant="outline" className="rounded-none">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-12">
                {productsData?.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {productsData && productsData.totalPages > 1 && (
                <div className="mt-16 flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-none"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {page} of {productsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    className="rounded-none"
                    disabled={page === productsData.totalPages}
                    onClick={() => setPage((p) => Math.min(productsData.totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
