import type { PrivacyCopy } from "@/lib/i18n/privacyCopy";
import type { LanguageCode } from "@/lib/types";

/** Spanish, French, German, Chinese and Arabic versions of the /privacy page (same content as English). */
export const PRIVACY_COPY_OTHER: Pick<Record<LanguageCode, PrivacyCopy>, "es" | "fr" | "de" | "zh" | "ar"> = {
  es: {
    badge: "Privacidad",
    title: "Privacidad",
    subtitle: "Qué recopila Help Nearby, qué envía a otros servicios y qué conserva.",
    updated: "Última actualización: 31 de octubre de 2026",
    sections: [
      {
        title: "En resumen",
        items: [
          "Sin cuentas, sin inicio de sesión, sin publicidad.",
          "Sin cookies de seguimiento. Nuestras estadísticas de visitas (Vercel Web Analytics) no usan cookies ni identificadores personales.",
          "Tu ubicación se usa solo para mostrar ayuda cercana. No se guarda en nuestra base de datos.",
        ],
      },
      {
        title: "Tu ubicación",
        paragraphs: [
          "Si lo permites, el navegador entrega al sitio tu posición. Se envía a nuestro servidor en el cuerpo de una solicitud (no en la dirección web) para encontrar organizaciones cercanas, determinar tu país y, si pides indicaciones, trazar una ruta a pie.",
          "No guardamos tu posición en una base de datos y el código de nuestro servidor no la escribe en registros. Tu navegador conserva solo un área redondeada (unos 2 km) con los últimos resultados de búsqueda durante una hora, para que la página se abra más rápido; puedes borrarlo en los ajustes del navegador.",
          "Si lo rechazas, el sitio funciona con una ubicación predeterminada y la búsqueda de lugares.",
        ],
      },
      {
        title: "Qué reciben otros servicios",
        items: [
          "Servidor de teselas de OpenStreetMap (tile.openstreetmap.org): tu navegador carga las teselas del mapa directamente desde él, por lo que recibe tu dirección IP, datos del navegador y qué teselas del mapa ves, lo que muestra aproximadamente qué zona miras.",
          "Nominatim y Photon (geocodificación de OpenStreetMap): nuestro servidor envía tus coordenadas para encontrar el país, o el texto de un lugar o una dirección que buscas. La solicitud sale de nuestro servidor, no de tu dispositivo.",
          "Overpass API (réplicas de OpenStreetMap): nuestro servidor envía el centro del área de búsqueda y el radio para encontrar lugares cercanos.",
          "OSRM (router.project-osrm.org, routing.openstreetmap.de): cuando pides una ruta a pie, nuestro servidor envía el punto de partida (tu posición) y el destino.",
          "ReliefWeb, HDX y GDHO (directorios humanitarios): nuestro servidor envía el nombre del país.",
          "Asistente de IA (AITunnel, api.aitunnel.ru): el texto de tus mensajes del chat (los últimos de la conversación) y las organizaciones encontradas para la respuesta. No escribas datos personales en el chat. Tus coordenadas no se envían al servicio de IA.",
          "Vercel Web Analytics (las solicitudes van a nuestro propio dominio, bajo /_vercel/insights): recuentos agregados de visitas, páginas y países. No usa cookies ni identificadores personales y no recibe coordenadas, texto de búsqueda ni nada de lo que escribes: la dirección de la página se envía sin parámetros de consulta. Vercel es también nuestro proveedor de alojamiento.",
          "Alojamiento y base de datos: el proveedor de alojamiento procesa registros técnicos estándar de solicitudes (dirección IP, hora, dirección de la página). El catálogo, las reseñas y las organizaciones enviadas se almacenan en una base de datos Supabase.",
        ],
      },
      {
        title: "Qué guardan los formularios",
        items: [
          "Reseña: un nombre o apodo opcional (no es un campo para el nombre real; déjalo vacío para aparecer como Anónimo), el país, el mensaje y la valoración que escribes, y la fecha. Una reseña se publica solo tras la moderación. No escribas nada que no quieras hacer público.",
          "Añadir una organización: el nombre, la categoría, el país, la ciudad, la dirección, el teléfono, el correo electrónico, el sitio web, el horario y la descripción que escribes, más las coordenadas obtenidas a partir de la dirección. Estos datos se publican tras la verificación, así que indica contactos de la organización, no privados.",
          "Contador de ayuda: cuando pulsas Llamar o Cómo llegar guardamos solo el identificador de la organización, la acción y la hora. Nada que te identifique.",
        ],
      },
      {
        title: "En tu dispositivo",
        items: [
          "Tus elecciones de idioma, tema y modo de vista, y una caché de resultados recientes (un área redondeada, no tu posición exacta).",
          "Una cookie de inicio de sesión existe solo para los administradores del sitio.",
        ],
      },
      {
        title: "Preguntas",
        paragraphs: ["Usa los enlaces de contacto al final de la página."],
      },
    ],
  },
  fr: {
    badge: "Confidentialité",
    title: "Confidentialité",
    subtitle: "Ce que Help Nearby collecte, ce qu'il envoie à d'autres services et ce qu'il conserve.",
    updated: "Dernière mise à jour : 31 octobre 2026",
    sections: [
      {
        title: "En bref",
        items: [
          "Pas de comptes, pas de connexion, pas de publicité.",
          "Pas de cookies de suivi. Nos statistiques de visites (Vercel Web Analytics) n'utilisent ni cookies ni identifiants personnels.",
          "Votre position sert uniquement à afficher l'aide près de chez vous. Elle n'est pas enregistrée dans notre base de données.",
        ],
      },
      {
        title: "Votre position",
        paragraphs: [
          "Si vous l'autorisez, le navigateur transmet votre position au site. Elle est envoyée à notre serveur dans le corps d'une requête (et non dans l'adresse web) pour trouver les organisations proches, déterminer votre pays et, si vous demandez un itinéraire, tracer un parcours à pied.",
          "Nous n'enregistrons pas votre position dans une base de données et le code de notre serveur ne l'écrit pas dans les journaux. Votre navigateur ne conserve qu'une zone arrondie (environ 2 km) avec les derniers résultats de recherche pendant une heure, afin que la page s'ouvre plus vite ; vous pouvez l'effacer dans les réglages du navigateur.",
          "Si vous refusez, le site fonctionne avec une position par défaut et la recherche de lieu.",
        ],
      },
      {
        title: "Ce que reçoivent les autres services",
        items: [
          "Serveur de tuiles OpenStreetMap (tile.openstreetmap.org) : votre navigateur charge directement les tuiles de la carte, il reçoit donc votre adresse IP, des informations sur le navigateur et les tuiles que vous consultez, ce qui indique à peu près la zone que vous regardez.",
          "Nominatim et Photon (géocodage OpenStreetMap) : notre serveur envoie vos coordonnées pour trouver le pays, ou le texte d'un lieu ou d'une adresse que vous recherchez. La requête provient de notre serveur, pas de votre appareil.",
          "Overpass API (miroirs OpenStreetMap) : notre serveur envoie le centre de la zone de recherche et le rayon pour trouver des lieux proches.",
          "OSRM (router.project-osrm.org, routing.openstreetmap.de) : lorsque vous demandez un itinéraire à pied, notre serveur envoie le point de départ (votre position) et la destination.",
          "ReliefWeb, HDX et GDHO (annuaires humanitaires) : notre serveur envoie le nom du pays.",
          "Assistant IA (AITunnel, api.aitunnel.ru) : le texte de vos messages dans le chat (les derniers de la conversation) et les organisations trouvées pour la réponse. N'écrivez pas de données personnelles dans le chat. Vos coordonnées ne sont pas envoyées au service d'IA.",
          "Vercel Web Analytics (les requêtes vont vers notre propre domaine, sous /_vercel/insights) : décomptes agrégés des visites, des pages et des pays. Il n'utilise ni cookies ni identifiants personnels et ne reçoit ni coordonnées, ni texte de recherche, ni rien de ce que vous saisissez : l'adresse de la page est envoyée sans paramètres de requête. Vercel est aussi notre hébergeur.",
          "Hébergement et base de données : l'hébergeur traite des journaux techniques standard des requêtes (adresse IP, heure, adresse de la page). Le catalogue, les avis et les organisations soumises sont stockés dans une base de données Supabase.",
        ],
      },
      {
        title: "Ce que conservent les formulaires",
        items: [
          "Avis : un nom ou pseudonyme facultatif (ce n'est pas un champ pour votre vrai nom ; laissez-le vide pour apparaître comme Anonyme), le pays, le message et la note que vous saisissez, et la date. Un avis n'est publié qu'après modération. N'écrivez rien que vous ne souhaitez pas rendre public.",
          "Ajouter une organisation : le nom, la catégorie, le pays, la ville, l'adresse, le téléphone, l'e-mail, le site web, les horaires et la description que vous saisissez, ainsi que les coordonnées trouvées à partir de l'adresse. Ces informations sont publiées après vérification ; indiquez donc les coordonnées de l'organisation, pas des coordonnées privées.",
          "Compteur d'aide : lorsque vous appuyez sur Appeler ou Itinéraire, nous ne conservons que l'identifiant de l'organisation, l'action et l'heure. Rien qui vous identifie.",
        ],
      },
      {
        title: "Sur votre appareil",
        items: [
          "Vos choix de langue, de thème et de mode d'affichage, et un cache des résultats récents (une zone arrondie, pas votre position exacte).",
          "Un cookie de connexion n'existe que pour les administrateurs du site.",
        ],
      },
      {
        title: "Questions",
        paragraphs: ["Utilisez les liens de contact en bas de la page."],
      },
    ],
  },
  de: {
    badge: "Datenschutz",
    title: "Datenschutz",
    subtitle: "Was Help Nearby erfasst, was an andere Dienste gesendet wird und was gespeichert wird.",
    updated: "Zuletzt aktualisiert: 31. Oktober 2026",
    sections: [
      {
        title: "Kurz gesagt",
        items: [
          "Keine Konten, keine Anmeldung, keine Werbung.",
          "Keine Tracking-Cookies. Unsere Besuchsstatistik (Vercel Web Analytics) verwendet weder Cookies noch persönliche Kennungen.",
          "Ihr Standort wird nur verwendet, um Hilfe in Ihrer Nähe anzuzeigen. Er wird nicht in unserer Datenbank gespeichert.",
        ],
      },
      {
        title: "Ihr Standort",
        paragraphs: [
          "Wenn Sie es erlauben, übergibt der Browser der Website Ihre Position. Sie wird im Body einer Anfrage (nicht in der Webadresse) an unseren Server gesendet, um Organisationen in der Nähe zu finden, Ihr Land zu bestimmen und, wenn Sie eine Wegbeschreibung anfordern, eine Fußgängerroute zu zeichnen.",
          "Wir speichern Ihre Position nicht in einer Datenbank, und unser Servercode schreibt sie nicht in Logs. Ihr Browser behält nur ein gerundetes Gebiet (etwa 2 km) mit den letzten Suchergebnissen für eine Stunde, damit sich die Seite schneller öffnet; Sie können das in den Browsereinstellungen löschen.",
          "Wenn Sie ablehnen, funktioniert die Website mit einem Standardstandort und der Ortssuche.",
        ],
      },
      {
        title: "Was andere Dienste erhalten",
        items: [
          "OpenStreetMap-Kachelserver (tile.openstreetmap.org): Ihr Browser lädt die Kartenkacheln direkt von dort, daher erhält er Ihre IP-Adresse, Browserdaten und welche Kartenkacheln Sie ansehen, was ungefähr zeigt, welches Gebiet Sie betrachten.",
          "Nominatim und Photon (OpenStreetMap-Geokodierung): Unser Server sendet Ihre Koordinaten, um das Land zu bestimmen, oder den Text eines Ortes oder einer Adresse, die Sie suchen. Die Anfrage kommt von unserem Server, nicht von Ihrem Gerät.",
          "Overpass API (OpenStreetMap-Spiegelserver): Unser Server sendet den Mittelpunkt des Suchgebiets und den Radius, um Orte in Ihrer Nähe zu finden.",
          "OSRM (router.project-osrm.org, routing.openstreetmap.de): Wenn Sie eine Fußgängerroute anfordern, sendet unser Server den Startpunkt (Ihre Position) und das Ziel.",
          "ReliefWeb, HDX und GDHO (humanitäre Verzeichnisse): Unser Server sendet den Namen des Landes.",
          "KI-Assistent (AITunnel, api.aitunnel.ru): der Text Ihrer Chat-Nachrichten (die letzten des Gesprächs) und die für die Antwort gefundenen Organisationen. Bitte schreiben Sie keine personenbezogenen Daten in den Chat. Ihre Koordinaten werden nicht an den KI-Dienst gesendet.",
          "Vercel Web Analytics (die Anfragen gehen an unsere eigene Domain, unter /_vercel/insights): aggregierte Zahlen zu Besuchen, Seiten und Ländern. Es verwendet keine Cookies und keine persönlichen Kennungen und erhält weder Koordinaten noch Suchtext noch etwas, was Sie eingeben: Die Seitenadresse wird ohne Query-String gesendet. Vercel ist auch unser Hosting-Anbieter.",
          "Hosting und Datenbank: Der Hosting-Anbieter verarbeitet übliche technische Anfrageprotokolle (IP-Adresse, Zeit, Adresse der Seite). Der Katalog, die Bewertungen und eingereichte Organisationen werden in einer Supabase-Datenbank gespeichert.",
        ],
      },
      {
        title: "Was die Formulare speichern",
        items: [
          "Bewertung: ein optionaler Name oder Spitzname (kein Feld für den echten Namen; lassen Sie es leer, um als Anonym zu erscheinen), das Land, die Nachricht und die Bewertung, die Sie eingeben, sowie das Datum. Eine Bewertung wird erst nach Moderation veröffentlicht. Schreiben Sie nichts, was nicht öffentlich werden soll.",
          "Organisation hinzufügen: der Name, die Kategorie, das Land, die Stadt, die Adresse, das Telefon, die E-Mail, die Website, die Öffnungszeiten und die Beschreibung, die Sie eingeben, sowie aus der Adresse ermittelte Koordinaten. Diese Angaben werden nach der Prüfung veröffentlicht; geben Sie daher Kontaktdaten der Organisation an, keine privaten.",
          "Hilfezähler: Wenn Sie auf Anrufen oder Route klicken, speichern wir nur die Kennung der Organisation, die Aktion und die Zeit. Nichts, was Sie identifiziert.",
        ],
      },
      {
        title: "Auf Ihrem Gerät",
        items: [
          "Ihre Auswahl von Sprache, Design und Ansichtsmodus sowie ein Cache der letzten Ergebnisse (ein gerundetes Gebiet, nicht Ihre genaue Position).",
          "Ein Anmelde-Cookie existiert nur für die Administratoren der Website.",
        ],
      },
      {
        title: "Fragen",
        paragraphs: ["Nutzen Sie die Kontaktlinks am Ende der Seite."],
      },
    ],
  },
  zh: {
    badge: "隐私",
    title: "隐私",
    subtitle: "Help Nearby 收集什么、向其他服务发送什么、保存什么。",
    updated: "最后更新：2026 年 10 月 31 日",
    sections: [
      {
        title: "简而言之",
        items: [
          "没有账号，无需登录，没有广告。",
          "没有跟踪 Cookie。我们的访问统计（Vercel Web Analytics）不使用 Cookie，也不使用个人标识符。",
          "您的位置仅用于显示附近的帮助，不会保存在我们的数据库中。",
        ],
      },
      {
        title: "您的位置",
        paragraphs: [
          "如果您允许，浏览器会把您的位置提供给网站。位置通过请求正文（而不是网址）发送到我们的服务器，用于查找附近的机构、判断您所在的国家，以及在您请求路线时绘制步行路线。",
          "我们不会把您的位置存入数据库，服务器代码也不会把它写入日志。您的浏览器只保留一个取整后的区域（约 2 公里）和最近的搜索结果，保存一小时，以便页面打开更快；您可以在浏览器设置中清除。",
          "如果您拒绝，网站将使用默认位置和地点搜索。",
        ],
      },
      {
        title: "其他服务会收到什么",
        items: [
          "OpenStreetMap 地图瓦片服务器（tile.openstreetmap.org）：您的浏览器直接从它加载地图瓦片，因此它会收到您的 IP 地址、浏览器信息以及您查看的地图瓦片，这大致显示您在看哪个区域。",
          "Nominatim 和 Photon（OpenStreetMap 地理编码）：我们的服务器发送您的坐标以确定国家，或发送您搜索的地点或地址文字。请求来自我们的服务器，而不是您的设备。",
          "Overpass API（OpenStreetMap 镜像）：我们的服务器发送搜索区域的中心点和半径，以查找您附近的地点。",
          "OSRM（router.project-osrm.org、routing.openstreetmap.de）：当您请求步行路线时，我们的服务器发送起点（您的位置）和目的地。",
          "ReliefWeb、HDX 和 GDHO（人道主义名录）：我们的服务器发送国家名称。",
          "AI 助手（AITunnel，api.aitunnel.ru）：您的聊天消息文字（对话中最近的几条）以及为回答找到的机构。请不要在聊天中填写个人信息。您的坐标不会发送给 AI 服务。",
          "Vercel Web Analytics（请求发送到我们自己的域名，路径为 /_vercel/insights）：访问量、页面和国家的汇总统计。它不使用 Cookie，也不使用个人标识符，不会收到坐标、搜索文字或您输入的任何内容：页面地址在发送时不带查询参数。Vercel 同时也是我们的托管服务商。",
          "托管与数据库：托管服务商会处理标准的技术请求日志（IP 地址、时间、页面地址）。目录、评价和提交的机构保存在 Supabase 数据库中。",
        ],
      },
      {
        title: "表单会保存什么",
        items: [
          "评价：您输入的可选姓名或昵称（这不是真实姓名栏；留空则显示为“匿名”）、国家、留言和评分，以及日期。评价经审核后才会发布。请不要写下不想公开的内容。",
          "添加机构：您输入的名称、类别、国家、城市、地址、电话、电子邮件、网站、营业时间和描述，以及根据地址找到的坐标。这些信息在核实后发布，因此请填写机构的联系方式，而不是私人联系方式。",
          "帮助计数：当您点击“致电”或“路线”时，我们只保存机构编号、操作类型和时间，不保存任何能识别您的信息。",
        ],
      },
      {
        title: "在您的设备上",
        items: [
          "您选择的语言、主题和视图模式，以及最近结果的缓存（取整后的区域，而不是您的确切位置）。",
          "登录 Cookie 仅存在于网站管理员处。",
        ],
      },
      {
        title: "问题",
        paragraphs: ["请使用页面底部的联系链接。"],
      },
    ],
  },
  ar: {
    badge: "الخصوصية",
    title: "الخصوصية",
    subtitle: "ما الذي يجمعه Help Nearby، وما الذي يرسله إلى خدمات أخرى، وما الذي يحتفظ به.",
    updated: "آخر تحديث: 31 أكتوبر 2026",
    sections: [
      {
        title: "باختصار",
        items: [
          "لا حسابات ولا تسجيل دخول ولا إعلانات.",
          "لا ملفات تعريف ارتباط للتتبع. إحصاءات الزيارات لدينا (Vercel Web Analytics) لا تستخدم ملفات تعريف الارتباط ولا معرّفات شخصية.",
          "يُستخدم موقعك فقط لعرض المساعدة القريبة منك. ولا يُحفظ في قاعدة بياناتنا.",
        ],
      },
      {
        title: "موقعك",
        paragraphs: [
          "إذا سمحت بذلك، يمنح المتصفح الموقع موضعك. يُرسل إلى خادمنا ضمن نص الطلب (وليس في عنوان الويب) للعثور على المنظمات القريبة وتحديد بلدك ورسم مسار للمشي إذا طلبت الاتجاهات.",
          "لا نحفظ موضعك في قاعدة بيانات، ولا يكتبه كود الخادم في السجلات. يحتفظ متصفحك فقط بمنطقة مقرَّبة (نحو 2 كم) مع آخر نتائج البحث لمدة ساعة، ليُفتح الموقع أسرع؛ ويمكنك مسحها من إعدادات المتصفح.",
          "إذا رفضت، يعمل الموقع بموقع افتراضي وبالبحث عن الأماكن.",
        ],
      },
      {
        title: "ما تستلمه الخدمات الأخرى",
        items: [
          "خادم بلاطات خرائط OpenStreetMap (tile.openstreetmap.org): يحمّل متصفحك بلاطات الخريطة منه مباشرة، لذا يستلم عنوان IP الخاص بك وبيانات المتصفح وأي بلاطات خريطة تعرضها، وهذا يبيّن تقريبًا أي منطقة تنظر إليها.",
          "Nominatim وPhoton (الترميز الجغرافي في OpenStreetMap): يرسل خادمنا إحداثياتك لتحديد البلد، أو نص المكان أو العنوان الذي تبحث عنه. يأتي الطلب من خادمنا لا من جهازك.",
          "Overpass API (نسخ OpenStreetMap المرآة): يرسل خادمنا مركز منطقة البحث ونصف القطر للعثور على أماكن قريبة منك.",
          "OSRM (router.project-osrm.org وrouting.openstreetmap.de): عندما تطلب مسارًا للمشي، يرسل خادمنا نقطة البداية (موضعك) والوجهة.",
          "ReliefWeb وHDX وGDHO (أدلة إنسانية): يرسل خادمنا اسم البلد.",
          "مساعد الذكاء الاصطناعي (AITunnel، api.aitunnel.ru): نص رسائل الدردشة (آخر رسائل المحادثة) والمنظمات التي عُثر عليها للإجابة. يُرجى عدم كتابة بيانات شخصية في الدردشة. لا تُرسل إحداثياتك إلى خدمة الذكاء الاصطناعي.",
          "Vercel Web Analytics (تذهب الطلبات إلى نطاقنا الخاص، تحت المسار /_vercel/insights): أعداد مجمّعة للزيارات والصفحات والدول. لا تستخدم ملفات تعريف الارتباط ولا معرّفات شخصية ولا تستلم إحداثيات أو نص بحث أو أي شيء تكتبه: يُرسل عنوان الصفحة دون معاملات الاستعلام. Vercel هي أيضًا مزوّد الاستضافة لدينا.",
          "الاستضافة وقاعدة البيانات: يعالج مزوّد الاستضافة سجلات الطلبات التقنية المعتادة (عنوان IP والوقت وعنوان الصفحة). يُخزَّن الدليل والمراجعات والمنظمات المرسَلة في قاعدة بيانات Supabase.",
        ],
      },
      {
        title: "ما تحفظه النماذج",
        items: [
          "المراجعة: اسم أو لقب اختياري (ليس حقلًا للاسم الحقيقي؛ اتركه فارغًا لتظهر باسم «مجهول»)، والبلد والرسالة والتقييم الذي تكتبه، والتاريخ. لا تُنشر المراجعة إلا بعد الإشراف. لا تكتب ما لا تريد أن يصبح علنيًا.",
          "إضافة منظمة: الاسم والفئة والبلد والمدينة والعنوان والهاتف والبريد الإلكتروني والموقع الإلكتروني وساعات العمل والوصف التي تكتبها، إضافةً إلى الإحداثيات المستخرجة من العنوان. تُنشر هذه البيانات بعد التحقق، لذا اذكر وسائل الاتصال الخاصة بالمنظمة لا الخاصة بك.",
          "عداد المساعدة: عند الضغط على اتصال أو الاتجاهات نحفظ فقط معرّف المنظمة والإجراء والوقت. لا شيء يحدد هويتك.",
        ],
      },
      {
        title: "على جهازك",
        items: [
          "اختياراتك للغة والمظهر ووضع العرض، وذاكرة مؤقتة لآخر النتائج (منطقة مقرَّبة وليس موضعك الدقيق).",
          "ملف تعريف الارتباط لتسجيل الدخول موجود فقط لمشرفي الموقع.",
        ],
      },
      {
        title: "أسئلة",
        paragraphs: ["استخدم روابط التواصل في أسفل الصفحة."],
      },
    ],
  },
};
