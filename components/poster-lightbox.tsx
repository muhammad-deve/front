"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { X, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface PosterLightboxProps {
    src: string
    alt: string
    className?: string
    children?: React.ReactNode
    width?: number
    height?: number
}

export function PosterLightbox({
    src,
    alt,
    className,
    children,
    width = 300,
    height = 450,
}: PosterLightboxProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isZoomed, setIsZoomed] = useState(false)

    const handleClose = useCallback(() => {
        setIsOpen(false)
        setIsZoomed(false)
    }, [])

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose()
        },
        [handleClose]
    )

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown)
            document.body.style.overflow = "hidden"
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = ""
        }
    }, [isOpen, handleKeyDown])

    return (
        <>
            {/* Clickable Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={cn(
                    "relative cursor-zoom-in group block",
                    className
                )}
                aria-label={`View ${alt} in fullscreen`}
            >
                {children || (
                    <Image
                        src={src}
                        alt={alt}
                        width={width}
                        height={height}
                        className="w-full h-full object-cover"
                    />
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </button>

            {/* Lightbox Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Fullscreen view of ${alt}`}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={handleClose}
                    />

                    {/* Controls */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsZoomed(!isZoomed)}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                        >
                            {isZoomed ? (
                                <ZoomOut className="w-5 h-5" />
                            ) : (
                                <ZoomIn className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            aria-label="Close fullscreen view"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Image Container */}
                    <div
                        className={cn(
                            "relative z-10 animate-in zoom-in-95 fade-in duration-200 max-w-[90vw] max-h-[90vh]",
                            isZoomed && "cursor-zoom-out"
                        )}
                        onClick={isZoomed ? () => setIsZoomed(false) : undefined}
                    >
                        <Image
                            src={src}
                            alt={alt}
                            width={isZoomed ? 1200 : 600}
                            height={isZoomed ? 1800 : 900}
                            className={cn(
                                "object-contain max-h-[90vh] w-auto transition-transform duration-300",
                                isZoomed ? "scale-100" : "scale-100"
                            )}
                            priority
                        />
                    </div>

                    {/* Caption */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                        <p className="text-white/70 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                            {alt}
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}
