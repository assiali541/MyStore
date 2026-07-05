import { Link } from "wouter";
import { Category } from "@workspace/api-client-react";

export function CategoryCard({ category }: { category: Category }) {
  const image = category.imageUrl || "https://placehold.co/800x600/E8E4DF/333333?text=Collection";

  return (
    <Link href={`/shop?category=${category.id}`} className="group block relative overflow-hidden aspect-[4/5] md:aspect-[3/4]">
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 z-10" />
      <img 
        src={image} 
        alt={category.name} 
        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-serif text-3xl md:text-4xl text-white font-medium tracking-wide mb-2">
          {category.name}
        </h3>
        <span className="text-white/80 tracking-widest text-sm uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          Discover {category.productCount} Pieces
        </span>
      </div>
    </Link>
  );
}
