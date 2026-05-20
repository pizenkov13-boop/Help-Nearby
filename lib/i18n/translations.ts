import type { LanguageCode } from "@/lib/types";

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
  { code: "zh", label: "ZH" },
  { code: "ar", label: "AR" },
];

export type TranslationKey =
  | "brand"
  | "navHome"
  | "navMap"
  | "navAbout"
  | "heroTitle"
  | "heroSubtitle"
  | "heroCta"
  | "filtersTitle"
  | "filterCountry"
  | "filterCountryAll"
  | "filterCategory"
  | "filterCategoryAll"
  | "filterOpenNow"
  | "categoryFood"
  | "categoryShelter"
  | "categoryMedical"
  | "categoryClothing"
  | "categoryVolunteer"
  | "resultsCount"
  | "noResults"
  | "openNow"
  | "closed"
  | "getDirections"
  | "mapTitle"
  | "chatTitle"
  | "chatPlaceholder"
  | "chatSend"
  | "chatWelcome"
  | "chatHint"
  | "locating"
  | "locationError"
  | "yourLocation"
  | "defaultLocationNotice"
  | "navWhy"
  | "navReviews"
  | "aboutTitle"
  | "aboutSubtitle"
  | "aboutMissionTitle"
  | "aboutMissionText"
  | "aboutVisionTitle"
  | "aboutVisionText"
  | "aboutValuesTitle"
  | "aboutValuesText"
  | "whyTitle"
  | "whySubtitle"
  | "whyCard1Title"
  | "whyCard1Text"
  | "whyCard2Title"
  | "whyCard2Text"
  | "whyCard3Title"
  | "whyCard3Text"
  | "whyStoryTitle"
  | "whyStoryText"
  | "reviewsTitle"
  | "reviewsSubtitle"
  | "reviewsFormName"
  | "reviewsFormEmail"
  | "reviewsFormRating"
  | "reviewsFormMessage"
  | "reviewsFormSubmit"
  | "reviewsFormSuccess"
  | "reviewsFormRequired"
  | "callNow"
  | "share"
  | "copied"
  | "backToHome"
  | "description"
  | "contactDetails"
  | "chatError"
  | "chatTyping"
  | "verified"
  | "loadingNearby"
  | "routeWalking"
  | "routeDriving"
  | "routeTransit"
  | "routeTo"
  | "routeClear"
  | "routeLoading"
  | "routeDistance"
  | "routeWalkTime"
  | "routeDriveTime"
  | "routeTransitTime"
  | "routeTransitNote";

const en: Record<TranslationKey, string> = {
  brand: "Help Nearby",
  navHome: "Home",
  navMap: "Map",
  navAbout: "About",
  heroTitle: "Find Help Near You",
  heroSubtitle:
    "Discover food banks, shelters, medical aid, clothing donations, and volunteer opportunities in your area.",
  heroCta: "Find Help Near You",
  filtersTitle: "Filters",
  filterCountry: "Country",
  filterCountryAll: "All countries",
  filterCategory: "Category",
  filterCategoryAll: "All categories",
  filterOpenNow: "Open now",
  categoryFood: "Food",
  categoryShelter: "Shelter",
  categoryMedical: "Medical",
  categoryClothing: "Clothing",
  categoryVolunteer: "Volunteer",
  resultsCount: "organizations found",
  noResults: "No organizations match your filters yet.",
  openNow: "Open now",
  closed: "Closed",
  getDirections: "Get Directions",
  mapTitle: "Nearby map",
  chatTitle: "AI Assistant",
  chatPlaceholder: "Ask about help nearby…",
  chatSend: "Send",
  chatWelcome: "Hi! I can help you find assistance nearby.",
  chatHint: "Ask me about food, shelter, medical aid, and more.",
  locating: "Getting your location…",
  locationError: "Unable to get your location. Please enable location access.",
  yourLocation: "You are here",
  defaultLocationNotice: "Showing default location",
  navWhy: "Why It Matters",
  navReviews: "Reviews",
  aboutTitle: "About Us",
  aboutSubtitle: "Connecting people with life-saving resources in their community.",
  aboutMissionTitle: "Our Mission",
  aboutMissionText:
    "Help Nearby makes it simple to find food banks, shelters, medical aid, clothing donations, and volunteer opportunities — wherever you are.",
  aboutVisionTitle: "Our Vision",
  aboutVisionText:
    "A world where anyone facing hardship can locate trusted help within minutes, in their own language.",
  aboutValuesTitle: "What We Believe",
  aboutValuesText:
    "Dignity, accessibility, and community. We build tools that respect privacy, work on any device, and put real organizations on the map.",
  whyTitle: "Why It Matters",
  whySubtitle: "Behind every pin on the map is a person who needs support today.",
  whyCard1Title: "Crisis Is Closer Than You Think",
  whyCard1Text:
    "Millions face food insecurity and housing instability. Quick access to nearby aid can change outcomes.",
  whyCard2Title: "Information Saves Time",
  whyCard2Text:
    "Searching scattered websites wastes precious hours. One map brings verified places together.",
  whyCard3Title: "Communities Want to Help",
  whyCard3Text:
    "Volunteers and donors are ready — they just need a clear way to find where help is needed most.",
  whyStoryTitle: "Every Search Tells a Story",
  whyStoryText:
    "Whether someone needs a warm meal, a safe place to sleep, or medical care, Help Nearby exists so no one has to navigate crisis alone.",
  reviewsTitle: "Reviews & Suggestions",
  reviewsSubtitle: "Share your experience or ideas to improve Help Nearby.",
  reviewsFormName: "Your name",
  reviewsFormEmail: "Email (optional)",
  reviewsFormRating: "Rating",
  reviewsFormMessage: "Your feedback or suggestion",
  reviewsFormSubmit: "Submit feedback",
  reviewsFormSuccess: "Thank you! Your feedback has been received.",
  reviewsFormRequired: "Please enter your name and message.",
  callNow: "Call Now",
  share: "Share",
  copied: "Copied!",
  backToHome: "Back to home",
  description: "About",
  contactDetails: "Contact & hours",
  chatError: "Sorry, I couldn't respond right now. Please try again in a moment.",
  chatTyping: "Typing…",
  verified: "Verified",
  loadingNearby: "Finding more nearby…",
  routeWalking: "Walking",
  routeDriving: "Driving",
  routeTransit: "Transit",
  routeTo: "Directions to",
  routeClear: "Clear route",
  routeLoading: "Calculating route…",
  routeDistance: "Distance",
  routeWalkTime: "Walking time",
  routeDriveTime: "Driving time",
  routeTransitTime: "Est. time",
  routeTransitNote: "Transit uses driving estimate (OSRM does not support public transit).",
};

const ru: Record<TranslationKey, string> = {
  ...en,
  brand: "Помощь рядом",
  navHome: "Главная",
  navMap: "Карта",
  navAbout: "О нас",
  heroTitle: "Найдите помощь рядом",
  heroSubtitle:
    "Найдите продовольственные банки, приюты, медицинскую помощь, одежду и волонтёрские возможности в вашем районе.",
  heroCta: "Найти помощь рядом",
  filtersTitle: "Фильтры",
  filterCountry: "Страна",
  filterCountryAll: "Все страны",
  filterCategory: "Категория",
  filterCategoryAll: "Все категории",
  filterOpenNow: "Открыто сейчас",
  categoryFood: "Еда",
  categoryShelter: "Приют",
  categoryMedical: "Медицина",
  categoryClothing: "Одежда",
  categoryVolunteer: "Волонтёры",
  resultsCount: "организаций найдено",
  noResults: "Пока нет организаций по вашим фильтрам.",
  openNow: "Открыто",
  closed: "Закрыто",
  getDirections: "Маршрут",
  mapTitle: "Карта рядом",
  chatTitle: "ИИ-помощник",
  chatPlaceholder: "Спросите о помощи рядом…",
  chatSend: "Отправить",
  chatWelcome: "Привет! Я помогу найти помощь рядом.",
  chatHint: "Спросите о еде, приюте, медицине и другом.",
};

const es: Record<TranslationKey, string> = {
  ...en,
  brand: "Ayuda Cerca",
  navHome: "Inicio",
  navMap: "Mapa",
  navAbout: "Acerca de",
  heroTitle: "Encuentra ayuda cerca de ti",
  heroSubtitle:
    "Descubre bancos de alimentos, refugios, ayuda médica, ropa y oportunidades de voluntariado en tu zona.",
  heroCta: "Encuentra ayuda cerca",
  filtersTitle: "Filtros",
  filterCountry: "País",
  filterCountryAll: "Todos los países",
  filterCategory: "Categoría",
  filterCategoryAll: "Todas las categorías",
  filterOpenNow: "Abierto ahora",
  categoryFood: "Comida",
  categoryShelter: "Refugio",
  categoryMedical: "Médico",
  categoryClothing: "Ropa",
  categoryVolunteer: "Voluntariado",
  resultsCount: "organizaciones encontradas",
  noResults: "Aún no hay organizaciones que coincidan con tus filtros.",
  openNow: "Abierto",
  closed: "Cerrado",
  getDirections: "Cómo llegar",
  mapTitle: "Mapa cercano",
  chatTitle: "Asistente IA",
  chatPlaceholder: "Pregunta sobre ayuda cercana…",
  chatSend: "Enviar",
  chatWelcome: "¡Hola! Puedo ayudarte a encontrar asistencia cercana.",
  chatHint: "Pregúntame sobre comida, refugio, ayuda médica y más.",
};

const fr: Record<TranslationKey, string> = {
  ...en,
  brand: "Aide à Proximité",
  navHome: "Accueil",
  navMap: "Carte",
  navAbout: "À propos",
  heroTitle: "Trouvez de l'aide près de vous",
  heroSubtitle:
    "Découvrez les banques alimentaires, refuges, aide médicale, vêtements et bénévolat près de chez vous.",
  heroCta: "Trouver de l'aide",
  filtersTitle: "Filtres",
  filterCountry: "Pays",
  filterCountryAll: "Tous les pays",
  filterCategory: "Catégorie",
  filterCategoryAll: "Toutes les catégories",
  filterOpenNow: "Ouvert maintenant",
  categoryFood: "Nourriture",
  categoryShelter: "Abri",
  categoryMedical: "Médical",
  categoryClothing: "Vêtements",
  categoryVolunteer: "Bénévolat",
  resultsCount: "organisations trouvées",
  noResults: "Aucune organisation ne correspond à vos filtres.",
  openNow: "Ouvert",
  closed: "Fermé",
  getDirections: "Itinéraire",
  mapTitle: "Carte à proximité",
  chatTitle: "Assistant IA",
  chatPlaceholder: "Demandez de l'aide à proximité…",
  chatSend: "Envoyer",
  chatWelcome: "Bonjour ! Je peux vous aider à trouver de l'aide.",
  chatHint: "Demandez-moi nourriture, abri, aide médicale, etc.",
};

const de: Record<TranslationKey, string> = {
  ...en,
  brand: "Hilfe in der Nähe",
  navHome: "Start",
  navMap: "Karte",
  navAbout: "Über uns",
  heroTitle: "Hilfe in Ihrer Nähe finden",
  heroSubtitle:
    "Entdecken Sie Tafeln, Unterkünfte, medizinische Hilfe, Kleidung und Freiwilligenarbeit in Ihrer Nähe.",
  heroCta: "Hilfe in der Nähe finden",
  filtersTitle: "Filter",
  filterCountry: "Land",
  filterCountryAll: "Alle Länder",
  filterCategory: "Kategorie",
  filterCategoryAll: "Alle Kategorien",
  filterOpenNow: "Jetzt geöffnet",
  categoryFood: "Essen",
  categoryShelter: "Unterkunft",
  categoryMedical: "Medizin",
  categoryClothing: "Kleidung",
  categoryVolunteer: "Freiwillige",
  resultsCount: "Organisationen gefunden",
  noResults: "Keine Organisationen entsprechen Ihren Filtern.",
  openNow: "Geöffnet",
  closed: "Geschlossen",
  getDirections: "Route",
  mapTitle: "Karte in der Nähe",
  chatTitle: "KI-Assistent",
  chatPlaceholder: "Fragen Sie nach Hilfe in der Nähe…",
  chatSend: "Senden",
  chatWelcome: "Hallo! Ich helfe Ihnen, Hilfe in der Nähe zu finden.",
  chatHint: "Fragen Sie nach Essen, Unterkunft, medizinischer Hilfe usw.",
};

const zh: Record<TranslationKey, string> = {
  ...en,
  brand: "附近援助",
  navHome: "首页",
  navMap: "地图",
  navAbout: "关于",
  heroTitle: "在附近寻找帮助",
  heroSubtitle: "发现您附近的食物银行、庇护所、医疗援助、衣物捐赠和志愿者机会。",
  heroCta: "在附近寻找帮助",
  filtersTitle: "筛选",
  filterCountry: "国家",
  filterCountryAll: "所有国家",
  filterCategory: "类别",
  filterCategoryAll: "所有类别",
  filterOpenNow: "现在营业",
  categoryFood: "食物",
  categoryShelter: "庇护所",
  categoryMedical: "医疗",
  categoryClothing: "衣物",
  categoryVolunteer: "志愿者",
  resultsCount: "个组织",
  noResults: "暂无符合筛选条件的组织。",
  openNow: "营业中",
  closed: "已关闭",
  getDirections: "获取路线",
  mapTitle: "附近地图",
  chatTitle: "AI 助手",
  chatPlaceholder: "询问附近的帮助…",
  chatSend: "发送",
  chatWelcome: "您好！我可以帮您找到附近的援助。",
  chatHint: "询问食物、庇护所、医疗援助等。",
};

const ar: Record<TranslationKey, string> = {
  ...en,
  brand: "مساعدة قريبة",
  navHome: "الرئيسية",
  navMap: "الخريطة",
  navAbout: "حول",
  heroTitle: "اعثر على المساعدة بالقرب منك",
  heroSubtitle:
    "اكتشف بنوك الطعام والملاجئ والمساعدة الطبية والملابس وفرص التطوع في منطقتك.",
  heroCta: "اعثر على المساعدة",
  filtersTitle: "الفلاتر",
  filterCountry: "البلد",
  filterCountryAll: "جميع البلدان",
  filterCategory: "الفئة",
  filterCategoryAll: "جميع الفئات",
  filterOpenNow: "مفتوح الآن",
  categoryFood: "طعام",
  categoryShelter: "مأوى",
  categoryMedical: "طبي",
  categoryClothing: "ملابس",
  categoryVolunteer: "تطوع",
  resultsCount: "منظمة",
  noResults: "لا توجد منظمات تطابق الفلاتر بعد.",
  openNow: "مفتوح",
  closed: "مغلق",
  getDirections: "الاتجاهات",
  mapTitle: "خريطة قريبة",
  chatTitle: "مساعد الذكاء الاصطناعي",
  chatPlaceholder: "اسأل عن المساعدة القريبة…",
  chatSend: "إرسال",
  chatWelcome: "مرحباً! يمكنني مساعدتك في إيجاد المساعدة القريبة.",
  chatHint: "اسألني عن الطعام والمأوى والمساعدة الطبية والمزيد.",
};

export const translations: Record<LanguageCode, Record<TranslationKey, string>> =
  {
    en,
    ru,
    es,
    fr,
    de,
    zh,
    ar,
  };
