import { useListCategories } from "@workspace/api-client-react";
import { CategoryCard } from "@/components/category-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <div className="pt-32 pb-24 px-4 md:px-6 container mx-auto">
      <div className="mb-16 text-center max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-foreground font-medium mb-4">Collections</h1>
        <p className="text-muted-foreground font-light">
          Explore our thematic selections, each curated to tell a distinct sartorial story.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-sm" />
          ))}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-muted-foreground">
          No collections available at the moment.
        </div>
      )}
    </div>
  );
}
