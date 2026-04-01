"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Tag,
  Package,
  ChefHat,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Types
interface Category {
  id: number
  nombre: string
  color: string
  descripcion: string | null
  activo: boolean
  productCount: number
}

interface Product {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  activo: boolean
  requiereCoccion: boolean
  idCategoria: number | null
  categoria: string | null
  categoriaColor: string | null
}

// Mock data
const categories: Category[] = [
  { id: 1, nombre: "Entradas", color: "#FBBF24", descripcion: "Platillos para comenzar", activo: true, productCount: 8 },
  { id: 2, nombre: "Sopas", color: "#34D399", descripcion: "Sopas y caldos", activo: true, productCount: 6 },
  { id: 3, nombre: "Ensaladas", color: "#A78BFA", descripcion: "Ensaladas frescas", activo: true, productCount: 5 },
  { id: 4, nombre: "Platillos", color: "#F472B6", descripcion: "Platillos principales", activo: true, productCount: 15 },
  { id: 5, nombre: "Bebidas", color: "#60A5FA", descripcion: "Bebidas y refrescos", activo: true, productCount: 21 },
  { id: 6, nombre: "Postres", color: "#FB923C", descripcion: "Postres y dulces", activo: true, productCount: 6 },
]

const products: Product[] = [
  { id: 1, nombre: "Tacos al Pastor", descripcion: "3 tacos con cebolla y cilantro", precio: 100.00, activo: true, requiereCoccion: true, idCategoria: 4, categoria: "Platillos", categoriaColor: "#F472B6" },
  { id: 2, nombre: "Chilaquiles Verdes", descripcion: "Con pollo, crema y queso", precio: 140.00, activo: true, requiereCoccion: true, idCategoria: 4, categoria: "Platillos", categoriaColor: "#F472B6" },
  { id: 3, nombre: "Cerveza Clara", descripcion: "Cerveza nacional 355ml", precio: 65.00, activo: true, requiereCoccion: false, idCategoria: 5, categoria: "Bebidas", categoriaColor: "#60A5FA" },
  { id: 4, nombre: "Ensalada César", descripcion: "Lechuga, crutones, parmesano", precio: 95.00, activo: true, requiereCoccion: false, idCategoria: 3, categoria: "Ensaladas", categoriaColor: "#A78BFA" },
  { id: 5, nombre: "Sopa Azteca", descripcion: "Sopa con tortilla, aguacate y queso", precio: 85.00, activo: true, requiereCoccion: true, idCategoria: 2, categoria: "Sopas", categoriaColor: "#34D399" },
  { id: 6, nombre: "Flan Napolitano", descripcion: "Flan casero con caramelo", precio: 55.00, activo: true, requiereCoccion: false, idCategoria: 6, categoria: "Postres", categoriaColor: "#FB923C" },
]

export function ProductsView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.idCategoria?.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Productos y Categorías</h1>
        <p className="text-muted-foreground">
          Gestiona el catálogo de productos de tu negocio
        </p>
      </div>

      <Tabs defaultValue="products" className="flex-1 flex flex-col">
        <TabsList className="w-fit rounded-xl border-2 border-border bg-muted/50 p-1">
          <TabsTrigger value="products" className="rounded-lg gap-2 data-[state=active]:bg-background">
            <Package className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg gap-2 data-[state=active]:bg-background">
            <Tag className="h-4 w-4" />
            Categorías
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="flex-1 flex flex-col mt-4">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-72 rounded-xl border-2 pl-12"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-44 rounded-xl border-2">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo producto
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-2 sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crear nuevo producto</DialogTitle>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Nombre del producto</Label>
                    <Input
                      id="productName"
                      placeholder="Ej: Tacos al Pastor"
                      className="rounded-xl border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productDesc">Descripción</Label>
                    <Textarea
                      id="productDesc"
                      placeholder="Describe el producto..."
                      className="rounded-xl border-2 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="productPrice">Precio</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="rounded-xl border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productCategory">Categoría</Label>
                      <Select>
                        <SelectTrigger className="rounded-xl border-2">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">Sin categoría</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border-2 border-border p-4">
                    <div className="flex items-center gap-3">
                      <ChefHat className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Requiere cocción</p>
                        <p className="text-sm text-muted-foreground">
                          El producto se enviará a la pantalla de cocina
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl border-2"
                      onClick={() => setIsProductDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1 rounded-xl">
                      Crear producto
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total productos</p>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold text-primary">
                {products.filter((p) => p.activo).length}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Con cocción</p>
              <p className="text-2xl font-bold text-foreground">
                {products.filter((p) => p.requiereCoccion).length}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Categorías</p>
              <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            </div>
          </div>

          {/* Products Table */}
          <div className="flex-1 rounded-2xl border-2 border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border hover:bg-transparent">
                  <TableHead className="font-semibold">Producto</TableHead>
                  <TableHead className="font-semibold">Categoría</TableHead>
                  <TableHead className="font-semibold">Precio</TableHead>
                  <TableHead className="font-semibold">Cocción</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.nombre}</p>
                        {product.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.descripcion}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.categoria ? (
                        <Badge
                          variant="outline"
                          className="rounded-lg border-2"
                          style={{
                            borderColor: product.categoriaColor || undefined,
                            backgroundColor: `${product.categoriaColor}20`,
                            color: product.categoriaColor || undefined,
                          }}
                        >
                          {product.categoria}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${product.precio.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {product.requiereCoccion ? (
                        <Badge variant="outline" className="rounded-lg border-2 border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          <ChefHat className="mr-1 h-3 w-3" />
                          Sí
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={product.activo} />
                        <span className={product.activo ? "text-primary" : "text-muted-foreground"}>
                          {product.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Desactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="flex-1 flex flex-col mt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar categorías..."
                className="h-11 w-72 rounded-xl border-2 pl-12"
              />
            </div>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva categoría
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-2 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear nueva categoría</DialogTitle>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="catName">Nombre</Label>
                    <Input
                      id="catName"
                      placeholder="Ej: Postres"
                      className="rounded-xl border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="catDesc">Descripción</Label>
                    <Textarea
                      id="catDesc"
                      placeholder="Describe la categoría..."
                      className="rounded-xl border-2 resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {["#FBBF24", "#34D399", "#A78BFA", "#F472B6", "#60A5FA", "#FB923C", "#EF4444", "#8B5CF6"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="h-10 w-10 rounded-xl border-2 border-border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl border-2"
                      onClick={() => setIsCategoryDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1 rounded-xl">
                      Crear categoría
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="group relative rounded-2xl border-2 border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="absolute right-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Desactivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div
                  className="mb-4 h-14 w-14 rounded-xl"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="font-semibold text-foreground">{category.nombre}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {category.descripcion || "Sin descripción"}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="outline" className="rounded-lg border-2">
                    {category.productCount} productos
                  </Badge>
                  <Switch checked={category.activo} />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
