import type { LanguageCode } from "@/lib/types";

export interface CopyPrivacySection {
  title: string;
  text: string;
}

export interface CopyPrivacyCopy {
  badge: string;
  title: string;
  subtitle: string;
  sections: CopyPrivacySection[];
  operatorLabel: string;
  emailLabel: string;
}

/** Privacy page of a copy (template deployment): generic, never names the main site's operator. */
export const COPY_PRIVACY: Record<LanguageCode, CopyPrivacyCopy> = {
  en: {
    badge: "Privacy",
    title: "Privacy",
    subtitle: "What this site does and does not collect.",
    sections: [
      {
        title: "Location",
        text: "Your location is requested only when you press the button to find help near you. It is used in your browser and in the search request to find places nearby, and it is not stored on this site's server.",
      },
      {
        title: "Accounts and personal data",
        text: "There are no visitor accounts and no personal data about visitors is collected. If the operator has turned on analytics, it is anonymous.",
      },
      {
        title: "Where the data comes from",
        text: "Places are taken from OpenStreetMap and, if the operator has connected one, from the operator's own database of organizations.",
      },
      {
        title: "Anonymous ping to the template author",
        text: "Once a day this site sends the author of the open-source HelpNearby template an anonymous ping: the site's domain, the software version and the date. It contains no visitor data. The operator can turn it off with DISABLE_PING=true.",
      },
    ],
    operatorLabel: "Site operator",
    emailLabel: "Contact",
  },
  ru: {
    badge: "Приватность",
    title: "Приватность",
    subtitle: "Что этот сайт собирает и чего не собирает.",
    sections: [
      {
        title: "Местоположение",
        text: "Местоположение запрашивается только когда вы нажимаете кнопку поиска помощи рядом. Оно используется в браузере и в поисковом запросе, чтобы найти места поблизости, и не хранится на сервере этого сайта.",
      },
      {
        title: "Аккаунты и личные данные",
        text: "Аккаунтов посетителей нет, личные данные посетителей не собираются. Если оператор включил аналитику, она анонимная.",
      },
      {
        title: "Откуда данные",
        text: "Места берутся из OpenStreetMap и, если оператор подключил свою базу, из его базы организаций.",
      },
      {
        title: "Анонимный пинг автору шаблона",
        text: "Раз в сутки сайт отправляет автору открытого шаблона HelpNearby анонимный пинг: домен сайта, версию программы и дату. Данных посетителей в нём нет. Оператор может отключить его переменной DISABLE_PING=true.",
      },
    ],
    operatorLabel: "Оператор сайта",
    emailLabel: "Контакт",
  },
  es: {
    badge: "Privacidad",
    title: "Privacidad",
    subtitle: "Qué recopila y qué no recopila este sitio.",
    sections: [
      {
        title: "Ubicación",
        text: "Tu ubicación solo se solicita cuando pulsas el botón para encontrar ayuda cercana. Se usa en tu navegador y en la solicitud de búsqueda para encontrar lugares próximos, y no se guarda en el servidor de este sitio.",
      },
      {
        title: "Cuentas y datos personales",
        text: "No hay cuentas de visitantes y no se recopilan datos personales de los visitantes. Si el operador ha activado analíticas, son anónimas.",
      },
      {
        title: "De dónde provienen los datos",
        text: "Los lugares se obtienen de OpenStreetMap y, si el operador ha conectado una, de su propia base de datos de organizaciones.",
      },
      {
        title: "Ping anónimo al autor de la plantilla",
        text: "Una vez al día este sitio envía al autor de la plantilla de código abierto HelpNearby un ping anónimo: el dominio del sitio, la versión del software y la fecha. No contiene datos de visitantes. El operador puede desactivarlo con DISABLE_PING=true.",
      },
    ],
    operatorLabel: "Operador del sitio",
    emailLabel: "Contacto",
  },
  fr: {
    badge: "Confidentialité",
    title: "Confidentialité",
    subtitle: "Ce que ce site collecte et ne collecte pas.",
    sections: [
      {
        title: "Localisation",
        text: "Votre position n'est demandée que lorsque vous appuyez sur le bouton pour trouver de l'aide près de chez vous. Elle est utilisée dans votre navigateur et dans la requête de recherche pour trouver des lieux à proximité, et elle n'est pas enregistrée sur le serveur de ce site.",
      },
      {
        title: "Comptes et données personnelles",
        text: "Il n'y a pas de comptes visiteurs et aucune donnée personnelle sur les visiteurs n'est collectée. Si l'opérateur a activé des statistiques, elles sont anonymes.",
      },
      {
        title: "Origine des données",
        text: "Les lieux proviennent d'OpenStreetMap et, si l'opérateur en a connecté une, de sa propre base de données d'organisations.",
      },
      {
        title: "Ping anonyme à l'auteur du modèle",
        text: "Une fois par jour, ce site envoie à l'auteur du modèle open source HelpNearby un ping anonyme : le domaine du site, la version du logiciel et la date. Il ne contient aucune donnée de visiteur. L'opérateur peut le désactiver avec DISABLE_PING=true.",
      },
    ],
    operatorLabel: "Exploitant du site",
    emailLabel: "Contact",
  },
  de: {
    badge: "Datenschutz",
    title: "Datenschutz",
    subtitle: "Was diese Website erfasst und was nicht.",
    sections: [
      {
        title: "Standort",
        text: "Ihr Standort wird nur abgefragt, wenn Sie die Schaltfläche drücken, um Hilfe in Ihrer Nähe zu finden. Er wird in Ihrem Browser und in der Suchanfrage verwendet, um Orte in der Nähe zu finden, und nicht auf dem Server dieser Website gespeichert.",
      },
      {
        title: "Konten und personenbezogene Daten",
        text: "Es gibt keine Besucherkonten, und es werden keine personenbezogenen Daten von Besuchern erhoben. Hat der Betreiber Analysen aktiviert, sind diese anonym.",
      },
      {
        title: "Woher die Daten stammen",
        text: "Orte stammen von OpenStreetMap und, falls der Betreiber eine angebunden hat, aus dessen eigener Datenbank von Organisationen.",
      },
      {
        title: "Anonymer Ping an den Autor der Vorlage",
        text: "Einmal täglich sendet diese Website dem Autor der Open-Source-Vorlage HelpNearby einen anonymen Ping: die Domain der Website, die Softwareversion und das Datum. Er enthält keine Besucherdaten. Der Betreiber kann ihn mit DISABLE_PING=true abschalten.",
      },
    ],
    operatorLabel: "Betreiber der Website",
    emailLabel: "Kontakt",
  },
  zh: {
    badge: "隐私",
    title: "隐私",
    subtitle: "本网站收集什么，不收集什么。",
    sections: [
      {
        title: "位置",
        text: "只有在您点击查找附近援助的按钮时，才会请求您的位置。位置信息仅在您的浏览器和搜索请求中用于查找附近的地点，不会保存在本网站的服务器上。",
      },
      {
        title: "账号与个人数据",
        text: "本网站没有访客账号，也不收集访客的个人数据。如果运营者启用了统计分析，这些数据也是匿名的。",
      },
      {
        title: "数据来源",
        text: "地点来自 OpenStreetMap；如果运营者接入了自己的机构数据库，也会使用该数据库。",
      },
      {
        title: "向模板作者发送的匿名 ping",
        text: "本网站每天会向开源模板 HelpNearby 的作者发送一次匿名 ping，内容为网站域名、软件版本和日期，不包含任何访客数据。运营者可以通过 DISABLE_PING=true 关闭。",
      },
    ],
    operatorLabel: "网站运营者",
    emailLabel: "联系方式",
  },
  ar: {
    badge: "الخصوصية",
    title: "الخصوصية",
    subtitle: "ما الذي يجمعه هذا الموقع وما الذي لا يجمعه.",
    sections: [
      {
        title: "الموقع",
        text: "لا يُطلب موقعك إلا عند الضغط على زر البحث عن مساعدة قريبة. يُستخدم في متصفحك وفي طلب البحث للعثور على الأماكن القريبة، ولا يُخزَّن على خادم هذا الموقع.",
      },
      {
        title: "الحسابات والبيانات الشخصية",
        text: "لا توجد حسابات للزوار ولا تُجمع أي بيانات شخصية عنهم. وإذا فعّل المشغّل التحليلات فهي مجهولة الهوية.",
      },
      {
        title: "مصدر البيانات",
        text: "تؤخذ الأماكن من OpenStreetMap، ومن قاعدة بيانات المنظمات الخاصة بالمشغّل إن كان قد ربطها.",
      },
      {
        title: "إشارة ping مجهولة إلى مؤلف القالب",
        text: "مرة واحدة يوميًا يرسل هذا الموقع إلى مؤلف القالب مفتوح المصدر HelpNearby إشارة ping مجهولة: نطاق الموقع وإصدار البرنامج والتاريخ. لا تحتوي على أي بيانات عن الزوار. يمكن للمشغّل إيقافها عبر DISABLE_PING=true.",
      },
    ],
    operatorLabel: "مشغّل الموقع",
    emailLabel: "التواصل",
  },
};
