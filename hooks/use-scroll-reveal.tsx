'use client';

import { type CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

export type RevealVariant =
    | 'fade-up'
    | 'fade-down'
    | 'fade-left'
    | 'fade-right'
    | 'zoom-in'
    | 'flip-up';

interface RevealProps {
    children: ReactNode;
    variant?: RevealVariant;
    delay?: number;
    duration?: number;
    threshold?: number;
    className?: string;
    once?: boolean;
}

const HIDDEN_STYLES: Record<RevealVariant, CSSProperties> = {
    'fade-up': { opacity: 0, transform: 'translateY(40px)' },
    'fade-down': { opacity: 0, transform: 'translateY(-40px)' },
    'fade-left': { opacity: 0, transform: 'translateX(40px)' },
    'fade-right': { opacity: 0, transform: 'translateX(-40px)' },
    'zoom-in': { opacity: 0, transform: 'scale(0.88)' },
    'flip-up': { opacity: 0, transform: 'perspective(600px) rotateX(18deg) translateY(30px)' },
};

const VISIBLE_STYLES: CSSProperties = { opacity: 1, transform: 'none' };

export function ScrollReveal({
    children,
    variant = 'fade-up',
    delay = 0,
    duration = 900,
    threshold = 0.15,
    className = '',
    once = true,
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    if (once) observer.disconnect();
                } else if (!once) {
                    setVisible(false);
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, once]);

    const style: CSSProperties = {
        ...(visible ? VISIBLE_STYLES : HIDDEN_STYLES[variant]),
        transition: `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms,
                 transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
    };

    return (
        <div ref={ref} style={style} className={className} >
            {children}
        </div>
    );
}

interface StaggerProps {
    children: ReactNode[];
    variant?: RevealVariant;
    baseDelay?: number;
    staggerDelay?: number;
    duration?: number;
    threshold?: number;
    className?: string;
    itemClassName?: string;
}

export function Stagger({
    children,
    variant = 'fade-up',
    baseDelay = 0,
    staggerDelay = 80,
    duration = 800,
    threshold = 0.1,
    className = '',
    itemClassName = '',
}: StaggerProps) {
    return (
        <div className={className} >
            {(Array.isArray(children) ? children : [children]).map((child, i) => (
                <ScrollReveal
                    key={i}
                    variant={variant}
                    delay={baseDelay + i * staggerDelay}
                    duration={duration}
                    threshold={threshold}
                    className={itemClassName}
                >
                    {child}
                </ScrollReveal>
            ))}
        </div>
    );
}