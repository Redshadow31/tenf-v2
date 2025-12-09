"use client";

import { use } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: "vêtements" | "accessoires" | "décoration";
  featured?: boolean;
  details?: string[];
  sizes?: string[];
  colors?: string[];
}

// TODO: Remplacer par une vraie source de données (base de données, API, etc.)
const products: Record<string, Product> = {
  "tshirt-tenf": {
    id: "tshirt-tenf",
    name: "T-shirt TENF",
    price: 20.0,
    image: "https://placehold.co/800x800?text=T-shirt+TENF",
    description: "Porte fièrement les couleurs de TENF avec ce t-shirt.",
    category: "vêtements",
    details: [
      "100% coton",
      "Logo TENF brodé",
      "Taille disponible : S, M, L, XL, XXL",
      "Lavable en machine",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Noir", "Blanc"],
  },
  "mug-tenf": {
    id: "mug-tenf",
    name: "Mug TENF",
    price: 15.0,
    image: "https://placehold.co/800x800?text=Mug+TENF",
    description: "Commence la journée en mettant la famille à l'honneur.",
    category: "accessoires",
    details: [
      "Céramique de qualité",
      "Logo TENF imprimé",
      "Capacité : 350ml",
      "Lavable au lave-vaisselle",
    ],
  },
  "sticker-pack": {
    id: "sticker-pack",
    name: "Sticker Pack",
    price: 6.0,
    image: "https://placehold.co/800x800?text=Sticker+Pack",
    description: "Collection de stickers TENF pour personnaliser tes affaires.",
    category: "décoration",
    details: [
      "Pack de 10 stickers",
      "Designs variés",
      "Résistants à l'eau",
      "Faciles à appliquer",
    ],
  },
  "sweatshirt-tenf": {
    id: "sweatshirt-tenf",
    name: "Sweatshirt TENF",
    price: 85.0,
    image: "https://placehold.co/800x800?text=Sweatshirt+TENF",
    description: "Affiche la New Family avec style et confort.",
    category: "vêtements",
    details: [
      "80% coton, 20% polyester",
      "Logo TENF brodé",
      "Taille disponible : S, M, L, XL, XXL",
      "Capuche avec cordons",
      "Poche kangourou",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Gris foncé", "Noir"],
  },
  "casquette-tenf": {
    id: "casquette-tenf",
    name: "Casquette TENF",
    price: 18.0,
    image: "https://placehold.co/800x800?text=Casquette+TENF",
    description: "Porte les couleurs TENF avec cette casquette stylée.",
    category: "accessoires",
    details: [
      "100% coton",
      "Logo TENF brodé",
      "Ajustable",
      "Visière courbée",
    ],
    colors: ["Noir", "Blanc"],
  },
  "pin-tenf": {
    id: "pin-tenf",
    name: "Pin's TENF",
    price: 8.0,
    image: "https://placehold.co/800x800?text=Pin+TENF",
    description: "Porte fièrement le pin's TENF.",
    category: "accessoires",
    details: [
      "Métal émaillé",
      "Logo TENF",
      "Fermoir sécurisé",
      "Taille : 2.5cm",
    ],
    colors: ["Rouge", "Blanc"],
  },
};

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const product = products[id];

  if (!product) {
    return (
      <main className="p-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-white mb-4">
              Produit non trouvé
            </h1>
            <Link
              href="/boutique"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              ← Retour à la boutique
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">
            Accueil
          </Link>
          <span>/</span>
          <Link href="/boutique" className="hover:text-white transition-colors">
            Boutique
          </Link>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image du produit */}
          <div className="aspect-square w-full bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Informations du produit */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {product.name}
              </h1>
              <p className="text-3xl font-bold text-purple-400 mb-4">
                €{product.price.toFixed(2)}
              </p>
              <p className="text-lg text-gray-300">{product.description}</p>
            </div>

            {/* Options du produit */}
            {product.sizes && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Taille
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className="px-4 py-2 border-2 border-gray-700 hover:border-purple-500 text-white rounded-lg transition-colors"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Couleur
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className="px-4 py-2 border-2 border-gray-700 hover:border-purple-500 text-white rounded-lg transition-colors"
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton d'achat */}
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors">
              Ajouter au panier
            </button>

            {/* Détails du produit */}
            {product.details && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Détails du produit
                </h3>
                <ul className="space-y-2">
                  {product.details.map((detail, index) => (
                    <li key={index} className="text-gray-300 flex items-start">
                      <span className="text-purple-400 mr-2">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Catégorie */}
            <div>
              <span className="text-sm text-gray-400">Catégorie: </span>
              <span className="text-sm text-purple-400 capitalize">
                {product.category}
              </span>
            </div>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="pt-8">
          <Link
            href="/boutique"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Retour à la boutique
          </Link>
        </div>
      </div>
    </main>
  );
}

