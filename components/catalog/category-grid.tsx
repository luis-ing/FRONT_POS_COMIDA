"use client"

import { cn } from "@/lib/utils"

interface Category {
  id: number
  name: string
  count: number
  color: string
}

interface CategoryGridProps {
  categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
      {categories.map((category) => (
        <button
          key={category.id}
          className={cn(
            "group relative flex flex-col items-start justify-between rounded-2xl border-2 border-transparent p-4 text-left transition-all hover:border-primary/20 hover:shadow-md",
            category.color
          )}
          style={{ borderColor: `${category.color}80`, backgroundColor: `${category.color}20` }} // Agrega un fondo con opacidad
        >
          <span className="text-sm font-semibold text-foreground">
            {category.name}
          </span>
          <span className="mt-2 text-xs text-muted-foreground">
            {category.count} productos
          </span>
        </button>
      ))}
    </div>
  )
}
