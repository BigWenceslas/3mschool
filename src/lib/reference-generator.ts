export function generatePaymentReference(type: 'course' | 'annual_registration', id?: string): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  switch (type) {
    case 'course':
      return `CRS-${timestamp}-${random}`
    case 'annual_registration':
      return `REG-${timestamp}-${random}`
    default:
      return `PAY-${timestamp}-${random}`
  }
}

export function generateUniqueReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `${timestamp}${random}`
}