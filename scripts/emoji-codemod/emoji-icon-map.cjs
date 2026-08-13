'use strict';

/**
 * Table de correspondance emoji -> icône lucide-react.
 * Générée par analyse du repo choubebebakon/depot-saas (scan de 2230 occurrences,
 * 205 emojis distincts) puis validée contre les exports réels de lucide-react.
 *
 * Chaque nom ci-dessous a été vérifié comme export existant de lucide-react
 * (require('lucide-react/dist/cjs/lucide-react.js')) au moment de la génération.
 * Le codemod revalide quand même dynamiquement contre TA version installée
 * (voir replace-emojis.cjs) : un nom absent de ta version est ignoré proprement
 * (pas d'import cassé), et signalé dans le rapport.
 *
 * ~25 emojis très rares (1 occurrence, drapeaux, symboles ambigus) ne sont
 * volontairement PAS mappés ici : ils seront listés dans le rapport pour
 * une décision manuelle plutôt qu'un choix arbitraire.
 */

module.exports = new Map([
  ['✏', 'Pencil'], // U+270F ×229 occurrences
  ['🗑', 'Trash2'], // U+1F5D1 ×148 occurrences
  ['→', 'ArrowRight'], // U+2192 ×138 occurrences
  ['🔍', 'Search'], // U+1F50D ×105 occurrences
  ['💰', 'Coins'], // U+1F4B0 ×91 occurrences
  ['⚠', 'AlertTriangle'], // U+26A0 ×85 occurrences
  ['✅', 'CheckCircle2'], // U+2705 ×79 occurrences
  ['📦', 'Package'], // U+1F4E6 ×63 occurrences
  ['📊', 'BarChart3'], // U+1F4CA ×48 occurrences
  ['📋', 'ClipboardList'], // U+1F4CB ×47 occurrences
  ['➕', 'Plus'], // U+2795 ×41 occurrences
  ['⚙', 'Settings'], // U+2699 ×36 occurrences
  ['📅', 'Calendar'], // U+1F4C5 ×35 occurrences
  ['✕', 'X'], // U+2715 ×33 occurrences
  ['📈', 'TrendingUp'], // U+1F4C8 ×32 occurrences
  ['👤', 'User'], // U+1F464 ×32 occurrences
  ['🏷', 'Tag'], // U+1F3F7 ×29 occurrences
  ['📁', 'Folder'], // U+1F4C1 ×27 occurrences
  ['✓', 'Check'], // U+2713 ×26 occurrences
  ['📱', 'Smartphone'], // U+1F4F1 ×25 occurrences
  ['💾', 'Save'], // U+1F4BE ×25 occurrences
  ['🔧', 'Wrench'], // U+1F527 ×25 occurrences
  ['💸', 'HandCoins'], // U+1F4B8 ×21 occurrences
  ['🚀', 'Rocket'], // U+1F680 ×21 occurrences
  ['⏳', 'Hourglass'], // U+23F3 ×19 occurrences
  ['🏧', 'Landmark'], // U+1F3E7 ×17 occurrences
  ['🧾', 'Receipt'], // U+1F9FE ×17 occurrences
  ['🚚', 'Truck'], // U+1F69A ×15 occurrences
  ['💵', 'Banknote'], // U+1F4B5 ×15 occurrences
  ['👨', 'User'], // U+1F468 ×15 occurrences
  ['👥', 'Users'], // U+1F465 ×14 occurrences
  ['✨', 'Sparkles'], // U+2728 ×14 occurrences
  ['🔄', 'RefreshCw'], // U+1F504 ×14 occurrences
  ['❌', 'XCircle'], // U+274C ×14 occurrences
  ['🛠', 'Hammer'], // U+1F6E0 ×14 occurrences
  ['🚛', 'Truck'], // U+1F69B ×13 occurrences
  ['🔥', 'Flame'], // U+1F525 ×13 occurrences
  ['↓', 'ArrowDown'], // U+2193 ×13 occurrences
  ['🏪', 'Store'], // U+1F3EA ×12 occurrences
  ['🍦', 'IceCreamCone'], // U+1F366 ×12 occurrences
  ['🏗', 'HardHat'], // U+1F3D7 ×12 occurrences
  ['🍽', 'UtensilsCrossed'], // U+1F37D ×12 occurrences
  ['📝', 'FileText'], // U+1F4DD ×12 occurrences
  ['💳', 'CreditCard'], // U+1F4B3 ×12 occurrences
  ['🔒', 'Lock'], // U+1F512 ×11 occurrences
  ['📥', 'ArrowDownToLine'], // U+1F4E5 ×11 occurrences
  ['📤', 'ArrowUpFromLine'], // U+1F4E4 ×11 occurrences
  ['🏭', 'Factory'], // U+1F3ED ×11 occurrences
  ['👈', 'ArrowLeft'], // U+1F448 ×11 occurrences
  ['💊', 'Pill'], // U+1F48A ×10 occurrences
  ['🏢', 'Building2'], // U+1F3E2 ×10 occurrences
  ['💇', 'Scissors'], // U+1F487 ×10 occurrences
  ['🛺', 'Car'], // U+1F6FA ×10 occurrences
  ['📄', 'File'], // U+1F4C4 ×10 occurrences
  ['🛒', 'ShoppingCart'], // U+1F6D2 ×9 occurrences
  ['📚', 'BookOpen'], // U+1F4DA ×9 occurrences
  ['🥖', 'Croissant'], // U+1F956 ×9 occurrences
  ['🔴', 'Circle'], // U+1F534 ×9 occurrences
  ['🍺', 'Beer'], // U+1F37A ×9 occurrences
  ['🩺', 'Stethoscope'], // U+1FA7A ×9 occurrences
  ['🏠', 'Home'], // U+1F3E0 ×9 occurrences
  ['🏆', 'Trophy'], // U+1F3C6 ×8 occurrences
  ['🧴', 'SprayCan'], // U+1F9F4 ×8 occurrences
  ['←', 'ArrowLeft'], // U+2190 ×8 occurrences
  ['⏭', 'SkipForward'], // U+23ED ×8 occurrences
  ['🚗', 'Car'], // U+1F697 ×7 occurrences
  ['🥤', 'CupSoda'], // U+1F964 ×7 occurrences
  ['🛏', 'BedDouble'], // U+1F6CF ×7 occurrences
  ['⏰', 'AlarmClock'], // U+23F0 ×7 occurrences
  ['🐄', 'Beef'], // U+1F404 ×7 occurrences
  ['💼', 'Briefcase'], // U+1F4BC ×6 occurrences
  ['🧼', 'Droplet'], // U+1F9FC ×6 occurrences
  ['🚨', 'Siren'], // U+1F6A8 ×6 occurrences
  ['⛽', 'Fuel'], // U+26FD ×6 occurrences
  ['🏨', 'Hotel'], // U+1F3E8 ×5 occurrences
  ['🌾', 'Wheat'], // U+1F33E ×5 occurrences
  ['🎨', 'Palette'], // U+1F3A8 ×5 occurrences
  ['🟡', 'Circle'], // U+1F7E1 ×5 occurrences
  ['📖', 'BookOpen'], // U+1F4D6 ×5 occurrences
  ['💧', 'Droplet'], // U+1F4A7 ×5 occurrences
  ['📍', 'MapPin'], // U+1F4CD ×4 occurrences
  ['🖨', 'Printer'], // U+1F5A8 ×4 occurrences
  ['🟢', 'Circle'], // U+1F7E2 ×4 occurrences
  ['🏥', 'Building2'], // U+1F3E5 ×4 occurrences
  ['💅', 'Sparkles'], // U+1F485 ×4 occurrences
  ['🎉', 'PartyPopper'], // U+1F389 ×4 occurrences
  ['🔩', 'Cog'], // U+1F529 ×4 occurrences
  ['🟠', 'Circle'], // U+1F7E0 ×4 occurrences
  ['👩', 'User'], // U+1F469 ×4 occurrences
  ['💉', 'Syringe'], // U+1F489 ×4 occurrences
  ['✖', 'X'], // U+2716 ×4 occurrences
  ['🔔', 'Bell'], // U+1F514 ×4 occurrences
  ['☠', 'Skull'], // U+2620 ×4 occurrences
  ['🚪', 'DoorOpen'], // U+1F6AA ×3 occurrences
  ['⚡', 'Zap'], // U+26A1 ×3 occurrences
  ['🍳', 'CookingPot'], // U+1F373 ×3 occurrences
  ['⭐', 'Star'], // U+2B50 ×3 occurrences
  ['🪑', 'Armchair'], // U+1FA91 ×3 occurrences
  ['🌸', 'Flower2'], // U+1F338 ×3 occurrences
  ['🔋', 'BatteryFull'], // U+1F50B ×3 occurrences
  ['🎁', 'Gift'], // U+1F381 ×3 occurrences
  ['📉', 'TrendingDown'], // U+1F4C9 ×3 occurrences
  ['💄', 'Sparkles'], // U+1F484 ×3 occurrences
  ['👋', 'Hand'], // U+1F44B ×3 occurrences
  ['🎯', 'Target'], // U+1F3AF ×3 occurrences
  ['📲', 'Smartphone'], // U+1F4F2 ×3 occurrences
  ['⏲', 'Timer'], // U+23F2 ×3 occurrences
  ['🧪', 'TestTube'], // U+1F9EA ×2 occurrences
  ['🧺', 'ShoppingBasket'], // U+1F9FA ×2 occurrences
  ['🧱', 'Box'], // U+1F9F1 ×2 occurrences
  ['🔐', 'KeyRound'], // U+1F510 ×2 occurrences
  ['🔓', 'Unlock'], // U+1F513 ×2 occurrences
  ['🌟', 'Star'], // U+1F31F ×2 occurrences
  ['👕', 'Shirt'], // U+1F455 ×2 occurrences
  ['👔', 'Shirt'], // U+1F454 ×2 occurrences
  ['🧹', 'Brush'], // U+1F9F9 ×2 occurrences
  ['🏡', 'Home'], // U+1F3E1 ×2 occurrences
  ['🥗', 'Salad'], // U+1F957 ×2 occurrences
  ['🍰', 'CakeSlice'], // U+1F370 ×2 occurrences
  ['🛍', 'ShoppingBag'], // U+1F6CD ×2 occurrences
  ['🌱', 'Sprout'], // U+1F331 ×2 occurrences
  ['🗂', 'FolderOpen'], // U+1F5C2 ×2 occurrences
  ['📞', 'Phone'], // U+1F4DE ×2 occurrences
  ['🎧', 'Headphones'], // U+1F3A7 ×2 occurrences
  ['🐣', 'Egg'], // U+1F423 ×2 occurrences
  ['⚖', 'Scale'], // U+2696 ×2 occurrences
  ['💎', 'Gem'], // U+1F48E ×2 occurrences
  ['💡', 'Lightbulb'], // U+1F4A1 ×2 occurrences
  ['🧃', 'CupSoda'], // U+1F9C3 ×2 occurrences
  ['📂', 'FolderOpen'], // U+1F4C2 ×2 occurrences
  ['↑', 'ArrowUp'], // U+2191 ×2 occurrences
  ['📧', 'Mail'], // U+1F4E7 ×2 occurrences
  ['🍔', 'Beef'], // U+1F354 ×1 occurrences
  ['🔨', 'Hammer'], // U+1F528 ×1 occurrences
  ['👗', 'Shirt'], // U+1F457 ×1 occurrences
  ['🤝', 'Handshake'], // U+1F91D ×1 occurrences
  ['⌛', 'Hourglass'], // U+231B ×1 occurrences
  ['🔀', 'Shuffle'], // U+1F500 ×1 occurrences
  ['🔢', 'Hash'], // U+1F522 ×1 occurrences
  ['🎫', 'Ticket'], // U+1F3AB ×1 occurrences
  ['🛎', 'BellRing'], // U+1F6CE ×1 occurrences
  ['🔵', 'Circle'], // U+1F535 ×1 occurrences
  ['🌳', 'TreePine'], // U+1F333 ×1 occurrences
  ['🍖', 'Beef'], // U+1F356 ×1 occurrences
  ['⚪', 'Circle'], // U+26AA ×1 occurrences
  ['✈', 'Plane'], // U+2708 ×1 occurrences
  ['📆', 'CalendarDays'], // U+1F4C6 ×1 occurrences
  ['🧬', 'Dna'], // U+1F9EC ×1 occurrences
  ['💀', 'Skull'], // U+1F480 ×1 occurrences
  ['📃', 'FileText'], // U+1F4C3 ×1 occurrences
  ['📷', 'Camera'], // U+1F4F7 ×1 occurrences
  ['🔗', 'Link'], // U+1F517 ×1 occurrences
  ['⛔', 'Ban'], // U+26D4 ×1 occurrences
  ['🤖', 'Bot'], // U+1F916 ×1 occurrences
  ['👁', 'Eye'], // U+1F441 ×1 occurrences
  ['💬', 'MessageCircle'], // U+1F4AC ×1 occurrences
  ['✉', 'Mail'], // U+2709 ×1 occurrences
  ['🧠', 'Brain'], // U+1F9E0 ×1 occurrences
  ['🍻', 'Beer'], // U+1F37B ×1 occurrences
  ['🍹', 'CupSoda'], // U+1F379 ×1 occurrences
  ['🍷', 'Wine'], // U+1F377 ×1 occurrences
  ['🥛', 'Milk'], // U+1F95B ×1 occurrences
  ['⚫', 'Circle'], // U+26AB ×1 occurrences
  ['🔑', 'Key'], // U+1F511 ×1 occurrences
  ['📡', 'Satellite'], // U+1F4E1 ×1 occurrences
  ['🚧', 'Construction'], // U+1F6A7 ×1 occurrences
  ['🌍', 'Globe'], // U+1F30D ×1 occurrences
  ['🎓', 'GraduationCap'], // U+1F393 ×1 occurrences
  ['💻', 'Laptop'], // U+1F4BB ×1 occurrences
  ['👑', 'Crown'], // U+1F451 ×1 occurrences
  ['⏸', 'Pause'], // U+23F8 ×1 occurrences
  ['🏘', 'Home'], // U+1F3D8 ×1 occurrences
  ['⏱', 'Timer'], // U+23F1 ×1 occurrences
  ['📏', 'Ruler'], // U+1F4CF ×1 occurrences
  ['🗺', 'Map'], // U+1F5FA ×1 occurrences
  ['🌡', 'Thermometer'], // U+1F321 ×1 occurrences
  ['🍞', 'Croissant'], // U+1F35E ×1 occurrences
  ['🌿', 'Leaf'], // U+1F33F ×1 occurrences
  ['👜', 'ShoppingBag'], // U+1F45C ×1 occurrences
  ['📐', 'Ruler'], // U+1F4D0 ×1 occurrences
  ['📰', 'Newspaper'], // U+1F4F0 ×1 occurrences
  ['🚫', 'Ban'], // U+1F6AB ×1 occurrences
  ['🛡', 'Shield'], // U+1F6E1 ×1 occurrences
  ['📸', 'Camera'], // U+1F4F8 ×1 occurrences
]);
