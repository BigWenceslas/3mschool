// Mapping entre les valeurs d'affichage françaises et les valeurs de base de données
export const PAYMENT_METHODS = {
  // Base de données -> Affichage
  DB_TO_DISPLAY: {
    'cash': 'Espèces',
    'mobile': 'Mobile Money',
    'mobile_money': 'Mobile Money',
    'bank_transfer': 'Virement bancaire',
    'card': 'Carte bancaire', 
    'exempted': 'Exempté'
  },
  // Affichage -> Base de données
  DISPLAY_TO_DB: {
    'Espèces': 'cash',
    'Mobile Money': 'mobile_money',
    'Virement bancaire': 'bank_transfer',
    'Carte bancaire': 'card',
    'Exempté': 'exempted'
  }
} as const

// Options pour les dropdowns/selects
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'exempted', label: 'Exempté' }
]

// Fonction pour convertir valeur DB vers affichage
export function getPaymentMethodLabel(dbValue: string): string {
  return PAYMENT_METHODS.DB_TO_DISPLAY[dbValue as keyof typeof PAYMENT_METHODS.DB_TO_DISPLAY] || dbValue
}

// Fonction pour convertir valeur d'affichage vers DB
export function getPaymentMethodValue(displayLabel: string): string {
  return PAYMENT_METHODS.DISPLAY_TO_DB[displayLabel as keyof typeof PAYMENT_METHODS.DISPLAY_TO_DB] || displayLabel
}

// Types TypeScript
export type PaymentMethodDB = keyof typeof PAYMENT_METHODS.DB_TO_DISPLAY
export type PaymentMethodDisplay = keyof typeof PAYMENT_METHODS.DISPLAY_TO_DB