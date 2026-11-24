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
    updated: "Last updated: 31 October 2026",
    sections: [
      {
        title: "In short",
        items: [
          "No accounts, no sign-in, no advertising.",
          "No tracking cookies. Our visit statistics (Vercel Web Analytics) use no cookies and no personal identifiers.",
          "Your location is used only to show help near you. It is not saved in our database.",
        ],
      },
      {
        title: "Your location",
        paragraphs: [
          "If you allow it, the browser gives the site your position. It is sent to our server in the body of a request (not in the web address) to find organizations nearby, work out your country and, if you ask for directions, draw a walking route.",
          "We do not store your position in a database and our server code does not write it to logs. Your browser keeps only a rounded area (about 2 km) with the last search results for 30 minutes, so the page can open faster; you can clear it in your browser settings.",
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
          "Vercel Web Analytics (requests go to our own domain, under /_vercel/insights): aggregated counts of visits, pages and countries. It uses no cookies and no personal identifiers, and it does not receive coordinates, search text or anything you type: the page address is sent without any query string. Vercel is also our hosting provider.",
          "Text of a place you type: it is sent to our server (in the body of a request, not in the web address) and on to Nominatim or Photon. Our code does not log it, but the hosting provider's logs may contain it.",
          "Your IP address is kept in the server's memory for a short time (up to one hour) only to limit how often requests can be made. It is not written to the database.",
          "Hosting and database: the hosting provider processes standard technical request logs (IP address, time and the URL of each request). The catalogue, reviews and submitted organizations are stored in a Supabase database.",
        ],
      },
      {
        title: "Stored activity",
        items: [
          "Reviews and organization submissions received before these forms were removed may remain stored in the database.",
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
    updated: "Обновлено: 31 октября 2026",
    sections: [
      {
        title: "Коротко",
        items: [
          "Нет аккаунтов, входа и рекламы.",
          "Нет отслеживающих cookie. Наша статистика посещений (Vercel Web Analytics) не использует cookie и персональные идентификаторы.",
          "Ваше местоположение используется только для показа помощи рядом. В нашей базе данных оно не сохраняется.",
        ],
      },
      {
        title: "Ваше местоположение",
        paragraphs: [
          "Если вы разрешите, браузер передаст сайту вашу позицию. Она отправляется на наш сервер в теле запроса (не в адресе страницы), чтобы найти организации рядом, определить страну и, если вы запросите маршрут, построить пеший путь.",
          "Мы не сохраняем вашу позицию в базе данных, и серверный код не пишет её в логи. Браузер хранит только округлённую область (около 2 км) с последними результатами поиска в течение 30 минут, чтобы страница открывалась быстрее; это можно очистить в настройках браузера.",
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
          "Vercel Web Analytics (запросы идут на наш собственный домен, путь /_vercel/insights): агрегированные счётчики посещений, страниц и стран. Не использует cookie и персональные идентификаторы и не получает координаты, текст поиска или то, что вы вводите: адрес страницы отправляется без параметров запроса. Vercel также является нашим хостинг-провайдером.",
          "Введённое название места: передаётся на наш сервер (в теле запроса, не в адресе) и дальше в Nominatim или Photon. Наш код его не логирует, но оно может попадать в логи хостинга.",
          "IP-адрес временно хранится в памяти сервера (не дольше часа) только для ограничения частоты запросов. В базу данных он не записывается.",
          "Хостинг и база данных: хостинг-провайдер обрабатывает стандартные технические логи запросов (IP-адрес, время и URL каждого запроса). Каталог, отзывы и присланные организации хранятся в базе данных Supabase.",
        ],
      },
      {
        title: "Сохранённые данные",
        items: [
          "Отзывы и сведения об организациях, отправленные до удаления форм, могут оставаться в базе данных.",
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
