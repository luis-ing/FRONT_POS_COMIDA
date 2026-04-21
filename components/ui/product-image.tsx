import Image, { type ImageProps } from "next/image"
import { buildMediaUrl } from "@/lib/media"
 
type ProductImageProps = Omit<ImageProps, "src"> & {
  /**
   * imagenURL relativa del backend (ej: "cafe_delicia/productos/abc.jpg")
   * o null/undefined para mostrar la imagen por defecto.
   */
  src: string | null | undefined
}
 
export function ProductImage({ src, alt, className, ...props }: ProductImageProps) {
  return (
    <Image
      src={buildMediaUrl(src)}   // construye URL con ?token= incluido
      alt={alt}
      className={className}
      unoptimized                // CRÍTICO: evita que Next.js intercepte la petición
      {...props}
    />
  )
}