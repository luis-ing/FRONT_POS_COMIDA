"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import {
  Search, Plus, MoreHorizontal, Edit2, Trash2,
  Tag, Package, ChefHat, Loader2, ImagePlus, X,
} from "lucide-react"
import { Input }    from "@/components/ui/input"
import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Switch }   from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label }    from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast }    from "sonner"

import { buildMediaUrl } from "@/lib/media"
import { ProductImage }  from "@/components/ui/product-image"  // ← wrapper con unoptimized
import {
  getProductos, createProducto, updateProducto, desactivarProducto,
} from "@/services/producto_service"
import {
  getCategorias, createCategoria, updateCategoria, desactivarCategoria,
} from "@/services/categoria_service"
import type { ProductoResponse, CategoriaResponse } from "@/types/schemas"

// ─── Constantes ───────────────────────────────────────────────────────────────

const EMPTY_PRODUCT  = { nombre: "", descripcion: "", precio: "", idCategoria: "", requiereCoccion: true }
const EMPTY_CATEGORY = { nombre: "", descripcion: "", color: "#FBBF24" }
const COLOR_OPTIONS  = ["#FBBF24", "#34D399", "#A78BFA", "#F472B6", "#60A5FA", "#FB923C", "#EF4444", "#8B5CF6"]

// ─── ImagePicker ─────────────────────────────────────────────────────────────

interface ImagePickerProps {
  currentImageUrl?: string | null
  file: File | null
  onChange: (file: File | null) => void
}

function ImagePicker({ currentImageUrl, file, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Blob URL si el usuario seleccionó un archivo nuevo; URL autenticada si hay imagen guardada
  const previewSrc: string = file
    ? URL.createObjectURL(file)
    : buildMediaUrl(currentImageUrl)

  const isDefaultImage = !file && !currentImageUrl

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    if (!selected) return
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(selected.type)) {
      toast.error("Solo se permiten imágenes JPG, PNG, WEBP o GIF")
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5 MB")
      return
    }
    onChange(selected)
    e.target.value = ""
  }

  return (
    <div className="space-y-2">
      <Label>Imagen del producto</Label>
      <div
        className="group relative flex aspect-square w-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50"
        onClick={() => inputRef.current?.click()}
      >
        {!isDefaultImage ? (
          <>
            {/* Vista previa: blob local (sin red) o URL autenticada del backend */}
            <Image
              src={previewSrc}
              alt="Vista previa"
              fill
              className="object-cover"
              unoptimized   // SIEMPRE unoptimized aquí para evitar 401
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="text-sm font-medium text-white">Cambiar imagen</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus className="h-8 w-8" />
            <p className="text-sm">Haz clic para subir una imagen</p>
            <p className="text-xs">JPG, PNG, WEBP · máx. 5 MB</p>
          </div>
        )}
        {file && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(null) }}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
    </div>
  )
}

// ─── ProductsView ─────────────────────────────────────────────────────────────

export function ProductsView() {
  const [productos,   setProductos]   = useState<ProductoResponse[]>([])
  const [categorias,  setCategorias]  = useState<CategoriaResponse[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery,      setSearchQuery]      = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isProductDialogOpen,  setIsProductDialogOpen]  = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingProduct,  setEditingProduct]  = useState<ProductoResponse | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoriaResponse | null>(null)
  const [productForm,  setProductForm]  = useState(EMPTY_PRODUCT)
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY)
  const [submitting,   setSubmitting]   = useState(false)
  const [imagenFile,   setImagenFile]   = useState<File | null>(null)

  const fetchAll = useCallback(async () => {
    setLoadingData(true)
    try {
      const [prods, cats] = await Promise.all([getProductos(), getCategorias()])
      setProductos(prods)
      setCategorias(cats)
    } catch { toast.error("Error al cargar datos") }
    finally  { setLoadingData(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openNewProduct = () => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setImagenFile(null); setIsProductDialogOpen(true) }
  const openEditProduct = (p: ProductoResponse) => {
    setEditingProduct(p)
    setProductForm({ nombre: p.nombre, descripcion: p.descripcion ?? "", precio: String(p.precio), idCategoria: p.idCategoria ? String(p.idCategoria) : "", requiereCoccion: p.requiereCoccion })
    setImagenFile(null)
    setIsProductDialogOpen(true)
  }
  const handleProductDialogChange = (open: boolean) => { setIsProductDialogOpen(open); if (!open) setImagenFile(null) }

  const handleProductSubmit = async () => {
    if (!productForm.nombre || !productForm.precio) { toast.error("Nombre y precio son requeridos"); return }
    setSubmitting(true)
    try {
      const payload = { nombre: productForm.nombre, descripcion: productForm.descripcion || undefined, precio: parseFloat(productForm.precio), requiereCoccion: productForm.requiereCoccion, idCategoria: productForm.idCategoria ? parseInt(productForm.idCategoria) : undefined }
      if (editingProduct) {
        const updated = await updateProducto(editingProduct.id, payload, imagenFile)
        setProductos(prev => prev.map(p => p.id === updated.id ? updated : p))
        toast.success("Producto actualizado")
      } else {
        const created = await createProducto(payload, imagenFile)
        setProductos(prev => [...prev, created])
        toast.success("Producto creado")
      }
      setIsProductDialogOpen(false); setImagenFile(null)
    } catch { toast.error("Error al guardar el producto") }
    finally  { setSubmitting(false) }
  }

  const handleDesactivarProducto = async (id: number) => {
    try { await desactivarProducto(id); setProductos(prev => prev.map(p => p.id === id ? { ...p, activo: false } : p)); toast.success("Producto desactivado") }
    catch { toast.error("Error al desactivar el producto") }
  }

  const openNewCategory   = () => { setEditingCategory(null); setCategoryForm(EMPTY_CATEGORY); setIsCategoryDialogOpen(true) }
  const openEditCategory  = (c: CategoriaResponse) => { setEditingCategory(c); setCategoryForm({ nombre: c.nombre, descripcion: c.descripcion ?? "", color: c.color ?? "#FBBF24" }); setIsCategoryDialogOpen(true) }

  const handleCategorySubmit = async () => {
    if (!categoryForm.nombre) { toast.error("El nombre de la categoría es requerido"); return }
    setSubmitting(true)
    try {
      const payload = { nombre: categoryForm.nombre, descripcion: categoryForm.descripcion || undefined, color: categoryForm.color }
      if (editingCategory) { const u = await updateCategoria(editingCategory.id, payload); setCategorias(prev => prev.map(c => c.id === u.id ? u : c)); toast.success("Categoría actualizada") }
      else                 { const c = await createCategoria(payload); setCategorias(prev => [...prev, c]); toast.success("Categoría creada") }
      setIsCategoryDialogOpen(false)
    } catch { toast.error("Error al guardar la categoría") }
    finally  { setSubmitting(false) }
  }

  const handleDesactivarCategoria = async (id: number) => {
    try { await desactivarCategoria(id); setCategorias(prev => prev.map(c => c.id === id ? { ...c, activo: false } : c)); toast.success("Categoría desactivada") }
    catch (err: any) { toast.error(err?.response?.data?.detail ?? "Error al desactivar la categoría") }
  }

  const filteredProducts = productos.filter(p => {
    const matchesSearch   = p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.idCategoria?.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loadingData) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Productos y Categorías</h1>
        <p className="text-muted-foreground">Gestiona el catálogo de productos de tu negocio</p>
      </div>

      <Tabs defaultValue="products" className="flex-1 flex flex-col">
        <TabsList className="w-fit h-9 rounded-xl border-2 border-border bg-muted/50 p-1">
          <TabsTrigger value="products"   className="rounded-lg gap-2 h-7"><Package className="h-4 w-4" /> Productos</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg gap-2 h-7"><Tag     className="h-4 w-4" /> Categorías</TabsTrigger>
        </TabsList>

        {/* ══ PRODUCTOS ══ */}
        <TabsContent value="products" className="flex-1 flex flex-col mt-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar productos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-11 w-72 rounded-xl border-2 pl-12" />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-44 rounded-xl border-2"><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color ?? undefined }} />{cat.nombre}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isProductDialogOpen} onOpenChange={handleProductDialogChange}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2" onClick={openNewProduct}><Plus className="h-4 w-4" /> Nuevo producto</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-2 sm:max-w-lg">
                <DialogHeader><DialogTitle>{editingProduct ? "Editar producto" : "Crear nuevo producto"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <ImagePicker currentImageUrl={editingProduct?.imagenURL} file={imagenFile} onChange={setImagenFile} />
                  <div className="space-y-2">
                    <Label>Nombre del producto</Label>
                    <Input placeholder="Ej: Tacos al Pastor" value={productForm.nombre} onChange={e => setProductForm(f => ({ ...f, nombre: e.target.value }))} className="rounded-xl border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea placeholder="Describe el producto..." value={productForm.descripcion} onChange={e => setProductForm(f => ({ ...f, descripcion: e.target.value }))} className="rounded-xl border-2 resize-none" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio</Label>
                      <Input type="number" step="0.01" placeholder="0.00" value={productForm.precio} onChange={e => setProductForm(f => ({ ...f, precio: e.target.value }))} className="rounded-xl border-2" />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select value={productForm.idCategoria} onValueChange={v => setProductForm(f => ({ ...f, idCategoria: v }))}>
                        <SelectTrigger className="rounded-xl border-2"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">Sin categoría</SelectItem>
                          {categorias.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border-2 border-border p-4">
                    <div className="flex items-center gap-3">
                      <ChefHat className="h-5 w-5 text-muted-foreground" />
                      <div><p className="font-medium">Requiere cocción</p><p className="text-sm text-muted-foreground">El producto se enviará a cocina</p></div>
                    </div>
                    <Switch checked={productForm.requiereCoccion} onCheckedChange={v => setProductForm(f => ({ ...f, requiereCoccion: v }))} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-xl border-2" onClick={() => setIsProductDialogOpen(false)}>Cancelar</Button>
                    <Button className="flex-1 rounded-xl" onClick={handleProductSubmit} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingProduct ? "Guardar cambios" : "Crear producto"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[
              { label: "Total productos", value: productos.length },
              { label: "Activos",         value: productos.filter(p => p.activo).length },
              { label: "Con cocción",     value: productos.filter(p => p.requiereCoccion).length },
              { label: "Categorías",      value: categorias.length },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border-2 border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div className="flex-1 rounded-2xl border-2 border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border hover:bg-transparent">
                  <TableHead className="w-[56px]" />
                  <TableHead className="font-semibold">Producto</TableHead>
                  <TableHead className="font-semibold">Categoría</TableHead>
                  <TableHead className="font-semibold">Precio</TableHead>
                  <TableHead className="font-semibold">Cocción</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.id} className="border-b border-border/50 hover:bg-muted/50">
                    <TableCell className="py-2">
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-border">
                        {/* ProductImage usa unoptimized internamente → va directo al backend con ?token= */}
                        <ProductImage src={product.imagenURL} alt={product.nombre} fill className="object-cover" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.nombre}</p>
                        {product.descripcion && <p className="text-sm text-muted-foreground line-clamp-1">{product.descripcion}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.categoria ? (
                        <Badge variant="outline" className="rounded-lg border-2" style={{ borderColor: product.categoria.color ?? undefined, backgroundColor: `${product.categoria.color}20`, color: product.categoria.color ?? undefined }}>
                          {product.categoria.nombre}
                        </Badge>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="font-medium">${Number(product.precio).toFixed(2)}</TableCell>
                    <TableCell>
                      {product.requiereCoccion ? (
                        <Badge variant="outline" className="rounded-lg border-2 border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          <ChefHat className="mr-1 h-3 w-3" /> Sí
                        </Badge>
                      ) : <span className="text-muted-foreground">No</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.activo ? "default" : "outline"} className="rounded-lg">
                        {product.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEditProduct(product)}><Edit2 className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDesactivarProducto(product.id)} disabled={!product.activo}>
                            <Trash2 className="mr-2 h-4 w-4" /> Desactivar
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

        {/* ══ CATEGORÍAS ══ */}
        <TabsContent value="categories" className="flex-1 flex flex-col mt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar categorías..." className="h-11 w-72 rounded-xl border-2 pl-12" />
            </div>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2" onClick={openNewCategory}><Plus className="h-4 w-4" /> Nueva categoría</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-2 sm:max-w-md">
                <DialogHeader><DialogTitle>{editingCategory ? "Editar categoría" : "Crear nueva categoría"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input placeholder="Ej: Postres" value={categoryForm.nombre} onChange={e => setCategoryForm(f => ({ ...f, nombre: e.target.value }))} className="rounded-xl border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea placeholder="Describe la categoría..." value={categoryForm.descripcion} onChange={e => setCategoryForm(f => ({ ...f, descripcion: e.target.value }))} className="rounded-xl border-2 resize-none" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map(color => (
                        <button key={color} type="button" onClick={() => setCategoryForm(f => ({ ...f, color }))}
                          className="h-10 w-10 rounded-xl border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          style={{ backgroundColor: color, borderColor: categoryForm.color === color ? "white" : "transparent", boxShadow: categoryForm.color === color ? `0 0 0 3px ${color}` : undefined }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-xl border-2" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
                    <Button className="flex-1 rounded-xl" onClick={handleCategorySubmit} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingCategory ? "Guardar cambios" : "Crear categoría"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categorias.map(category => (
              <div key={category.id} className="group relative rounded-2xl border-2 border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="absolute right-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => openEditCategory(category)}><Edit2 className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDesactivarCategoria(category.id)} disabled={!category.activo}>
                        <Trash2 className="mr-2 h-4 w-4" /> Desactivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mb-4 h-14 w-14 rounded-xl" style={{ backgroundColor: category.color ?? undefined }} />
                <h3 className="font-semibold text-foreground">{category.nombre}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{category.descripcion || "Sin descripción"}</p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="outline" className="rounded-lg border-2">{productos.filter(p => p.idCategoria === category.id).length} productos</Badge>
                  <Badge variant={category.activo ? "default" : "outline"} className="rounded-lg">{category.activo ? "Activa" : "Inactiva"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}