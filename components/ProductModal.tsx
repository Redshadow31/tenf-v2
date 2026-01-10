"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type ProductModalProps = {
  product: {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    buyUrl?: string;
    category?: {
      id: string;
      name: string;
      color: string;
    } | null;
  };
  isOpen: boolean;
  onClose: () => void;
};

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setCurrentImageIndex(0);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = product.images[currentImageIndex] || product.images[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            {product.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Images Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square w-full rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
                    Image non disponible
                  </div>
                )}
                
                {/* Navigation arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", color: "white" }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", color: "white" }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", color: "white" }}>
                    {currentImageIndex + 1} / {product.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Grid */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index ? "" : "opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        borderColor: currentImageIndex === index ? "var(--color-primary)" : "var(--color-border)",
                        borderWidth: currentImageIndex === index ? "3px" : "2px",
                        backgroundColor: "var(--color-surface)",
                        boxShadow: currentImageIndex === index ? "0 0 0 2px var(--color-primary)" : "none",
                      }}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - Miniature ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Category */}
              {product.category && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: product.category.color }} />
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    {product.category.name}
                  </span>
                </div>
              )}

              {/* Price */}
              <div>
                <div className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                  €{product.price.toFixed(2)}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  Description
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--color-text-secondary)" }}>
                  {product.description || "Aucune description disponible."}
                </p>
              </div>

              {/* Buy Button */}
              <div className="pt-4">
                <Link
                  href={`/boutique/${product.id}`}
                  className="block w-full text-center px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                  style={{ backgroundColor: "var(--color-primary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  Acheter maintenant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
