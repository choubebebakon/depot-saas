# Rapport emoji -> icône lucide-react — occurrences à traiter manuellement

Total : **896 occurrences** dans **315 fichiers**.

Ces occurrences n'ont volontairement PAS été modifiées automatiquement : les mettre
dans un attribut, un objet de config, ou un argument de fonction casserait la syntaxe
(une chaîne de caractères JS ne peut pas contenir un composant React). Chaque ligne
ci-dessous indique l'icône suggérée — le remplacement demande d'adapter le code
consommateur au cas par cas (ex. transformer `icon: '💊'` + `{item.icon}` en
`icon: Pill` + `<item.icon />`).

## Répartition par catégorie

- **149** — Attribut JSX (title=, aria-label=, placeholder=... — impossible d'y mettre un composant)
- **474** — Chaîne dans un objet de config (icon: '...', label: '...')
- **273** — Autre (argument de fonction, toast/log, variable...)

## Détail par fichier (du plus impacté au moins impacté)

### frontend-depot/src/components/chatbot/GeStockChatbot.jsx (20)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 5 | 📦 | Package | config-string | `📦` |
| 6 | 🏪 | Store | config-string | `🏪` |
| 7 | 💊 | Pill | config-string | `💊` |
| 8 | 🍽 | UtensilsCrossed | config-string | `🍽` |
| 9 | 🏨 | Hotel | config-string | `🏨` |
| 10 | 🛠 | Hammer | config-string | `🛠` |
| 11 | 🛒 | ShoppingCart | config-string | `🛒` |
| 12 | 🔧 | Wrench | config-string | `🔧` |
| 13 | 🏥 | Building2 | config-string | `🏥` |
| 14 | 🚚 | Truck | config-string | `🚚` |
| 15 | 🏢 | Building2 | config-string | `🏢` |
| 17 | 🍞 | Croissant | config-string | `🍞` |
| 18 | 👔 | Shirt | config-string | `👔` |
| 19 | 💇 | Scissors | config-string | `💇` |
| 20 | 🧴 | SprayCan | config-string | `🧴` |
| 21 | 📚 | BookOpen | config-string | `📚` |
| 22 | 🍦 | IceCreamCone | config-string | `🍦` |
| 23 | 🧱 | Box | config-string | `🧱` |
| 26 | 🤖 | Bot | config-string | `🤖` |
| 120 | ⚠ | AlertTriangle | config-string | `⚠️ Service temporairement indisponible. Réessayez dans un moment.` |

### frontend-depot/src/pages/ConsignesPage.jsx (15)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 8 | 🍺 | Beer | config-string | `🍺` |
| 9 | 🍺 | Beer | config-string | `🍺` |
| 10 | 📦 | Package | config-string | `📦` |
| 11 | 🏗 | HardHat | config-string | `🏗️` |
| 12 | 💧 | Droplet | config-string | `💧` |
| 236 | 📦 | Package | other | `📦` |
| 301 | 💵 | Banknote | other | `💵 Rembourser` |
| 301 | 📋 | ClipboardList | other | `📋 Créer Avoir` |
| 423 | 🏭 | Factory | other | `🏭 Inventaire Vides` |
| 424 | ⚙ | Settings | other | `⚙️ Configuration` |
| 426 | 📋 | ClipboardList | other | `📋 Historique` |
| 458 | 📦 | Package | other | `📦` |
| 537 | 📦 | Package | other | `📦` |
| 605 | 📦 | Package | other | `📦` |
| 648 | 📦 | Package | other | `📦` |

### frontend-depot/src/modules/pharmacie/pages/DashboardPharmacie.jsx (14)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 125 | 💰 | Coins | config-string | `💰` |
| 126 | 📝 | FileText | config-string | `📝` |
| 127 | ⏰ | AlarmClock | config-string | `⏰` |
| 128 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 140 | 🔴 | Circle | other | `🔴 Expirés` |
| 140 | 🔴 | Circle | other | `🔴` |
| 141 | 🟠 | Circle | other | `🟠 < 7 jours` |
| 141 | 🟠 | Circle | other | `🟠` |
| 142 | 🟡 | Circle | other | `🟡 < 30 jours` |
| 142 | 🟡 | Circle | other | `🟡` |
| 175 | 💊 | Pill | config-string | `💊` |
| 176 | 📝 | FileText | config-string | `📝` |
| 177 | ⏰ | AlarmClock | config-string | `⏰` |
| 178 | 👤 | User | config-string | `👤` |

### frontend-depot/src/core/notifications/NotificationsPage.jsx (13)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 9 | 📦 | Package | config-string | `📦` |
| 9 | 💳 | CreditCard | config-string | `💳` |
| 9 | 📅 | Calendar | config-string | `📅` |
| 9 | 🏨 | Hotel | config-string | `🏨` |
| 10 | 📋 | ClipboardList | config-string | `📋` |
| 10 | 🚚 | Truck | config-string | `🚚` |
| 10 | 🔒 | Lock | config-string | `🔒` |
| 10 | 📅 | Calendar | config-string | `📅` |
| 11 | 🔧 | Wrench | config-string | `🔧` |
| 11 | ⚙ | Settings | config-string | `⚙️` |
| 11 | 🏪 | Store | config-string | `🏪` |
| 11 | 🤖 | Bot | config-string | `🤖` |
| 152 | 🔔 | Bell | other | `🔔` |

### frontend-depot/src/pages/CataloguePage.jsx (11)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 37 | 📦 | Package | config-string | `📦` |
| 38 | 🍺 | Beer | other | `🍺` |
| 38 | 🥤 | CupSoda | other | `🥤` |
| 38 | 💧 | Droplet | other | `💧` |
| 38 | 🧃 | CupSoda | other | `🧃` |
| 38 | 🍷 | Wine | other | `🍷` |
| 38 | 🥛 | Milk | other | `🥛` |
| 38 | 📦 | Package | other | `📦` |
| 278 | ✏ | Pencil | other | `✏️ Modifier` |
| 278 | ➕ | Plus | other | `➕ Créer` |
| 438 | 🔍 | Search | other | `🔍 Rechercher un article...` |

### frontend-depot/src/pages/SupermarcheLandingPage.jsx (10)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 679 | 💰 | Coins | config-string | `💰 Montant fixe` |
| 680 | 🏷 | Tag | config-string | `🏷️ Prix fixe` |
| 1014 | 👑 | Crown | config-string | `👑 Gérant` |
| 1015 | 📦 | Package | config-string | `📦 Magasinier` |
| 1016 | 💳 | CreditCard | config-string | `💳 Caissier` |
| 1017 | 📊 | BarChart3 | config-string | `📊 Comptable` |
| 1073 | 🧴 | SprayCan | other | `🧴 Hygiène` |
| 1074 | 📱 | Smartphone | other | `📱 Électronique` |
| 1075 | 🏠 | Home | other | `🏠 Bazar` |
| 1076 | 🥤 | CupSoda | other | `🥤 Liquide` |

### frontend-depot/src/modules/salon_beaute/forms/PrestationForm.jsx (10)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 81 | ✏ | Pencil | jsx-attribute | `✏️ Modifier prestation` |
| 81 | 💇 | Scissors | jsx-attribute | `💇 Nouvelle prestation` |
| 86 | 💇 | Scissors | config-string | `💇 Coiffure` |
| 86 | 🎨 | Palette | config-string | `🎨 Couleur` |
| 87 | ✨ | Sparkles | config-string | `✨ Mèches` |
| 88 | 🧴 | SprayCan | config-string | `🧴 Soin` |
| 88 | 💄 | Sparkles | config-string | `💄 Beauté` |
| 89 | 💅 | Sparkles | config-string | `💅 Onglerie` |
| 95 | ✅ | CheckCircle2 | jsx-attribute | `✅ Disponible` |
| 95 | ❌ | XCircle | jsx-attribute | `❌ Indisponible` |

### frontend-depot/src/modules/supermarche/pages/DashboardSupermarche.jsx (10)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 131 | 🏷 | Tag | other | `🏷️` |
| 131 | 🚚 | Truck | other | `🚚` |
| 139 | 💰 | Coins | other | `💰` |
| 140 | 🧾 | Receipt | other | `🧾` |
| 141 | ⚠ | AlertTriangle | other | `⚠️` |
| 142 | 🏷 | Tag | other | `🏷️` |
| 218 | 📦 | Package | config-string | `📦` |
| 219 | 🏷 | Tag | config-string | `🏷️` |
| 220 | 📊 | BarChart3 | config-string | `📊` |
| 221 | 💸 | HandCoins | config-string | `💸` |

### frontend-depot/src/pages/DlcPage.jsx (9)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 9 | ✅ | CheckCircle2 | config-string | `✅ OK` |
| 10 | ⚠ | AlertTriangle | config-string | `⚠️ Attention` |
| 11 | 🔥 | Flame | config-string | `🔥 Urgent` |
| 12 | ☠ | Skull | config-string | `☠️ Expiré` |
| 282 | ✅ | CheckCircle2 | config-string | `✅ OK` |
| 283 | ⚠ | AlertTriangle | config-string | `⚠️ Attention` |
| 284 | 🔥 | Flame | config-string | `🔥 Urgent` |
| 285 | ☠ | Skull | config-string | `☠️ Expirés` |
| 388 | 📦 | Package | other | `📦` |

### frontend-depot/src/pages/MaintenancePage.jsx (9)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 8 | ⚫ | Circle | config-string | `⚫` |
| 9 | 🔴 | Circle | config-string | `🔴` |
| 10 | ⛽ | Fuel | config-string | `⛽` |
| 11 | 🛠 | Hammer | config-string | `🛠️` |
| 12 | 🔍 | Search | config-string | `🔍` |
| 13 | 📝 | FileText | config-string | `📝` |
| 394 | 📊 | BarChart3 | other | `📊 Tableau de bord` |
| 515 | 🚨 | Siren | other | `🚨 En retard` |
| 515 | 📅 | Calendar | other | `📅 Planifiée` |

### frontend-depot/src/modules/elevage/forms/EvenementElevageForm.jsx (9)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier événement` |
| 85 | 📅 | Calendar | jsx-attribute | `📅 Nouvel événement` |
| 90 | 🐣 | Egg | config-string | `🐣 Naissance` |
| 90 | 💰 | Coins | config-string | `💰 Achat` |
| 91 | 💵 | Banknote | config-string | `💵 Vente` |
| 91 | 💀 | Skull | config-string | `💀 Mortalité` |
| 92 | 💉 | Syringe | config-string | `💉 Vaccination` |
| 92 | 🏥 | Building2 | config-string | `🏥 Traitement` |
| 93 | ⚖ | Scale | config-string | `⚖️ Pesée` |

### frontend-depot/src/modules/immobilier/forms/BienImmobilierForm.jsx (9)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 81 | ✏ | Pencil | jsx-attribute | `✏️ Modifier bien` |
| 81 | 🏠 | Home | jsx-attribute | `🏠 Nouveau bien` |
| 84 | 🏢 | Building2 | config-string | `🏢 Appartement` |
| 84 | 🏠 | Home | config-string | `🏠 Maison` |
| 85 | 🏡 | Home | config-string | `🏡 Villa` |
| 85 | 🏪 | Store | config-string | `🏪 Local commercial` |
| 86 | 🏢 | Building2 | config-string | `🏢 Bureau` |
| 86 | 📦 | Package | config-string | `📦 Entrepôt` |
| 87 | 🌳 | TreePine | config-string | `🌳 Terrain` |

### backend-depot/src/core/notifications/channels/email.channel.ts (9)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 82 | ⚠ | AlertTriangle | config-string | `⚠️ Stock critique — Action requise` |
| 83 | 🚫 | Ban | config-string | `🚫 Rupture de stock détectée` |
| 84 | 📅 | Calendar | config-string | `📅 Produits proches de l'expiration` |
| 85 | ✅ | CheckCircle2 | config-string | `✅ Paiement confirmé` |
| 86 | ❌ | XCircle | config-string | `❌ Paiement échoué` |
| 87 | ⏰ | AlarmClock | config-string | `⏰ Votre abonnement expire dans 7 jours` |
| 88 | ⚠ | AlertTriangle | config-string | `⚠️ Votre abonnement expire dans 3 jours` |
| 89 | 🚨 | Siren | config-string | `🚨 Dernier jour — Abonnement expire demain` |
| 90 | 📊 | BarChart3 | config-string | `📊 Votre rapport journalier GeStock` |

### frontend-depot/src/shared/forms/MouvementStockForm.jsx (8)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 64 | ✏ | Pencil | jsx-attribute | `✏️ Modifier mouvement` |
| 64 | 📦 | Package | jsx-attribute | `📦 Mouvement de stock` |
| 64 | 💾 | Save | other | `💾` |
| 75 | 📥 | ArrowDownToLine | other | `📥 Entrée` |
| 75 | 📤 | ArrowUpFromLine | other | `📤 Sortie` |
| 75 | ⚖ | Scale | other | `⚖️ Ajustement` |
| 75 | 🔄 | RefreshCw | other | `🔄 Transfert` |
| 75 | 📋 | ClipboardList | other | `📋 Inventaire` |

### frontend-depot/src/modules/restaurant/forms/PlatForm.jsx (8)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier plat` |
| 85 | 🍽 | UtensilsCrossed | jsx-attribute | `🍽️ Nouveau plat` |
| 90 | 🥗 | Salad | config-string | `🥗 Entrée` |
| 91 | 🍰 | CakeSlice | config-string | `🍰 Dessert` |
| 91 | 🥤 | CupSoda | config-string | `🥤 Boisson` |
| 92 | ⭐ | Star | config-string | `⭐ Spécialité` |
| 98 | ✅ | CheckCircle2 | jsx-attribute | `✅ Disponible` |
| 98 | ❌ | XCircle | jsx-attribute | `❌ Indisponible` |

### frontend-depot/src/pages/CaissePage.jsx (7)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 351 | 💵 | Banknote | config-string | `💵` |
| 352 | 📱 | Smartphone | config-string | `📱` |
| 353 | 📲 | Smartphone | config-string | `📲` |
| 354 | 💸 | HandCoins | config-string | `💸` |
| 380 | 📊 | BarChart3 | other | `📊 Résumé` |
| 380 | 💸 | HandCoins | other | `💸 Dépenses` |
| 380 | 📋 | ClipboardList | other | `📋 Historique` |

### frontend-depot/src/pages/TourneesPage.jsx (7)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 10 | ⏳ | Hourglass | config-string | `⏳ Attente Magasinier` |
| 11 | ✅ | CheckCircle2 | config-string | `✅ Validée` |
| 12 | ✖ | X | config-string | `✖ Annulée` |
| 396 | 💵 | Banknote | config-string | `💵 Cash remis (FCFA)` |
| 397 | 📱 | Smartphone | config-string | `📱 Orange Money remis (FCFA)` |
| 398 | 📲 | Smartphone | config-string | `📲 MTN MoMo remis (FCFA)` |
| 678 | 📋 | ClipboardList | other | `📋 Historique` |

### frontend-depot/src/modules/boutique/pages/CategoriesPage.jsx (7)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 10 | 🌸 | Flower2 | config-string | `🌸` |
| 11 | 📚 | BookOpen | config-string | `📚` |
| 12 | 📱 | Smartphone | config-string | `📱` |
| 13 | 💅 | Sparkles | config-string | `💅` |
| 14 | 🍦 | IceCreamCone | config-string | `🍦` |
| 103 | 🔍 | Search | other | `🔍 Rechercher une catégorie...` |
| 134 | 🏷 | Tag | other | `🏷️` |

### frontend-depot/src/modules/depot-boissons/forms/VenteBoissonsForm.jsx (7)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 157 | ✏ | Pencil | jsx-attribute | `✏️ Modifier vente` |
| 157 | 💰 | Coins | jsx-attribute | `💰 Nouvelle vente` |
| 157 | 💵 | Banknote | other | `💵` |
| 189 | 💵 | Banknote | config-string | `💵 Cash` |
| 190 | 📱 | Smartphone | config-string | `📱 Orange Money` |
| 191 | 📱 | Smartphone | config-string | `📱 MTN MoMo` |
| 192 | 🔀 | Shuffle | config-string | `🔀 Mixte` |

### frontend-depot/src/modules/hotel/forms/ChambreForm.jsx (7)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 88 | ✏ | Pencil | jsx-attribute | `✏️ Modifier chambre` |
| 88 | 🛏 | BedDouble | jsx-attribute | `🛏️ Nouvelle chambre` |
| 97 | 🟢 | Circle | config-string | `🟢 Libre` |
| 97 | 🔴 | Circle | config-string | `🔴 Occupée` |
| 98 | 🔵 | Circle | config-string | `🔵 Réservée` |
| 98 | 🧹 | Brush | config-string | `🧹 En nettoyage` |
| 99 | 🔧 | Wrench | config-string | `🔧 Hors service` |

### frontend-depot/src/modules/pressing/forms/TicketPressingForm.jsx (7)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 96 | ✏ | Pencil | jsx-attribute | `✏️ Modifier ticket` |
| 96 | 🎫 | Ticket | jsx-attribute | `🎫 Nouveau ticket pressing` |
| 110 | 🧺 | ShoppingBasket | config-string | `🧺 Lavage` |
| 110 | 👔 | Shirt | config-string | `👔 Repassage` |
| 111 | 🧼 | Droplet | config-string | `🧼 Nettoyage sec` |
| 111 | ✨ | Sparkles | config-string | `✨ Détachage` |
| 112 | 🔄 | RefreshCw | config-string | `🔄 Pressing complet` |

### frontend-depot/src/pages/CareersPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 13 | 💰 | Coins | config-string | `💰` |
| 14 | 📱 | Smartphone | config-string | `📱` |
| 15 | 🌍 | Globe | config-string | `🌍` |
| 16 | 🎓 | GraduationCap | config-string | `🎓` |
| 17 | 🏡 | Home | config-string | `🏡` |
| 18 | 🚀 | Rocket | config-string | `🚀` |

### frontend-depot/src/pages/WholesalersPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 48 | 🍺 | Beer | other | `🍺 SABC` |
| 48 | 🍻 | Beer | other | `🍻 Guinness Cameroun` |
| 48 | 🟡 | Circle | other | `🟡 Castel Group` |
| 48 | 💧 | Droplet | other | `💧 Supermont` |
| 48 | 🍹 | CupSoda | other | `🍹 Top Boissons` |
| 48 | 🧃 | CupSoda | other | `🧃 Fruiteq` |

### frontend-depot/src/modules/depot-boissons/dashboard.config.js (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 💰 | Coins | config-string | `💰` |
| 3 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 4 | 🚚 | Truck | config-string | `🚚` |
| 5 | 🏧 | Landmark | config-string | `🏧` |
| 6 | 👥 | Users | config-string | `👥` |
| 7 | 🛺 | Car | config-string | `🛺` |

### frontend-depot/src/modules/boutique/components/TypeBoutiqueSelector.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 7 | 🛍 | ShoppingBag | config-string | `🛍️` |
| 8 | 🌸 | Flower2 | config-string | `🌸` |
| 9 | 📚 | BookOpen | config-string | `📚` |
| 10 | 📱 | Smartphone | config-string | `📱` |
| 11 | 💅 | Sparkles | config-string | `💅` |
| 12 | 🍦 | IceCreamCone | config-string | `🍦` |

### frontend-depot/src/modules/boutique/forms/CategorieForm.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 25 | 🏷 | Tag | config-string | `🏷️` |
| 45 | 🏷 | Tag | other | `🏷️` |
| 60 | 🏷 | Tag | other | `🏷️` |
| 88 | ✏ | Pencil | jsx-attribute | `✏️ Modifier catégorie` |
| 88 | 🏷 | Tag | jsx-attribute | `🏷️ Nouvelle catégorie` |
| 135 | 🏷 | Tag | other | `🏷️` |

### frontend-depot/src/modules/clinique/pages/RapportsPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 78 | 🩺 | Stethoscope | config-string | `🩺` |
| 79 | 📋 | ClipboardList | config-string | `📋` |
| 80 | 👤 | User | config-string | `👤` |
| 81 | 🔄 | RefreshCw | config-string | `🔄` |
| 82 | 👨 | User | config-string | `👨‍⚕️` |
| 83 | 💰 | Coins | config-string | `💰` |

### frontend-depot/src/modules/depot-boissons/pages/RapportsPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 6 | 💰 | Coins | config-string | `💰` |
| 7 | 📦 | Package | config-string | `📦` |
| 8 | 👥 | Users | config-string | `👥` |
| 9 | 💼 | Briefcase | config-string | `💼` |
| 10 | 🛺 | Car | config-string | `🛺` |
| 11 | 💸 | HandCoins | config-string | `💸` |

### frontend-depot/src/modules/depot-boissons/forms/ConditionnementForm.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 94 | ✏ | Pencil | jsx-attribute | `✏️ Modifier conditionnement` |
| 94 | 📦 | Package | jsx-attribute | `📦 Nouveau conditionnement` |
| 142 | 📦 | Package | config-string | `📦 Casier` |
| 143 | 📦 | Package | config-string | `📦 Pack` |
| 144 | 📦 | Package | config-string | `📦 Palette` |
| 145 | 🔢 | Hash | config-string | `🔢 Unité` |

### frontend-depot/src/modules/elevage/pages/RapportsPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 78 | 🌾 | Wheat | config-string | `🌾` |
| 79 | 💉 | Syringe | config-string | `💉` |
| 80 | 👨 🌾 | User, Wheat | config-string | `👨‍🌾` |
| 81 | 🚛 | Truck | config-string | `🚛` |
| 82 | 🐄 | Beef | config-string | `🐄` |
| 83 | 💰 | Coins | config-string | `💰` |

### frontend-depot/src/modules/garage_automobile/pages/RapportsPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 78 | 🔧 | Wrench | config-string | `🔧` |
| 79 | ⚙ | Settings | config-string | `⚙️` |
| 80 | 🩺 | Stethoscope | config-string | `🩺` |
| 81 | 🛠 | Hammer | config-string | `🛠️` |
| 82 | 👥 | Users | config-string | `👥` |
| 83 | 💰 | Coins | config-string | `💰` |

### frontend-depot/src/modules/hotel/pages/RapportsPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 78 | 📈 | TrendingUp | config-string | `📈` |
| 79 | 💰 | Coins | config-string | `💰` |
| 80 | 📊 | BarChart3 | config-string | `📊` |
| 81 | 📅 | Calendar | config-string | `📅` |
| 82 | 🛎 | BellRing | config-string | `🛎️` |
| 83 | 👨 💼 | User, Briefcase | config-string | `👨‍💼` |

### frontend-depot/src/modules/quincaillerie/pages/RapportsPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 78 | 🔩 | Cog | config-string | `🔩` |
| 79 | 🧱 | Box | config-string | `🧱` |
| 80 | 🔧 | Wrench | config-string | `🔧` |
| 81 | ⚡ | Zap | config-string | `⚡` |
| 82 | 👥 | Users | config-string | `👥` |
| 83 | 💰 | Coins | config-string | `💰` |

### frontend-depot/src/modules/restaurant/pages/RapportsPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 78 | 🍖 | Beef | config-string | `🍖` |
| 79 | 🥗 | Salad | config-string | `🥗` |
| 80 | 🍰 | CakeSlice | config-string | `🍰` |
| 81 | 🥤 | CupSoda | config-string | `🥤` |
| 82 | 👥 | Users | config-string | `👥` |
| 83 | 💰 | Coins | config-string | `💰` |

### frontend-depot/src/modules/telephonie/pages/RapportsPage.jsx (6)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 78 | 📱 | Smartphone | config-string | `📱` |
| 79 | 🎧 | Headphones | config-string | `🎧` |
| 80 | 🔧 | Wrench | config-string | `🔧` |
| 81 | 🔋 | BatteryFull | config-string | `🔋` |
| 82 | 👥 | Users | config-string | `👥` |
| 83 | 💰 | Coins | config-string | `💰` |

### frontend-depot/src/components/DynamicSidebar.jsx (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 8 | 👤 | User | config-string | `👤` |
| 9 | 🏢 | Building2 | config-string | `🏢` |
| 10 | ⚙ | Settings | config-string | `⚙️` |
| 11 | 💳 | CreditCard | config-string | `💳` |
| 122 | 📊 | BarChart3 | other | `📊` |

### frontend-depot/src/components/VenteForm.jsx (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 14 | 🍺 | Beer | config-string | `🍺` |
| 15 | 🍺 | Beer | config-string | `🍺` |
| 16 | 📦 | Package | config-string | `📦` |
| 17 | 🏗 | HardHat | config-string | `🏗️` |
| 18 | 💧 | Droplet | config-string | `💧` |

### frontend-depot/src/pages/BoutiqueLandingPage.jsx (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 596 | → → → | ArrowRight, ArrowRight, ArrowRight | config-string | `Hommes → Femmes → Enfants → Accessoires` |
| 597 | → → → | ArrowRight, ArrowRight, ArrowRight | config-string | `Smartphones → Accessoires → Chargeurs → Audio` |
| 598 | → → → | ArrowRight, ArrowRight, ArrowRight | config-string | `Parfums → Maquillage → Soins → Cheveux` |
| 599 | → → → | ArrowRight, ArrowRight, ArrowRight | config-string | `Livres → Papeterie → Scolaire → Bureau` |
| 600 | → → → | ArrowRight, ArrowRight, ArrowRight | config-string | `Cuisine → Froid → Lavage → Petit électro` |

### frontend-depot/src/pages/HelpCenterPage.jsx (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 6 | → | ArrowRight | config-string | `Dans GeStock, allez dans Stock → Inventaire. Lancez un nouvel inventaire : l'app vous présente chaque article avec le st` |
| 7 | → → | ArrowRight, ArrowRight | config-string | `Allez dans Stock → Ajustements → Déclarer une perte. Sélectionnez le produit, saisissez la quantité cassée et le motif (` |
| 8 | → | ArrowRight | config-string | `Lors d'une livraison, ouvrez le bon de livraison correspondant et cliquez sur "Retour vides". Saisissez les quantités ré` |
| 9 | → → | ArrowRight, ArrowRight | config-string | `GeStock garde un historique complet de toutes les livraisons et retours pour chaque client. Allez dans Clients → [Nom du` |
| 10 | → | ArrowRight | config-string | `Lors de la création d'une vente, choisissez "Paiement différé" comme mode de règlement. Entrez le montant versé maintena` |

### frontend-depot/src/pages/glacier/GlacierPage.jsx (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 93 | 📊 | BarChart3 | config-string | `📊 Stats` |
| 93 | 📖 | BookOpen | config-string | `📖 Menu` |
| 94 | 🪑 | Armchair | config-string | `🪑 Tables` |
| 94 | 📋 | ClipboardList | config-string | `📋 Commandes` |
| 95 | 🍦 | IceCreamCone | config-string | `🍦 Compositions` |

### frontend-depot/src/modules/depot-boissons/forms/ConsigneForm.jsx (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 122 | ✏ | Pencil | jsx-attribute | `✏️ Modifier mouvement consigne` |
| 122 | 🔄 | RefreshCw | jsx-attribute | `🔄 Mouvement consigne` |
| 187 | 📤 | ArrowUpFromLine | jsx-attribute | `📤 Sortie consigne` |
| 187 | 📥 | ArrowDownToLine | jsx-attribute | `📥 Retour consigne` |
| 205 | 💵 | Banknote | other | `💵 Rembourser en cash` |

### frontend-depot/src/modules/depot-boissons/pages/StockArticlesPage.jsx (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 234 | 🔍 | Search | other | `🔍 Rechercher un article...` |
| 326 | 📥 | ArrowDownToLine | other | `📥 Entrée de stock` |
| 359 | 📤 | ArrowUpFromLine | other | `📤 Sortie de stock` |
| 393 | 🔄 | RefreshCw | other | `🔄 Transfert de stock` |
| 433 | 📋 | ClipboardList | other | `📋 Historique des mouvements` |

### frontend-depot/src/modules/immobilier/forms/InterventionBienForm.jsx (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 86 | ✏ | Pencil | jsx-attribute | `✏️ Modifier intervention` |
| 86 | 🔧 | Wrench | jsx-attribute | `🔧 Nouvelle intervention` |
| 96 | 📅 | Calendar | config-string | `📅 Planifiée` |
| 96 | ⚡ | Zap | config-string | `⚡ En cours` |
| 97 | ✅ | CheckCircle2 | config-string | `✅ Effectuée` |

### frontend-depot/src/modules/telephonie/forms/TelephoneForm.jsx (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 105 | ✏ | Pencil | jsx-attribute | `✏️ Modifier téléphone` |
| 105 | 📱 | Smartphone | jsx-attribute | `📱 Nouveau téléphone` |
| 125 | ✨ | Sparkles | config-string | `✨ Neuf` |
| 125 | 🔄 | RefreshCw | config-string | `🔄 Recond.` |
| 125 | 📱 | Smartphone | config-string | `📱 Occasion` |

### backend-depot/src/main.ts (5)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 81 | ⚠ | AlertTriangle | other | `⚠️ ` |
| 83 | ⚠ | AlertTriangle | other | `⚠️  DISABLE_SUBSCRIPTION_CHECKS=true — CONTRÔLES ABONNEMENT DÉSACTIVÉS` |
| 86 | ⚠ | AlertTriangle | other | `⚠️  Ne JAMAIS déployer en production avec ce flag actif.` |
| 88 | ⚠ | AlertTriangle | other | `⚠️ ` |
| 92 | 🚀 | Rocket | other | `🚀 Backend GeStock SaaS stabilisé sur http://localhost:3000` |

### frontend-depot/src/pages/AboutPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 5 | 👨 💼 | User, Briefcase | config-string | `👨‍💼` |
| 6 | 👩 💻 | User, Laptop | config-string | `👩‍💻` |
| 7 | 👨 🎨 | User, Palette | config-string | `👨‍🎨` |
| 8 | 👩 🎯 | User, Target | config-string | `👩‍🎯` |

### frontend-depot/src/components/admin/UtilisateursPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 71 | ✓ | Check | other | `Utilisateur créé ✓` |
| 116 | 🔍 | Search | other | `🔍 Rechercher...` |
| 177 | 👤 | User | other | `👤 Nouvel Utilisateur` |
| 177 | ➕ | Plus | other | `➕` |

### frontend-depot/src/modules/boulangerie/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🥖 | Croissant | config-string | `🥖` |
| 3 | 💰 | Coins | config-string | `💰` |
| 4 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 5 | 📉 | TrendingDown | config-string | `📉` |

### frontend-depot/src/modules/boutique/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 💰 | Coins | config-string | `💰` |
| 3 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 4 | 👤 | User | config-string | `👤` |
| 5 | 🏧 | Landmark | config-string | `🏧` |

### frontend-depot/src/modules/ciment_btp/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🏗 | HardHat | config-string | `🏗️` |
| 3 | 🚚 | Truck | config-string | `🚚` |
| 4 | 📋 | ClipboardList | config-string | `📋` |
| 5 | ⚠ | AlertTriangle | config-string | `⚠️` |

### frontend-depot/src/modules/clinique/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 📅 | Calendar | config-string | `📅` |
| 3 | 🩺 | Stethoscope | config-string | `🩺` |
| 4 | 👥 | Users | config-string | `👥` |
| 5 | 🏧 | Landmark | config-string | `🏧` |

### frontend-depot/src/modules/elevage/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🐄 | Beef | config-string | `🐄` |
| 3 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | 🌾 | Wheat | config-string | `🌾` |

### frontend-depot/src/modules/garage_automobile/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🚗 | Car | config-string | `🚗` |
| 3 | 🔧 | Wrench | config-string | `🔧` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | ⚙ | Settings | config-string | `⚙️` |

### frontend-depot/src/modules/glacier_snack/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🍦 | IceCreamCone | config-string | `🍦` |
| 3 | 💰 | Coins | config-string | `💰` |
| 4 | 🌟 | Star | config-string | `🌟` |
| 5 | ⚠ | AlertTriangle | config-string | `⚠️` |

### frontend-depot/src/modules/hotel/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🛏 | BedDouble | config-string | `🛏️` |
| 3 | 📅 | Calendar | config-string | `📅` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | 📈 | TrendingUp | config-string | `📈` |

### frontend-depot/src/modules/immobilier/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🏠 | Home | config-string | `🏠` |
| 3 | 💰 | Coins | config-string | `💰` |
| 4 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 5 | 📈 | TrendingUp | config-string | `📈` |

### frontend-depot/src/modules/librairie/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 💰 | Coins | config-string | `💰` |
| 3 | 📋 | ClipboardList | config-string | `📋` |
| 4 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 5 | 🏧 | Landmark | config-string | `🏧` |

### frontend-depot/src/modules/parfumerie/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🧴 | SprayCan | config-string | `🧴` |
| 3 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | 🎁 | Gift | config-string | `🎁` |

### frontend-depot/src/modules/pharmacie/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 💰 | Coins | config-string | `💰` |
| 3 | 📝 | FileText | config-string | `📝` |
| 4 | ⏰ | AlarmClock | config-string | `⏰` |
| 5 | ⚠ | AlertTriangle | config-string | `⚠️` |

### frontend-depot/src/modules/pressing/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🏷 | Tag | config-string | `🏷️` |
| 3 | ✅ | CheckCircle2 | config-string | `✅` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | 👤 | User | config-string | `👤` |

### frontend-depot/src/modules/quincaillerie/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🛠 | Hammer | config-string | `🛠` |
| 3 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | 🏗 | HardHat | config-string | `🏗️` |

### frontend-depot/src/modules/restaurant/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 🍽 | UtensilsCrossed | config-string | `🍽️` |
| 3 | 📋 | ClipboardList | config-string | `📋` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | 📅 | Calendar | config-string | `📅` |

### frontend-depot/src/modules/salon_beaute/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 📅 | Calendar | config-string | `📅` |
| 3 | 💇 | Scissors | config-string | `💇` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | 👤 | User | config-string | `👤` |

### frontend-depot/src/modules/supermarche/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 💰 | Coins | config-string | `💰` |
| 3 | 🧾 | Receipt | config-string | `🧾` |
| 4 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 5 | 🏷 | Tag | config-string | `🏷️` |

### frontend-depot/src/modules/telephonie/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 📱 | Smartphone | config-string | `📱` |
| 3 | 🔧 | Wrench | config-string | `🔧` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | 🔋 | BatteryFull | config-string | `🔋` |

### frontend-depot/src/modules/transport/dashboard.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 2 | 📦 | Package | config-string | `📦` |
| 3 | 🚛 | Truck | config-string | `🚛` |
| 4 | 💰 | Coins | config-string | `💰` |
| 5 | 🚚 | Truck | config-string | `🚚` |

### frontend-depot/src/modules/transport/sidebar.config.js (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 4 | 🚛 | Truck | config-string | `🚛` |
| 6 | 👨 ✈ | User, Plane | config-string | `👨‍✈️` |
| 8 | 👤 | User | config-string | `👤` |
| 19 | 🚛 | Truck | config-string | `🚛` |

### frontend-depot/src/pages/immobilier/ImmobilierPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 89 | 📝 | FileText | other | `📝 Contrats` |
| 89 | 💰 | Coins | other | `💰 Loyers` |
| 89 | 🔧 | Wrench | other | `🔧 Interventions` |
| 89 | 📊 | BarChart3 | other | `📊 Stats` |

### frontend-depot/src/shared/forms/ClientForm.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 113 | ✏ | Pencil | jsx-attribute | `✏️ Modifier le client` |
| 113 | 👤 | User | jsx-attribute | `👤 Nouveau client` |
| 113 | 💾 | Save | jsx-attribute | `💾` |
| 113 | ➕ | Plus | jsx-attribute | `➕` |

### frontend-depot/src/shared/forms/ArticleBaseForm.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 79 | 💾 | Save | jsx-attribute | `💾` |
| 79 | ➕ | Plus | jsx-attribute | `➕` |
| 79 | ✏ | Pencil | other | `✏️ Modifier l'article` |
| 79 | 📦 | Package | other | `📦 Nouvel article` |

### frontend-depot/src/modules/boulangerie/pages/DashboardBoulangerie.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 99 | 🥖 | Croissant | config-string | `🥖` |
| 100 | 💰 | Coins | config-string | `💰` |
| 101 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 102 | 📉 | TrendingDown | config-string | `📉` |

### frontend-depot/src/modules/boulangerie/pages/RapportsPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 93 | 💰 | Coins | config-string | `💰` |
| 94 | 💸 | HandCoins | config-string | `💸` |
| 95 | 🥖 | Croissant | config-string | `🥖` |
| 96 | 📊 | BarChart3 | config-string | `📊` |

### frontend-depot/src/modules/boutique/pages/DashboardBoutique.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 60 | 💰 | Coins | config-string | `💰` |
| 61 | 📦 | Package | config-string | `📦` |
| 62 | 👤 | User | config-string | `👤` |
| 63 | ⚠ | AlertTriangle | config-string | `⚠️` |

### frontend-depot/src/modules/ciment_btp/pages/DashboardCimentBtp.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 90 | 🏗 | HardHat | config-string | `🏗️` |
| 91 | 🚚 | Truck | config-string | `🚚` |
| 92 | 📋 | ClipboardList | config-string | `📋` |
| 93 | ⚠ | AlertTriangle | config-string | `⚠️` |

### frontend-depot/src/modules/clinique/pages/DashboardClinique.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 94 | 📅 | Calendar | config-string | `📅` |
| 95 | 🩺 | Stethoscope | config-string | `🩺` |
| 96 | 👥 | Users | config-string | `👥` |
| 97 | 🏧 | Landmark | config-string | `🏧` |

### frontend-depot/src/modules/depot-boissons/pages/ParametresPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 71 | ✓ | Check | config-string | `Paramètres sauvegardés avec succès ✓` |
| 100 | 🏪 | Store | other | `🏪` |
| 112 | 🧾 | Receipt | other | `🧾` |
| 120 | 🛒 | ShoppingCart | other | `🛒` |

### frontend-depot/src/modules/elevage/pages/DashboardElevage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 99 | 🐄 | Beef | config-string | `🐄` |
| 100 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 101 | 💰 | Coins | config-string | `💰` |
| 102 | 🌾 | Wheat | config-string | `🌾` |

### frontend-depot/src/modules/garage_automobile/pages/DashboardGarage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 99 | 🚗 | Car | config-string | `🚗` |
| 100 | 🔧 | Wrench | config-string | `🔧` |
| 101 | 💰 | Coins | config-string | `💰` |
| 102 | ⚙ | Settings | config-string | `⚙️` |

### frontend-depot/src/modules/glacier_snack/pages/DashboardGlacier.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 90 | 🍦 | IceCreamCone | config-string | `🍦` |
| 91 | 💰 | Coins | config-string | `💰` |
| 92 | 🌟 | Star | config-string | `🌟` |
| 93 | ⚠ | AlertTriangle | config-string | `⚠️` |

### frontend-depot/src/modules/hotel/pages/DashboardHotel.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 102 | 🛏 | BedDouble | config-string | `🛏️` |
| 103 | 📅 | Calendar | config-string | `📅` |
| 104 | 💰 | Coins | config-string | `💰` |
| 105 | 📈 | TrendingUp | config-string | `📈` |

### frontend-depot/src/modules/immobilier/pages/DashboardImmobilier.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 90 | 🏠 | Home | config-string | `🏠` |
| 91 | 💰 | Coins | config-string | `💰` |
| 92 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 93 | 📈 | TrendingUp | config-string | `📈` |

### frontend-depot/src/modules/librairie/pages/DashboardLibrairie.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 90 | 📚 | BookOpen | config-string | `📚` |
| 91 | 💰 | Coins | config-string | `💰` |
| 92 | 📦 | Package | config-string | `📦` |
| 93 | ⏳ | Hourglass | config-string | `⏳` |

### frontend-depot/src/modules/librairie/pages/RapportsPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 75 | 💰 | Coins | config-string | `💰` |
| 76 | 📚 | BookOpen | config-string | `📚` |
| 77 | 👥 | Users | config-string | `👥` |
| 78 | 📈 | TrendingUp | config-string | `📈` |

### frontend-depot/src/modules/parfumerie/pages/DashboardParfumerie.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 90 | 🧴 | SprayCan | config-string | `🧴` |
| 91 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 92 | 💰 | Coins | config-string | `💰` |
| 93 | 🎁 | Gift | config-string | `🎁` |

### frontend-depot/src/modules/parfumerie/pages/RapportsPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 93 | 💰 | Coins | config-string | `💰` |
| 94 | 💸 | HandCoins | config-string | `💸` |
| 95 | 📈 | TrendingUp | config-string | `📈` |
| 96 | 📊 | BarChart3 | config-string | `📊` |

### frontend-depot/src/modules/pharmacie/components/AlertCard.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 15 | 🔴 | Circle | other | `🔴` |
| 16 | 🟠 | Circle | other | `🟠` |
| 17 | 🟡 | Circle | other | `🟡` |
| 18 | ⚪ | Circle | other | `⚪` |

### frontend-depot/src/modules/pharmacie/forms/MedicamentForm.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 121 | ✏ | Pencil | jsx-attribute | `✏️ Modifier médicament` |
| 121 | 💊 | Pill | jsx-attribute | `💊 Nouveau médicament` |
| 135 | 🔴 | Circle | jsx-attribute | `🔴 Sur ordonnance` |
| 135 | 🟢 | Circle | jsx-attribute | `🟢 Libre` |

### frontend-depot/src/modules/pharmacie/pages/RapportsPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 92 | 💰 | Coins | config-string | `💰` |
| 93 | 💸 | HandCoins | config-string | `💸` |
| 94 | 📈 | TrendingUp | config-string | `📈` |
| 95 | 📊 | BarChart3 | config-string | `📊` |

### frontend-depot/src/modules/pressing/pages/RapportsPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 94 | 💰 | Coins | config-string | `💰` |
| 95 | 💸 | HandCoins | config-string | `💸` |
| 96 | 📈 | TrendingUp | config-string | `📈` |
| 97 | 📊 | BarChart3 | config-string | `📊` |

### frontend-depot/src/modules/pressing/pages/ServicesPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 83 | 👕 | Shirt | config-string | `👕` |
| 83 | 🔥 | Flame | config-string | `🔥` |
| 83 | ✨ | Sparkles | config-string | `✨` |
| 83 | 🎨 | Palette | config-string | `🎨` |

### frontend-depot/src/modules/quincaillerie/pages/DashboardQuincaillerie.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 90 | 🛠 | Hammer | config-string | `🛠` |
| 91 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 92 | 💰 | Coins | config-string | `💰` |
| 93 | 🏗 | HardHat | config-string | `🏗️` |

### frontend-depot/src/modules/restaurant/pages/DashboardRestaurant.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 108 | 🍽 | UtensilsCrossed | config-string | `🍽️` |
| 109 | 💰 | Coins | config-string | `💰` |
| 110 | 📋 | ClipboardList | config-string | `📋` |
| 111 | ⭐ | Star | config-string | `⭐` |

### frontend-depot/src/modules/salon_beaute/pages/DashboardSalon.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 99 | 📅 | Calendar | config-string | `📅` |
| 100 | 💇 | Scissors | config-string | `💇` |
| 101 | 💰 | Coins | config-string | `💰` |
| 102 | 👤 | User | config-string | `👤` |

### frontend-depot/src/modules/salon_beaute/pages/RapportsPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 94 | 💰 | Coins | config-string | `💰` |
| 95 | 💸 | HandCoins | config-string | `💸` |
| 96 | 📈 | TrendingUp | config-string | `📈` |
| 97 | 📊 | BarChart3 | config-string | `📊` |

### frontend-depot/src/modules/supermarche/forms/PromotionSupermarcheForm.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 116 | ✏ | Pencil | jsx-attribute | `✏️ Modifier promotion` |
| 116 | 🏷 | Tag | jsx-attribute | `🏷️ Nouvelle promotion` |
| 138 | 💰 | Coins | config-string | `💰 Montant fixe` |
| 139 | 🏷 | Tag | config-string | `🏷️ Prix fixe` |

### frontend-depot/src/modules/supermarche/pages/ParametresPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 71 | ✓ | Check | config-string | `Paramètres sauvegardés avec succès ✓` |
| 87 | 🏪 | Store | other | `🏪` |
| 99 | 🧾 | Receipt | other | `🧾` |
| 107 | 🛒 | ShoppingCart | other | `🛒` |

### frontend-depot/src/modules/supermarche/pages/RapportsPage.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 67 | 💰 | Coins | config-string | `💰` |
| 68 | 🧾 | Receipt | config-string | `🧾` |
| 69 | 💸 | HandCoins | config-string | `💸` |
| 70 | 📈 | TrendingUp | config-string | `📈` |

### frontend-depot/src/modules/telephonie/pages/DashboardTelephonie.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 103 | 📱 | Smartphone | config-string | `📱` |
| 104 | 🔧 | Wrench | config-string | `🔧` |
| 105 | 💰 | Coins | config-string | `💰` |
| 106 | 🔋 | BatteryFull | config-string | `🔋` |

### frontend-depot/src/modules/transport/pages/DashboardTransport.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 99 | 📦 | Package | config-string | `📦` |
| 100 | 🚛 | Truck | config-string | `🚛` |
| 101 | 💰 | Coins | config-string | `💰` |
| 102 | 🚚 | Truck | config-string | `🚚` |

### frontend-depot/src/modules/pressing/pages/DashboardPressing.jsx (4)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 99 | 🏷 | Tag | config-string | `🏷️` |
| 100 | ✅ | CheckCircle2 | config-string | `✅` |
| 101 | 💰 | Coins | config-string | `💰` |
| 102 | 👤 | User | config-string | `👤` |

### frontend-depot/src/components/StatsCards.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 55 | 💰 | Coins | config-string | `💰` |
| 63 | 🧾 | Receipt | config-string | `🧾` |
| 71 | ⭐ | Star | config-string | `⭐` |

### frontend-depot/src/context/NotifContext.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 49 | ✅ | CheckCircle2 | config-string | `✅` |
| 50 | ❌ | XCircle | config-string | `❌` |
| 51 | ⚠ | AlertTriangle | config-string | `⚠️` |

### frontend-depot/src/contexts/ToastContext.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 47 | ✅ | CheckCircle2 | config-string | `✅` |
| 48 | ❌ | XCircle | config-string | `❌` |
| 49 | ⚠ | AlertTriangle | config-string | `⚠️` |

### frontend-depot/src/components/admin/DepotsPage.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 80 | ✓ | Check | other | `Dépôt créé ✓` |
| 181 | 🏢 | Building2 | other | `🏢 Nouveau Dépôt` |
| 181 | ➕ | Plus | other | `➕` |

### frontend-depot/src/core/notifications/NotificationToast.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 5 | ❌ | XCircle | config-string | `❌` |
| 6 | ⚠ | AlertTriangle | config-string | `⚠️` |
| 8 | ✅ | CheckCircle2 | config-string | `✅` |

### frontend-depot/src/modules/garage_automobile/sidebar.config.js (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 3 | 🚗 | Car | config-string | `🚗` |
| 5 | 📄 | File | config-string | `📄` |
| 6 | 👤 | User | config-string | `👤` |

### frontend-depot/src/pages/clinique/CliniquePage.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 70 | 🩺 | Stethoscope | other | `🩺 Consultations` |
| 70 | 📅 | Calendar | other | `📅 Rendez-vous` |
| 70 | 📊 | BarChart3 | other | `📊 Stats` |

### frontend-depot/src/pages/hotellerie/HotelleriePage.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 63 | 📅 | Calendar | other | `📅 Réservations` |
| 63 | 🏷 | Tag | other | `🏷️ Types` |
| 63 | 📊 | BarChart3 | other | `📊 Stats` |

### frontend-depot/src/pages/transport/TransportPage.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 63 | 📦 | Package | other | `📦 Colis` |
| 63 | 🗺 | Map | other | `🗺️ Trajets` |
| 63 | 📊 | BarChart3 | other | `📊 Stats` |

### frontend-depot/src/modules/ciment_btp/pages/RapportsPage.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 86 | 💰 | Coins | config-string | `💰` |
| 87 | 🏗 | HardHat | config-string | `🏗️` |
| 88 | 💸 | HandCoins | config-string | `💸` |

### frontend-depot/src/modules/depot-boissons/forms/ChargementForm.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 88 | ✏ | Pencil | jsx-attribute | `✏️ Modifier chargement` |
| 88 | 📦 | Package | jsx-attribute | `📦 Chargement de tournée` |
| 88 | 💾 | Save | other | `💾` |

### frontend-depot/src/modules/glacier_snack/pages/RapportsPage.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 86 | 💰 | Coins | config-string | `💰` |
| 87 | 🍦 | IceCreamCone | config-string | `🍦` |
| 88 | 💸 | HandCoins | config-string | `💸` |

### frontend-depot/src/modules/hotel/forms/CheckOutForm.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 75 | 🧾 | Receipt | other | `🧾 Check-out` |
| 103 | 🧾 | Receipt | other | `🧾 Check-out` |
| 103 | 🧾 | Receipt | other | `🧾` |

### frontend-depot/src/modules/immobilier/pages/RapportsPage.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 86 | 💰 | Coins | config-string | `💰` |
| 87 | 🏠 | Home | config-string | `🏠` |
| 88 | 💸 | HandCoins | config-string | `💸` |

### frontend-depot/src/modules/pharmacie/forms/POSPharmacieForm.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 180 | 📱 | Smartphone | other | `📱 Orange Money` |
| 180 | 📱 | Smartphone | other | `📱 MTN MoMo` |
| 180 | 💳 | CreditCard | other | `💳 Carte` |

### frontend-depot/src/shared/components/ExportButton.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 3 | 📤 | ArrowUpFromLine | other | `📤 Exporter` |
| 31 | 📊 | BarChart3 | other | `📊` |
| 31 | 📃 | FileText | other | `📃` |

### frontend-depot/src/modules/restaurant/forms/PriseCommandeForm.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 121 | 🍽 | UtensilsCrossed | config-string | `🍽️ Sur place` |
| 121 | 🛍 | ShoppingBag | config-string | `🛍️ À emporter` |
| 121 | 🚚 | Truck | config-string | `🚚 Livraison` |

### frontend-depot/src/modules/supermarche/forms/POSSupermarcheForm.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 216 | 📱 | Smartphone | other | `📱 Orange Money` |
| 216 | 📱 | Smartphone | other | `📱 MTN MoMo` |
| 216 | 💳 | CreditCard | other | `💳 Carte` |

### frontend-depot/src/modules/supermarche/forms/DepenseForm.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 65 | ✏ | Pencil | jsx-attribute | `✏️ Modifier la dépense` |
| 65 | 💰 | Coins | jsx-attribute | `💰 Nouvelle dépense` |
| 65 | 💰 | Coins | other | `💰` |

### frontend-depot/src/modules/transport/pages/RapportsPage.jsx (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 86 | 📦 | Package | config-string | `📦` |
| 87 | 🚛 | Truck | config-string | `🚛` |
| 88 | 💸 | HandCoins | config-string | `💸` |

### backend-depot/src/support/support.service.ts (3)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 97 | 📧 | Mail | config-string | `📧 Email de contact` |
| 98 | 👤 | User | config-string | `👤 Utilisateur` |
| 99 | 📄 | File | config-string | `📄 Page` |

### frontend-depot/src/pages/SecurityPage.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 55 | → | ArrowRight | other | `Dépôt Central Bonanjo → son propre schéma de données` |
| 55 | → | ArrowRight | other | `Dépôt Bonabéri → son propre schéma de données` |

### frontend-depot/src/modules/boutique/sidebar.config.js (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 5 | 👤 | User | config-string | `👤` |
| 9 | 📄 | File | config-string | `📄` |

### frontend-depot/src/modules/ciment_btp/sidebar.config.js (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 7 | 🚛 | Truck | config-string | `🚛` |
| 9 | 👤 | User | config-string | `👤` |

### frontend-depot/src/modules/pressing/sidebar.config.js (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 4 | 👤 | User | config-string | `👤` |
| 5 | 🧼 | Droplet | config-string | `🧼` |

### frontend-depot/src/modules/quincaillerie/sidebar.config.js (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 6 | 👤 | User | config-string | `👤` |
| 10 | 📄 | File | config-string | `📄` |

### frontend-depot/src/pages/boulangerie/ProductionPage.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 101 | 🥖 | Croissant | other | `🥖 Production` |
| 101 | 📊 | BarChart3 | other | `📊 Statistiques` |

### frontend-depot/src/pages/librairie/LibrairiePage.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 73 | 📋 | ClipboardList | other | `📋 Commandes` |
| 73 | 📊 | BarChart3 | other | `📊 Stats` |

### frontend-depot/src/pages/restaurant/RestaurantPage.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 63 | 📋 | ClipboardList | other | `📋 Commandes` |
| 63 | 📖 | BookOpen | other | `📖 Menu` |

### frontend-depot/src/shared/components/DataTable.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 11 | 🔍 | Search | other | `🔍 Rechercher...` |
| 15 | 📋 | ClipboardList | other | `📋` |

### frontend-depot/src/shared/forms/FournisseurForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 104 | ✏ | Pencil | jsx-attribute | `✏️ Modifier le fournisseur` |
| 104 | 🏭 | Factory | jsx-attribute | `🏭 Nouveau fournisseur` |

### frontend-depot/src/modules/boulangerie/forms/RecetteForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 95 | ✏ | Pencil | jsx-attribute | `✏️ Modifier recette` |
| 95 | 📖 | BookOpen | jsx-attribute | `📖 Nouvelle recette` |

### frontend-depot/src/modules/boulangerie/forms/ProductionJourForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 104 | 🏭 | Factory | other | `🏭 Production du jour` |
| 104 | 💾 | Save | other | `💾` |

### frontend-depot/src/modules/boutique/forms/DepenseBoutiqueForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 88 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 88 | ➕ | Plus | jsx-attribute | `➕ Nouvelle Dépense` |

### frontend-depot/src/modules/boutique/forms/ClientBoutiqueForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 47 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 47 | ➕ | Plus | jsx-attribute | `➕ Nouveau Client` |

### frontend-depot/src/modules/boutique/forms/FactureBoutiqueForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 47 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 47 | ➕ | Plus | jsx-attribute | `➕ Nouvelle Facture` |

### frontend-depot/src/modules/boutique/forms/CaisseBoutiqueForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 46 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 46 | ➕ | Plus | jsx-attribute | `➕ Nouvelle Opération` |

### frontend-depot/src/modules/boutique/forms/FournisseurBoutiqueForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 47 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 47 | ➕ | Plus | jsx-attribute | `➕ Nouveau Fournisseur` |

### frontend-depot/src/modules/boutique/pages/RapportsPage.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 25 | 💰 | Coins | config-string | `💰` |
| 26 | 🧾 | Receipt | config-string | `🧾` |

### frontend-depot/src/modules/boutique/forms/PromotionBoutiqueForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 49 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 49 | ➕ | Plus | jsx-attribute | `➕ Nouvelle Promotion` |

### frontend-depot/src/modules/boutique/forms/StockBoutiqueForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 106 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 106 | ➕ | Plus | jsx-attribute | `➕ Nouvel Article` |

### frontend-depot/src/modules/ciment_btp/forms/DevisForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 109 | ✏ | Pencil | jsx-attribute | `✏️ Modifier devis` |
| 109 | 📋 | ClipboardList | jsx-attribute | `📋 Nouveau devis` |

### frontend-depot/src/modules/clinique/forms/ConsultationForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 101 | 🩺 | Stethoscope | other | `🩺 Consultation` |
| 101 | 💾 | Save | other | `💾` |

### frontend-depot/src/modules/ciment_btp/forms/ChantierForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 92 | ✏ | Pencil | jsx-attribute | `✏️ Modifier chantier` |
| 92 | 🏗 | HardHat | jsx-attribute | `🏗️ Nouveau chantier` |

### frontend-depot/src/modules/clinique/forms/PatientForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 84 | ✏ | Pencil | jsx-attribute | `✏️ Modifier patient` |
| 84 | 👤 | User | jsx-attribute | `👤 Nouveau patient` |

### frontend-depot/src/modules/clinique/forms/RendezVousForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 94 | ✏ | Pencil | jsx-attribute | `✏️ Modifier RDV` |
| 94 | 📅 | Calendar | jsx-attribute | `📅 Nouveau rendez-vous` |

### frontend-depot/src/modules/clinique/forms/DossierMedicalForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 79 | 📋 | ClipboardList | other | `📋 Dossier médical` |
| 79 | 💾 | Save | other | `💾` |

### frontend-depot/src/modules/depot-boissons/forms/TricycleForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 100 | ✏ | Pencil | jsx-attribute | `✏️ Modifier tricycle` |
| 100 | 🚚 | Truck | jsx-attribute | `🚚 Nouveau tricycle` |

### frontend-depot/src/modules/depot-boissons/pages/FournisseursPage.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 244 | 📦 | Package | other | `📦 Commander au fournisseur` |
| 273 | 📥 | ArrowDownToLine | other | `📥 Réceptionner livraison` |

### frontend-depot/src/modules/depot-boissons/forms/TourneeForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 98 | ✏ | Pencil | jsx-attribute | `✏️ Modifier tournée` |
| 98 | 🚚 | Truck | jsx-attribute | `🚚 Nouvelle tournée` |

### frontend-depot/src/modules/depot-boissons/forms/ArticleBoissonsForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 104 | ✏ | Pencil | jsx-attribute | `✏️ Modifier article` |
| 104 | 🍺 | Beer | jsx-attribute | `🍺 Nouvel article boissons` |

### frontend-depot/src/modules/elevage/forms/AlimentationForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 88 | 🍽 | UtensilsCrossed | other | `🍽️ Alimentation` |
| 88 | 💾 | Save | other | `💾` |

### frontend-depot/src/modules/elevage/forms/VaccinationForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 80 | 💉 | Syringe | other | `💉 Vaccination` |
| 80 | 💾 | Save | other | `💾` |

### frontend-depot/src/modules/garage_automobile/forms/OrdreTravailForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 108 | ✏ | Pencil | jsx-attribute | `✏️ Modifier OT` |
| 108 | 🔧 | Wrench | jsx-attribute | `🔧 Nouvel ordre de travail` |

### frontend-depot/src/modules/garage_automobile/forms/DiagnosticForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 80 | 🩺 | Stethoscope | other | `🩺 Diagnostic` |
| 80 | 💾 | Save | other | `💾` |

### frontend-depot/src/modules/garage_automobile/forms/PieceGarageForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 79 | ✏ | Pencil | jsx-attribute | `✏️ Modifier pièce` |
| 79 | 🔩 | Cog | jsx-attribute | `🔩 Nouvelle pièce` |

### frontend-depot/src/modules/garage_automobile/forms/VehiculeClientForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 87 | ✏ | Pencil | jsx-attribute | `✏️ Modifier véhicule` |
| 87 | 🚗 | Car | jsx-attribute | `🚗 Nouveau véhicule` |

### frontend-depot/src/modules/glacier_snack/forms/DepenseGlacierForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 85 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/glacier_snack/forms/PersonnelGlacierForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 85 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/glacier_snack/forms/FournisseurGlacierForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 85 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/glacier_snack/forms/StockGlacierForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 85 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/glacier_snack/forms/ClientGlacierForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 85 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/hotel/forms/CheckInForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✅ | CheckCircle2 | other | `✅ Check-in` |
| 85 | ✅ | CheckCircle2 | other | `✅` |

### frontend-depot/src/modules/hotel/forms/ReservationHotelForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 132 | ✏ | Pencil | jsx-attribute | `✏️ Modifier réservation` |
| 132 | 📅 | Calendar | jsx-attribute | `📅 Nouvelle réservation` |

### frontend-depot/src/modules/hotel/forms/TypeChambreForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 87 | ✏ | Pencil | jsx-attribute | `✏️ Modifier type` |
| 87 | 🏷 | Tag | jsx-attribute | `🏷️ Nouveau type de chambre` |

### frontend-depot/src/modules/hotel/forms/ConsommationHotelForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 82 | 🍽 | UtensilsCrossed | other | `🍽️ Ajouter consommation` |
| 82 | ➕ | Plus | other | `➕` |

### frontend-depot/src/modules/immobilier/forms/PaiementLoyerForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 92 | 💰 | Coins | other | `💰 Paiement de loyer` |
| 92 | 💰 | Coins | other | `💰` |

### frontend-depot/src/modules/immobilier/forms/ContratLocationForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 98 | ✏ | Pencil | jsx-attribute | `✏️ Modifier contrat` |
| 98 | 📝 | FileText | jsx-attribute | `📝 Nouveau contrat de location` |

### frontend-depot/src/modules/librairie/forms/FournisseurLibrairieForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 85 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/librairie/forms/DepenseLibrairieForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 87 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 87 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/librairie/forms/PersonnelLibrairieForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 86 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 86 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/librairie/forms/ClientLibrairieForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 85 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/librairie/forms/StockLibrairieForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 85 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 85 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/pharmacie/forms/OrdonnanceForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 126 | ✏ | Pencil | jsx-attribute | `✏️ Modifier ordonnance` |
| 126 | 📋 | ClipboardList | jsx-attribute | `📋 Nouvelle ordonnance` |

### frontend-depot/src/modules/pharmacie/forms/DelivranceForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 104 | 💊 | Pill | other | `💊 Délivrance` |
| 104 | 💊 | Pill | other | `💊` |

### frontend-depot/src/modules/pressing/forms/RetraitPressingForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 82 | ✅ | CheckCircle2 | other | `✅ Retrait vêtements` |
| 82 | ✅ | CheckCircle2 | other | `✅` |

### frontend-depot/src/modules/quincaillerie/pages/CategoriesPage.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 157 | ✏ | Pencil | jsx-attribute | `✏️ Modifier Catégorie` |
| 157 | 📁 | Folder | jsx-attribute | `📁 Nouvelle Catégorie` |

### frontend-depot/src/modules/restaurant/forms/MenuJourForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 104 | 📋 | ClipboardList | other | `📋 Menu du jour` |
| 104 | 📋 | ClipboardList | other | `📋` |

### frontend-depot/src/modules/pharmacie/forms/LotForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 124 | ✏ | Pencil | jsx-attribute | `✏️ Modifier lot` |
| 124 | 🏷 | Tag | jsx-attribute | `🏷️ Nouveau lot` |

### frontend-depot/src/modules/restaurant/forms/ReservationRestaurantForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 88 | ✏ | Pencil | jsx-attribute | `✏️ Modifier réservation` |
| 88 | 📅 | Calendar | jsx-attribute | `📅 Nouvelle réservation` |

### frontend-depot/src/modules/restaurant/forms/TableForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 83 | ✏ | Pencil | jsx-attribute | `✏️ Modifier table` |
| 83 | 🪑 | Armchair | jsx-attribute | `🪑 Nouvelle table` |

### frontend-depot/src/modules/salon_beaute/forms/RendezVousSalonForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 112 | ✏ | Pencil | jsx-attribute | `✏️ Modifier RDV` |
| 112 | 📅 | Calendar | jsx-attribute | `📅 Nouveau rendez-vous` |

### frontend-depot/src/modules/supermarche/forms/ArticleSupermarcheForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 123 | ✏ | Pencil | jsx-attribute | `✏️ Modifier article` |
| 123 | 📦 | Package | jsx-attribute | `📦 Nouvel article` |

### frontend-depot/src/modules/supermarche/forms/InventaireForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 98 | 📋 | ClipboardList | other | `📋 Inventaire` |
| 98 | ✅ | CheckCircle2 | other | `✅` |

### frontend-depot/src/modules/salon_beaute/forms/EncaissementSalonForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 83 | 💰 | Coins | other | `💰 Encaissement` |
| 83 | 💰 | Coins | other | `💰` |

### frontend-depot/src/modules/supermarche/forms/RayonForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 77 | ✏ | Pencil | jsx-attribute | `✏️ Modifier rayon` |
| 77 | 🏪 | Store | jsx-attribute | `🏪 Nouveau rayon` |

### frontend-depot/src/modules/supermarche/pages/DepensesPage.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 105 | 🔍 | Search | other | `🔍 Rechercher...` |
| 183 | ✓ | Check | other | `Dépense enregistrée ✓` |

### frontend-depot/src/modules/supermarche/pages/InventairePage.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 99 | 🔍 | Search | other | `🔍 Rechercher un produit...` |
| 176 | ✓ | Check | other | `Inventaire enregistré ✓` |

### frontend-depot/src/modules/telephonie/forms/ReparationTelephoneForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 109 | ✏ | Pencil | jsx-attribute | `✏️ Modifier réparation` |
| 109 | 🔧 | Wrench | jsx-attribute | `🔧 Nouvelle réparation` |

### frontend-depot/src/modules/restaurant/forms/AdditionForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 90 | 🧾 | Receipt | other | `🧾 Addition` |
| 90 | 🧾 | Receipt | other | `🧾` |

### frontend-depot/src/modules/transport/forms/CaisseForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 86 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 86 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/transport/forms/ColisForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 90 | ✏ | Pencil | jsx-attribute | `✏️ Modifier colis` |
| 90 | 📦 | Package | jsx-attribute | `📦 Nouveau colis` |

### frontend-depot/src/modules/transport/forms/DepenseForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 86 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 86 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/transport/forms/FlotteForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 83 | ✏ | Pencil | jsx-attribute | `✏️ Modifier véhicule` |
| 83 | ➕ | Plus | jsx-attribute | `➕ Nouveau véhicule` |

### frontend-depot/src/modules/transport/forms/ChauffeurForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 83 | ✏ | Pencil | jsx-attribute | `✏️ Modifier chauffeur` |
| 83 | ➕ | Plus | jsx-attribute | `➕ Nouveau chauffeur` |

### frontend-depot/src/modules/transport/forms/LivraisonForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 83 | ✏ | Pencil | jsx-attribute | `✏️ Modifier livraison` |
| 83 | ➕ | Plus | jsx-attribute | `➕ Nouvelle livraison` |

### frontend-depot/src/modules/transport/forms/PersonnelForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 86 | ✏ | Pencil | jsx-attribute | `✏️ Modifier` |
| 86 | ➕ | Plus | jsx-attribute | `➕ Nouveau` |

### frontend-depot/src/modules/transport/forms/TrajetForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 88 | ✏ | Pencil | jsx-attribute | `✏️ Modifier trajet` |
| 88 | 🚚 | Truck | jsx-attribute | `🚚 Nouveau trajet` |

### frontend-depot/src/modules/transport/forms/TransportClientForm.jsx (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 83 | ✏ | Pencil | jsx-attribute | `✏️ Modifier client` |
| 83 | ➕ | Plus | jsx-attribute | `➕ Nouveau client` |

### backend-depot/src/prisma.service.ts (2)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 137 | ✅ | CheckCircle2 | other | `✅ Base de données connectée et Isolation active !` |
| 139 | ❌ | XCircle | other | `❌ Erreur de connexion database:` |

### frontend-depot/src/components/GenericMetierDashboard.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 40 | 📋 | ClipboardList | other | `📋` |

### frontend-depot/src/config/metier-dashboard.config.ts (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 281 | 🚗 | Car | config-string | `🚗` |

### frontend-depot/src/pages/Changelog.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 29 | 🚀 | Rocket | config-string | `Lancement Officiel de GeStock 🚀` |

### frontend-depot/src/pages/MobileAppPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 138 | → → | ArrowRight, ArrowRight | other | `Scan QR → saisie quantités → récupération vides` |

### frontend-depot/src/modules/glacier_snack/sidebar.config.js (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 8 | 👤 | User | config-string | `👤` |

### frontend-depot/src/modules/hotel/sidebar.config.js (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 7 | 👨 💼 | User, Briefcase | config-string | `👨‍💼` |

### frontend-depot/src/modules/immobilier/sidebar.config.js (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 9 | 📄 | File | config-string | `📄` |

### frontend-depot/src/modules/librairie/sidebar.config.js (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 8 | 👤 | User | config-string | `👤` |

### frontend-depot/src/modules/parfumerie/sidebar.config.js (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 6 | 👤 | User | config-string | `👤` |

### frontend-depot/src/modules/salon_beaute/sidebar.config.js (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 6 | 👤 | User | config-string | `👤` |

### frontend-depot/src/modules/supermarche/sidebar.config.js (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 5 | 🗂 | FolderOpen | config-string | `🗂️` |

### frontend-depot/src/modules/telephonie/sidebar.config.js (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 6 | 👤 | User | config-string | `👤` |

### frontend-depot/src/shared/components/ConfirmDialog.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 1 | ⚠ | AlertTriangle | other | `⚠️` |

### frontend-depot/src/shared/components/EmptyState.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 1 | 📋 | ClipboardList | other | `📋` |

### frontend-depot/src/shared/components/PrintButton.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 1 | 🖨 | Printer | other | `🖨️ Imprimer` |

### frontend-depot/src/shared/components/SearchBar.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 3 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/boutique/pages/ClientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 70 | 🔍 | Search | other | `🔍 Nom, email...` |

### frontend-depot/src/modules/boutique/pages/DepensesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 82 | 🔍 | Search | other | `🔍 Libellé...` |

### frontend-depot/src/modules/boutique/pages/FacturesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 47 | 🔍 | Search | other | `🔍 N° facture, client...` |

### frontend-depot/src/modules/boutique/pages/FournisseursPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 70 | 🔍 | Search | other | `🔍 Nom, email...` |

### frontend-depot/src/modules/boutique/pages/PromotionsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 74 | 🔍 | Search | other | `🔍 Libellé...` |

### frontend-depot/src/modules/boutique/pages/StockPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 88 | 🔍 | Search | other | `🔍 Nom produit...` |

### frontend-depot/src/modules/boutique/pages/VentesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 77 | 🔍 | Search | other | `🔍 Produit, client...` |

### frontend-depot/src/modules/clinique/pages/ConsultationsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 139 | 🔍 | Search | other | `🔍 Patient, mdecin...` |

### frontend-depot/src/modules/clinique/pages/MedecinsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 164 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/clinique/pages/MedicamentsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 164 | 🔍 | Search | other | `🔍 Mdicament...` |

### frontend-depot/src/modules/clinique/pages/PatientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 142 | 🔍 | Search | other | `🔍 Nom, tlphone...` |

### frontend-depot/src/modules/clinique/pages/PrescriptionsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 160 | 🔍 | Search | other | `🔍 Patient, mdecin...` |

### frontend-depot/src/modules/clinique/pages/RendezVousPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 103 | 🔍 | Search | other | `🔍 Patient ou mdecin...` |

### frontend-depot/src/modules/depot-boissons/pages/ClientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 115 | 🔍 | Search | other | `🔍 Rechercher un client...` |

### frontend-depot/src/modules/depot-boissons/pages/ConsignesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 75 | 🔍 | Search | other | `🔍 Rechercher un client...` |

### frontend-depot/src/modules/depot-boissons/pages/DepensesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 124 | 🔍 | Search | other | `🔍 Rechercher une dépense...` |

### frontend-depot/src/modules/depot-boissons/pages/TourneesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 148 | 🔍 | Search | other | `🔍 Rechercher une tournée...` |

### frontend-depot/src/modules/elevage/pages/AlimentationPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 159 | 🔍 | Search | other | `🔍 Type ou enclos...` |

### frontend-depot/src/modules/elevage/pages/DepensesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 159 | 🔍 | Search | other | `🔍 Libell ou catgorie...` |

### frontend-depot/src/modules/elevage/pages/EvenementsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 165 | 🔍 | Search | other | `🔍 Animal, type...` |

### frontend-depot/src/modules/elevage/forms/LotElevageForm.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 81 | ✏ | Pencil | jsx-attribute | `✏️ Modifier lot` |

### frontend-depot/src/modules/elevage/pages/StockPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 159 | 🔍 | Search | other | `🔍 Nom ou catgorie...` |

### frontend-depot/src/modules/elevage/pages/TroupeauxPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 159 | 🔍 | Search | other | `🔍 Identifiant, espce...` |

### frontend-depot/src/modules/elevage/pages/VentesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 159 | 🔍 | Search | other | `🔍 Type ou client...` |

### frontend-depot/src/modules/elevage/pages/SantePage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 112 | 🔍 | Search | other | `🔍 Animal, type...` |

### frontend-depot/src/modules/garage_automobile/pages/CaissePage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 95 | 🔍 | Search | other | `🔍 Libellé...` |

### frontend-depot/src/modules/garage_automobile/pages/ClientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 144 | 🔍 | Search | other | `🔍 Nom, tlphone ou email...` |

### frontend-depot/src/modules/garage_automobile/pages/DepensesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 166 | 🔍 | Search | other | `🔍 Libell ou catgorie...` |

### frontend-depot/src/modules/garage_automobile/pages/DevisPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 168 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/garage_automobile/pages/FournisseursPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 144 | 🔍 | Search | other | `🔍 Nom ou spcialit...` |

### frontend-depot/src/modules/garage_automobile/pages/OrdresReparationPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 94 | 🔍 | Search | other | `🔍 Rf., immatriculation...` |

### frontend-depot/src/modules/garage_automobile/pages/PersonnelPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 144 | 🔍 | Search | other | `🔍 Nom ou fonction...` |

### frontend-depot/src/modules/garage_automobile/pages/PiecesStockPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 148 | 🔍 | Search | other | `🔍 Nom ou rfrence...` |

### frontend-depot/src/modules/garage_automobile/pages/VehiculesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 144 | 🔍 | Search | other | `🔍 Immatriculation, marque, modle...` |

### frontend-depot/src/modules/hotel/pages/ChambresPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 200 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/hotel/pages/ClientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 146 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/hotel/pages/FacturationPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 166 | 🔍 | Search | other | `🔍 Client ou chambre...` |

### frontend-depot/src/modules/hotel/pages/FournisseursPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 146 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/hotel/pages/MenagePage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 168 | 🔍 | Search | other | `🔍 Chambre ou agent...` |

### frontend-depot/src/modules/hotel/pages/PersonnelPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 168 | 🔍 | Search | other | `🔍 Nom ou fonction...` |

### frontend-depot/src/modules/hotel/pages/ReservationsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 148 | 🔍 | Search | other | `🔍 Client...` |

### frontend-depot/src/modules/hotel/pages/ServicesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 175 | 🔍 | Search | other | `🔍 Chambre, type...` |

### frontend-depot/src/modules/immobilier/pages/BiensPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 135 | 🔍 | Search | other | `🔍 Nom, adresse ou type...` |

### frontend-depot/src/modules/immobilier/pages/ContratsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 137 | 🔍 | Search | other | `🔍 Bien ou locataire...` |

### frontend-depot/src/modules/immobilier/pages/DepensesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 167 | 🔍 | Search | other | `🔍 Libell ou catgorie...` |

### frontend-depot/src/modules/immobilier/pages/DocumentsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 167 | 🔍 | Search | other | `🔍 Titre, type ou bien...` |

### frontend-depot/src/modules/immobilier/pages/InterventionsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 135 | 🔍 | Search | other | `🔍 Bien, type...` |

### frontend-depot/src/modules/immobilier/pages/LocatairesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 135 | 🔍 | Search | other | `🔍 Nom, email ou tlphone...` |

### frontend-depot/src/modules/immobilier/pages/LoyersPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 172 | 🔍 | Search | other | `🔍 Bien, locataire ou mois...` |

### frontend-depot/src/modules/immobilier/pages/PersonnelPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 163 | 🔍 | Search | other | `🔍 Nom, poste...` |

### frontend-depot/src/modules/immobilier/pages/VisitesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 167 | 🔍 | Search | other | `🔍 Client, bien...` |

### frontend-depot/src/modules/librairie/pages/CaissePage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 117 | 🔍 | Search | other | `🔍 Libell...` |

### frontend-depot/src/modules/librairie/pages/CataloguePage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 161 | 🔍 | Search | other | `🔍 Titre, auteur, ISBN...` |

### frontend-depot/src/modules/librairie/pages/ClientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 146 | 🔍 | Search | other | `🔍 Nom, email...` |

### frontend-depot/src/modules/librairie/pages/CommandesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 161 | 🔍 | Search | other | `🔍 Article, fournisseur...` |

### frontend-depot/src/modules/librairie/pages/DepensesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 144 | 🔍 | Search | other | `🔍 Libell...` |

### frontend-depot/src/modules/librairie/pages/FournisseursPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 146 | 🔍 | Search | other | `🔍 Nom, email...` |

### frontend-depot/src/modules/librairie/pages/ParametresPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 65 | ✓ | Check | other | `Paramètres enregistrés ✓` |

### frontend-depot/src/modules/librairie/pages/PersonnelPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 146 | 🔍 | Search | other | `🔍 Nom, poste...` |

### frontend-depot/src/modules/librairie/pages/StockPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 146 | 🔍 | Search | other | `🔍 Article...` |

### frontend-depot/src/modules/librairie/pages/VentesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 161 | 🔍 | Search | other | `🔍 Article, client...` |

### frontend-depot/src/modules/pharmacie/pages/FournisseursPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 150 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/pharmacie/pages/LotsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 152 | 🔍 | Search | other | `🔍 Rechercher un lot ou mdicament...` |

### frontend-depot/src/modules/pharmacie/pages/MedicamentsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 154 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/pharmacie/pages/OrdonnancesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 178 | 🔍 | Search | other | `🔍 Rechercher une ordonnance...` |

### frontend-depot/src/modules/pharmacie/pages/PatientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 150 | 🔍 | Search | other | `🔍 Rechercher un patient...` |

### frontend-depot/src/modules/quincaillerie/pages/ChantiersPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 173 | 🔍 | Search | other | `🔍 Nom...` |

### frontend-depot/src/modules/quincaillerie/pages/ClientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 165 | 🔍 | Search | other | `🔍 Nom ou tlphone...` |

### frontend-depot/src/modules/quincaillerie/pages/DepensesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 168 | 🔍 | Search | other | `🔍 Libell ou catgorie...` |

### frontend-depot/src/modules/quincaillerie/pages/DevisPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 168 | 🔍 | Search | other | `🔍 Libell...` |

### frontend-depot/src/modules/quincaillerie/pages/FournisseursPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 165 | 🔍 | Search | other | `🔍 Nom ou spcialit...` |

### frontend-depot/src/modules/quincaillerie/pages/ProduitsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 169 | 🔍 | Search | other | `🔍 Dsignation ou rfrence...` |

### frontend-depot/src/modules/quincaillerie/pages/StockPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 170 | 🔍 | Search | other | `🔍 Produit...` |

### frontend-depot/src/modules/quincaillerie/pages/VentesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 173 | 🔍 | Search | other | `🔍 Produit...` |

### frontend-depot/src/modules/pharmacie/pages/StockPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 162 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/restaurant/pages/ClientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 136 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/restaurant/pages/CommandesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 169 | 🔍 | Search | other | `🔍 Table ou articles...` |

### frontend-depot/src/modules/restaurant/pages/FournisseursPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 136 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/restaurant/pages/MenuPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 139 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/restaurant/pages/ReservationsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 136 | 🔍 | Search | other | `🔍 Client...` |

### frontend-depot/src/modules/restaurant/pages/StockPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 139 | 🔍 | Search | other | `🔍 Article...` |

### frontend-depot/src/modules/supermarche/pages/ClientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 72 | 🔍 | Search | other | `🔍 Rechercher un client...` |

### frontend-depot/src/modules/supermarche/pages/FournisseursPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 54 | 🔍 | Search | other | `🔍 Rechercher un fournisseur...` |

### frontend-depot/src/modules/supermarche/pages/StockPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 145 | 🔍 | Search | other | `🔍 Rechercher...` |

### frontend-depot/src/modules/supermarche/pages/RayonsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 71 | 🔍 | Search | other | `🔍 Rechercher un rayon...` |

### frontend-depot/src/modules/telephonie/pages/AccessoiresPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 172 | 🔍 | Search | other | `🔍 Dsignation ou type...` |

### frontend-depot/src/modules/telephonie/pages/ClientsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 139 | 🔍 | Search | other | `🔍 Nom ou tlphone...` |

### frontend-depot/src/modules/telephonie/pages/DepensesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 169 | 🔍 | Search | other | `🔍 Libell ou catgorie...` |

### frontend-depot/src/modules/telephonie/pages/FournisseursPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 139 | 🔍 | Search | other | `🔍 Nom ou spcialit...` |

### frontend-depot/src/modules/telephonie/pages/RechargesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 172 | 🔍 | Search | other | `🔍 Numro, oprateur...` |

### frontend-depot/src/modules/telephonie/pages/ReparationsPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 144 | 🔍 | Search | other | `🔍 Panne, tlphone...` |

### frontend-depot/src/modules/telephonie/pages/StockPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 174 | 🔍 | Search | other | `🔍 Article...` |

### frontend-depot/src/modules/telephonie/pages/TelephonesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 143 | 🔍 | Search | other | `🔍 Modle, marque, IMEI...` |

### frontend-depot/src/modules/telephonie/pages/VentesPage.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 177 | 🔍 | Search | other | `🔍 Tlphone ou accessoire...` |

### frontend-depot/src/shared/components/forms/FormModal.jsx (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 3 | 💾 | Save | other | `💾` |

### backend-depot/src/catalogue/catalogue.service.ts (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 18 | 📦 | Package | other | `📦` |

### backend-depot/src/common/depot-scope.service.ts (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 22 | ⚠ | AlertTriangle | other | `⚠️ Requête sans tenantId détectée - exécution en mode ouvert.` |

### backend-depot/src/billing/services/subscription-lifecycle.service.ts (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 44 | ⚠ | AlertTriangle | other | `⚠️ DISABLE_SUBSCRIPTION_CHECKS actif — CRON lifecycle ignoré` |

### backend-depot/src/modules/boutique/boutique.service.ts (1)

| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |
|---|---|---|---|---|
| 769 | 🏷 | Tag | other | `🏷️` |

