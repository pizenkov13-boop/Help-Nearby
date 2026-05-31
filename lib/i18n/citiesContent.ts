import type { LanguageCode } from "@/lib/types";
import type { CityUrgency } from "@/lib/homeContent";

export interface CityInNeedCard {
  id: "sudan" | "gaza" | "yemen" | "armenia" | "kyrgyzstan" | "tajikistan";
  city: string;
  country: string;
  urgency: CityUrgency;
  issue: string;
  problem: string;
  source: string;
}

const CITY_META: Omit<CityInNeedCard, "issue" | "problem" | "source">[] = [
  {
    id: "sudan",
    city: "Sudan",
    country: "🇸🇩",
    urgency: "CRISIS",
  },
  {
    id: "gaza",
    city: "Gaza, Palestine",
    country: "🇵🇸",
    urgency: "CRISIS",
  },
  {
    id: "yemen",
    city: "Yemen",
    country: "🇾🇪",
    urgency: "CRISIS",
  },
  {
    id: "armenia",
    city: "Armenia",
    country: "🇦🇲",
    urgency: "HIGH NEED",
  },
  {
    id: "kyrgyzstan",
    city: "Kyrgyzstan",
    country: "🇰🇬",
    urgency: "VULNERABLE",
  },
  {
    id: "tajikistan",
    city: "Tajikistan",
    country: "🇹🇯",
    urgency: "VULNERABLE",
  },
];

const CITIES_CONTENT: Record<
  LanguageCode,
  Record<CityInNeedCard["id"], Pick<CityInNeedCard, "issue" | "problem" | "source">>
> = {
  en: {
    sudan: {
      issue: "Armed conflict since 2023, mass displacement",
      problem:
        "33.7 million people need humanitarian aid — the highest number in the world; 21 million need medical help",
      source: "UN OCHA, Sudan Humanitarian Needs & Response Plan 2026",
    },
    gaza: {
      issue: "Armed conflict, restrictions on humanitarian aid",
      problem:
        "Severe shortages of food and medicine; about half of essential medicines are out of stock",
      source: "UN OCHA / UNRWA Situation Reports, 2026",
    },
    yemen: {
      issue: "Prolonged conflict and economic collapse",
      problem:
        "22 million people need humanitarian aid; 18.3 million face acute hunger",
      source: "UN OCHA, Yemen Humanitarian Needs & Response Plan 2026",
    },
    armenia: {
      issue: "Displacement from Nagorno-Karabakh",
      problem:
        "Over 115,000 refugees arrived in 2023 — one in every 30 people in Armenia; 196,000 people in need of aid",
      source: "UNHCR Armenia, 2026",
    },
    kyrgyzstan: {
      issue: "Poverty and food insecurity",
      problem:
        "Over 41% of people cannot afford an adequate diet; in the Batken region poverty exceeds 40%",
      source: "WFP Kyrgyz Republic Country Brief, 2026",
    },
    tajikistan: {
      issue: "Poverty and food insecurity",
      problem:
        "In rural areas about two-thirds of people live in poverty; malnutrition is widespread",
      source: "WFP Tajikistan, 2026",
    },
  },
  ru: {
    sudan: {
      issue: "Вооружённый конфликт с 2023 года, массовое перемещение населения",
      problem:
        "33,7 млн человек нуждаются в гуманитарной помощи — это самый высокий показатель в мире; 21 млн нуждаются в медицинской помощи",
      source: "УКГВ ООН, План гуманитарных потребностей и реагирования Судана 2026",
    },
    gaza: {
      issue: "Вооружённый конфликт, ограничения на гуманитарную помощь",
      problem:
        "Острая нехватка продовольствия и лекарств; около половины жизненно важных препаратов отсутствуют",
      source: "Доклады УКГВ ООН / БАПОР, 2026",
    },
    yemen: {
      issue: "Длительный конфликт и экономический коллапс",
      problem:
        "22 млн человек нуждаются в гуманитарной помощи; 18,3 млн сталкиваются с острым голодом",
      source: "УКГВ ООН, План гуманитарных потребностей и реагирования Йемена 2026",
    },
    armenia: {
      issue: "Перемещение населения из Нагорного Карабаха",
      problem:
        "Более 115 000 беженцев прибыли в 2023 году — каждый 30-й житель Армении; 196 000 человек нуждаются в помощи",
      source: "УВКБ ООН Армения, 2026",
    },
    kyrgyzstan: {
      issue: "Бедность и продовольственная небезопасность",
      problem:
        "Более 41% людей не могут позволить себе полноценный рацион; в Баткенской области уровень бедности превышает 40%",
      source: "WFP, страновой обзор Кыргызской Республики, 2026",
    },
    tajikistan: {
      issue: "Бедность и продовольственная небезопасность",
      problem:
        "В сельской местности около двух третей населения живут в бедности; недоедание широко распространено",
      source: "WFP Таджикистан, 2026",
    },
  },
  es: {
    sudan: {
      issue: "Conflicto armado desde 2023 y desplazamiento masivo",
      problem:
        "33,7 millones de personas necesitan ayuda humanitaria, la cifra más alta del mundo; 21 millones necesitan atención médica",
      source: "UN OCHA, Plan de Necesidades y Respuesta Humanitaria de Sudán 2026",
    },
    gaza: {
      issue: "Conflicto armado y restricciones a la ayuda humanitaria",
      problem:
        "Graves escaseces de alimentos y medicinas; cerca de la mitad de los medicamentos esenciales están agotados",
      source: "Informes de situación de UN OCHA / UNRWA, 2026",
    },
    yemen: {
      issue: "Conflicto prolongado y colapso económico",
      problem:
        "22 millones de personas necesitan ayuda humanitaria; 18,3 millones enfrentan hambre aguda",
      source: "UN OCHA, Plan de Necesidades y Respuesta Humanitaria de Yemen 2026",
    },
    armenia: {
      issue: "Desplazamiento desde Nagorno-Karabaj",
      problem:
        "Más de 115.000 refugiados llegaron en 2023 — una de cada 30 personas en Armenia; 196.000 personas necesitan ayuda",
      source: "ACNUR Armenia, 2026",
    },
    kyrgyzstan: {
      issue: "Pobreza e inseguridad alimentaria",
      problem:
        "Más del 41% de la población no puede costear una dieta adecuada; en la región de Batken la pobreza supera el 40%",
      source: "WFP, Informe país de la República Kirguisa, 2026",
    },
    tajikistan: {
      issue: "Pobreza e inseguridad alimentaria",
      problem:
        "En las zonas rurales, alrededor de dos tercios de la población vive en pobreza; la malnutrición está muy extendida",
      source: "WFP Tayikistán, 2026",
    },
  },
  fr: {
    sudan: {
      issue: "Conflit armé depuis 2023, déplacements massifs",
      problem:
        "33,7 millions de personnes ont besoin d'aide humanitaire — le chiffre le plus élevé au monde; 21 millions ont besoin d'aide médicale",
      source: "UN OCHA, Plan de réponse aux besoins humanitaires du Soudan 2026",
    },
    gaza: {
      issue: "Conflit armé, restrictions de l'aide humanitaire",
      problem:
        "Graves pénuries de nourriture et de médicaments; environ la moitié des médicaments essentiels sont en rupture",
      source: "Rapports de situation UN OCHA / UNRWA, 2026",
    },
    yemen: {
      issue: "Conflit prolongé et effondrement économique",
      problem:
        "22 millions de personnes ont besoin d'aide humanitaire; 18,3 millions font face à une faim aiguë",
      source: "UN OCHA, Plan de réponse aux besoins humanitaires du Yémen 2026",
    },
    armenia: {
      issue: "Déplacements depuis le Haut-Karabakh",
      problem:
        "Plus de 115 000 réfugiés sont arrivés en 2023 — une personne sur 30 en Arménie; 196 000 personnes ont besoin d'aide",
      source: "HCR Arménie, 2026",
    },
    kyrgyzstan: {
      issue: "Pauvreté et insécurité alimentaire",
      problem:
        "Plus de 41% de la population ne peut pas se permettre une alimentation adéquate; dans la région de Batken, la pauvreté dépasse 40%",
      source: "PAM, Brief pays République kirghize, 2026",
    },
    tajikistan: {
      issue: "Pauvreté et insécurité alimentaire",
      problem:
        "Dans les zones rurales, environ deux tiers de la population vivent dans la pauvreté; la malnutrition est répandue",
      source: "PAM Tadjikistan, 2026",
    },
  },
  de: {
    sudan: {
      issue: "Bewaffneter Konflikt seit 2023, Massenvertreibung",
      problem:
        "33,7 Millionen Menschen benötigen humanitäre Hilfe — die höchste Zahl weltweit; 21 Millionen brauchen medizinische Hilfe",
      source: "UN OCHA, Sudan Humanitarian Needs & Response Plan 2026",
    },
    gaza: {
      issue: "Bewaffneter Konflikt, Einschränkungen bei humanitärer Hilfe",
      problem:
        "Schwere Engpässe bei Nahrungsmitteln und Medikamenten; etwa die Hälfte der essenziellen Medikamente ist nicht verfügbar",
      source: "UN OCHA / UNRWA Lageberichte, 2026",
    },
    yemen: {
      issue: "Anhaltender Konflikt und wirtschaftlicher Zusammenbruch",
      problem:
        "22 Millionen Menschen benötigen humanitäre Hilfe; 18,3 Millionen leiden unter akutem Hunger",
      source: "UN OCHA, Yemen Humanitarian Needs & Response Plan 2026",
    },
    armenia: {
      issue: "Vertreibung aus Bergkarabach",
      problem:
        "Über 115.000 Geflüchtete kamen 2023 an — eine von 30 Personen in Armenien; 196.000 Menschen sind auf Hilfe angewiesen",
      source: "UNHCR Armenien, 2026",
    },
    kyrgyzstan: {
      issue: "Armut und Ernährungsunsicherheit",
      problem:
        "Über 41% der Menschen können sich keine ausreichende Ernährung leisten; in der Region Batken liegt die Armut bei über 40%",
      source: "WFP Länderbericht Kirgisische Republik, 2026",
    },
    tajikistan: {
      issue: "Armut und Ernährungsunsicherheit",
      problem:
        "In ländlichen Gebieten leben etwa zwei Drittel der Menschen in Armut; Mangelernährung ist weit verbreitet",
      source: "WFP Tadschikistan, 2026",
    },
  },
  zh: {
    sudan: {
      issue: "自 2023 年以来的武装冲突与大规模流离失所",
      problem:
        "有 3370 万人需要人道援助——为全球最高；其中 2100 万人需要医疗帮助",
      source: "联合国人道协调厅（UN OCHA），2026 年苏丹人道需求与响应计划",
    },
    gaza: {
      issue: "武装冲突及人道援助受限",
      problem:
        "食品和药品严重短缺；约一半基本药物已断供",
      source: "UN OCHA / UNRWA 形势报告，2026",
    },
    yemen: {
      issue: "长期冲突与经济崩溃",
      problem:
        "2200 万人需要人道援助；1830 万人面临急性饥饿",
      source: "联合国人道协调厅（UN OCHA），2026 年也门人道需求与响应计划",
    },
    armenia: {
      issue: "纳戈尔诺-卡拉巴赫地区人口流离失所",
      problem:
        "2023 年有超过 11.5 万名难民抵达——约每 30 名亚美尼亚人中就有 1 人；19.6 万人需要援助",
      source: "联合国难民署亚美尼亚办事处，2026",
    },
    kyrgyzstan: {
      issue: "贫困与粮食不安全",
      problem:
        "超过 41% 的人口无力负担足够营养的饮食；在巴特肯地区，贫困率超过 40%",
      source: "世界粮食计划署（WFP）吉尔吉斯共和国国家简报，2026",
    },
    tajikistan: {
      issue: "贫困与粮食不安全",
      problem:
        "在农村地区，约三分之二的人口生活在贫困中；营养不良问题广泛存在",
      source: "世界粮食计划署（WFP）塔吉克斯坦，2026",
    },
  },
  ar: {
    sudan: {
      issue: "نزاع مسلح منذ 2023 ونزوح جماعي",
      problem:
        "يحتاج 33.7 مليون شخص إلى مساعدات إنسانية — وهو أعلى رقم في العالم؛ ويحتاج 21 مليوناً إلى مساعدة طبية",
      source: "مكتب الأمم المتحدة لتنسيق الشؤون الإنسانية، خطة احتياجات واستجابة السودان 2026",
    },
    gaza: {
      issue: "نزاع مسلح وقيود على المساعدات الإنسانية",
      problem:
        "نقص حاد في الغذاء والدواء؛ نحو نصف الأدوية الأساسية غير متوفر",
      source: "تقارير الوضع لمكتب الأمم المتحدة / الأونروا، 2026",
    },
    yemen: {
      issue: "نزاع ممتد وانهيار اقتصادي",
      problem:
        "يحتاج 22 مليون شخص إلى مساعدات إنسانية؛ ويواجه 18.3 مليوناً جوعاً حاداً",
      source: "مكتب الأمم المتحدة لتنسيق الشؤون الإنسانية، خطة احتياجات واستجابة اليمن 2026",
    },
    armenia: {
      issue: "نزوح من ناغورنو كاراباخ",
      problem:
        "وصل أكثر من 115,000 لاجئ في 2023 — شخص من كل 30 في أرمينيا؛ و196,000 شخص بحاجة إلى المساعدة",
      source: "المفوضية السامية للأمم المتحدة لشؤون اللاجئين في أرمينيا، 2026",
    },
    kyrgyzstan: {
      issue: "الفقر وانعدام الأمن الغذائي",
      problem:
        "أكثر من 41% من السكان لا يستطيعون تحمل كلفة نظام غذائي مناسب؛ وفي منطقة باتكين تتجاوز نسبة الفقر 40%",
      source: "برنامج الأغذية العالمي، موجز جمهورية قيرغيزستان 2026",
    },
    tajikistan: {
      issue: "الفقر وانعدام الأمن الغذائي",
      problem:
        "في المناطق الريفية يعيش نحو ثلثي السكان في الفقر؛ وسوء التغذية منتشر على نطاق واسع",
      source: "برنامج الأغذية العالمي في طاجيكستان، 2026",
    },
  },
};

export function getCitiesInNeed(language: LanguageCode): CityInNeedCard[] {
  const localized = CITIES_CONTENT[language] ?? CITIES_CONTENT.en;

  return CITY_META.map((city) => ({
    ...city,
    ...localized[city.id],
  }));
}
