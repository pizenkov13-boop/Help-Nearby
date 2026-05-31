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
  | "navOurStory"
  | "navHowItWorks"
  | "navTheProblem"
  | "navOurSolution"
  | "navCitiesInNeed"
  | "openMenu"
  | "languageMenu"
  | "heroTitle"
  | "heroSubtitle"
  | "heroCta"
  | "howItWorksTitle"
  | "howItWorksStep1Title"
  | "howItWorksStep1Description"
  | "howItWorksStep2Title"
  | "howItWorksStep2Description"
  | "howItWorksStep3Title"
  | "howItWorksStep3Description"
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
  | "switchToLiteVersion"
  | "showLiteMap"
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
  | "navReviewsShort"
  | "footerTagline"
  | "footerQuickLinks"
  | "footerContact"
  | "footerInstagram"
  | "footerPartnerLabel"
  | "footerPartnerTelegram"
  | "footerPartnerWebsite"
  | "footerOurPartner"
  | "footerTelegram"
  | "footerWebsite"
  | "footerPartnerName"
  | "footerSdgHeading"
  | "footerSdgDisclaimer"
  | "footerCopyright"
  | "footerMadeWith"
  | "footerForCommunities"
  | "aboutPageTitle"
  | "aboutPageSubtitle"
  | "aboutOurStory"
  | "aboutStoryText"
  | "aboutOurValues"
  | "aboutSearchDiscoverTitle"
  | "aboutSearchDiscoverText"
  | "aboutGetHelpCardTitle"
  | "aboutGetHelpCardText"
  | "aboutHowItWorksCard1Title"
  | "aboutHowItWorksCard1Text"
  | "aboutHowItWorksCard2Title"
  | "aboutHowItWorksCard2Text"
  | "aboutValueAccessibilityTitle"
  | "aboutValueAccessibilityText"
  | "aboutValueDignityTitle"
  | "aboutValueDignityText"
  | "aboutValueGlobalTitle"
  | "aboutValueGlobalText"
  | "aboutValuesCard1Title"
  | "aboutValuesCard1Text"
  | "aboutValuesCard2Title"
  | "aboutValuesCard2Text"
  | "aboutValuesCard3Title"
  | "aboutValuesCard3Text"
  | "aboutPageHeading"
  | "aboutExploreOrgs"
  | "aboutExploreOrganizations"
  | "whyPageTitle"
  | "whyPageSubtitle"
  | "whyTheProblem"
  | "whyStat700m"
  | "whyStat150m"
  | "whyStat2_3b"
  | "whyStat1Label"
  | "whyStat2Label"
  | "whyStat3Label"
  | "whyProblem1Title"
  | "whyProblem1Text"
  | "whyProblem2Title"
  | "whyProblem2Text"
  | "whyProblem3Title"
  | "whyProblem3Text"
  | "whyProblemCard1Title"
  | "whyProblemCard1Text"
  | "whyProblemCard2Title"
  | "whyProblemCard2Text"
  | "whyProblemCard3Title"
  | "whyProblemCard3Text"
  | "whyOurSolution"
  | "whySolution1Title"
  | "whySolution1Text"
  | "whySolution2Title"
  | "whySolution2Text"
  | "whySolution3Title"
  | "whySolution3Text"
  | "whySolutionCard1Title"
  | "whySolutionCard1Text"
  | "whySolutionCard2Title"
  | "whySolutionCard2Text"
  | "whySolutionCard3Title"
  | "whySolutionCard3Text"
  | "whyPageHeading"
  | "citiesTitle"
  | "citiesSubtitle"
  | "urgencyCrisis"
  | "urgencyHighNeed"
  | "urgencyVulnerable"
  | "citiesBadgeCrisis"
  | "citiesBadgeHighNeed"
  | "citiesBadgeVulnerable"
  | "cityIssueLabel"
  | "cityProblemLabel"
  | "citySourceLabel"
  | "citiesIssueLabel"
  | "citiesProblemLabel"
  | "citiesSourceLabel"
  | "mapLoading"
  | "mapRefiningLocations"
  | "loadingMap"
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
  | "noVerifiedNearby"
  | "verifiedOnlyNotice"
  | "searchRadiusWithin"
  | "searchExpand"
  | "searchNearestOrgs"
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
  navOurStory: "Our Story",
  navHowItWorks: "How It Works",
  navTheProblem: "The Problem",
  navOurSolution: "Our Solution",
  navCitiesInNeed: "Cities in Need",
  openMenu: "Open menu",
  languageMenu: "Language",
  heroTitle: "Find Help Near You",
  heroSubtitle:
    "Instant access to free food, shelter, and medical care — anywhere in the world. No barriers, no sign-up, no cost.",
  heroCta: "Find Help Near Me",
  howItWorksTitle: "How It Works",
  howItWorksStep1Title: "Share Your Location",
  howItWorksStep1Description:
    "Allow location access or simply type your city — we'll find help near you instantly.",
  howItWorksStep2Title: "Discover Organizations",
  howItWorksStep2Description:
    "Browse verified food banks, shelters, clinics and more — filtered by distance and category.",
  howItWorksStep3Title: "Get Help Now",
  howItWorksStep3Description:
    "Call directly with one tap or get turn-by-turn directions. No account needed.",
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
  switchToLiteVersion: "Switch to lite mode",
  showLiteMap: "Load map (lite)",
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
  navReviews: "Reviews & Suggestions",
  navReviewsShort: "Reviews",
  footerTagline: "Connecting people to the help they need. Fast, free, accessible.",
  footerQuickLinks: "Quick Links",
  footerContact: "Contact",
  footerInstagram: "Inst: @help.nearby1",
  footerPartnerLabel: "Our Partner",
  footerPartnerTelegram: "tg: The Kindness Corp.",
  footerPartnerWebsite: "Web: kindnesscorporation.ru",
  footerOurPartner: "Our Partner",
  footerTelegram: "tg: The Kindness Corp.",
  footerWebsite: "Web: kindnesscorporation.ru",
  footerPartnerName: "The Kindness Co.",
  footerSdgHeading: "Supporting UN Sustainable Development Goals",
  footerSdgDisclaimer: "Not affiliated with the United Nations",
  footerCopyright: "© 2026 Help Nearby · Helping find assistance worldwide",
  footerMadeWith: "Made with",
  footerForCommunities: "for communities in need",
  aboutPageTitle: "Connecting People with Help",
  aboutPageHeading: "Connecting People with Help",
  aboutPageSubtitle:
    "A platform that makes finding free assistance fast, transparent, and accessible to everyone.",
  aboutOurStory: "Our Story",
  aboutStoryText:
    "Help Nearby was created to bridge the gap between people in crisis and the organizations ready to help. We believe everyone deserves easy access to food, shelter, and medical care — regardless of language, device, or internet speed.",
  aboutOurValues: "Our Values",
  aboutSearchDiscoverTitle: "Search & Discover",
  aboutSearchDiscoverText:
    "Enter your location and find nearby organizations filtered by category and your specific needs.",
  aboutGetHelpCardTitle: "Get Help",
  aboutGetHelpCardText:
    "Call directly or get directions to verified organizations instantly.",
  aboutHowItWorksCard1Title: "Search & Discover",
  aboutHowItWorksCard1Text:
    "Enter your location and find nearby organizations filtered by category and your specific needs.",
  aboutHowItWorksCard2Title: "Get Help",
  aboutHowItWorksCard2Text:
    "Call directly or get directions to verified organizations instantly.",
  aboutValueAccessibilityTitle: "Accessibility",
  aboutValueAccessibilityText:
    "Help should be easy to find, free, and available to everyone.",
  aboutValueDignityTitle: "Dignity",
  aboutValueDignityText:
    "Everyone deserves help with respect and compassion.",
  aboutValueGlobalTitle: "Global Reach",
  aboutValueGlobalText: "No matter where you are, help is near you.",
  aboutValuesCard1Title: "Accessibility",
  aboutValuesCard1Text:
    "Help should be easy to find, free, and available to everyone.",
  aboutValuesCard2Title: "Dignity",
  aboutValuesCard2Text: "Everyone deserves help with respect and compassion.",
  aboutValuesCard3Title: "Global Reach",
  aboutValuesCard3Text: "No matter where you are, help is near you.",
  aboutExploreOrgs: "Explore Organizations",
  aboutExploreOrganizations: "Explore Organizations",
  whyPageTitle: "Help Should Be Accessible To All",
  whyPageSubtitle: "No one should face crisis alone — anywhere in the world.",
  whyTheProblem: "The Problem",
  whyStat700m: "people live in extreme poverty",
  whyStat150m: "homeless people worldwide",
  whyStat2_3b: "people lack food security",
  whyStat1Label: "people live in extreme poverty",
  whyStat2Label: "homeless people worldwide",
  whyStat3Label: "people lack food security",
  whyProblem1Title: "Hard to Find",
  whyProblem1Text:
    "People in crisis don't know where to turn. Resources are scattered and information is hard to find.",
  whyProblem2Title: "No Transparency",
  whyProblem2Text:
    "No operating hours, no real-time info. People waste time going to closed locations.",
  whyProblem3Title: "No Connection",
  whyProblem3Text:
    "Organizations and people in need are disconnected, making effective help harder to reach.",
  whyProblemCard1Title: "Hard to Find",
  whyProblemCard1Text:
    "People in crisis don't know where to turn. Resources are scattered and information is hard to find.",
  whyProblemCard2Title: "No Transparency",
  whyProblemCard2Text:
    "No operating hours, no real-time info. People waste time going to closed locations.",
  whyProblemCard3Title: "No Connection",
  whyProblemCard3Text:
    "Organizations and people in need are disconnected, making effective help harder to reach.",
  whyOurSolution: "Our Solution",
  whySolution1Title: "All in One Place",
  whySolution1Text:
    "Every local assistance organization in one easy-to-use map interface.",
  whySolution2Title: "Real-Time Info",
  whySolution2Text: "See what's open now, get directions, call instantly.",
  whySolution3Title: "Works Everywhere",
  whySolution3Text:
    "7 languages, offline mode, optimized for 2G networks in crisis zones.",
  whySolutionCard1Title: "All in One Place",
  whySolutionCard1Text:
    "Every local assistance organization in one easy-to-use map interface.",
  whySolutionCard2Title: "Real-Time Info",
  whySolutionCard2Text: "See what's open now, get directions, call instantly.",
  whySolutionCard3Title: "Works Everywhere",
  whySolutionCard3Text:
    "7 languages, offline mode, optimized for 2G networks in crisis zones.",
  whyPageHeading: "Help Should Be Accessible To All",
  citiesTitle: "Cities in Need",
  citiesSubtitle:
    "Communities facing urgent humanitarian crises need help the most.",
  urgencyCrisis: "Crisis",
  urgencyHighNeed: "High Need",
  urgencyVulnerable: "Vulnerable",
  citiesBadgeCrisis: "Crisis",
  citiesBadgeHighNeed: "High Need",
  citiesBadgeVulnerable: "Vulnerable",
  cityIssueLabel: "Issue:",
  cityProblemLabel: "Problem:",
  citySourceLabel: "Source:",
  citiesIssueLabel: "Issue",
  citiesProblemLabel: "Problem",
  citiesSourceLabel: "Source",
  mapLoading: "Loading map…",
  mapRefiningLocations: "Refining locations…",
  loadingMap: "Loading map...",
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
  reviewsSubtitle:
    "Share your experience or suggest improvements to help us serve people better.",
  reviewsFormName: "Your name",
  reviewsFormCountry: "Your country",
  reviewsFormRating: "Rating",
  reviewsFormMessage: "Your feedback or suggestion",
  reviewsFormSubmit: "Submit feedback",
  reviewsFormSuccess:
    "Thank you! Your review was submitted and will appear after approval.",
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
  loadingNearby: "Loading nearby organizations…",
  noVerifiedNearby:
    "No verified organizations found nearby. Try the Emergency button for urgent help.",
  verifiedOnlyNotice: "Showing verified organizations only",
  searchRadiusWithin: "Showing results within {km} km",
  searchExpand: "Expand search",
  searchNearestOrgs: "Nearest organizations ({km} km away)",
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
  heroTitle: "Найдите помощь рядом с вами",
  heroSubtitle:
    "Мгновенный доступ к бесплатной еде, жилью и медицинской помощи — в любой точке мира. Без барьеров, без регистрации, бесплатно.",
  heroCta: "Найти помощь рядом со мной",
  howItWorksTitle: "Как это работает",
  howItWorksStep1Title: "Укажите своё местоположение",
  howItWorksStep1Description:
    "Разрешите доступ к геолокации или введите город — мы мгновенно найдём помощь рядом с вами.",
  howItWorksStep2Title: "Найдите организации",
  howItWorksStep2Description:
    "Просматривайте проверенные продовольственные банки, приюты, клиники и другие службы — с фильтрацией по расстоянию и категории.",
  howItWorksStep3Title: "Получите помощь сейчас",
  howItWorksStep3Description:
    "Позвоните одним касанием или постройте маршрут. Регистрация не требуется.",
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
  switchToFullVersion: "Переключиться на полную версию",
  switchToLiteVersion: "Переключиться на лёгкий режим",
  showLiteMap: "Загрузить карту (лёгкий)",
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
  locating: "Определяем ваше местоположение…",
  locationError:
    "Не удалось определить ваше местоположение. Пожалуйста, включите доступ к геолокации.",
  yourLocation: "Вы здесь",
  defaultLocationNotice: "Показано местоположение по умолчанию",
  navWhy: "Почему это важно",
  navReviews: "Отзывы и предложения",
  navReviewsShort: "Отзывы",
  navOurStory: "Наша история",
  navHowItWorks: "Как это работает",
  navTheProblem: "Проблема",
  navOurSolution: "Наше решение",
  navCitiesInNeed: "Города в беде",
  openMenu: "Открыть меню",
  languageMenu: "Язык",
  footerTagline:
    "Соединяем людей с помощью, которая им нужна. Быстро, бесплатно, доступно.",
  footerQuickLinks: "Быстрые ссылки",
  footerContact: "Контакты",
  footerInstagram: "Inst: @help.nearby1",
  footerPartnerLabel: "Наш партнёр",
  footerPartnerTelegram: "tg: The Kindness Corp.",
  footerPartnerWebsite: "Web: kindnesscorporation.ru",
  footerOurPartner: "Наш партнёр",
  footerTelegram: "tg: The Kindness Corp.",
  footerWebsite: "Web: kindnesscorporation.ru",
  footerPartnerName: "The Kindness Co.",
  footerSdgHeading: "Поддерживаем Цели устойчивого развития ООН",
  footerSdgDisclaimer: "Не связаны с Организацией Объединённых Наций",
  footerCopyright: "© 2026 Help Nearby · Помогаем находить помощь по всему миру",
  footerMadeWith: "Сделано с любовью",
  footerForCommunities: "для сообществ, которым нужна помощь",
  aboutPageTitle: "Соединяем людей с помощью",
  aboutPageHeading: "Соединяем людей с помощью",
  aboutPageSubtitle:
    "Платформа, которая делает поиск бесплатной помощи быстрым, прозрачным и доступным для всех.",
  aboutOurStory: "Наша история",
  aboutStoryText:
    "Help Nearby создан, чтобы сократить разрыв между людьми в кризисе и организациями, готовыми помочь. Мы верим, что каждый заслуживает простого доступа к еде, жилью и медицинской помощи — независимо от языка, устройства или скорости интернета.",
  aboutOurValues: "Наши ценности",
  aboutSearchDiscoverTitle: "Ищите и находите",
  aboutSearchDiscoverText:
    "Введите своё местоположение и найдите рядом организации с фильтрами по категории и вашим потребностям.",
  aboutGetHelpCardTitle: "Получите помощь",
  aboutGetHelpCardText:
    "Сразу звоните или получайте маршрут до проверенных организаций.",
  aboutHowItWorksCard1Title: "Ищите и находите",
  aboutHowItWorksCard1Text:
    "Введите своё местоположение и найдите рядом организации с фильтрами по категории и вашим потребностям.",
  aboutHowItWorksCard2Title: "Получите помощь",
  aboutHowItWorksCard2Text:
    "Сразу звоните или получайте маршрут до проверенных организаций.",
  aboutValueAccessibilityTitle: "Доступность",
  aboutValueAccessibilityText:
    "Помощь должна быть простой в поиске, бесплатной и доступной каждому.",
  aboutValueDignityTitle: "Достоинство",
  aboutValueDignityText:
    "Каждый человек заслуживает помощи с уважением и сочувствием.",
  aboutValueGlobalTitle: "Глобальный охват",
  aboutValueGlobalText: "Где бы вы ни были, помощь рядом.",
  aboutValuesCard1Title: "Доступность",
  aboutValuesCard1Text:
    "Помощь должна быть простой в поиске, бесплатной и доступной каждому.",
  aboutValuesCard2Title: "Достоинство",
  aboutValuesCard2Text:
    "Каждый человек заслуживает помощи с уважением и сочувствием.",
  aboutValuesCard3Title: "Глобальный охват",
  aboutValuesCard3Text: "Где бы вы ни были, помощь рядом.",
  aboutExploreOrgs: "Смотреть организации",
  aboutExploreOrganizations: "Смотреть организации",
  whyPageTitle: "Помощь должна быть доступна всем",
  whyPageSubtitle: "Никто не должен оставаться один в кризисе — нигде в мире.",
  whyTheProblem: "Проблема",
  whyStat700m: "человек живут в крайней бедности",
  whyStat150m: "бездомных людей по всему миру",
  whyStat2_3b: "человек испытывают нехватку продовольствия",
  whyStat1Label: "человек живут в крайней бедности",
  whyStat2Label: "бездомных людей по всему миру",
  whyStat3Label: "человек испытывают нехватку продовольствия",
  whyProblem1Title: "Сложно найти",
  whyProblem1Text:
    "Люди в кризисе не знают, куда обращаться. Ресурсы разбросаны, а информацию трудно найти.",
  whyProblem2Title: "Нет прозрачности",
  whyProblem2Text:
    "Нет графиков работы, нет информации в реальном времени. Люди теряют время, приходя в закрытые места.",
  whyProblem3Title: "Нет связи",
  whyProblem3Text:
    "Организации и нуждающиеся люди не связаны, поэтому эффективная помощь доходит труднее.",
  whyProblemCard1Title: "Сложно найти",
  whyProblemCard1Text:
    "Люди в кризисе не знают, куда обращаться. Ресурсы разбросаны, а информацию трудно найти.",
  whyProblemCard2Title: "Нет прозрачности",
  whyProblemCard2Text:
    "Нет графиков работы, нет информации в реальном времени. Люди теряют время, приходя в закрытые места.",
  whyProblemCard3Title: "Нет связи",
  whyProblemCard3Text:
    "Организации и нуждающиеся люди не связаны, поэтому эффективная помощь доходит труднее.",
  whyOurSolution: "Наше решение",
  whySolution1Title: "Всё в одном месте",
  whySolution1Text:
    "Все местные организации помощи на одной удобной карте.",
  whySolution2Title: "Информация в реальном времени",
  whySolution2Text: "Смотрите, что открыто сейчас, стройте маршрут, звоните сразу.",
  whySolution3Title: "Работает везде",
  whySolution3Text:
    "7 языков, офлайн-режим, оптимизация для сетей 2G в кризисных зонах.",
  whySolutionCard1Title: "Всё в одном месте",
  whySolutionCard1Text: "Все местные организации помощи на одной удобной карте.",
  whySolutionCard2Title: "Информация в реальном времени",
  whySolutionCard2Text:
    "Смотрите, что открыто сейчас, стройте маршрут, звоните сразу.",
  whySolutionCard3Title: "Работает везде",
  whySolutionCard3Text:
    "7 языков, офлайн-режим, оптимизация для сетей 2G в кризисных зонах.",
  whyPageHeading: "Помощь должна быть доступна всем",
  citiesTitle: "Города в беде",
  citiesSubtitle:
    "Сообщества в условиях острых гуманитарных кризисов нуждаются в помощи больше всего.",
  urgencyCrisis: "Кризис",
  urgencyHighNeed: "Высокая потребность",
  urgencyVulnerable: "Уязвимые",
  citiesBadgeCrisis: "Кризис",
  citiesBadgeHighNeed: "Высокая потребность",
  citiesBadgeVulnerable: "Уязвимые",
  cityIssueLabel: "Ситуация:",
  cityProblemLabel: "Проблема:",
  citySourceLabel: "Источник:",
  citiesIssueLabel: "Ситуация",
  citiesProblemLabel: "Проблема",
  citiesSourceLabel: "Источник",
  mapLoading: "Загрузка карты…",
  mapRefiningLocations: "Уточняем местоположения…",
  loadingMap: "Загрузка карты...",
  aboutTitle: "О нас",
  aboutSubtitle:
    "Соединяем людей с жизненно важными ресурсами в их сообществе.",
  aboutMissionTitle: "Наша миссия",
  aboutMissionText:
    "Help Nearby упрощает поиск продовольственных банков, приютов, медицинской помощи, пунктов выдачи одежды и волонтёрских возможностей — где бы вы ни находились.",
  aboutVisionTitle: "Наше видение",
  aboutVisionText:
    "Мир, где любой человек в трудной ситуации может за минуты найти надёжную помощь на своём языке.",
  aboutValuesTitle: "Во что мы верим",
  aboutValuesText:
    "Достоинство, доступность и сообщество. Мы создаём инструменты, уважающие приватность, работающие на любых устройствах и показывающие реальные организации на карте.",
  whyTitle: "Почему это важно",
  whySubtitle:
    "За каждой точкой на карте стоит человек, которому нужна поддержка уже сегодня.",
  whyCard1Title: "Кризис ближе, чем кажется",
  whyCard1Text:
    "Миллионы людей сталкиваются с нехваткой еды и жилищной нестабильностью. Быстрый доступ к помощи рядом меняет исход.",
  whyCard2Title: "Информация экономит время",
  whyCard2Text:
    "Поиск по разрозненным сайтам отнимает драгоценные часы. Одна карта объединяет проверенные места.",
  whyCard3Title: "Сообщества хотят помогать",
  whyCard3Text:
    "Волонтёры и доноры готовы — им нужен понятный способ увидеть, где помощь нужна больше всего.",
  whyStoryTitle: "За каждым поиском — история",
  whyStoryText:
    "Нужна ли человеку горячая еда, безопасное место для сна или медицинская помощь — Help Nearby создан, чтобы никто не проходил кризис в одиночку.",
  reviewsTitle: "Отзывы и предложения",
  reviewsSubtitle:
    "Поделитесь опытом или предложите улучшения, чтобы мы помогали людям ещё лучше.",
  reviewsFormName: "Ваше имя",
  reviewsFormCountry: "Ваша страна",
  reviewsFormRating: "Оценка",
  reviewsFormMessage: "Ваш отзыв или предложение",
  reviewsFormSubmit: "Отправить отзыв",
  reviewsFormSuccess:
    "Спасибо! Ваш отзыв отправлен и появится после проверки.",
  reviewsFormRequired: "Пожалуйста, укажите имя, страну и сообщение.",
  reviewsListTitle: "Отзывы сообщества",
  reviewsListEmpty: "Пока нет отзывов. Будьте первым, кто поделится опытом.",
  reviewsLoading: "Загрузка отзывов…",
  share: "Поделиться",
  copied: "Скопировано!",
  backToHome: "Назад на главную",
  description: "Описание",
  contactDetails: "Контакты и часы работы",
  chatError:
    "Извините, сейчас не могу ответить. Пожалуйста, попробуйте ещё раз через минуту.",
  chatTyping: "Печатает…",
  verified: "Проверено",
  loadingNearby: "Загружаем организации рядом…",
  noVerifiedNearby:
    "Проверенные организации рядом не найдены. Для срочной помощи используйте кнопку «Экстренная помощь».",
  verifiedOnlyNotice: "Показываются только проверенные организации",
  searchRadiusWithin: "Показаны результаты в радиусе {km} км",
  searchExpand: "Расширить поиск",
  searchNearestOrgs: "Ближайшие организации (в {km} км)",
  routeWalking: "Пешком",
  routeDriving: "На машине",
  routeTransit: "Транспорт",
  routeTo: "Маршрут до",
  routeClear: "Очистить маршрут",
  routeLoading: "Прокладываем маршрут…",
  routeDistance: "Расстояние",
  routeWalkTime: "Время пешком",
  routeDriveTime: "Время на машине",
  routeTransitTime: "Примерное время",
  routeTransitNote:
    "Для транспорта используется оценка для авто (OSRM не поддерживает общественный транспорт).",
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
    "Acceso instantáneo a comida, refugio y atención médica gratuitas — en cualquier parte del mundo. Sin barreras, sin registro, sin costo.",
  heroCta: "Encontrar ayuda cerca de mí",
  howItWorksTitle: "Cómo funciona",
  howItWorksStep1Title: "Comparte tu ubicación",
  howItWorksStep1Description:
    "Permite el acceso a la ubicación o escribe tu ciudad — encontraremos ayuda cerca de ti al instante.",
  howItWorksStep2Title: "Descubre organizaciones",
  howItWorksStep2Description:
    "Explora bancos de alimentos, refugios, clínicas verificados y más — filtrados por distancia y categoría.",
  howItWorksStep3Title: "Obtén ayuda ahora",
  howItWorksStep3Description:
    "Llama con un solo toque u obtén indicaciones paso a paso. No necesitas cuenta.",
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
  switchToFullVersion: "Cambiar a la versión completa",
  switchToLiteVersion: "Cambiar al modo lite",
  showLiteMap: "Cargar mapa (lite)",
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
  locating: "Obteniendo tu ubicación…",
  locationError:
    "No se pudo obtener tu ubicación. Habilita el acceso a la ubicación.",
  yourLocation: "Estás aquí",
  defaultLocationNotice: "Mostrando ubicación predeterminada",
  navWhy: "Por qué importa",
  navReviews: "Reseñas y sugerencias",
  navReviewsShort: "Reseñas",
  navOurStory: "Nuestra historia",
  navHowItWorks: "Cómo funciona",
  navTheProblem: "El problema",
  navOurSolution: "Nuestra solución",
  navCitiesInNeed: "Ciudades en necesidad",
  openMenu: "Abrir menú",
  languageMenu: "Idioma",
  footerTagline:
    "Conectamos a las personas con la ayuda que necesitan. Rápido, gratis y accesible.",
  footerQuickLinks: "Enlaces rápidos",
  footerContact: "Contacto",
  footerInstagram: "Inst: @help.nearby1",
  footerPartnerLabel: "Nuestro socio",
  footerPartnerTelegram: "tg: The Kindness Corp.",
  footerPartnerWebsite: "Web: kindnesscorporation.ru",
  footerOurPartner: "Nuestro socio",
  footerTelegram: "tg: The Kindness Corp.",
  footerWebsite: "Web: kindnesscorporation.ru",
  footerPartnerName: "The Kindness Co.",
  footerSdgHeading: "Apoyando los Objetivos de Desarrollo Sostenible de la ONU",
  footerSdgDisclaimer: "No afiliado a las Naciones Unidas",
  footerCopyright:
    "© 2026 Help Nearby · Ayudando a encontrar asistencia en todo el mundo",
  footerMadeWith: "Hecho con",
  footerForCommunities: "para comunidades que lo necesitan",
  aboutPageTitle: "Conectando a las personas con ayuda",
  aboutPageHeading: "Conectando a las personas con ayuda",
  aboutPageSubtitle:
    "Una plataforma que hace que encontrar asistencia gratuita sea rápido, transparente y accesible para todos.",
  aboutOurStory: "Nuestra historia",
  aboutStoryText:
    "Help Nearby fue creado para cerrar la brecha entre las personas en crisis y las organizaciones listas para ayudar. Creemos que todos merecen acceso fácil a comida, refugio y atención médica, sin importar idioma, dispositivo o velocidad de internet.",
  aboutOurValues: "Nuestros valores",
  aboutSearchDiscoverTitle: "Buscar y descubrir",
  aboutSearchDiscoverText:
    "Introduce tu ubicación y encuentra organizaciones cercanas filtradas por categoría y tus necesidades específicas.",
  aboutGetHelpCardTitle: "Obtener ayuda",
  aboutGetHelpCardText:
    "Llama directamente u obtén indicaciones a organizaciones verificadas al instante.",
  aboutHowItWorksCard1Title: "Buscar y descubrir",
  aboutHowItWorksCard1Text:
    "Introduce tu ubicación y encuentra organizaciones cercanas filtradas por categoría y tus necesidades específicas.",
  aboutHowItWorksCard2Title: "Obtener ayuda",
  aboutHowItWorksCard2Text:
    "Llama directamente u obtén indicaciones a organizaciones verificadas al instante.",
  aboutValueAccessibilityTitle: "Accesibilidad",
  aboutValueAccessibilityText:
    "La ayuda debe ser fácil de encontrar, gratuita y disponible para todos.",
  aboutValueDignityTitle: "Dignidad",
  aboutValueDignityText:
    "Todos merecen ayuda con respeto y compasión.",
  aboutValueGlobalTitle: "Alcance global",
  aboutValueGlobalText:
    "Sin importar dónde estés, la ayuda está cerca de ti.",
  aboutValuesCard1Title: "Accesibilidad",
  aboutValuesCard1Text:
    "La ayuda debe ser fácil de encontrar, gratuita y disponible para todos.",
  aboutValuesCard2Title: "Dignidad",
  aboutValuesCard2Text: "Todos merecen ayuda con respeto y compasión.",
  aboutValuesCard3Title: "Alcance global",
  aboutValuesCard3Text:
    "Sin importar dónde estés, la ayuda está cerca de ti.",
  aboutExploreOrgs: "Explorar organizaciones",
  aboutExploreOrganizations: "Explorar organizaciones",
  whyPageTitle: "La ayuda debe ser accesible para todos",
  whyPageSubtitle: "Nadie debería enfrentar una crisis solo, en ningún lugar del mundo.",
  whyTheProblem: "El problema",
  whyStat700m: "personas viven en pobreza extrema",
  whyStat150m: "personas sin hogar en todo el mundo",
  whyStat2_3b: "personas carecen de seguridad alimentaria",
  whyStat1Label: "personas viven en pobreza extrema",
  whyStat2Label: "personas sin hogar en todo el mundo",
  whyStat3Label: "personas carecen de seguridad alimentaria",
  whyProblem1Title: "Difícil de encontrar",
  whyProblem1Text:
    "Las personas en crisis no saben a dónde acudir. Los recursos están dispersos y la información es difícil de encontrar.",
  whyProblem2Title: "Sin transparencia",
  whyProblem2Text:
    "Sin horarios, sin información en tiempo real. Las personas pierden tiempo yendo a lugares cerrados.",
  whyProblem3Title: "Sin conexión",
  whyProblem3Text:
    "Las organizaciones y las personas necesitadas están desconectadas, lo que dificulta que la ayuda llegue eficazmente.",
  whyProblemCard1Title: "Difícil de encontrar",
  whyProblemCard1Text:
    "Las personas en crisis no saben a dónde acudir. Los recursos están dispersos y la información es difícil de encontrar.",
  whyProblemCard2Title: "Sin transparencia",
  whyProblemCard2Text:
    "Sin horarios, sin información en tiempo real. Las personas pierden tiempo yendo a lugares cerrados.",
  whyProblemCard3Title: "Sin conexión",
  whyProblemCard3Text:
    "Las organizaciones y las personas necesitadas están desconectadas, lo que dificulta que la ayuda llegue eficazmente.",
  whyOurSolution: "Nuestra solución",
  whySolution1Title: "Todo en un solo lugar",
  whySolution1Text:
    "Cada organización local de asistencia en una interfaz de mapa fácil de usar.",
  whySolution2Title: "Información en tiempo real",
  whySolution2Text:
    "Mira qué está abierto ahora, obtén direcciones y llama al instante.",
  whySolution3Title: "Funciona en todas partes",
  whySolution3Text:
    "7 idiomas, modo sin conexión y optimizado para redes 2G en zonas de crisis.",
  whySolutionCard1Title: "Todo en un solo lugar",
  whySolutionCard1Text:
    "Cada organización local de asistencia en una interfaz de mapa fácil de usar.",
  whySolutionCard2Title: "Información en tiempo real",
  whySolutionCard2Text:
    "Mira qué está abierto ahora, obtén direcciones y llama al instante.",
  whySolutionCard3Title: "Funciona en todas partes",
  whySolutionCard3Text:
    "7 idiomas, modo sin conexión y optimizado para redes 2G en zonas de crisis.",
  whyPageHeading: "La ayuda debe ser accesible para todos",
  citiesTitle: "Ciudades en necesidad",
  citiesSubtitle:
    "Las comunidades que enfrentan crisis humanitarias urgentes son las que más ayuda necesitan.",
  urgencyCrisis: "Crisis",
  urgencyHighNeed: "Alta necesidad",
  urgencyVulnerable: "Vulnerable",
  citiesBadgeCrisis: "Crisis",
  citiesBadgeHighNeed: "Alta necesidad",
  citiesBadgeVulnerable: "Vulnerable",
  cityIssueLabel: "Situación:",
  cityProblemLabel: "Problema:",
  citySourceLabel: "Fuente:",
  citiesIssueLabel: "Situación",
  citiesProblemLabel: "Problema",
  citiesSourceLabel: "Fuente",
  mapLoading: "Cargando mapa…",
  mapRefiningLocations: "Refinando ubicaciones…",
  loadingMap: "Cargando mapa...",
  aboutTitle: "Sobre nosotros",
  aboutSubtitle:
    "Conectando a las personas con recursos que salvan vidas en su comunidad.",
  aboutMissionTitle: "Nuestra misión",
  aboutMissionText:
    "Help Nearby facilita encontrar bancos de alimentos, refugios, ayuda médica, donaciones de ropa y oportunidades de voluntariado dondequiera que estés.",
  aboutVisionTitle: "Nuestra visión",
  aboutVisionText:
    "Un mundo donde cualquier persona en dificultad pueda encontrar ayuda confiable en minutos, en su propio idioma.",
  aboutValuesTitle: "En qué creemos",
  aboutValuesText:
    "Dignidad, accesibilidad y comunidad. Creamos herramientas que respetan la privacidad, funcionan en cualquier dispositivo y ponen organizaciones reales en el mapa.",
  whyTitle: "Por qué importa",
  whySubtitle:
    "Detrás de cada punto en el mapa hay una persona que necesita apoyo hoy.",
  whyCard1Title: "La crisis está más cerca de lo que crees",
  whyCard1Text:
    "Millones enfrentan inseguridad alimentaria e inestabilidad de vivienda. El acceso rápido a ayuda cercana puede cambiar resultados.",
  whyCard2Title: "La información ahorra tiempo",
  whyCard2Text:
    "Buscar en sitios dispersos desperdicia horas valiosas. Un solo mapa reúne lugares verificados.",
  whyCard3Title: "Las comunidades quieren ayudar",
  whyCard3Text:
    "Voluntarios y donantes están listos: solo necesitan una forma clara de ver dónde se necesita más ayuda.",
  whyStoryTitle: "Cada búsqueda cuenta una historia",
  whyStoryText:
    "Ya sea una comida caliente, un lugar seguro para dormir o atención médica, Help Nearby existe para que nadie afronte una crisis solo.",
  reviewsTitle: "Reseñas y sugerencias",
  reviewsSubtitle:
    "Comparte tu experiencia o sugiere mejoras para ayudarnos a servir mejor a las personas.",
  reviewsFormName: "Tu nombre",
  reviewsFormCountry: "Tu país",
  reviewsFormRating: "Calificación",
  reviewsFormMessage: "Tu comentario o sugerencia",
  reviewsFormSubmit: "Enviar comentario",
  reviewsFormSuccess:
    "¡Gracias! Tu reseña fue enviada y aparecerá tras la aprobación.",
  reviewsFormRequired: "Por favor, ingresa tu nombre, país y mensaje.",
  reviewsListTitle: "Comentarios de la comunidad",
  reviewsListEmpty:
    "Aún no hay reseñas. Sé la primera persona en compartir tu experiencia.",
  reviewsLoading: "Cargando reseñas…",
  share: "Compartir",
  copied: "¡Copiado!",
  backToHome: "Volver al inicio",
  description: "Descripción",
  contactDetails: "Contacto y horarios",
  chatError:
    "Lo siento, no pude responder ahora. Inténtalo de nuevo en un momento.",
  chatTyping: "Escribiendo…",
  verified: "Verificado",
  loadingNearby: "Cargando organizaciones cercanas…",
  noVerifiedNearby:
    "No se encontraron organizaciones verificadas cerca. Prueba el botón de Emergencia para ayuda urgente.",
  verifiedOnlyNotice: "Mostrando solo organizaciones verificadas",
  searchRadiusWithin: "Mostrando resultados dentro de {km} km",
  searchExpand: "Ampliar búsqueda",
  searchNearestOrgs: "Organizaciones más cercanas (a {km} km)",
  routeWalking: "A pie",
  routeDriving: "En coche",
  routeTransit: "Transporte público",
  routeTo: "Indicaciones a",
  routeClear: "Borrar ruta",
  routeLoading: "Calculando ruta…",
  routeDistance: "Distancia",
  routeWalkTime: "Tiempo caminando",
  routeDriveTime: "Tiempo en coche",
  routeTransitTime: "Tiempo estimado",
  routeTransitNote:
    "El transporte usa estimación de conducción (OSRM no admite transporte público).",
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
    "Accès instantané à la nourriture, l'hébergement et les soins médicaux gratuits — partout dans le monde. Sans barrières, sans inscription, sans frais.",
  heroCta: "Trouver de l'aide près de moi",
  howItWorksTitle: "Comment ça marche",
  howItWorksStep1Title: "Partagez votre position",
  howItWorksStep1Description:
    "Autorisez l'accès à la localisation ou saisissez votre ville — nous trouverons de l'aide près de vous instantanément.",
  howItWorksStep2Title: "Découvrez des organisations",
  howItWorksStep2Description:
    "Parcourez des banques alimentaires, refuges, cliniques vérifiés et plus — filtrés par distance et catégorie.",
  howItWorksStep3Title: "Obtenez de l'aide maintenant",
  howItWorksStep3Description:
    "Appelez en un clic ou obtenez un itinéraire détaillé. Aucun compte requis.",
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
  switchToFullVersion: "Passer à la version complète",
  switchToLiteVersion: "Passer en mode lite",
  showLiteMap: "Charger la carte (lite)",
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
  locating: "Récupération de votre position…",
  locationError:
    "Impossible d'obtenir votre position. Veuillez autoriser l'accès à la localisation.",
  yourLocation: "Vous êtes ici",
  defaultLocationNotice: "Affichage de la position par défaut",
  navWhy: "Pourquoi c'est important",
  navReviews: "Avis et suggestions",
  navReviewsShort: "Avis",
  navOurStory: "Notre histoire",
  navHowItWorks: "Comment ça marche",
  navTheProblem: "Le problème",
  navOurSolution: "Notre solution",
  navCitiesInNeed: "Villes en difficulté",
  openMenu: "Ouvrir le menu",
  languageMenu: "Langue",
  footerTagline:
    "Relier les personnes à l'aide dont elles ont besoin. Rapide, gratuit, accessible.",
  footerQuickLinks: "Liens rapides",
  footerContact: "Contact",
  footerInstagram: "Inst: @help.nearby1",
  footerPartnerLabel: "Notre partenaire",
  footerPartnerTelegram: "tg: The Kindness Corp.",
  footerPartnerWebsite: "Web: kindnesscorporation.ru",
  footerOurPartner: "Notre partenaire",
  footerTelegram: "tg: The Kindness Corp.",
  footerWebsite: "Web: kindnesscorporation.ru",
  footerPartnerName: "The Kindness Co.",
  footerSdgHeading:
    "Soutenir les Objectifs de développement durable des Nations unies",
  footerSdgDisclaimer: "Non affilié aux Nations unies",
  footerCopyright:
    "© 2026 Help Nearby · Aider à trouver de l'assistance dans le monde entier",
  footerMadeWith: "Fait avec",
  footerForCommunities: "pour les communautés dans le besoin",
  aboutPageTitle: "Relier les personnes à l'aide",
  aboutPageHeading: "Relier les personnes à l'aide",
  aboutPageSubtitle:
    "Une plateforme qui rend la recherche d'aide gratuite rapide, transparente et accessible à tous.",
  aboutOurStory: "Notre histoire",
  aboutStoryText:
    "Help Nearby a été créé pour combler l'écart entre les personnes en crise et les organisations prêtes à aider. Nous croyons que chacun mérite un accès facile à la nourriture, à l'hébergement et aux soins médicaux, quel que soit la langue, l'appareil ou la vitesse d'internet.",
  aboutOurValues: "Nos valeurs",
  aboutSearchDiscoverTitle: "Rechercher et découvrir",
  aboutSearchDiscoverText:
    "Entrez votre position et trouvez des organisations proches filtrées par catégorie et selon vos besoins spécifiques.",
  aboutGetHelpCardTitle: "Obtenir de l'aide",
  aboutGetHelpCardText:
    "Appelez directement ou obtenez un itinéraire vers des organisations vérifiées instantanément.",
  aboutHowItWorksCard1Title: "Rechercher et découvrir",
  aboutHowItWorksCard1Text:
    "Entrez votre position et trouvez des organisations proches filtrées par catégorie et selon vos besoins spécifiques.",
  aboutHowItWorksCard2Title: "Obtenir de l'aide",
  aboutHowItWorksCard2Text:
    "Appelez directement ou obtenez un itinéraire vers des organisations vérifiées instantanément.",
  aboutValueAccessibilityTitle: "Accessibilité",
  aboutValueAccessibilityText:
    "L'aide doit être facile à trouver, gratuite et disponible pour tous.",
  aboutValueDignityTitle: "Dignité",
  aboutValueDignityText:
    "Chacun mérite de l'aide avec respect et compassion.",
  aboutValueGlobalTitle: "Portée mondiale",
  aboutValueGlobalText:
    "Où que vous soyez, l'aide est près de vous.",
  aboutValuesCard1Title: "Accessibilité",
  aboutValuesCard1Text:
    "L'aide doit être facile à trouver, gratuite et disponible pour tous.",
  aboutValuesCard2Title: "Dignité",
  aboutValuesCard2Text: "Chacun mérite de l'aide avec respect et compassion.",
  aboutValuesCard3Title: "Portée mondiale",
  aboutValuesCard3Text: "Où que vous soyez, l'aide est près de vous.",
  aboutExploreOrgs: "Explorer les organisations",
  aboutExploreOrganizations: "Explorer les organisations",
  whyPageTitle: "L'aide doit être accessible à tous",
  whyPageSubtitle:
    "Personne ne devrait affronter une crise seul — n'importe où dans le monde.",
  whyTheProblem: "Le problème",
  whyStat700m: "personnes vivent dans l'extrême pauvreté",
  whyStat150m: "personnes sans abri dans le monde",
  whyStat2_3b: "personnes manquent de sécurité alimentaire",
  whyStat1Label: "personnes vivent dans l'extrême pauvreté",
  whyStat2Label: "personnes sans abri dans le monde",
  whyStat3Label: "personnes manquent de sécurité alimentaire",
  whyProblem1Title: "Difficile à trouver",
  whyProblem1Text:
    "Les personnes en crise ne savent pas vers qui se tourner. Les ressources sont dispersées et l'information est difficile à trouver.",
  whyProblem2Title: "Aucune transparence",
  whyProblem2Text:
    "Pas d'horaires, pas d'informations en temps réel. Les personnes perdent du temps à se rendre dans des lieux fermés.",
  whyProblem3Title: "Pas de connexion",
  whyProblem3Text:
    "Les organisations et les personnes dans le besoin sont déconnectées, ce qui rend l'aide efficace plus difficile à atteindre.",
  whyProblemCard1Title: "Difficile à trouver",
  whyProblemCard1Text:
    "Les personnes en crise ne savent pas vers qui se tourner. Les ressources sont dispersées et l'information est difficile à trouver.",
  whyProblemCard2Title: "Aucune transparence",
  whyProblemCard2Text:
    "Pas d'horaires, pas d'informations en temps réel. Les personnes perdent du temps à se rendre dans des lieux fermés.",
  whyProblemCard3Title: "Pas de connexion",
  whyProblemCard3Text:
    "Les organisations et les personnes dans le besoin sont déconnectées, ce qui rend l'aide efficace plus difficile à atteindre.",
  whyOurSolution: "Notre solution",
  whySolution1Title: "Tout en un seul endroit",
  whySolution1Text:
    "Chaque organisation locale d'assistance dans une interface cartographique simple d'utilisation.",
  whySolution2Title: "Infos en temps réel",
  whySolution2Text:
    "Voyez ce qui est ouvert maintenant, obtenez un itinéraire, appelez instantanément.",
  whySolution3Title: "Fonctionne partout",
  whySolution3Text:
    "7 langues, mode hors ligne, optimisé pour les réseaux 2G dans les zones de crise.",
  whySolutionCard1Title: "Tout en un seul endroit",
  whySolutionCard1Text:
    "Chaque organisation locale d'assistance dans une interface cartographique simple d'utilisation.",
  whySolutionCard2Title: "Infos en temps réel",
  whySolutionCard2Text:
    "Voyez ce qui est ouvert maintenant, obtenez un itinéraire, appelez instantanément.",
  whySolutionCard3Title: "Fonctionne partout",
  whySolutionCard3Text:
    "7 langues, mode hors ligne, optimisé pour les réseaux 2G dans les zones de crise.",
  whyPageHeading: "L'aide doit être accessible à tous",
  citiesTitle: "Villes en difficulté",
  citiesSubtitle:
    "Les communautés confrontées à des crises humanitaires urgentes ont le plus besoin d'aide.",
  urgencyCrisis: "Crise",
  urgencyHighNeed: "Forte nécessité",
  urgencyVulnerable: "Vulnérable",
  citiesBadgeCrisis: "Crise",
  citiesBadgeHighNeed: "Forte nécessité",
  citiesBadgeVulnerable: "Vulnérable",
  cityIssueLabel: "Enjeu :",
  cityProblemLabel: "Problème :",
  citySourceLabel: "Source :",
  citiesIssueLabel: "Enjeu",
  citiesProblemLabel: "Problème",
  citiesSourceLabel: "Source",
  mapLoading: "Chargement de la carte…",
  mapRefiningLocations: "Affinage des localisations…",
  loadingMap: "Chargement de la carte...",
  aboutTitle: "À propos de nous",
  aboutSubtitle:
    "Connecter les personnes aux ressources vitales de leur communauté.",
  aboutMissionTitle: "Notre mission",
  aboutMissionText:
    "Help Nearby simplifie la recherche de banques alimentaires, refuges, aides médicales, dons de vêtements et opportunités de bénévolat — où que vous soyez.",
  aboutVisionTitle: "Notre vision",
  aboutVisionText:
    "Un monde où toute personne en difficulté peut trouver une aide fiable en quelques minutes, dans sa propre langue.",
  aboutValuesTitle: "Ce en quoi nous croyons",
  aboutValuesText:
    "Dignité, accessibilité et communauté. Nous créons des outils qui respectent la vie privée, fonctionnent sur tous les appareils et placent de vraies organisations sur la carte.",
  whyTitle: "Pourquoi c'est important",
  whySubtitle:
    "Derrière chaque point sur la carte se trouve une personne qui a besoin de soutien aujourd'hui.",
  whyCard1Title: "La crise est plus proche que vous ne le pensez",
  whyCard1Text:
    "Des millions de personnes font face à l'insécurité alimentaire et à l'instabilité du logement. Un accès rapide à l'aide de proximité peut changer l'issue.",
  whyCard2Title: "L'information fait gagner du temps",
  whyCard2Text:
    "Chercher sur des sites dispersés fait perdre de précieuses heures. Une seule carte rassemble les lieux vérifiés.",
  whyCard3Title: "Les communautés veulent aider",
  whyCard3Text:
    "Les bénévoles et les donateurs sont prêts — ils ont juste besoin d'un moyen clair de voir où l'aide est la plus nécessaire.",
  whyStoryTitle: "Chaque recherche raconte une histoire",
  whyStoryText:
    "Qu'il s'agisse d'un repas chaud, d'un endroit sûr pour dormir ou de soins médicaux, Help Nearby existe pour que personne n'affronte la crise seul.",
  reviewsTitle: "Avis et suggestions",
  reviewsSubtitle:
    "Partagez votre expérience ou proposez des améliorations pour nous aider à mieux servir les personnes.",
  reviewsFormName: "Votre nom",
  reviewsFormCountry: "Votre pays",
  reviewsFormRating: "Note",
  reviewsFormMessage: "Votre avis ou suggestion",
  reviewsFormSubmit: "Envoyer l'avis",
  reviewsFormSuccess:
    "Merci ! Votre avis a été envoyé et apparaîtra après validation.",
  reviewsFormRequired: "Veuillez saisir votre nom, votre pays et votre message.",
  reviewsListTitle: "Retours de la communauté",
  reviewsListEmpty:
    "Aucun avis pour l'instant. Soyez la première personne à partager votre expérience.",
  reviewsLoading: "Chargement des avis…",
  share: "Partager",
  copied: "Copié !",
  backToHome: "Retour à l'accueil",
  description: "Description",
  contactDetails: "Contact et horaires",
  chatError:
    "Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer dans un instant.",
  chatTyping: "Saisie…",
  verified: "Vérifié",
  loadingNearby: "Chargement des organisations proches…",
  noVerifiedNearby:
    "Aucune organisation vérifiée à proximité. Essayez le bouton Urgence pour une aide immédiate.",
  verifiedOnlyNotice: "Affichage des organisations vérifiées uniquement",
  searchRadiusWithin: "Résultats affichés dans un rayon de {km} km",
  searchExpand: "Élargir la recherche",
  searchNearestOrgs: "Organisations les plus proches (à {km} km)",
  routeWalking: "À pied",
  routeDriving: "En voiture",
  routeTransit: "Transports",
  routeTo: "Itinéraire vers",
  routeClear: "Effacer l'itinéraire",
  routeLoading: "Calcul de l'itinéraire…",
  routeDistance: "Distance",
  routeWalkTime: "Temps de marche",
  routeDriveTime: "Temps en voiture",
  routeTransitTime: "Temps estimé",
  routeTransitNote:
    "Le transport utilise une estimation voiture (OSRM ne prend pas en charge les transports publics).",
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
    "Sofortiger Zugang zu kostenloser Verpflegung, Unterkunft und medizinischer Versorgung — weltweit. Keine Hürden, keine Anmeldung, keine Kosten.",
  heroCta: "Hilfe in meiner Nähe finden",
  howItWorksTitle: "So funktioniert es",
  howItWorksStep1Title: "Standort teilen",
  howItWorksStep1Description:
    "Erlauben Sie den Standortzugriff oder geben Sie Ihre Stadt ein — wir finden sofort Hilfe in Ihrer Nähe.",
  howItWorksStep2Title: "Organisationen entdecken",
  howItWorksStep2Description:
    "Durchsuchen Sie verifizierte Tafeln, Unterkünfte, Kliniken und mehr — gefiltert nach Entfernung und Kategorie.",
  howItWorksStep3Title: "Jetzt Hilfe erhalten",
  howItWorksStep3Description:
    "Rufen Sie mit einem Tipp an oder erhalten Sie eine Schritt-für-Schritt-Route. Kein Konto erforderlich.",
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
  switchToFullVersion: "Zur Vollversion wechseln",
  switchToLiteVersion: "Zum Lite-Modus wechseln",
  showLiteMap: "Karte laden (Lite)",
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
  locating: "Ihr Standort wird ermittelt…",
  locationError:
    "Ihr Standort konnte nicht ermittelt werden. Bitte erlauben Sie den Standortzugriff.",
  yourLocation: "Sie sind hier",
  defaultLocationNotice: "Standardstandort wird angezeigt",
  navWhy: "Warum es wichtig ist",
  navReviews: "Bewertungen und Vorschläge",
  navReviewsShort: "Reviews",
  navOurStory: "Unsere Geschichte",
  navHowItWorks: "So funktioniert es",
  navTheProblem: "Das Problem",
  navOurSolution: "Unsere Lösung",
  navCitiesInNeed: "Städte in Not",
  openMenu: "Menü öffnen",
  languageMenu: "Sprache",
  footerTagline:
    "Wir verbinden Menschen mit der Hilfe, die sie brauchen. Schnell, kostenlos, zugänglich.",
  footerQuickLinks: "Schnellzugriffe",
  footerContact: "Kontakt",
  footerInstagram: "Inst: @help.nearby1",
  footerPartnerLabel: "Unser Partner",
  footerPartnerTelegram: "tg: The Kindness Corp.",
  footerPartnerWebsite: "Web: kindnesscorporation.ru",
  footerOurPartner: "Unser Partner",
  footerTelegram: "tg: The Kindness Corp.",
  footerWebsite: "Web: kindnesscorporation.ru",
  footerPartnerName: "The Kindness Co.",
  footerSdgHeading:
    "Unterstützung der UN-Ziele für nachhaltige Entwicklung",
  footerSdgDisclaimer: "Nicht mit den Vereinten Nationen verbunden",
  footerCopyright:
    "© 2026 Help Nearby · Hilfe weltweit leichter auffindbar machen",
  footerMadeWith: "Gemacht mit",
  footerForCommunities: "für Gemeinschaften in Not",
  aboutPageTitle: "Menschen mit Hilfe verbinden",
  aboutPageHeading: "Menschen mit Hilfe verbinden",
  aboutPageSubtitle:
    "Eine Plattform, die das Finden kostenloser Hilfe schnell, transparent und für alle zugänglich macht.",
  aboutOurStory: "Unsere Geschichte",
  aboutStoryText:
    "Help Nearby wurde geschaffen, um die Lücke zwischen Menschen in Krisen und hilfsbereiten Organisationen zu schließen. Wir glauben, dass jeder einfachen Zugang zu Essen, Unterkunft und medizinischer Versorgung verdient — unabhängig von Sprache, Gerät oder Internetgeschwindigkeit.",
  aboutOurValues: "Unsere Werte",
  aboutSearchDiscoverTitle: "Suchen und entdecken",
  aboutSearchDiscoverText:
    "Geben Sie Ihren Standort ein und finden Sie Organisationen in der Nähe, gefiltert nach Kategorie und Ihren Bedürfnissen.",
  aboutGetHelpCardTitle: "Hilfe erhalten",
  aboutGetHelpCardText:
    "Rufen Sie direkt an oder holen Sie sich sofort Wegbeschreibungen zu verifizierten Organisationen.",
  aboutHowItWorksCard1Title: "Suchen und entdecken",
  aboutHowItWorksCard1Text:
    "Geben Sie Ihren Standort ein und finden Sie Organisationen in der Nähe, gefiltert nach Kategorie und Ihren Bedürfnissen.",
  aboutHowItWorksCard2Title: "Hilfe erhalten",
  aboutHowItWorksCard2Text:
    "Rufen Sie direkt an oder holen Sie sich sofort Wegbeschreibungen zu verifizierten Organisationen.",
  aboutValueAccessibilityTitle: "Zugänglichkeit",
  aboutValueAccessibilityText:
    "Hilfe sollte leicht zu finden, kostenlos und für alle verfügbar sein.",
  aboutValueDignityTitle: "Würde",
  aboutValueDignityText:
    "Jeder Mensch verdient Hilfe mit Respekt und Mitgefühl.",
  aboutValueGlobalTitle: "Globale Reichweite",
  aboutValueGlobalText:
    "Egal wo Sie sind, Hilfe ist in Ihrer Nähe.",
  aboutValuesCard1Title: "Zugänglichkeit",
  aboutValuesCard1Text:
    "Hilfe sollte leicht zu finden, kostenlos und für alle verfügbar sein.",
  aboutValuesCard2Title: "Würde",
  aboutValuesCard2Text:
    "Jeder Mensch verdient Hilfe mit Respekt und Mitgefühl.",
  aboutValuesCard3Title: "Globale Reichweite",
  aboutValuesCard3Text: "Egal wo Sie sind, Hilfe ist in Ihrer Nähe.",
  aboutExploreOrgs: "Organisationen entdecken",
  aboutExploreOrganizations: "Organisationen entdecken",
  whyPageTitle: "Hilfe sollte für alle zugänglich sein",
  whyPageSubtitle:
    "Niemand sollte eine Krise allein bewältigen müssen — nirgendwo auf der Welt.",
  whyTheProblem: "Das Problem",
  whyStat700m: "Menschen leben in extremer Armut",
  whyStat150m: "obdachlose Menschen weltweit",
  whyStat2_3b: "Menschen haben keine Ernährungssicherheit",
  whyStat1Label: "Menschen leben in extremer Armut",
  whyStat2Label: "obdachlose Menschen weltweit",
  whyStat3Label: "Menschen haben keine Ernährungssicherheit",
  whyProblem1Title: "Schwer zu finden",
  whyProblem1Text:
    "Menschen in Krisen wissen nicht, wohin sie sich wenden sollen. Ressourcen sind verstreut und Informationen schwer zu finden.",
  whyProblem2Title: "Keine Transparenz",
  whyProblem2Text:
    "Keine Öffnungszeiten, keine Echtzeitinfos. Menschen verschwenden Zeit mit geschlossenen Standorten.",
  whyProblem3Title: "Keine Verbindung",
  whyProblem3Text:
    "Organisationen und Hilfesuchende sind voneinander getrennt, wodurch wirksame Hilfe schwerer erreichbar ist.",
  whyProblemCard1Title: "Schwer zu finden",
  whyProblemCard1Text:
    "Menschen in Krisen wissen nicht, wohin sie sich wenden sollen. Ressourcen sind verstreut und Informationen schwer zu finden.",
  whyProblemCard2Title: "Keine Transparenz",
  whyProblemCard2Text:
    "Keine Öffnungszeiten, keine Echtzeitinfos. Menschen verschwenden Zeit mit geschlossenen Standorten.",
  whyProblemCard3Title: "Keine Verbindung",
  whyProblemCard3Text:
    "Organisationen und Hilfesuchende sind voneinander getrennt, wodurch wirksame Hilfe schwerer erreichbar ist.",
  whyOurSolution: "Unsere Lösung",
  whySolution1Title: "Alles an einem Ort",
  whySolution1Text:
    "Jede lokale Hilfsorganisation in einer einfach nutzbaren Kartenoberfläche.",
  whySolution2Title: "Echtzeit-Informationen",
  whySolution2Text:
    "Sehen Sie, was jetzt geöffnet ist, holen Sie sich Routen und rufen Sie direkt an.",
  whySolution3Title: "Funktioniert überall",
  whySolution3Text:
    "7 Sprachen, Offline-Modus, optimiert für 2G-Netze in Krisengebieten.",
  whySolutionCard1Title: "Alles an einem Ort",
  whySolutionCard1Text:
    "Jede lokale Hilfsorganisation in einer einfach nutzbaren Kartenoberfläche.",
  whySolutionCard2Title: "Echtzeit-Informationen",
  whySolutionCard2Text:
    "Sehen Sie, was jetzt geöffnet ist, holen Sie sich Routen und rufen Sie direkt an.",
  whySolutionCard3Title: "Funktioniert überall",
  whySolutionCard3Text:
    "7 Sprachen, Offline-Modus, optimiert für 2G-Netze in Krisengebieten.",
  whyPageHeading: "Hilfe sollte für alle zugänglich sein",
  citiesTitle: "Städte in Not",
  citiesSubtitle:
    "Gemeinschaften in akuten humanitären Krisen brauchen Hilfe am dringendsten.",
  urgencyCrisis: "Krise",
  urgencyHighNeed: "Hoher Bedarf",
  urgencyVulnerable: "Gefährdet",
  citiesBadgeCrisis: "Krise",
  citiesBadgeHighNeed: "Hoher Bedarf",
  citiesBadgeVulnerable: "Gefährdet",
  cityIssueLabel: "Thema:",
  cityProblemLabel: "Problem:",
  citySourceLabel: "Quelle:",
  citiesIssueLabel: "Thema",
  citiesProblemLabel: "Problem",
  citiesSourceLabel: "Quelle",
  mapLoading: "Karte wird geladen…",
  mapRefiningLocations: "Standorte werden verfeinert…",
  loadingMap: "Karte wird geladen...",
  aboutTitle: "Über uns",
  aboutSubtitle:
    "Menschen mit lebenswichtigen Ressourcen in ihrer Gemeinschaft verbinden.",
  aboutMissionTitle: "Unsere Mission",
  aboutMissionText:
    "Help Nearby macht es einfach, Tafeln, Unterkünfte, medizinische Hilfe, Kleiderspenden und Freiwilligenangebote zu finden — egal wo Sie sind.",
  aboutVisionTitle: "Unsere Vision",
  aboutVisionText:
    "Eine Welt, in der Menschen in Not innerhalb weniger Minuten verlässliche Hilfe in ihrer eigenen Sprache finden können.",
  aboutValuesTitle: "Woran wir glauben",
  aboutValuesText:
    "Würde, Zugänglichkeit und Gemeinschaft. Wir bauen Werkzeuge, die Privatsphäre respektieren, auf jedem Gerät funktionieren und echte Organisationen auf die Karte bringen.",
  whyTitle: "Warum es wichtig ist",
  whySubtitle:
    "Hinter jedem Punkt auf der Karte steht ein Mensch, der heute Unterstützung braucht.",
  whyCard1Title: "Die Krise ist näher als gedacht",
  whyCard1Text:
    "Millionen Menschen sind von Ernährungsunsicherheit und instabilen Wohnverhältnissen betroffen. Schneller Zugang zu Hilfe in der Nähe kann Leben verändern.",
  whyCard2Title: "Information spart Zeit",
  whyCard2Text:
    "Die Suche auf verstreuten Webseiten kostet wertvolle Stunden. Eine Karte bringt verifizierte Orte zusammen.",
  whyCard3Title: "Gemeinschaften wollen helfen",
  whyCard3Text:
    "Freiwillige und Spender sind bereit — sie brauchen nur einen klaren Weg zu sehen, wo Hilfe am nötigsten ist.",
  whyStoryTitle: "Jede Suche erzählt eine Geschichte",
  whyStoryText:
    "Ob eine warme Mahlzeit, ein sicherer Schlafplatz oder medizinische Versorgung — Help Nearby ist da, damit niemand eine Krise allein bewältigen muss.",
  reviewsTitle: "Bewertungen und Vorschläge",
  reviewsSubtitle:
    "Teilen Sie Ihre Erfahrung oder schlagen Sie Verbesserungen vor, damit wir Menschen besser unterstützen können.",
  reviewsFormName: "Ihr Name",
  reviewsFormCountry: "Ihr Land",
  reviewsFormRating: "Bewertung",
  reviewsFormMessage: "Ihr Feedback oder Vorschlag",
  reviewsFormSubmit: "Feedback senden",
  reviewsFormSuccess:
    "Danke! Ihre Bewertung wurde gesendet und erscheint nach Freigabe.",
  reviewsFormRequired:
    "Bitte geben Sie Ihren Namen, Ihr Land und eine Nachricht ein.",
  reviewsListTitle: "Community-Feedback",
  reviewsListEmpty:
    "Noch keine Bewertungen. Teilen Sie als Erste/r Ihre Erfahrung.",
  reviewsLoading: "Bewertungen werden geladen…",
  share: "Teilen",
  copied: "Kopiert!",
  backToHome: "Zurück zur Startseite",
  description: "Beschreibung",
  contactDetails: "Kontakt und Öffnungszeiten",
  chatError:
    "Entschuldigung, ich konnte gerade nicht antworten. Bitte versuchen Sie es gleich erneut.",
  chatTyping: "Schreibt…",
  verified: "Verifiziert",
  loadingNearby: "Organisationen in der Nähe werden geladen…",
  noVerifiedNearby:
    "Keine verifizierten Organisationen in der Nähe gefunden. Nutzen Sie für dringende Hilfe die Notfall-Schaltfläche.",
  verifiedOnlyNotice: "Es werden nur verifizierte Organisationen angezeigt",
  searchRadiusWithin: "Ergebnisse innerhalb von {km} km",
  searchExpand: "Suche erweitern",
  searchNearestOrgs: "Nächste Organisationen ({km} km entfernt)",
  routeWalking: "Zu Fuß",
  routeDriving: "Auto",
  routeTransit: "ÖPNV",
  routeTo: "Route zu",
  routeClear: "Route löschen",
  routeLoading: "Route wird berechnet…",
  routeDistance: "Entfernung",
  routeWalkTime: "Gehzeit",
  routeDriveTime: "Fahrzeit",
  routeTransitTime: "Geschätzte Zeit",
  routeTransitNote:
    "Für ÖPNV wird die Fahrzeit-Schätzung verwendet (OSRM unterstützt keinen öffentlichen Verkehr).",
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
  heroTitle: "在您附近寻找帮助",
  heroSubtitle:
    "随时随地即时获取免费食物、住所和医疗援助。无门槛、无需注册、完全免费。",
  heroCta: "在我附近寻找帮助",
  howItWorksTitle: "使用方法",
  howItWorksStep1Title: "分享您的位置",
  howItWorksStep1Description:
    "允许定位或输入城市——我们将立即为您找到附近的帮助。",
  howItWorksStep2Title: "发现组织",
  howItWorksStep2Description:
    "浏览经核实的食物银行、庇护所、诊所等——按距离和类别筛选。",
  howItWorksStep3Title: "立即获得帮助",
  howItWorksStep3Description:
    "一键致电或获取逐步导航。无需注册账户。",
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
  switchToFullVersion: "切换到完整版本",
  switchToLiteVersion: "切换到轻量模式",
  showLiteMap: "加载地图（轻量）",
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
  locating: "正在获取您的位置…",
  locationError: "无法获取您的位置。请启用位置访问权限。",
  yourLocation: "您在这里",
  defaultLocationNotice: "显示默认位置",
  navWhy: "为何重要",
  navReviews: "评价与建议",
  navReviewsShort: "评价",
  navOurStory: "我们的故事",
  navHowItWorks: "运作方式",
  navTheProblem: "问题所在",
  navOurSolution: "我们的解决方案",
  navCitiesInNeed: "需要帮助的城市",
  openMenu: "打开菜单",
  languageMenu: "语言",
  footerTagline: "将人们与所需帮助连接起来。快速、免费、可及。",
  footerQuickLinks: "快捷链接",
  footerContact: "联系方式",
  footerInstagram: "Inst: @help.nearby1",
  footerPartnerLabel: "我们的合作伙伴",
  footerPartnerTelegram: "tg: The Kindness Corp.",
  footerPartnerWebsite: "Web: kindnesscorporation.ru",
  footerOurPartner: "我们的合作伙伴",
  footerTelegram: "tg: The Kindness Corp.",
  footerWebsite: "Web: kindnesscorporation.ru",
  footerPartnerName: "The Kindness Co.",
  footerSdgHeading: "支持联合国可持续发展目标",
  footerSdgDisclaimer: "与联合国无关联",
  footerCopyright: "© 2026 Help Nearby · 帮助在全球范围内找到援助",
  footerMadeWith: "用爱制作",
  footerForCommunities: "献给需要帮助的社区",
  aboutPageTitle: "连接人与帮助",
  aboutPageHeading: "连接人与帮助",
  aboutPageSubtitle:
    "一个让寻找免费援助变得快速、透明且人人可及的平台。",
  aboutOurStory: "我们的故事",
  aboutStoryText:
    "Help Nearby 的创建旨在弥合危机中的人们与愿意提供帮助的组织之间的鸿沟。我们相信每个人都应轻松获得食物、住所和医疗照护——无论语言、设备或网络速度如何。",
  aboutOurValues: "我们的价值观",
  aboutSearchDiscoverTitle: "搜索与发现",
  aboutSearchDiscoverText:
    "输入您的位置，按类别和具体需求筛选附近组织。",
  aboutGetHelpCardTitle: "获取帮助",
  aboutGetHelpCardText:
    "可直接致电，或立即获取前往已验证组织的路线。",
  aboutHowItWorksCard1Title: "搜索与发现",
  aboutHowItWorksCard1Text:
    "输入您的位置，按类别和具体需求筛选附近组织。",
  aboutHowItWorksCard2Title: "获取帮助",
  aboutHowItWorksCard2Text:
    "可直接致电，或立即获取前往已验证组织的路线。",
  aboutValueAccessibilityTitle: "可及性",
  aboutValueAccessibilityText: "帮助应当易于找到、免费且人人可用。",
  aboutValueDignityTitle: "尊严",
  aboutValueDignityText: "每个人都应被尊重并带着同理心获得帮助。",
  aboutValueGlobalTitle: "全球覆盖",
  aboutValueGlobalText: "无论您身在何处，帮助都在附近。",
  aboutValuesCard1Title: "可及性",
  aboutValuesCard1Text: "帮助应当易于找到、免费且人人可用。",
  aboutValuesCard2Title: "尊严",
  aboutValuesCard2Text: "每个人都应被尊重并带着同理心获得帮助。",
  aboutValuesCard3Title: "全球覆盖",
  aboutValuesCard3Text: "无论您身在何处，帮助都在附近。",
  aboutExploreOrgs: "探索组织",
  aboutExploreOrganizations: "探索组织",
  whyPageTitle: "帮助应对所有人可及",
  whyPageSubtitle: "无论世界何处，都不应让任何人独自面对危机。",
  whyTheProblem: "问题所在",
  whyStat700m: "人生活在极端贫困中",
  whyStat150m: "全球无家可归者",
  whyStat2_3b: "人缺乏粮食安全",
  whyStat1Label: "人生活在极端贫困中",
  whyStat2Label: "全球无家可归者",
  whyStat3Label: "人缺乏粮食安全",
  whyProblem1Title: "难以找到",
  whyProblem1Text:
    "危机中的人们不知道该向哪里求助。资源分散，信息难以获取。",
  whyProblem2Title: "缺乏透明",
  whyProblem2Text:
    "没有营业时间，没有实时信息。人们把时间浪费在前往已关闭地点上。",
  whyProblem3Title: "缺少连接",
  whyProblem3Text:
    "组织与有需要的人彼此脱节，使有效援助更难触达。",
  whyProblemCard1Title: "难以找到",
  whyProblemCard1Text:
    "危机中的人们不知道该向哪里求助。资源分散，信息难以获取。",
  whyProblemCard2Title: "缺乏透明",
  whyProblemCard2Text:
    "没有营业时间，没有实时信息。人们把时间浪费在前往已关闭地点上。",
  whyProblemCard3Title: "缺少连接",
  whyProblemCard3Text:
    "组织与有需要的人彼此脱节，使有效援助更难触达。",
  whyOurSolution: "我们的解决方案",
  whySolution1Title: "一站式呈现",
  whySolution1Text: "所有本地援助组织集中在一个易用地图界面中。",
  whySolution2Title: "实时信息",
  whySolution2Text: "查看当前是否营业、获取路线并即时拨打电话。",
  whySolution3Title: "处处可用",
  whySolution3Text: "支持 7 种语言、离线模式，并针对危机地区 2G 网络优化。",
  whySolutionCard1Title: "一站式呈现",
  whySolutionCard1Text: "所有本地援助组织集中在一个易用地图界面中。",
  whySolutionCard2Title: "实时信息",
  whySolutionCard2Text: "查看当前是否营业、获取路线并即时拨打电话。",
  whySolutionCard3Title: "处处可用",
  whySolutionCard3Text:
    "支持 7 种语言、离线模式，并针对危机地区 2G 网络优化。",
  whyPageHeading: "帮助应对所有人可及",
  citiesTitle: "需要帮助的城市",
  citiesSubtitle: "面临紧急人道危机的社区最需要帮助。",
  urgencyCrisis: "危机",
  urgencyHighNeed: "高需求",
  urgencyVulnerable: "脆弱",
  citiesBadgeCrisis: "危机",
  citiesBadgeHighNeed: "高需求",
  citiesBadgeVulnerable: "脆弱",
  cityIssueLabel: "情况：",
  cityProblemLabel: "问题：",
  citySourceLabel: "来源：",
  citiesIssueLabel: "情况",
  citiesProblemLabel: "问题",
  citiesSourceLabel: "来源",
  mapLoading: "地图加载中…",
  mapRefiningLocations: "正在优化位置…",
  loadingMap: "正在加载地图...",
  aboutTitle: "关于我们",
  aboutSubtitle: "将人们与其社区中的关键救助资源连接起来。",
  aboutMissionTitle: "我们的使命",
  aboutMissionText:
    "Help Nearby 让您轻松找到食物银行、庇护所、医疗援助、衣物捐赠点和志愿者机会——无论您身在何处。",
  aboutVisionTitle: "我们的愿景",
  aboutVisionText:
    "让每一位身处困境的人都能在几分钟内用自己的语言找到可信赖的帮助。",
  aboutValuesTitle: "我们的信念",
  aboutValuesText:
    "尊严、可及性与社区。我们打造尊重隐私、适用于任何设备并将真实组织呈现在地图上的工具。",
  whyTitle: "为何重要",
  whySubtitle: "地图上的每一个标记背后，都是今天需要支持的人。",
  whyCard1Title: "危机比你想象更近",
  whyCard1Text:
    "数百万人面临粮食不安全和住房不稳定。快速获得附近援助可以改变结局。",
  whyCard2Title: "信息节省时间",
  whyCard2Text:
    "在分散网站中搜索会浪费宝贵时间。一张地图可集中展示已验证地点。",
  whyCard3Title: "社区愿意伸出援手",
  whyCard3Text:
    "志愿者和捐赠者已经准备好——他们只需要清晰方式来了解哪里最需要帮助。",
  whyStoryTitle: "每次搜索都有故事",
  whyStoryText:
    "无论是热饭、安全住所还是医疗照护，Help Nearby 的存在是为了让任何人都不必独自面对危机。",
  reviewsTitle: "评价与建议",
  reviewsSubtitle: "分享您的体验或提出改进建议，帮助我们更好服务他人。",
  reviewsFormName: "您的姓名",
  reviewsFormCountry: "您的国家",
  reviewsFormRating: "评分",
  reviewsFormMessage: "您的反馈或建议",
  reviewsFormSubmit: "提交反馈",
  reviewsFormSuccess: "感谢！您的评价已提交，将在审核后显示。",
  reviewsFormRequired: "请填写姓名、国家和留言。",
  reviewsListTitle: "社区反馈",
  reviewsListEmpty: "暂无评价。欢迎成为第一位分享体验的人。",
  reviewsLoading: "正在加载评价…",
  share: "分享",
  copied: "已复制！",
  backToHome: "返回首页",
  description: "简介",
  contactDetails: "联系方式与营业时间",
  chatError: "抱歉，我现在无法回复。请稍后再试。",
  chatTyping: "正在输入…",
  verified: "已验证",
  loadingNearby: "正在加载附近组织…",
  noVerifiedNearby:
    "附近未找到已验证组织。紧急情况请尝试“紧急帮助”按钮。",
  verifiedOnlyNotice: "仅显示已验证组织",
  searchRadiusWithin: "显示 {km} 公里范围内结果",
  searchExpand: "扩大搜索范围",
  searchNearestOrgs: "最近组织（距离 {km} 公里）",
  routeWalking: "步行",
  routeDriving: "驾车",
  routeTransit: "公共交通",
  routeTo: "前往路线：",
  routeClear: "清除路线",
  routeLoading: "正在计算路线…",
  routeDistance: "距离",
  routeWalkTime: "步行时间",
  routeDriveTime: "驾车时间",
  routeTransitTime: "预计时间",
  routeTransitNote: "公共交通使用驾车估算（OSRM 不支持公共交通）。",
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
    "وصول فوري إلى الطعام والمأوى والرعاية الطبية المجانية — في أي مكان في العالم. بلا عوائق، بلا تسجيل، بلا تكلفة.",
  heroCta: "اعثر على المساعدة بالقرب مني",
  howItWorksTitle: "كيف يعمل",
  howItWorksStep1Title: "شارك موقعك",
  howItWorksStep1Description:
    "اسمح بالوصول إلى الموقع أو اكتب مدينتك — سنجد المساعدة بالقرب منك فوراً.",
  howItWorksStep2Title: "اكتشف المنظمات",
  howItWorksStep2Description:
    "تصفّح بنوك الطعام والملاجئ والعيادات المعتمدة والمزيد — مُصفّاة حسب المسافة والفئة.",
  howItWorksStep3Title: "احصل على المساعدة الآن",
  howItWorksStep3Description:
    "اتصل بنقرة واحدة أو احصل على اتجاهات خطوة بخطوة. لا حاجة لحساب.",
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
  switchToFullVersion: "الانتقال إلى النسخة الكاملة",
  switchToLiteVersion: "الانتقال إلى الوضع الخفيف",
  showLiteMap: "تحميل الخريطة (خفيف)",
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
  locating: "جارٍ تحديد موقعك…",
  locationError: "تعذر الحصول على موقعك. يرجى تفعيل الوصول إلى الموقع.",
  yourLocation: "موقعك هنا",
  defaultLocationNotice: "عرض الموقع الافتراضي",
  navWhy: "لماذا هذا مهم",
  navReviews: "التقييمات والاقتراحات",
  navReviewsShort: "التقييمات",
  navOurStory: "قصتنا",
  navHowItWorks: "كيف يعمل",
  navTheProblem: "المشكلة",
  navOurSolution: "حلّنا",
  navCitiesInNeed: "مدن بحاجة",
  openMenu: "فتح القائمة",
  languageMenu: "اللغة",
  footerTagline: "نصل الناس بالمساعدة التي يحتاجونها. بسرعة، مجاناً، وبسهولة الوصول.",
  footerQuickLinks: "روابط سريعة",
  footerContact: "التواصل",
  footerInstagram: "Inst: @help.nearby1",
  footerPartnerLabel: "شريكنا",
  footerPartnerTelegram: "tg: The Kindness Corp.",
  footerPartnerWebsite: "Web: kindnesscorporation.ru",
  footerOurPartner: "شريكنا",
  footerTelegram: "tg: The Kindness Corp.",
  footerWebsite: "Web: kindnesscorporation.ru",
  footerPartnerName: "The Kindness Co.",
  footerSdgHeading: "ندعم أهداف الأمم المتحدة للتنمية المستدامة",
  footerSdgDisclaimer: "غير تابع للأمم المتحدة",
  footerCopyright: "© 2026 Help Nearby · نساعد في إيجاد الدعم حول العالم",
  footerMadeWith: "صُنع بـ",
  footerForCommunities: "من أجل المجتمعات المحتاجة",
  aboutPageTitle: "ربط الناس بالمساعدة",
  aboutPageHeading: "ربط الناس بالمساعدة",
  aboutPageSubtitle:
    "منصة تجعل العثور على المساعدة المجانية سريعاً وشفافاً ومتاحة للجميع.",
  aboutOurStory: "قصتنا",
  aboutStoryText:
    "تم إنشاء Help Nearby لسد الفجوة بين الأشخاص في الأزمات والمنظمات المستعدة للمساعدة. نؤمن أن الجميع يستحقون وصولاً سهلاً إلى الطعام والمأوى والرعاية الطبية — بغض النظر عن اللغة أو الجهاز أو سرعة الإنترنت.",
  aboutOurValues: "قيمنا",
  aboutSearchDiscoverTitle: "ابحث واكتشف",
  aboutSearchDiscoverText:
    "أدخل موقعك وابحث عن منظمات قريبة مصنّفة حسب الفئة واحتياجاتك الخاصة.",
  aboutGetHelpCardTitle: "احصل على المساعدة",
  aboutGetHelpCardText:
    "اتصل مباشرة أو احصل على اتجاهات إلى المنظمات الموثقة فوراً.",
  aboutHowItWorksCard1Title: "ابحث واكتشف",
  aboutHowItWorksCard1Text:
    "أدخل موقعك وابحث عن منظمات قريبة مصنّفة حسب الفئة واحتياجاتك الخاصة.",
  aboutHowItWorksCard2Title: "احصل على المساعدة",
  aboutHowItWorksCard2Text:
    "اتصل مباشرة أو احصل على اتجاهات إلى المنظمات الموثقة فوراً.",
  aboutValueAccessibilityTitle: "سهولة الوصول",
  aboutValueAccessibilityText:
    "يجب أن تكون المساعدة سهلة الوصول ومجانية ومتاحة للجميع.",
  aboutValueDignityTitle: "الكرامة",
  aboutValueDignityText:
    "كل شخص يستحق الحصول على المساعدة باحترام وتعاطف.",
  aboutValueGlobalTitle: "انتشار عالمي",
  aboutValueGlobalText: "أينما كنت، المساعدة قريبة منك.",
  aboutValuesCard1Title: "سهولة الوصول",
  aboutValuesCard1Text:
    "يجب أن تكون المساعدة سهلة الوصول ومجانية ومتاحة للجميع.",
  aboutValuesCard2Title: "الكرامة",
  aboutValuesCard2Text:
    "كل شخص يستحق الحصول على المساعدة باحترام وتعاطف.",
  aboutValuesCard3Title: "انتشار عالمي",
  aboutValuesCard3Text: "أينما كنت، المساعدة قريبة منك.",
  aboutExploreOrgs: "استكشف المنظمات",
  aboutExploreOrganizations: "استكشف المنظمات",
  whyPageTitle: "يجب أن تكون المساعدة متاحة للجميع",
  whyPageSubtitle: "لا ينبغي لأحد أن يواجه الأزمة وحده — في أي مكان في العالم.",
  whyTheProblem: "المشكلة",
  whyStat700m: "شخص يعيشون في فقر مدقع",
  whyStat150m: "مشرد حول العالم",
  whyStat2_3b: "شخص يفتقرون إلى الأمن الغذائي",
  whyStat1Label: "شخص يعيشون في فقر مدقع",
  whyStat2Label: "مشرد حول العالم",
  whyStat3Label: "شخص يفتقرون إلى الأمن الغذائي",
  whyProblem1Title: "صعب العثور عليها",
  whyProblem1Text:
    "الأشخاص في الأزمات لا يعرفون إلى أين يتجهون. الموارد متفرقة والمعلومات صعبة الوصول.",
  whyProblem2Title: "لا شفافية",
  whyProblem2Text:
    "لا ساعات عمل واضحة ولا معلومات لحظية. الناس يضيعون الوقت بالذهاب إلى أماكن مغلقة.",
  whyProblem3Title: "لا اتصال",
  whyProblem3Text:
    "المنظمات والأشخاص المحتاجون منفصلون، ما يجعل وصول المساعدة الفعالة أصعب.",
  whyProblemCard1Title: "صعب العثور عليها",
  whyProblemCard1Text:
    "الأشخاص في الأزمات لا يعرفون إلى أين يتجهون. الموارد متفرقة والمعلومات صعبة الوصول.",
  whyProblemCard2Title: "لا شفافية",
  whyProblemCard2Text:
    "لا ساعات عمل واضحة ولا معلومات لحظية. الناس يضيعون الوقت بالذهاب إلى أماكن مغلقة.",
  whyProblemCard3Title: "لا اتصال",
  whyProblemCard3Text:
    "المنظمات والأشخاص المحتاجون منفصلون، ما يجعل وصول المساعدة الفعالة أصعب.",
  whyOurSolution: "حلّنا",
  whySolution1Title: "كل شيء في مكان واحد",
  whySolution1Text:
    "كل منظمات المساعدة المحلية في واجهة خريطة واحدة سهلة الاستخدام.",
  whySolution2Title: "معلومات لحظية",
  whySolution2Text:
    "اعرف ما هو مفتوح الآن، واحصل على الاتجاهات، واتصل فوراً.",
  whySolution3Title: "يعمل في كل مكان",
  whySolution3Text:
    "7 لغات، وضع دون اتصال، ومُحسَّن لشبكات 2G في مناطق الأزمات.",
  whySolutionCard1Title: "كل شيء في مكان واحد",
  whySolutionCard1Text:
    "كل منظمات المساعدة المحلية في واجهة خريطة واحدة سهلة الاستخدام.",
  whySolutionCard2Title: "معلومات لحظية",
  whySolutionCard2Text:
    "اعرف ما هو مفتوح الآن، واحصل على الاتجاهات، واتصل فوراً.",
  whySolutionCard3Title: "يعمل في كل مكان",
  whySolutionCard3Text:
    "7 لغات، وضع دون اتصال، ومُحسَّن لشبكات 2G في مناطق الأزمات.",
  whyPageHeading: "يجب أن تكون المساعدة متاحة للجميع",
  citiesTitle: "مدن بحاجة",
  citiesSubtitle:
    "المجتمعات التي تواجه أزمات إنسانية عاجلة هي الأكثر حاجة للمساعدة.",
  urgencyCrisis: "أزمة",
  urgencyHighNeed: "حاجة مرتفعة",
  urgencyVulnerable: "هشّة",
  citiesBadgeCrisis: "أزمة",
  citiesBadgeHighNeed: "حاجة مرتفعة",
  citiesBadgeVulnerable: "هشّة",
  cityIssueLabel: "القضية:",
  cityProblemLabel: "المشكلة:",
  citySourceLabel: "المصدر:",
  citiesIssueLabel: "القضية",
  citiesProblemLabel: "المشكلة",
  citiesSourceLabel: "المصدر",
  mapLoading: "جارٍ تحميل الخريطة…",
  mapRefiningLocations: "جارٍ تحسين المواقع…",
  loadingMap: "جارٍ تحميل الخريطة...",
  aboutTitle: "من نحن",
  aboutSubtitle: "نربط الناس بالموارد المنقذة للحياة في مجتمعاتهم.",
  aboutMissionTitle: "مهمتنا",
  aboutMissionText:
    "يجعل Help Nearby العثور على بنوك الطعام والملاجئ والمساعدة الطبية والتبرعات بالملابس وفرص التطوع أمراً بسيطاً — أينما كنت.",
  aboutVisionTitle: "رؤيتنا",
  aboutVisionText:
    "عالم يستطيع فيه أي شخص يمر بظروف صعبة العثور على مساعدة موثوقة خلال دقائق بلغته.",
  aboutValuesTitle: "ما نؤمن به",
  aboutValuesText:
    "الكرامة، سهولة الوصول، والمجتمع. نبني أدوات تحترم الخصوصية، وتعمل على أي جهاز، وتُظهر المنظمات الحقيقية على الخريطة.",
  whyTitle: "لماذا هذا مهم",
  whySubtitle:
    "خلف كل نقطة على الخريطة يوجد شخص يحتاج إلى الدعم اليوم.",
  whyCard1Title: "الأزمة أقرب مما تتخيل",
  whyCard1Text:
    "الملايين يواجهون انعدام الأمن الغذائي وعدم الاستقرار السكني. الوصول السريع للمساعدة القريبة يمكن أن يغيّر النتائج.",
  whyCard2Title: "المعلومة توفر الوقت",
  whyCard2Text:
    "البحث في مواقع متفرقة يهدر ساعات ثمينة. خريطة واحدة تجمع الأماكن الموثقة.",
  whyCard3Title: "المجتمعات تريد المساعدة",
  whyCard3Text:
    "المتطوعون والمتبرعون مستعدون — هم فقط بحاجة لطريقة واضحة لمعرفة أين الحاجة أكبر.",
  whyStoryTitle: "كل عملية بحث تحمل قصة",
  whyStoryText:
    "سواء كان الشخص يحتاج وجبة ساخنة أو مكاناً آمناً للنوم أو رعاية طبية، وُجد Help Nearby حتى لا يواجه أحد الأزمة وحده.",
  reviewsTitle: "التقييمات والاقتراحات",
  reviewsSubtitle:
    "شارك تجربتك أو اقترح تحسينات لمساعدتنا على خدمة الناس بشكل أفضل.",
  reviewsFormName: "اسمك",
  reviewsFormCountry: "بلدك",
  reviewsFormRating: "التقييم",
  reviewsFormMessage: "ملاحظتك أو اقتراحك",
  reviewsFormSubmit: "إرسال الملاحظة",
  reviewsFormSuccess:
    "شكراً لك! تم إرسال تقييمك وسيظهر بعد المراجعة.",
  reviewsFormRequired: "يرجى إدخال الاسم والبلد والرسالة.",
  reviewsListTitle: "آراء المجتمع",
  reviewsListEmpty: "لا توجد تقييمات بعد. كن أول من يشارك تجربته.",
  reviewsLoading: "جارٍ تحميل التقييمات…",
  share: "مشاركة",
  copied: "تم النسخ!",
  backToHome: "العودة إلى الرئيسية",
  description: "الوصف",
  contactDetails: "التواصل وساعات العمل",
  chatError:
    "عذراً، لا يمكنني الرد الآن. يرجى المحاولة مرة أخرى بعد قليل.",
  chatTyping: "يكتب…",
  verified: "موثّق",
  loadingNearby: "جارٍ تحميل المنظمات القريبة…",
  noVerifiedNearby:
    "لم يتم العثور على منظمات موثقة قريبة. جرّب زر الطوارئ للمساعدة العاجلة.",
  verifiedOnlyNotice: "عرض المنظمات الموثقة فقط",
  searchRadiusWithin: "عرض النتائج ضمن {km} كم",
  searchExpand: "توسيع البحث",
  searchNearestOrgs: "أقرب المنظمات (على بعد {km} كم)",
  routeWalking: "مشياً",
  routeDriving: "بالسيارة",
  routeTransit: "النقل العام",
  routeTo: "الاتجاهات إلى",
  routeClear: "مسح المسار",
  routeLoading: "جارٍ حساب المسار…",
  routeDistance: "المسافة",
  routeWalkTime: "مدة المشي",
  routeDriveTime: "مدة القيادة",
  routeTransitTime: "الوقت التقديري",
  routeTransitNote:
    "النقل العام يستخدم تقدير القيادة (OSRM لا يدعم النقل العام).",
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

export function formatSearchRadiusWithin(
  language: LanguageCode,
  km: number,
): string {
  const template =
    translations[language].searchRadiusWithin ??
    translations.en.searchRadiusWithin;
  return template.replace("{km}", String(km));
}

export function formatSearchNearestOrgs(
  language: LanguageCode,
  km: number,
): string {
  const template =
    translations[language].searchNearestOrgs ??
    translations.en.searchNearestOrgs;
  return template.replace("{km}", String(km));
}
