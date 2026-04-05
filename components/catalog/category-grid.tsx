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
  selectedCategoryId?: number | null
  onSelectCategory?: (categoryId: number) => void
}

export function CategoryGrid({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory?.(category.id)}
          className={cn(
            "group relative flex flex-col items-start justify-between rounded-2xl border-2 p-4 text-left transition-all",
            selectedCategoryId === category.id
              ? "border-primary shadow-md"
              : "border-transparent hover:border-primary/20 hover:shadow-md"
          )}
          style={{
            borderColor:
              selectedCategoryId === category.id ? undefined : `${category.color}80`,
            backgroundColor: `${category.color}20`,
          }}
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
