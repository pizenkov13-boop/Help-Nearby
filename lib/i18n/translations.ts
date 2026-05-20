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
  | "impactCounter"
  | "filtersTitle"
  | "filterCountry"
  | "filterCountryAll"
  | "filterCategory"
  | "filterCategoryAll"
  | "filterOpenNow"
  | "searchPlaceholder"
  | "searchClear"
  | "searchNoResultsFor"
  | "liteModeNotice"
  | "switchToFullVersion"
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
  | "reviewsFormCountry"
  | "reviewsFormRating"
  | "reviewsFormMessage"
  | "reviewsFormSubmit"
  | "reviewsFormSuccess"
  | "reviewsFormRequired"
  | "reviewsListTitle"
  | "reviewsListEmpty"
  | "reviewsLoading"
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
  | "routeTransitNote"
  | "emergencyHelp"
  | "emergencyTitle"
  | "emergencySubtitle"
  | "emergencyLocating"
  | "emergencyLoading"
  | "emergencyNoResults"
  | "emergencyCall"
  | "emergencyClose"
  | "emergencyLocationDenied"
  | "emergencyLoadError"
  | "emergencyRetry"
  | "emergencyNoPhone";

const en: Record<TranslationKey, string> = {
  brand: "Help Nearby",
  navHome: "Home",
  navMap: "Map",
  navAbout: "About",
  heroTitle: "Find Help Near You",
  heroSubtitle:
    "Discover food banks, shelters, medical aid, clothing donations, and volunteer opportunities in your area.",
  heroCta: "Find Help Near You",
  impactCounter: "{count} people found help today",
  filtersTitle: "Filters",
  filterCountry: "Country",
  filterCountryAll: "All countries",
  filterCategory: "Category",
  filterCategoryAll: "All categories",
  filterOpenNow: "Open now",
  searchPlaceholder: "Search by name, city or address...",
  searchClear: "Clear search",
  searchNoResultsFor: '0 results for "{query}"',
  liteModeNotice: "Lite mode active — optimized for slow connection",
  switchToFullVersion: "Switch to full version",
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
  reviewsFormCountry: "Your country",
  reviewsFormRating: "Rating",
  reviewsFormMessage: "Your feedback or suggestion",
  reviewsFormSubmit: "Submit feedback",
  reviewsFormSuccess: "Thank you! Your feedback has been received.",
  reviewsFormRequired: "Please enter your name, country, and message.",
  reviewsListTitle: "Community feedback",
  reviewsListEmpty: "No reviews yet. Be the first to share your experience.",
  reviewsLoading: "Loading reviews…",
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
  emergencyHelp: "Emergency Help",
  emergencyTitle: "24/7 Emergency Help",
  emergencySubtitle: "Open now — nearest help first. Call immediately if you are in crisis.",
  emergencyLocating: "Finding your location…",
  emergencyLoading: "Loading 24/7 help nearby…",
  emergencyNoResults:
    "No 24/7 organizations found near you. Try the full map or call your local emergency number.",
  emergencyCall: "Call now",
  emergencyClose: "Close",
  emergencyLocationDenied:
    "Location access is required to find the nearest 24/7 help. Please allow location and try again.",
  emergencyLoadError: "Could not load help listings. Please try again.",
  emergencyRetry: "Try again",
  emergencyNoPhone: "No phone listed — visit in person if possible.",
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
  impactCounter: "{count} человек получили помощь сегодня",
  filtersTitle: "Фильтры",
  filterCountry: "Страна",
  filterCountryAll: "Все страны",
  filterCategory: "Категория",
  filterCategoryAll: "Все категории",
  filterOpenNow: "Открыто сейчас",
  searchPlaceholder: "Поиск по названию, городу или адресу...",
  searchClear: "Очистить поиск",
  searchNoResultsFor: '0 результатов по запросу «{query}»',
  liteModeNotice: "Лёгкий режим — оптимизирован для медленного интернета",
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
  callNow: "Позвонить",
  mapTitle: "Карта рядом",
  chatTitle: "ИИ-помощник",
  chatPlaceholder: "Спросите о помощи рядом…",
  chatSend: "Отправить",
  chatWelcome: "Привет! Я помогу найти помощь рядом.",
  chatHint: "Спросите о еде, приюте, медицине и другом.",
  emergencyHelp: "Экстренная помощь",
  emergencyTitle: "Круглосуточная помощь 24/7",
  emergencySubtitle:
    "Открыто сейчас — ближайшая помощь первой. Звоните немедленно, если вы в кризисе.",
  emergencyLocating: "Определяем ваше местоположение…",
  emergencyLoading: "Загрузка помощи 24/7 рядом…",
  emergencyNoResults:
    "Рядом нет организаций 24/7. Откройте карту или позвоните по местному номеру экстренной помощи.",
  emergencyCall: "Позвонить",
  emergencyClose: "Закрыть",
  emergencyLocationDenied:
    "Нужен доступ к геолокации, чтобы найти ближайшую помощь 24/7. Разрешите доступ и повторите.",
  emergencyLoadError: "Не удалось загрузить список. Попробуйте снова.",
  emergencyRetry: "Повторить",
  emergencyNoPhone: "Телефон не указан — обратитесь лично, если возможно.",
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
  impactCounter: "{count} personas encontraron ayuda hoy",
  filtersTitle: "Filtros",
  filterCountry: "País",
  filterCountryAll: "Todos los países",
  filterCategory: "Categoría",
  filterCategoryAll: "Todas las categorías",
  filterOpenNow: "Abierto ahora",
  searchPlaceholder: "Buscar por nombre, ciudad o dirección...",
  searchClear: "Borrar búsqueda",
  searchNoResultsFor: '0 resultados para "{query}"',
  liteModeNotice: "Modo lite activo — optimizado para conexión lenta",
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
  callNow: "Llamar ahora",
  mapTitle: "Mapa cercano",
  chatTitle: "Asistente IA",
  chatPlaceholder: "Pregunta sobre ayuda cercana…",
  chatSend: "Enviar",
  chatWelcome: "¡Hola! Puedo ayudarte a encontrar asistencia cercana.",
  chatHint: "Pregúntame sobre comida, refugio, ayuda médica y más.",
  emergencyHelp: "Ayuda de emergencia",
  emergencyTitle: "Ayuda de emergencia 24/7",
  emergencySubtitle:
    "Abierto ahora — la ayuda más cercana primero. Llama de inmediato si estás en crisis.",
  emergencyLocating: "Buscando tu ubicación…",
  emergencyLoading: "Cargando ayuda 24/7 cercana…",
  emergencyNoResults:
    "No hay organizaciones 24/7 cerca. Usa el mapa completo o llama al número de emergencia local.",
  emergencyCall: "Llamar ahora",
  emergencyClose: "Cerrar",
  emergencyLocationDenied:
    "Se necesita tu ubicación para encontrar ayuda 24/7 cercana. Permite el acceso e inténtalo de nuevo.",
  emergencyLoadError: "No se pudo cargar la lista. Inténtalo de nuevo.",
  emergencyRetry: "Reintentar",
  emergencyNoPhone: "Sin teléfono — acude en persona si es posible.",
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
  impactCounter: "{count} personnes ont trouvé de l'aide aujourd'hui",
  filtersTitle: "Filtres",
  filterCountry: "Pays",
  filterCountryAll: "Tous les pays",
  filterCategory: "Catégorie",
  filterCategoryAll: "Toutes les catégories",
  filterOpenNow: "Ouvert maintenant",
  searchPlaceholder: "Rechercher par nom, ville ou adresse...",
  searchClear: "Effacer la recherche",
  searchNoResultsFor: '0 résultat pour « {query} »',
  liteModeNotice: "Mode lite actif — optimisé pour connexion lente",
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
  callNow: "Appeler",
  mapTitle: "Carte à proximité",
  chatTitle: "Assistant IA",
  chatPlaceholder: "Demandez de l'aide à proximité…",
  chatSend: "Envoyer",
  chatWelcome: "Bonjour ! Je peux vous aider à trouver de l'aide.",
  chatHint: "Demandez-moi nourriture, abri, aide médicale, etc.",
  emergencyHelp: "Aide d'urgence",
  emergencyTitle: "Aide d'urgence 24h/24",
  emergencySubtitle:
    "Ouvert maintenant — l'aide la plus proche en premier. Appelez immédiatement en cas de crise.",
  emergencyLocating: "Localisation en cours…",
  emergencyLoading: "Chargement de l'aide 24h/24 à proximité…",
  emergencyNoResults:
    "Aucune organisation 24h/24 à proximité. Utilisez la carte complète ou le numéro d'urgence local.",
  emergencyCall: "Appeler",
  emergencyClose: "Fermer",
  emergencyLocationDenied:
    "La localisation est requise pour trouver l'aide 24h/24 la plus proche. Autorisez-la et réessayez.",
  emergencyLoadError: "Impossible de charger la liste. Réessayez.",
  emergencyRetry: "Réessayer",
  emergencyNoPhone: "Pas de téléphone — rendez-vous sur place si possible.",
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
  impactCounter: "{count} Menschen haben heute Hilfe gefunden",
  filtersTitle: "Filter",
  filterCountry: "Land",
  filterCountryAll: "Alle Länder",
  filterCategory: "Kategorie",
  filterCategoryAll: "Alle Kategorien",
  filterOpenNow: "Jetzt geöffnet",
  searchPlaceholder: "Suche nach Name, Stadt oder Adresse...",
  searchClear: "Suche löschen",
  searchNoResultsFor: '0 Ergebnisse für "{query}"',
  liteModeNotice: "Lite-Modus aktiv — für langsame Verbindungen optimiert",
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
  callNow: "Jetzt anrufen",
  mapTitle: "Karte in der Nähe",
  chatTitle: "KI-Assistent",
  chatPlaceholder: "Fragen Sie nach Hilfe in der Nähe…",
  chatSend: "Senden",
  chatWelcome: "Hallo! Ich helfe Ihnen, Hilfe in der Nähe zu finden.",
  chatHint: "Fragen Sie nach Essen, Unterkunft, medizinischer Hilfe usw.",
  emergencyHelp: "Notfallhilfe",
  emergencyTitle: "24/7 Notfallhilfe",
  emergencySubtitle:
    "Jetzt geöffnet — nächste Hilfe zuerst. Rufen Sie sofort an, wenn Sie in einer Krise sind.",
  emergencyLocating: "Standort wird ermittelt…",
  emergencyLoading: "24/7-Hilfe in der Nähe wird geladen…",
  emergencyNoResults:
    "Keine 24/7-Organisationen in der Nähe. Nutzen Sie die Karte oder die örtliche Notrufnummer.",
  emergencyCall: "Jetzt anrufen",
  emergencyClose: "Schließen",
  emergencyLocationDenied:
    "Standortzugriff ist nötig, um die nächste 24/7-Hilfe zu finden. Bitte erlauben und erneut versuchen.",
  emergencyLoadError: "Liste konnte nicht geladen werden. Bitte erneut versuchen.",
  emergencyRetry: "Erneut versuchen",
  emergencyNoPhone: "Keine Telefonnummer — besuchen Sie vor Ort, wenn möglich.",
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
  impactCounter: "今天已有 {count} 人获得帮助",
  filtersTitle: "筛选",
  filterCountry: "国家",
  filterCountryAll: "所有国家",
  filterCategory: "类别",
  filterCategoryAll: "所有类别",
  filterOpenNow: "现在营业",
  searchPlaceholder: "按名称、城市或地址搜索...",
  searchClear: "清除搜索",
  searchNoResultsFor: "0 个与「{query}」匹配的结果",
  liteModeNotice: "轻量模式已启用 — 针对慢速网络优化",
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
  callNow: "立即拨打",
  mapTitle: "附近地图",
  chatTitle: "AI 助手",
  chatPlaceholder: "询问附近的帮助…",
  chatSend: "发送",
  chatWelcome: "您好！我可以帮您找到附近的援助。",
  chatHint: "询问食物、庇护所、医疗援助等。",
  emergencyHelp: "紧急求助",
  emergencyTitle: "24/7 紧急援助",
  emergencySubtitle: "正在开放 — 优先显示最近援助。如遇危机请立即致电。",
  emergencyLocating: "正在获取您的位置…",
  emergencyLoading: "正在加载附近 24/7 援助…",
  emergencyNoResults: "附近未找到 24/7 组织。请使用完整地图或拨打当地急救电话。",
  emergencyCall: "立即拨打",
  emergencyClose: "关闭",
  emergencyLocationDenied: "需要位置权限以查找最近的 24/7 援助。请允许后重试。",
  emergencyLoadError: "无法加载列表，请重试。",
  emergencyRetry: "重试",
  emergencyNoPhone: "未提供电话 — 如可能请亲自前往。",
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
  impactCounter: "{count} شخصاً وجدوا مساعدة اليوم",
  filtersTitle: "الفلاتر",
  filterCountry: "البلد",
  filterCountryAll: "جميع البلدان",
  filterCategory: "الفئة",
  filterCategoryAll: "جميع الفئات",
  filterOpenNow: "مفتوح الآن",
  searchPlaceholder: "ابحث بالاسم أو المدينة أو العنوان...",
  searchClear: "مسح البحث",
  searchNoResultsFor: '0 نتائج لـ "{query}"',
  liteModeNotice: "الوضع الخفيف مفعّل — مُحسَّن للاتصال البطيء",
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
  callNow: "اتصل الآن",
  mapTitle: "خريطة قريبة",
  chatTitle: "مساعد الذكاء الاصطناعي",
  chatPlaceholder: "اسأل عن المساعدة القريبة…",
  chatSend: "إرسال",
  chatWelcome: "مرحباً! يمكنني مساعدتك في إيجاد المساعدة القريبة.",
  chatHint: "اسألني عن الطعام والمأوى والمساعدة الطبية والمزيد.",
  emergencyHelp: "مساعدة طارئة",
  emergencyTitle: "مساعدة طارئة على مدار الساعة",
  emergencySubtitle:
    "مفتوح الآن — الأقرب أولاً. اتصل فوراً إذا كنت في أزمة.",
  emergencyLocating: "جاري تحديد موقعك…",
  emergencyLoading: "جاري تحميل المساعدة على مدار الساعة القريبة…",
  emergencyNoResults:
    "لا توجد منظمات على مدار الساعة بالقرب منك. استخدم الخريطة الكاملة أو رقم الطوارئ المحلي.",
  emergencyCall: "اتصل الآن",
  emergencyClose: "إغلاق",
  emergencyLocationDenied:
    "يلزم الوصول إلى الموقع للعثور على أقرب مساعدة. اسمح بالموقع وحاول مرة أخرى.",
  emergencyLoadError: "تعذر تحميل القائمة. حاول مرة أخرى.",
  emergencyRetry: "إعادة المحاولة",
  emergencyNoPhone: "لا يوجد هاتف — زُر المكان شخصياً إن أمكن.",
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

export function formatSearchNoResults(
  language: LanguageCode,
  query: string,
): string {
  const template =
    translations[language].searchNoResultsFor ??
    translations.en.searchNoResultsFor;
  return template.replace("{query}", query);
}

export function formatImpactCounter(
  language: LanguageCode,
  count: number,
): string {
  const template =
    translations[language].impactCounter ?? translations.en.impactCounter;
  return template.replace("{count}", String(count));
}
