import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(date))
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(price)
}

export function joursAvant(date: string): number {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function scoreCouleur(score: number): string {
  if (score >= 95) return 'text-green-700'
  if (score >= 85) return 'text-amber-600'
  return 'text-red-600'
}

export function scoreBarCouleur(score: number): string {
  if (score >= 95) return 'bg-green-500'
  if (score >= 85) return 'bg-amber-500'
  return 'bg-red-500'
}
