import type { LanguageCode } from "@/lib/types";

export interface PrivacySection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

export interface PrivacyCopy {
  badge: string;
  title: string;
  subtitle: string;
  updated: string;
  sections: PrivacySection[];
}

/** English and Russian; the other languages are in privacyCopyOther.ts. */
export const PRIVACY_COPY_EN_RU: Pick<Record<LanguageCode, PrivacyCopy>, "en" | "ru"> = {
  en: {
    badge: "Privacy",
    title: "Privacy",
    subtitle: "What Help Nearby collects, what it sends to other services, and what it keeps.",
    updated: "Last updated: 23 October 2026",
    sections: [
      {
        title: "In short",
        items: [
          "No accounts, no sign-in, no advertising.",
          "No tracking cookies. Our visit statistics (Umami Cloud) do not use cookies or any stored identifier.",
          "Your location is used only to show help near you. It is not saved in our database.",
        ],
      },
      {
        title: "Your location",
        paragraphs: [
          "If you allow it, the browser gives the site your position. It is sent to our server in the body of a request (not in the web address) to find organizations nearby, work out your country and, if you ask for directions, draw a walking route.",
          "We do not store your position in a database and our server code does not write it to logs. Your browser keeps only a rounded area (about 2 km) with the last search results for one hour, so the page can open faster; you can clear it in your browser settings.",
          "If you decline, the site works with a default location and place search.",
        ],
      },
      {
        title: "What other services receive",
        items: [
          "OpenStreetMap tile server (tile.openstreetmap.org): your browser loads map tiles directly from it, so it receives your IP address, browser details and which map tiles you view, which shows roughly which area you look at.",
          "Nominatim and Photon (OpenStreetMap geocoding): our server sends your coordinates to find the country, or the text of a place or address you search for. The request comes from our server, not from your device.",
          "Overpass API (OpenStreetMap mirrors): our server sends the centre of the search area and the radius to find places near you.",
          "OSRM (router.project-osrm.org, routing.openstreetmap.de): when you ask for a walking route, our server sends the start point (your position) and the destination.",
          "ReliefWeb, HDX and GDHO (humanitarian directories): our server sends the name of the country.",
          "AI assistant (AITunnel, api.aitunnel.ru): the text of your chat messages (the last ones in the conversation) and the organizations found for the answer. Please do not write personal data in the chat. Your coordinates are not sent to the AI service.",
          "Umami Cloud (cloud.umami.is): our visit statistics are collected by the Umami Cloud service, not by our own servers. It receives the page address without any query string, the referrer, language, screen size and browser details, and, like any web request, your IP address. This data is processed on Umami's servers outside Russia. No cookies are used. The events (search performed, map opened, directions requested, organization card opened) carry no data: no coordinates, no search text and nothing you type. The browser's Do Not Track setting is respected.",
          "Hosting and database: the hosting provider processes standard technical request logs (IP address, time, address of the page). The catalogue, reviews and submitted organizations are stored in a Supabase database.",
        ],
      },
      {
        title: "What the forms store",
        items: [
          "Review: an optional name or nickname (not a real-name field; leave it empty to appear as Anonymous), the country, the message and the rating you type, and the date. A review is published only after moderation. Do not write anything you do not want to be public.",
          "Add an organization: the name, category, country, city, address, phone, e-mail, website, opening hours and description you type, plus coordinates found from the address. These details are published after verification, so give organization contacts, not private ones.",
          "Counter of help: when you press Call or Directions we store only the organization id, the action and the time. Nothing that identifies you.",
        ],
      },
      {
        title: "On your device",
        items: [
          "Language, theme and view-mode choices, and a cache of recent results (a rounded area, not your exact position).",
          "A sign-in cookie exists only for site administrators.",
        ],
      },
      {
        title: "Questions",
        paragraphs: ["Use the contact links at the bottom of the page."],
      },
    ],
  },
  ru: {
    badge: "Конфиденциальность",
    title: "Конфиденциальность",
    subtitle: "Что собирает Help Nearby, что передаёт другим сервисам и что хранит.",
    updated: "Обновлено: 23 октября 2026",
    sections: [
      {
        title: "Коротко",
        items: [
          "Нет аккаунтов, входа и рекламы.",
          "Нет отслеживающих cookie. Наша статистика посещений (Umami Cloud) не использует cookie и не сохраняет идентификаторы.",
          "Ваше местоположение используется только для показа помощи рядом. В нашей базе данных оно не сохраняется.",
        ],
      },
      {
        title: "Ваше местоположение",
        paragraphs: [
          "Если вы разрешите, браузер передаст сайту вашу позицию. Она отправляется на наш сервер в теле запроса (не в адресе страницы), чтобы найти организации рядом, определить страну и, если вы запросите маршрут, построить пеший путь.",
          "Мы не сохраняем вашу позицию в базе данных, и серверный код не пишет её в логи. Браузер хранит только округлённую область (около 2 км) с последними результатами поиска в течение одного часа, чтобы страница открывалась быстрее; это можно очистить в настройках браузера.",
          "Если вы откажетесь, сайт работает с местоположением по умолчанию и поиском по месту.",
        ],
      },
      {
        title: "Что получают другие сервисы",
        items: [
          "Сервер карт OpenStreetMap (tile.openstreetmap.org): браузер загружает плитки карты напрямую, поэтому сервер получает ваш IP-адрес, сведения о браузере и то, какие плитки вы смотрите, то есть примерно какую область.",
          "Nominatim и Photon (геокодирование OpenStreetMap): наш сервер отправляет ваши координаты, чтобы определить страну, либо текст места или адреса, который вы ищете. Запрос идёт с нашего сервера, а не с вашего устройства.",
          "Overpass API (зеркала OpenStreetMap): наш сервер отправляет центр области поиска и радиус, чтобы найти места рядом.",
          "OSRM (router.project-osrm.org, routing.openstreetmap.de): когда вы просите пеший маршрут, наш сервер отправляет начальную точку (вашу позицию) и пункт назначения.",
          "ReliefWeb, HDX и GDHO (гуманитарные справочники): наш сервер отправляет название страны.",
          "ИИ-помощник (AITunnel, api.aitunnel.ru): текст ваших сообщений в чате (последние сообщения диалога) и найденные организации для ответа. Не пишите в чат личные данные. Ваши координаты ИИ-сервису не передаются.",
          "Umami Cloud (cloud.umami.is): статистику посещений собирает сервис Umami Cloud, а не наши собственные серверы. Он получает адрес страницы без параметров запроса, источник перехода, язык, размер экрана и сведения о браузере, а также, как при любом запросе в интернете, ваш IP-адрес. Эти данные обрабатываются на серверах Umami за пределами России. Cookie не используются. События (выполнен поиск, открыта карта, запрошен маршрут, открыта карточка организации) не содержат данных: ни координат, ни текста поиска, ни того, что вы вводите. Настройка браузера «Не отслеживать» учитывается.",
          "Хостинг и база данных: хостинг-провайдер обрабатывает стандартные технические логи запросов (IP-адрес, время, адрес страницы). Каталог, отзывы и присланные организации хранятся в базе данных Supabase.",
        ],
      },
      {
        title: "Что сохраняют формы",
        items: [
          "Отзыв: необязательное имя или псевдоним (это не поле для настоящего имени; оставьте пустым, и вы будете «Аноним»), страна, текст и оценка, которые вы вводите, и дата. Отзыв публикуется только после модерации. Не пишите то, что не хотите сделать публичным.",
          "Добавление организации: название, категория, страна, город, адрес, телефон, e-mail, сайт, часы работы и описание, которые вы вводите, а также координаты, найденные по адресу. Эти данные публикуются после проверки, поэтому указывайте контакты организации, а не личные.",
          "Счётчик помощи: при нажатии «Позвонить» или «Маршрут» мы сохраняем только идентификатор организации, тип действия и время. Ничего, что идентифицирует вас.",
        ],
      },
      {
        title: "На вашем устройстве",
        items: [
          "Выбор языка, темы и режима просмотра, а также кэш недавних результатов (округлённая область, а не точная позиция).",
          "Cookie для входа есть только у администраторов сайта.",
        ],
      },
      {
        title: "Вопросы",
        paragraphs: ["Используйте контакты внизу страницы."],
      },
    ],
  },
};
