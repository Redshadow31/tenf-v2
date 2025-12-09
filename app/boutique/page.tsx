"use client";

import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: "vêtements" | "accessoires" | "décoration";
  featured?: boolean;
}

const products: Product[] = [
  {
    id: "tshirt-tenf",
    name: "T-shirt TENF",
    price: 20.0,
    image: "https://placehold.co/400x400?text=T-shirt+TENF",
    description: "Porte fièrement les couleurs de TENF avec ce t-shirt.",
    category: "vêtements",
    featured: true,
  },
  {
    id: "mug-tenf",
    name: "Mug TENF",
    price: 15.0,
    image: "https://placehold.co/400x400?text=Mug+TENF",
    description: "Commence la journée en mettant la famille à l'honneur.",
    category: "accessoires",
    featured: true,
  },
  {
    id: "sticker-pack",
    name: "Sticker Pack",
    price: 6.0,
    image: "https://placehold.co/400x400?text=Sticker+Pack",
    description: "Collection de stickers TENF pour personnaliser tes affaires.",
    category: "décoration",
  },
  {
    id: "sweatshirt-tenf",
    name: "Sweatshirt TENF",
    price: 85.0,
    image: "https://placehold.co/400x400?text=Sweatshirt+TENF",
    description: "Affiche la New Family avec style et confort.",
    category: "vêtements",
    featured: true,
  },
  {
    id: "casquette-tenf",
    name: "Casquette TENF",
    price: 18.0,
    image: "https://placehold.co/400x400?text=Casquette+TENF",
    description: "Porte les couleurs TENF avec cette casquette stylée.",
    category: "accessoires",
  },
  {
    id: "pin-tenf",
    name: "Pin's TENF",
    price: 8.0,
    image: "https://placehold.co/400x400?text=Pin+TENF",
    description: "Porte fièrement le pin's TENF.",
    category: "accessoires",
    featured: true,
  },
];

export default function BoutiquePage() {
  const regularProducts = products.filter((p) => !p.featured);
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <main className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white">BOUTIQUE TENF</h1>
          <p className="text-2xl text-purple-400 font-semibold">MERCH OFFICIEL</p>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Soutiens la communauté et porte les couleurs de la New Family
          </p>
        </div>

        {/* Bannière */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6 text-center">
          <p className="text-xl text-white font-semibold">
            Notre communauté mérite le meilleur.
          </p>
        </div>

        {/* Section PRODUITS */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">PRODUITS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {regularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Section PRODUITS EN AVANT */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">PRODUITS EN AVANT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} featured />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

function ProductCard({ product, featured = false }: ProductCardProps) {
  const borderColors = [
    "border-orange-500",
    "border-pink-500",
    "border-blue-400",
    "border-purple-500",
    "border-red-500",
  ];
  const randomBorderColor =
    borderColors[product.id.length % borderColors.length];

  return (
    <div
      className={`bg-[#1a1a1d] border-2 ${randomBorderColor} rounded-lg overflow-hidden hover:scale-105 transition-transform`}
    >
      {/* Image du produit */}
      <div className="aspect-square w-full bg-gray-800 relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Informations du produit */}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
        {featured && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-purple-400">
            €{product.price.toFixed(2)}
          </span>
          <Link
            href={`/boutique/${product.id}`}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Acheter
          </Link>
        </div>
      </div>
    </div>
  );
}
