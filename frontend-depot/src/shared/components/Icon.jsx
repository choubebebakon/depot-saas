import React from 'react';
import * as LucideIcons from 'lucide-react';

const ICON_MAP = {
  // Dashboard & Navigation
  LayoutDashboard: LucideIcons.LayoutDashboard,
  BarChart3: LucideIcons.BarChart3,
  TrendingUp: LucideIcons.TrendingUp,
  Settings: LucideIcons.Settings,
  Cog: LucideIcons.Cog,
  
  // Business & Commerce
  Package: LucideIcons.Package,
  ShoppingBag: LucideIcons.ShoppingBag,
  ShoppingCart: LucideIcons.ShoppingCart,
  Tag: LucideIcons.Tag,
  Receipt: LucideIcons.Receipt,
  DollarSign: LucideIcons.DollarSign,
  Wallet: LucideIcons.Wallet,
  Factory: LucideIcons.Factory,
  Building: LucideIcons.Building,
  Building2: LucideIcons.Building2,
  Store: LucideIcons.Store,
  
  // People & Users
  Users: LucideIcons.Users,
  User: LucideIcons.User,
  
  // Transport & Logistics
  Truck: LucideIcons.Truck,
  Car: LucideIcons.Car,
  Wrench: LucideIcons.Wrench,
  WrenchIcon: LucideIcons.Wrench,
  
  // Food & Beverage
  Utensils: LucideIcons.Utensils,
  Cookie: LucideIcons.Cookie,
  IceCream: LucideIcons.IceCream,
  ChefHat: LucideIcons.ChefHat,
  Wheat: LucideIcons.Wheat,
  
  // Medical & Health
  Pill: LucideIcons.Pill,
  Hospital: LucideIcons.Hospital,
  Stethoscope: LucideIcons.Stethoscope,
  Activity: LucideIcons.Activity,
  Syringe: LucideIcons.Syringe,
  Dna: LucideIcons.Dna,
  
  // Technology
  Smartphone: LucideIcons.Smartphone,
  Headphones: LucideIcons.Headphones,
  Battery: LucideIcons.Battery,
  Laptop: LucideIcons.Laptop,
  
  // Files & Documents
  FileText: LucideIcons.FileText,
  Clipboard: LucideIcons.Clipboard,
  BookOpen: LucideIcons.BookOpen,
  FolderOpen: LucideIcons.FolderOpen,
  Library: LucideIcons.Library,
  Receipt: LucideIcons.Receipt,
  
  // Time & Calendar
  Clock: LucideIcons.Clock,
  Calendar: LucideIcons.Calendar,
  CalendarDays: LucideIcons.CalendarDays,
  
  // Numbers & Data
  Hash: LucideIcons.Hash,
  
  // Actions
  RefreshCw: LucideIcons.RefreshCw,
  RotateCcw: LucideIcons.RotateCcw,
  
  // Construction & Industry
  HardHat: LucideIcons.HardHat,
  Hammer: LucideIcons.Hammer,
  
  // Services
  Shirt: LucideIcons.Shirt,
  Scissors: LucideIcons.Scissors,
  SprayCan: LucideIcons.SprayCan,
  Gift: LucideIcons.Gift,
  
  // Agriculture
  Tractor: LucideIcons.Tractor,
  PawPrint: LucideIcons.PawPrint,
  IceCream: LucideIcons.IceCream,
  Library: LucideIcons.Library,
  
  // Real Estate
  Home: LucideIcons.Home,
  Hotel: LucideIcons.Hotel,
  Bed: LucideIcons.Bed,
  Key: LucideIcons.Key,
  FileCheck: LucideIcons.FileCheck,
  Eye: LucideIcons.Eye,
  
  // Hospitality
  Bell: LucideIcons.Bell,
  
  // Alerts & Notifications
  AlertTriangle: LucideIcons.AlertTriangle,
  AlertCircle: LucideIcons.AlertCircle,
  CheckCircle: LucideIcons.CheckCircle,
  XCircle: LucideIcons.XCircle,
  Check: LucideIcons.Check,
  X: LucideIcons.X,
  Circle: LucideIcons.Circle,
  Ban: LucideIcons.Ban,
  Sparkles: LucideIcons.Sparkles,
  
  // Communication
  Mail: LucideIcons.Mail,
  MessageSquare: LucideIcons.MessageSquare,
  
  // Other
  ShieldCheck: LucideIcons.ShieldCheck,
  LifeBuoy: LucideIcons.LifeBuoy,
  Menu: LucideIcons.Menu,
  MenuIcon: LucideIcons.Menu,
  X: LucideIcons.X,
  ChevronDown: LucideIcons.ChevronDown,
  ChevronRight: LucideIcons.ChevronRight,
  ChevronLeft: LucideIcons.ChevronLeft,
  Search: LucideIcons.Search,
  Plus: LucideIcons.Plus,
  Minus: LucideIcons.Minus,
  Trash: LucideIcons.Trash,
  Edit: LucideIcons.Edit,
  Download: LucideIcons.Download,
  Upload: LucideIcons.Upload,
  Printer: LucideIcons.Printer,
  Share: LucideIcons.Share,
  Copy: LucideIcons.Copy,
  Save: LucideIcons.Save,
  LogOut: LucideIcons.LogOut,
  LogIn: LucideIcons.LogIn,
  UserCircle: LucideIcons.UserCircle,
  Shield: LucideIcons.Shield,
  Lock: LucideIcons.Lock,
  Unlock: LucideIcons.Unlock,
  Info: LucideIcons.Info,
  HelpCircle: LucideIcons.HelpCircle,
  Zap: LucideIcons.Zap,
  Flame: LucideIcons.Flame,
  Star: LucideIcons.Star,
  Heart: LucideIcons.Heart,
  ThumbsUp: LucideIcons.ThumbsUp,
  ThumbsDown: LucideIcons.ThumbsDown,
  Rocket: LucideIcons.Rocket,
  Trophy: LucideIcons.Trophy,
  Globe: LucideIcons.Globe,
  CreditCard: LucideIcons.CreditCard,
  Store: LucideIcons.Store,
  Building2: LucideIcons.Building2,
};

export default function Icon({ name, size = 20, className = '', ...props }) {
  const IconComponent = ICON_MAP[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in ICON_MAP`);
    return null;
  }
  
  return <IconComponent size={size} className={className} {...props} />;
}

export { ICON_MAP };
