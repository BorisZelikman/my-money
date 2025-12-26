/**
 * Maps purpose icon text from database to actual emoji icons
 */
const iconMap: Record<string, string> = {
  // Shopping / Groceries
  'bin': '🛒',
  'basket': '🛒',
  'cart': '🛒',
  'shop': '🛍️',
  'shopping': '🛍️',
  'groceries': '🛒',
  'покупки': '🛒',
  
  // Home
  'home': '🏠',
  'house': '🏠',
  'дом': '🏠',
  
  // Food
  'food': '🍽️',
  'еда': '🍽️',
  'restaurant': '🍴',
  'ресторан': '🍴',
  
  // Transport
  'car': '🚗',
  'auto': '🚗',
  'машина': '🚗',
  'transport': '🚌',
  'транспорт': '🚌',
  'fuel': '⛽',
  'бензин': '⛽',
  
  // Utilities
  'electricity': '💡',
  'electric': '💡',
  'электричество': '💡',
  'water': '💧',
  'вода': '💧',
  'gas': '🔥',
  'газ': '🔥',
  
  // Health
  'health': '🏥',
  'medical': '🏥',
  'здоровье': '🏥',
  'medicine': '💊',
  'лекарства': '💊',
  
  // Entertainment
  'entertainment': '🎬',
  'развлечения': '🎬',
  'movie': '🎬',
  'кино': '🎬',
  
  // Communication
  'phone': '📱',
  'телефон': '📱',
  'internet': '🌐',
  'интернет': '🌐',
  
  // Kids
  'kids': '👶',
  'children': '👶',
  'дети': '👶',
  
  // Pets
  'pets': '🐾',
  'животные': '🐾',
  
  // Education
  'education': '📚',
  'образование': '📚',
  
  // Gifts
  'gift': '🎁',
  'present': '🎁',
  'подарок': '🎁',
  
  // Default
  'default': '📋',
  'other': '📋',
  'другое': '📋',
}

/**
 * Converts a purpose icon text to an emoji
 * If the text is already an emoji, returns it as-is
 * If the text is a known keyword, returns the mapped emoji
 * Otherwise returns a default icon
 */
export function getPurposeIcon(iconText: string | undefined): string {
  if (!iconText) return '🤝'
  
  // Check if it's already an emoji (starts with a high unicode character)
  const firstChar = iconText.codePointAt(0) || 0
  if (firstChar > 0x1F000) {
    return iconText.split(' ')[0] // Return just the emoji part
  }
  
  // Try to find a mapping (case-insensitive)
  const lowerText = iconText.toLowerCase().trim()
  
  // Check exact match first
  if (iconMap[lowerText]) {
    return iconMap[lowerText]
  }
  
  // Check if any key is contained in the text
  for (const [key, emoji] of Object.entries(iconMap)) {
    if (lowerText.includes(key) || key.includes(lowerText)) {
      return emoji
    }
  }
  
  // Default icon
  return '🤝'
}

