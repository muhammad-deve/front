"use client"

import { useEffect, useState, useRef } from "react"

interface AnimatedCounterProps {
    value: number
    duration?: number
    suffix?: string
    prefix?: string
}

export function AnimatedCounter({ value, duration = 2000, suffix = "", prefix = "" }: AnimatedCounterProps) {
    const [count, setCount] = useState(0)
    const countRef = useRef(0)
    const startTimeRef = useRef<number | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const elementRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )

        if (elementRef.current) {
            observer.observe(elementRef.current)
        }

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!isVisible) return

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp
            const progress = timestamp - startTimeRef.current

            // Easing function for smooth deceleration (easeOutQuart)
            const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

            const percentage = Math.min(progress / duration, 1)
            const currentCount = Math.floor(easeOut(percentage) * value)

            if (currentCount !== countRef.current) {
                countRef.current = currentCount
                setCount(currentCount)
            }

            if (progress < duration) {
                requestAnimationFrame(animate)
            } else {
                setCount(value)
            }
        }

        requestAnimationFrame(animate)
    }, [value, duration, isVisible])

    return (
        <span ref={elementRef}>
            {prefix}
            {count.toLocaleString()}
            {suffix}
        </span>
    )
}
