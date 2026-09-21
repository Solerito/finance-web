'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function GlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      // Atajo: 'N' para nueva transacción
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (pathname === '/') {
          document.getElementById('tx-importe')?.focus();
        } else {
          // Navegar al dashboard y añadir un hash para enfocarlo al cargar
          router.push('/#new-tx');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, pathname]);

  return null;
}
