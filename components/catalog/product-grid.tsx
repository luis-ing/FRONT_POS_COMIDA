"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProductImage } from "@/components/ui/product-image"  // ← wrapper con unoptimized
import type { CartItem } from "./catalog-view"

interface Product {
  id: number
  name: string
  price: number
  image: string | null   // imagenURL relativa del backend
  category: string
}

interface ProductGridProps {
  products: Product[]
  viewMode: "grid" | "list"
  onAddToCart: (product: Product) => void
  cartItems: CartItem[]
}

export function ProductGrid({ products, viewMode, onAddToCart, cartItems }: ProductGridProps) {
  const getCartQuantity = (productId: number) =>
    cartItems.find(item => item.id === productId)?.quantity || 0

  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {products.map(product => {
          const quantity = getCartQuantity(product.id)
          return (
            <div key={product.id} className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 transition-all hover:border-primary/30">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                {/* ProductImage → unoptimized → browser va directo al backend con ?token= */}
                <ProductImage src={product.image} alt={product.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{product.name}</h4>
                <p className="text-sm text-muted-foreground truncate">{product.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-foreground">${product.price.toFixed(2)}</p>
                {quantity > 0 && <span className="text-xs text-primary">{quantity} en carrito</span>}
              </div>
              <Button size="icon" className="h-10 w-10 rounded-xl shrink-0" onClick={() => onAddToCart(product)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map(product => {
        const quantity = getCartQuantity(product.id)
        return (
          <div key={product.id} className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg">
            <div className="relative aspect-square overflow-hidden">
              <ProductImage src={product.image} alt={product.name} fill className="object-cover transition-transform group-hover:scale-105" />
              {quantity > 0 && (
                <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
                  {quantity}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h4 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h4>
              <div className="mt-auto flex items-center justify-between pt-2">
                <p className="font-semibold text-foreground">${product.price.toFixed(2)}</p>
                <Button
                  size="icon" variant="outline"
                  className={cn("h-8 w-8 rounded-lg border-2 transition-all", quantity > 0 && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}
                  onClick={() => onAddToCart(product)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}