import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, ShoppingBag, X, Plus, Minus, ChevronLeft, ChevronRight, ArrowRight,
  Send, Check, Trash2, ChevronDown, Globe, Menu,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   la_store — premium streetwear storefront (kkaitew style)
   All editable content is in the CONFIG block below.
   ════════════════════════════════════════════════════════════════ */

/* ─────────────── CONFIG · edit me ─────────────── */
const money = (n) => `${Number(n).toLocaleString("uk-UA")} ₴`;

// Scrolls the page back to the very top (hero). Tries every plausible scrolling
// element so this keeps working even in embedded/preview hosts where only one
// of window / documentElement / body actually owns the scroll position.
const scrollToTop = () => {
  const targets = [window, document.documentElement, document.body];
  targets.forEach((el) => {
    try { el.scrollTo({ top: 0, left: 0, behavior: "smooth" }); } catch { /* ignore */ }
  });
  requestAnimationFrame(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
};

const HERO_VIDEO_URL = "https://res.cloudinary.com/dwhdnp0rl/video/upload/so_50p,q_100/v1782642247/IMG_1275_ooocde.mp4";

const LINKS = {
  tiktok:    "https://www.tiktok.com/@la_store1_?is_from_webapp=1&sender_device=pc",
  telegram:  "https://t.me/+AoxXPv2YtTxlMzMy",
  instagram: "https://www.instagram.com/la_store1_/",
  support:   "https://t.me/+AoxXPv2YtTxlMzMy",
};

// ▶ NEWSLETTER (Brevo) — used by the "Підписатися" footer form.
//   NOTE: this key is visible in the page source. Fine for now (prototype stage),
//   but move this call behind a server route once the real Next.js site is live.
const BREVO_API_KEY = "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";
const BREVO_LIST_ID = 3;
// ▶ ORDER NOTIFICATIONS — sent via Brevo's transactional email when a customer checks out.
//   OWNER_EMAIL  = where YOU receive the order (your inbox).
//   SENDER_EMAIL = the "from" address — must be verified in Brevo → Settings → Senders & IP → Senders.
const OWNER_EMAIL = "andriylyzak@gmail.com";
const SENDER_EMAIL = "lastore6767@gmail.com";

// ▶ MARQUEE GALLERY IMAGES — just paste your Cloudinary (or any) image URLs here.
//   Example: const MARQUEE = ["https://res.cloudinary.com/.../1.jpg", "...2.jpg"];
//   (placeholders below until you send the photos)
const MARQUEE_IMAGES = [
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753372/IMG_3032_cqgame.jpg",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753373/IMG_3994_vy3pne.jpg",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753390/IMG_5810_eauazv.jpg",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753373/IMG_1431_esgluv.heic",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753374/IMG_4255_a9qk8u.heic",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753374/IMG_4878_aqgpvn.jpg",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753390/IMG_8056_cs8awz.heic",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753374/IMG_4714_eoiqmh.heic",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753375/IMG_4860_wdijit.heic",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753390/IMG_5311_wvq7no.heic",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753390/IMG_9049_nvat1s.heic",
  "https://res.cloudinary.com/dwhdnp0rl/image/upload/f_auto,q_auto,w_420,h_560,c_fill,g_auto/v1785753374/IMG_4740_fc2vdf.heic",
];

const CATEGORIES = ["Під замовлення", "Наявність"];           // filter keys
const HEADER_CATS = ["Під замовлення", "Наявність"];          // top-left nav order
const BRANDS = [];
const INFO_KEYS = ["contacts", "shipping", "refund", "terms", "privacy"];

/* ─────────────── i18n ─────────────── */
const plural = (n, lang) => {
  if (lang === "en") return n === 1 ? "product" : "products";
  const f = lang === "ru" ? ["товар", "товара", "товаров"] : ["товар", "товари", "товарів"];
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return f[0];
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return f[1];
  return f[2];
};
const T = {
  ua: {
    newIn: "Новинки", heroCta: "ПЕРЕГЛЯНУТИ НАЯВНІСТЬ",
    catalog: "Всі товари", loading: "Завантаження...", all: "Всі", showAll: "Показати все",
    notFound: "Нічого не знайдено", reset: "Скинути фільтри", loadErr: "Не вдалося завантажити товари. Перевірте з'єднання і оновіть сторінку.",
    inStock: "В наявності", outStock: "Немає", addToCart: "Додати в кошик", addShort: "В кошик",
    soldOut: "Немає в наявності", cart: "Кошик", cartEmpty: "Кошик порожній", total: "Разом",
    checkout: "Оформити замовлення", searchPh: "Пошук товарів, брендів...", popular: "Популярні бренди",
    nothingFor: "Нічого не знайдено за", reviewsTitle: "Відгуки наших клієнтів", allReviews: "Усі відгуки можна переглянути в Telegram",
    quickLinks: "Швидкі посилання", info: "Інформація", subscribe: "Підписатися",
    subBlurb: "Ранній доступ, знижки і новини.", subDone: "Дякуємо за підписку! 🎉", subErr: "Введіть коректний email", subErrNet: "Не вдалось підписатись, спробуйте пізніше",
    about: "Оригінальний магазин luxury брендів\nWorldwide shipping",
    region: "Україна", rights: "© 2026 la_store. Всі права захищені.", added: "додано в кошик",
    sort: ["Ціна: спочатку дешевші", "Ціна: спочатку дорожчі", "Дата: від старих до нових", "Дата: від нових до старих"],
    cat: { "Під замовлення": "Під замовлення", "Наявність": "Наявність" },
    quickAll: "Всі колекції",
    infoItems: ["Контакти", "Політика доставки", "Політика повернення коштів", "Умови використання", "Конфіденційність"],
    descTpl: (b) => `Оригінал ${b}. Преміальна тканина та крій — streetwear без компромісів.`,
    contactTitle: "Зв'яжіться з нами", fName: "Ім'я", fTelegram: "Ваш нік у Telegram", fMsg: "Повідомлення",
    fSend: "Надіслати", tgSupport: "Telegram-підтримка",
    fSending: "Надсилаємо...", fSentOk: "Дякуємо! Ми вам скоро відповімо в Telegram.", fSentErr: "Не вдалося надіслати. Спробуйте ще раз або напишіть нам у Telegram.",
    contactIntro: "Маєте запитання щодо товару, розміру чи замовлення? Напишіть нам — відповідаємо швидко.",
    backShop: "До магазину",
    sizeLabel: "Розмір", youMayLike: "Вам також може сподобатися",
    careTitle: "Інструкції з догляду",
    careText: "Дотримуйтесь інструкцій з догляду на оригінальній етикетці вашого виробу. Для загального догляду зберігайте в прохолодному, сухому місці подалі від прямих сонячних променів та уникайте контакту з парфумами, оліями й косметикою. Якщо вам потрібна додаткова консультація, напишіть нам у Telegram.",
    shipReturnTitle: "Доставка та повернення",
    shipReturnText: "Обробка протягом 1–3 робочих днів. Доставка з відстеженням по всьому світу. Тариф розраховується при оформленні замовлення. Митні збори сплачує покупець.\n\nУсі продажі остаточні. Винятки — лише якщо товар не відповідає опису, прибув пошкодженим або виявився неоригінальним: напишіть нам у Telegram протягом 48 годин після доставки.",
    importantTitle: "Важлива інформація",
    importantText1: "Наш магазин займається виключно оригіналом і до кожного айтему присутній ордер-електронний чек покупки з офіційного сайту.",
    importantText2: "Багато фото речей були оброблені або доповнені за допомогою штучного інтелекту, тому деякі з них можуть не повністю відповідати дійсності. Для перегляду живих фото рекомендуємо перейти в",
    importantLinkLabel: "Telegram-канал",
    coTitle: "Оформлення замовлення", coSummary: "Ваше замовлення", coSubtotal: "Проміжна сума", coShipping: "Доставка",
    coShippingVal: "Worldwide shipping", coTotal: "Всього", coYourName: "Ваше ім'я", coTelegram: "Ваш нік у Telegram",
    coAfter: "Після оформлення ми скоро з вами зв'яжемося в Telegram для підтвердження замовлення та оплати.",
    coSubmit: "Оформити замовлення", coBack: "Повернутись до магазину", coSize: "Розмір", coEmptyTitle: "Кошик порожній", coEmptyText: "Додайте товар, щоб оформити замовлення.",
  },
  en: {
    newIn: "New In", heroCta: "VIEW AVAILABILITY",
    catalog: "All Products", loading: "Loading...", all: "All", showAll: "Show all",
    notFound: "Nothing found", reset: "Reset filters", loadErr: "Couldn't load products. Check your connection and refresh the page.",
    inStock: "In stock", outStock: "Sold out", addToCart: "Add to cart", addShort: "Add",
    soldOut: "Sold out", cart: "Cart", cartEmpty: "Your cart is empty", total: "Total",
    checkout: "Checkout", searchPh: "Search products, brands...", popular: "Popular brands",
    nothingFor: "No results for", reviewsTitle: "Customer reviews", allReviews: "Tap to view all reviews on Telegram",
    quickLinks: "Quick links", info: "Information", subscribe: "Subscribe",
    subBlurb: "Early access, discounts & news.", subDone: "Thanks for subscribing! 🎉", subErr: "Enter a valid email", subErrNet: "Couldn't subscribe, try again later",
    about: "Original store of luxury brands\nWorldwide shipping",
    region: "Ukraine", rights: "© 2026 la_store. All rights reserved.", added: "added to cart",
    sort: ["Price: low to high", "Price: high to low", "Date: oldest to newest", "Date: newest to oldest"],
    cat: { "Кроссовки": "Sneakers", "Футболки": "T-Shirts", "Осень": "Autumn" },
    quickAll: "All collections",
    infoItems: ["Contacts", "Shipping Policy", "Refund Policy", "Terms of Service", "Privacy Policy"],
    descTpl: (b) => `Authentic ${b}. Premium fabric and cut — streetwear with no compromise.`,
    contactTitle: "Contact us", fName: "Name", fTelegram: "Your Telegram @", fMsg: "Message",
    fSend: "Send", tgSupport: "Telegram support",
    fSending: "Sending...", fSentOk: "Thanks! We'll reply to you on Telegram soon.", fSentErr: "Couldn't send. Try again or message us on Telegram.",
    contactIntro: "Questions about a product, size or your order? Message us — we reply fast.",
    backShop: "Back to store",
    sizeLabel: "Size", youMayLike: "You might also like",
    careTitle: "Care Instructions",
    careText: "Follow the care instructions on your item's original label. For general care, store in a cool, dry place away from direct sunlight and avoid contact with perfume, oils and cosmetics. If you need further advice, message us on Telegram.",
    shipReturnTitle: "Shipping & Returns",
    shipReturnText: "Processed within 1–3 business days. Tracked delivery: 5–14 days (Europe), 10–21 days (worldwide). Shipping cost is calculated by weight at checkout. Customs fees are paid by the buyer.\n\nAll sales are final. Exceptions apply only if the item doesn't match its description, arrives damaged, or turns out to be non-authentic: message us on Telegram within 48 hours of delivery.",
    importantTitle: "Important Information",
    importantText1: "Our store deals exclusively in authentic items — every item comes with an order / e-receipt from the official website.",
    importantText2: "Many product photos have been edited or enhanced with AI, so some may not fully match reality. To see real, unedited photos, we recommend checking our",
    importantLinkLabel: "Telegram channel",
    coTitle: "Checkout", coSummary: "Your order", coSubtotal: "Subtotal", coShipping: "Shipping",
    coShippingVal: "Nova Poshta or pickup, Uzhhorod", coTotal: "Total", coYourName: "Your name", coTelegram: "Your Telegram @",
    coAfter: "After you place the order, we'll contact you shortly on Telegram to confirm the order and arrange payment.",
    coSubmit: "Place order", coBack: "Back to store", coSize: "Size", coEmptyTitle: "Your cart is empty", coEmptyText: "Add an item to place an order.",
  },
};

/* ─────────────── policy pages (original content) ─────────────── */
const PAGES = {
  shipping: {
    title: { en: "Shipping Policy", ru: "Политика доставки" },
    blocks: {
      en: [
        ["h", "Международная доставка - WORLDWIDE SHIPPING"],
        ["p", "Отправка по всему миру. Чтобы узнать стоимость и сроки для вашей страны — напишите нам в Telegram. Все заказы отправляются с отслеживанием. По любым вопросам доставки пишите нам в Telegram."],
        ["p", "Все заказы обрабатываются в течение 1–3 рабочих дней. Заказы, оформленные в выходные или праздничные дни, обрабатываются на следующий рабочий день. После отправки вы получите письмо-подтверждение с информацией для отслеживания."],
        ["p", "Стоимость доставки рассчитывается за килограмм общего веса отправления, округлённого до большего килограмма."],
        ["h", "Сроки доставки"],
        ["p", "Европа: 5–14 рабочих дней. Международная доставка: 10–21 рабочий день. Это ориентировочные сроки, а не гарантированные даты. Возможны задержки из-за таможенного оформления, работы местных почтовых служб или обстоятельств вне нашего контроля."],
      ],
      ru: [
        ["h", "Международная доставка - WORLDWIDE SHIPPING"],
        ["p", "Отправка по всему миру. Чтобы узнать стоимость и сроки для вашей страны — напишите нам в Telegram. Все заказы отправляются с отслеживанием. По любым вопросам доставки пишите нам в Telegram."],
        ["p", "Все заказы обрабатываются в течение 1–3 рабочих дней. Заказы, оформленные в выходные или праздничные дни, обрабатываются на следующий рабочий день. После отправки вы получите письмо-подтверждение с информацией для отслеживания."],
        ["p", "Стоимость доставки рассчитывается за килограмм общего веса отправления, округлённого до большего килограмма."],
        ["h", "Сроки доставки"],
        ["p", "Европа: 5–14 рабочих дней. Международная доставка: 10–21 рабочий день. Это ориентировочные сроки, а не гарантированные даты. Возможны задержки из-за таможенного оформления, работы местных почтовых служб или обстоятельств вне нашего контроля."],
      ],
    },
  },
  refund: {
    title: { en: "Refund Policy", ru: "Политика возврата средств" },
    blocks: {
      en: [
        ["p", "Due to the nature of our products — authentic luxury streetwear — all sales are final. We do not accept returns or exchanges for change of mind, wrong size or similar reasons."],
        ["h", "Before you buy"],
        ["p", "Please review the description, photos and measurements carefully. If you have questions about size, materials or authenticity, message us on Telegram before buying and we'll gladly provide extra photos and measurements."],
        ["h", "Exceptions"],
        ["p", "We offer a full refund or replacement only if: the item materially differs from its description, arrives damaged or defective, or is confirmed to be non-authentic. In that case, contact us on Telegram within 48 hours of delivery with photos of the issue."],
        ["p", "If an authenticity dispute is resolved in your favour, we cover all return shipping costs and refund the full amount — no questions asked."],
        ["h", "Your statutory rights"],
        ["p", "Nothing in this policy limits your statutory rights under applicable consumer-protection law."],
      ],
      ru: [
        ["p", "Учитывая специфику наших товаров — оригинальный luxury streetwear — все продажи являются окончательными. Мы не принимаем возврат или обмен из-за смены решения, неподходящего размера и подобных причин."],
        ["h", "Перед покупкой"],
        ["p", "Внимательно изучите описание, фото и замеры товара. Если есть вопросы о размере, материалах или оригинальности — напишите нам в Telegram до покупки, и мы предоставим дополнительные фото и замеры."],
        ["h", "Исключения"],
        ["p", "Полный возврат или замену мы предлагаем только если: товар существенно не соответствует описанию, прибыл повреждённым или с дефектом, либо подтверждена его неоригинальность. В этом случае свяжитесь с нами в Telegram в течение 48 часов после доставки с фото проблемы."],
        ["p", "Если спор об оригинальности решён в вашу пользу, мы покрываем все расходы на обратную доставку и возвращаем полную стоимость — без лишних вопросов."],
        ["h", "Ваши законные права"],
        ["p", "Ничто в этой политике не ограничивает ваши законные права согласно действующему законодательству о защите прав потребителей."],
      ],
    },
  },
  terms: {
    title: { en: "Terms of Service" },
    blocks: {
      en: [
        ["h", "Overview"],
        ["p", "Welcome to la_store. By visiting our website or purchasing from our store, you agree to be bound by these Terms of Service. Please read them carefully, as they include important information about your rights and our liability."],
        ["h", "Section 1 — Access and Account"],
        ["p", "By using the Services you confirm that you are at least the age of majority in your place of residence. You are responsible for keeping your account details secure and for all activity under your account, and you agree to provide accurate, current and complete information."],
        ["h", "Section 2 — Our Products"],
        ["p", "We curate authentic streetwear. We make every effort to display products accurately, but colours and appearance may vary depending on your device. Stock is limited and product details may change at any time without notice."],
        ["h", "Section 3 — Orders"],
        ["p", "When you place an order you make an offer to purchase. la_store may accept or decline any order at its discretion, and your order is confirmed only after we receive payment. Please review your order carefully before submitting."],
        ["h", "Section 4 — Prices and Billing"],
        ["p", "Prices are listed in Ukrainian hryvnia (₴) and may change without notice. Posted prices may exclude shipping and any applicable charges. You confirm that the payment details you provide are valid and that you are authorised to use them."],
        ["h", "Section 5 — Shipping and Delivery"],
        ["p", "Delivery times are estimates only and are not guaranteed. We are not liable for delays caused by carriers or events outside our control. Risk of loss passes to you once the order is handed to the carrier. See our Shipping Policy for details."],
        ["h", "Section 6 — Intellectual Property"],
        ["p", "All content on this website — text, images, graphics, layout and design — belongs to la_store or its licensors. Brand names and logos are trademarks of their respective owners. You may not reproduce or reuse our content without prior written consent."],
        ["h", "Section 7 — Third-Party Links"],
        ["p", "Our Services may contain links to third-party websites that we do not control. We are not responsible for the content, policies or practices of any third-party site, and you access them at your own risk."],
        ["h", "Section 8 — Feedback"],
        ["p", "If you send us ideas, suggestions or reviews, you grant us a non-exclusive, royalty-free licence to use them to operate and improve the Services. You are solely responsible for any feedback you submit and confirm it is your own."],
        ["h", "Section 9 — Prohibited Uses"],
        ["p", "You may use the Services for lawful purposes only. You may not use them to break any law, infringe intellectual-property rights, harass others, transmit malware, send spam, or use bots, scraping or other automated tools to access the Services."],
        ["h", "Section 10 — Disclaimer of Warranties"],
        ["p", "The Services and all products are provided \"as is\" and \"as available\" without warranties of any kind, express or implied, to the fullest extent permitted by law. We do not guarantee that the Services will be uninterrupted or error-free."],
        ["h", "Section 11 — Limitation of Liability"],
        ["p", "To the fullest extent permitted by law, la_store is not liable for any indirect, incidental or consequential damages arising from your use of the Services or any products purchased through them."],
        ["h", "Section 12 — Governing Law"],
        ["p", "These Terms are governed by the laws of Ukraine. Any disputes shall be subject to the jurisdiction of the competent Ukrainian courts."],
        ["h", "Section 13 — Changes to Terms"],
        ["p", "We may update these Terms at any time by posting the revised version on this page. Your continued use of the Services after changes are posted constitutes acceptance of those changes."],
        ["h", "Section 14 — Contact"],
        ["p", "Questions about these Terms of Service should be sent to us on Telegram."],
      ],
    },
  },
  privacy: {
    title: { en: "Privacy Policy" },
    blocks: {
      en: [
        ["h", "Overview"],
        ["p", "la_store respects your privacy. This policy explains what personal information we collect, how we use it, and the choices you have. By using our Services you agree to the practices described here."],
        ["h", "Information We Collect"],
        ["p", "We collect information you provide when placing an order or contacting us — such as your name, contact details and delivery address — along with order history. Payment details are processed securely by our payment providers. We also collect basic device and usage data to operate the store."],
        ["h", "How We Use Your Information"],
        ["p", "We use your information to process and deliver orders, provide customer support, prevent fraud, and improve our Services. With your consent, we may send you news about drops and discounts; you can opt out at any time."],
        ["h", "Sharing"],
        ["p", "We share information only as needed to run the store — for example with couriers, payment processors and service providers. We do not sell your personal information."],
        ["h", "Cookies"],
        ["p", "We use cookies for essential functionality and analytics. You can control or disable cookies through your browser settings, though some features may not work properly without them."],
        ["h", "Data Retention"],
        ["p", "We keep your personal information only as long as necessary to fulfil orders, comply with legal obligations and resolve disputes."],
        ["h", "Your Rights"],
        ["p", "You may request access to, correction of, or deletion of your personal data, and object to certain processing. To exercise these rights, contact us on Telegram."],
        ["h", "Security"],
        ["p", "We use reasonable measures to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security."],
        ["h", "Children"],
        ["p", "Our Services are not directed at children. We do not knowingly collect personal information from minors below the age of majority without parental consent."],
        ["h", "Changes & Contact"],
        ["p", "We may update this Privacy Policy from time to time. For any privacy questions or requests, contact us on Telegram."],
      ],
    },
  },
};

/* ─────────────── monochrome SVG placeholders ─────────────── */
const HUE = { "Stone Island": 200, "Palm Angels": 0, "Off-White": 50, "Heron Preston": 130, default: 220 };
const tile = (label, brand, v = 0, ratio = "4/5") => {
  const [w, h] = ratio === "4/5" ? [800, 1000] : [1200, 800];
  const hue = HUE[brand] ?? HUE.default;
  const l1 = 96 - v * 1.5, l2 = 90 - v * 2;
  const initial = (brand || "T")[0].toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
  <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
    <stop offset='0' stop-color='hsl(${hue} 6% ${l1}%)'/><stop offset='1' stop-color='hsl(${hue} 8% ${l2}%)'/></linearGradient></defs>
  <rect width='${w}' height='${h}' fill='url(#g)'/>
  <g opacity='0.04'><line x1='-100' y1='${h * 0.3 + v * 60}' x2='${w + 100}' y2='${-40 + v * 60}' stroke='#000' stroke-width='110'/></g>
  <circle cx='${w / 2}' cy='${h * 0.42}' r='${h * 0.22}' fill='none' stroke='#000' stroke-opacity='0.06' stroke-width='2'/>
  <text x='${w / 2}' y='${h * 0.57}' font-family='Arial Black,Arial' font-size='${h * 0.42}' font-weight='900' fill='#000' fill-opacity='0.06' text-anchor='middle'>${initial}</text>
  <text x='${w / 2}' y='${h - 78}' font-family='Arial' font-size='30' font-weight='700' letter-spacing='4' fill='#000' fill-opacity='0.55' text-anchor='middle'>${(brand || "").toUpperCase()}</text>
  <text x='${w / 2}' y='${h - 44}' font-family='Arial' font-size='20' letter-spacing='2' fill='#000' fill-opacity='0.3' text-anchor='middle'>${label.toUpperCase()}</text>
  <text x='${w / 2}' y='58' font-family='Arial' font-size='15' letter-spacing='7' fill='#000' fill-opacity='0.25' text-anchor='middle'>TRAP_LOVERZZ</text>
</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
};
/* ─────────────── live products — fetched from Airtable on load ─────────────── */
const AIRTABLE_TOKEN = "patNNDzHJG10Mc5bs.e948a915a5018c138708c3704f9dbfeec059e741fff4470e465c798675312f3e";
const AIRTABLE_BASE_ID = "appuZM9ugqsSp0pTK";
const AIRTABLE_TABLE = "Склад магазину";

const mapAirtableRecord = (rec, rowIndex) => {
  const f = rec.fields || {};
  const title = f["Назва товару"] || f["Назва"] || "Товар";
  const brand = "";
  const priceRaw = f["Ціна"];
  const price = typeof priceRaw === "number" ? priceRaw : parseFloat(String(priceRaw ?? "0").replace(/[^\d.]/g, "")) || 0;

  const statusRaw = String(f["Статус"] ?? "").toLowerCase();
  const in_stock = statusRaw ? (statusRaw.includes("in stock") || statusRaw.includes("наявн")) : true;

  let sizes = f["Розміри"];
  if (Array.isArray(sizes)) sizes = sizes.map((s) => String(s).trim()).filter(Boolean);
  else if (typeof sizes === "string") sizes = sizes.split(/[,/;]/).map((s) => s.trim()).filter(Boolean);
  else sizes = [];

  const photoField = f["Фото"];
  let images = Array.isArray(photoField)
    ? photoField.map((att) => att?.thumbnails?.full?.url || att?.url).filter(Boolean)
    : [];
  if (images.length === 0) images = [tile(title, brand, 0)];

  // Категорія comes strictly from the table — never guessed. If it's empty in Airtable,
  // the product simply won't match any category chip (only shows under "Усі").
  // Категорії: a Multiple Select field that mixes category tags (Кроссовки/Футболки/Осень)
  // together with brand tags in the same field. Pull out only the part that's a known category.
  const catField = f["Категорії"];
  const catList = Array.isArray(catField) ? catField : (typeof catField === "string" ? [catField] : []);
  const category = catList.map((s) => String(s).trim()).find((s) => CATEGORIES.includes(s)) || "";

  // Recency = position in the table (Airtable returns rows in their natural table order),
  // not a Date field — a row further down the table is the more recently added item.
  return { id: rec.id, title, brand, category, price, in_stock, sizes, images, rowIndex };
};

async function fetchAirtableProducts() {
  let all = [];
  let offset;
  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?pageSize=100${offset ? `&offset=${offset}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    if (!res.ok) throw new Error(`Airtable ${res.status}`);
    const data = await res.json();
    all = all.concat(data.records || []);
    offset = data.offset;
  } while (offset);
  return all.map((rec, i) => mapAirtableRecord(rec, i));
}

const pickRelated = (products, currentId, n = 4) => {
  const pool = products.filter((x) => x.id !== currentId && x.in_stock);
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr.slice(0, n);
};

const REVIEWS = [];

const MARQUEE = MARQUEE_IMAGES.length ? MARQUEE_IMAGES : [
  ["Lookbook", "Stone Island"], ["Доставка", "Palm Angels"], ["Packed", "Off-White"],
  ["Streetwear", "Heron Preston"], ["Drop", "Stone Island"], ["Lifestyle", "Palm Angels"],
  ["Original", "Off-White"], ["SS26", "Heron Preston"],
].map(([l, b], i) => tile(l, b, i % 3, "3/2"));

/* ─────────────── theme + css ─────────────── */
const VARS = {
  "--bg": "#ffffff", "--bg2": "#f7f7f8", "--card": "#fafafa", "--elev": "#f0f0f1",
  "--text": "#13131a", "--muted": "#75757c", "--line": "#e7e7ea", "--ink": "#0d0d0f",
  "--shadow": "0 24px 60px rgba(15,15,20,.14)",
  "--photo": "#ffffff",
};
const CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;width:100%;max-width:100%;overflow-x:hidden;background:#ffffff}
#root{display:block!important;width:100%!important;max-width:100%!important;margin:0!important;padding:0!important}
.tl-root{font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--text);background:var(--bg);min-height:100vh}
.tl-root ::selection{background:var(--ink);color:#fff}
.disp{font-family:'Arial Black','Inter',sans-serif;font-weight:900;letter-spacing:-.03em;line-height:.94}
.tl-scroll::-webkit-scrollbar{width:7px;height:7px}
.tl-scroll::-webkit-scrollbar-thumb{background:var(--line);border-radius:99px}
.nosb::-webkit-scrollbar{display:none}.nosb{-ms-overflow-style:none;scrollbar-width:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes shimmer{100%{transform:translateX(100%)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes kb{0%{transform:scale(1.05) translate(0,0)}100%{transform:scale(1.18) translate(-1.5%,-1.5%)}}
@keyframes sheen{0%{transform:translateX(-120%)}60%,100%{transform:translateX(220%)}}
@keyframes lineGrow{from{width:0;opacity:0}to{width:64px;opacity:1}}
.js-reveal{opacity:0}
.reveal-in{animation:fadeUp .7s cubic-bezier(.22,1,.36,1) forwards}
.skel{position:relative;overflow:hidden;background:var(--elev)}
.skel::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);animation:shimmer 1.3s infinite}
.btn{transition:transform .18s ease,background .25s ease,color .25s ease,opacity .2s,border-color .25s}
.btn:active{transform:scale(.96)}
.uline{position:relative}
.uline::after{content:'';position:absolute;left:0;bottom:-4px;height:1px;width:0;background:var(--ink);transition:width .35s cubic-bezier(.22,1,.36,1)}
.uline:hover::after{width:100%}
.cta{transition:transform .3s cubic-bezier(.22,1,.36,1),background .3s,color .3s}
.cta:hover{transform:scale(1.04);background:transparent;color:#fff;box-shadow:inset 0 0 0 1px #fff}
.marq{display:flex;width:max-content;animation:marquee 42s linear infinite;backface-visibility:hidden}
.marqwrap:hover .marq{animation-play-state:paused}
.marqimg{transition:transform .5s ease,filter .5s ease}
.marqimg:hover{transform:scale(1.05);filter:brightness(1.15)}
.prod-grid>div{min-width:0}
.marqwrap{contain:paint}
.marq{will-change:transform}
.snap{scroll-snap-type:x mandatory}.snap>*{scroll-snap-align:start}
.footer-grid{display:grid;grid-template-columns:1fr 1fr}
.footer-grid>div{min-width:0}
.footer-grid .footer-about,.footer-grid .footer-sub{grid-column:1/-1}
.footer-links-row{display:flex;flex-direction:column;align-items:flex-start}
.footer-about{text-align:center}
.footer-about p{margin-left:auto;margin-right:auto}
.footer-social{justify-content:center}
@media(min-width:880px){
  .footer-grid{grid-template-columns:repeat(4,1fr)}
  .footer-grid .footer-about,.footer-grid .footer-sub{grid-column:auto}
}
@media(max-width:639px){
  .footer-links-row{flex-direction:row;flex-wrap:wrap;gap:6px 18px}
}
.hero-full{height:100vh;min-height:100vh;width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}
@supports (height: 100svh){ .hero-full{height:100svh;min-height:100svh} }
.cat-mobile-btn{display:none}
@media(max-width:759px){
  .cat-desktop{display:none!important}
  .cat-mobile-btn{display:grid!important;place-items:center}
}
`;

/* ════════ small ui ════════ */
function Chip({ active, children, onClick }) {
  return (
    <button onClick={onClick} className="btn" style={{
      padding: "8px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
      border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
      background: active ? "var(--ink)" : "transparent", color: active ? "#fff" : "var(--text)",
    }}>{children}</button>
  );
}
const Dot = ({ ok, t, small }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: small ? 5 : 6, fontSize: small ? 9.5 : 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: ok ? "#15803d" : "#dc2626", lineHeight: 1 }}>
    <span style={{ width: small ? 5 : 6, height: small ? 5 : 6, flexShrink: 0, borderRadius: 99, background: ok ? "#4ade80" : "#f87171" }} />{ok ? t.inStock : t.outStock}
  </span>
);
// Compact, self-contained status pill for catalog cards — fixed height, dot + text centered as one unit.
const CatBadge = ({ ok, t }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 9px", borderRadius: 99, background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)", fontSize: 9, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: ok ? "#9bdcb0" : "#d99", whiteSpace: "nowrap", lineHeight: 1 }}>
    <span style={{ width: 5, height: 5, flexShrink: 0, borderRadius: 99, background: ok ? "#4ade80" : "#f87171", display: "block" }} />
    <span style={{ display: "block", transform: "translateY(.5px)" }}>{ok ? t.inStock : t.outStock}</span>
  </span>
);
const TikTok = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.32 2.1 1.7 3.6 3.5 3.85v2.45c-1.32.07-2.53-.32-3.5-1.02v6.1c0 3.12-2.5 5.22-5.25 5.22A5.2 5.2 0 0 1 8 14.4c0-2.85 2.4-5.02 5.42-4.92v2.5c-1.42-.18-2.72.82-2.72 2.42 0 1.4 1.12 2.5 2.5 2.5 1.4 0 2.42-1.08 2.42-2.72V3h.88z" /></svg>
);
const Instagram = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
);

/* ════════ hero video ════════ */
function HeroVideo({ src }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false); // a real frame is painted
  useEffect(() => {
    if (!src) return;
    const v = ref.current; if (!v) return;
    const tryPlay = () => { const p = v.play && v.play(); if (p && p.catch) p.catch(() => {}); };
    // As soon as the very first frame is decoded, reveal it and start playing.
    const onFrame = () => { setReady(true); tryPlay(); };
    v.addEventListener("loadeddata", onFrame);
    v.addEventListener("canplay", onFrame);
    tryPlay();
    const kick = () => tryPlay();
    ["pointerdown", "touchstart", "scroll", "keydown"].forEach((e) => window.addEventListener(e, kick, { once: true }));
    return () => {
      v.removeEventListener("loadeddata", onFrame);
      v.removeEventListener("canplay", onFrame);
      ["pointerdown", "touchstart", "scroll", "keydown"].forEach((e) => window.removeEventListener(e, kick));
    };
  }, [src]);
  if (!src) return null;
  return (
    <>
      <video ref={ref} autoPlay muted loop playsInline preload="auto"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: ready ? 1 : 0, transition: "opacity .4s ease" }}>
        <source src={src} type="video/mp4" />
      </video>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: ready ? 0 : 1, transition: "opacity .4s ease", pointerEvents: "none", background: "#ffffff" }}>
        <span style={{ width: 38, height: 38, borderRadius: "50%", border: "3px solid rgba(0,0,0,.12)", borderTopColor: "rgba(0,0,0,.7)", animation: "spin .8s linear infinite" }} />
      </div>
    </>
  );
}

/* ════════ marquee ════════ */
function Marquee() {
  return (
    <section style={{ borderTop: "1px solid var(--line)", padding: "26px 0", overflow: "hidden" }}>
      <div className="marqwrap">
        <div className="marq" style={{ gap: 16 }}>
          {[...MARQUEE, ...MARQUEE].map((src, i) => (
            <div key={i} style={{ flex: "0 0 auto", width: 260, aspectRatio: "3/4", borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", background: "var(--elev)" }}>
              <img className="marqimg" src={src} alt="" decoding="async" loading="eager"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.opacity = "0"; }}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity .3s ease" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════ product card ════════ */
function ProductCard({ p, t, onOpen, onAdd, delay }) {
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const len = p.images.length;
  const go = (e, d) => { e.stopPropagation(); setIdx((i) => (i + d + len) % len); };
  const out = !p.in_stock;
  return (
    <div className="js-reveal" style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => { setHover(true); if (len > 1) setIdx(1); }}
      onMouseLeave={() => { setHover(false); setIdx(0); }}>
      <div onClick={() => onOpen(p)} style={{ position: "relative", aspectRatio: "4/5", borderRadius: 14, overflow: "hidden", background: "var(--photo)", cursor: "pointer", border: "1px solid var(--line)" }}>
        {p.images.map((src, i) => (
          <img key={i} src={src} alt={p.title} loading="lazy" onError={(e) => { e.currentTarget.src = tile(p.title, p.brand, i); }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "16% 7% 7%", opacity: i === idx ? 1 : 0, transition: "opacity .55s ease", filter: out ? "grayscale(.6) brightness(.8)" : "none" }} />
        ))}
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2 }}><CatBadge ok={p.in_stock} t={t} /></div>
        {p.src === "Airtable" && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 9, fontWeight: 800, letterSpacing: ".1em", padding: "4px 8px", borderRadius: 99, background: "var(--ink)", color: "#fff" }}>AIRTABLE</div>}
        {len > 1 && <>
          <button onClick={(e) => go(e, -1)} aria-label="prev" className="btn" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 99, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", opacity: hover ? 1 : 0, transition: "opacity .3s", backdropFilter: "blur(6px)" }}><ChevronLeft size={18} /></button>
          <button onClick={(e) => go(e, 1)} aria-label="next" className="btn" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 99, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", opacity: hover ? 1 : 0, transition: "opacity .3s", backdropFilter: "blur(6px)" }}><ChevronRight size={18} /></button>
        </>}
        {len > 1 && (
          <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", gap: 4, opacity: hover ? 1 : 0, transition: "opacity .3s" }}>
            {p.images.map((_, i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i === idx ? "var(--ink)" : "rgba(0,0,0,.15)", transition: "background .3s" }} />)}
          </div>
        )}
        {!out && (
          <button onClick={(e) => { e.stopPropagation(); onAdd(p); }} className="btn" style={{ position: "absolute", bottom: 12, right: 12, height: 38, padding: "0 14px", borderRadius: 99, border: "none", background: "var(--ink)", color: "#fff", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", opacity: hover ? 1 : 0, transform: hover ? "none" : "translateY(6px)", transition: "opacity .3s, transform .3s" }}><Plus size={14} /> {t.addShort}</button>
        )}
      </div>
      <div style={{ padding: "14px 2px 4px", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{p.title}</span>

        </div>
        <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap" }}>{money(p.price)}</div>
      </div>
    </div>
  );
}
const CardSkeleton = () => (
  <div>
    <div className="skel" style={{ aspectRatio: "4/5", borderRadius: 14 }} />
    <div style={{ padding: "14px 2px", display: "grid", gap: 8 }}>
      <div className="skel" style={{ height: 9, width: "35%", borderRadius: 5 }} />
      <div className="skel" style={{ height: 13, width: "70%", borderRadius: 5 }} />
    </div>
  </div>
);

/* ════════ accordion ════════ */
function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: "1px solid var(--line)" }}>
      <button onClick={() => setOpen((o) => !o)} className="btn" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 2px", background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontWeight: 700, fontSize: 14, textAlign: "left" }}>
        {title}
        <ChevronDown size={18} style={{ flexShrink: 0, marginLeft: 10, transition: "transform .3s ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      <div style={{ maxHeight: open ? 600 : 0, overflow: "hidden", transition: "max-height .35s ease" }}>
        <div style={{ padding: "0 2px 18px", color: "var(--muted)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line" }}>{children}</div>
      </div>
    </div>
  );
}

/* ════════ quick view ════════ */
function QuickView({ p, t, lang, setLang, products, onClose, onAdd, onPick, onGoShop, onOpenPage }) {
  const [idx, setIdx] = useState(0);
  const [size, setSize] = useState(p.sizes?.[0] ?? null);
  const len = p.images.length;
  const out = !p.in_stock;
  const related = useMemo(() => pickRelated(products, p.id, 4), [products, p.id]);
  const rootRef = useRef(null);

  useEffect(() => { setIdx(0); setSize(p.sizes?.[0] ?? null); rootRef.current?.scrollTo(0, 0); }, [p.id]);
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".js-reveal");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("reveal-in"); io.unobserve(e.target); } }), { threshold: 0.05 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [p.id, related.length]);

  return (
    <div ref={rootRef} className="tl-scroll" style={{ position: "fixed", inset: 0, zIndex: 82, background: "var(--bg)", overflow: "auto", animation: "fadeIn .3s ease" }}>
      {/* top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,.8)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onClose} className="btn uline" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}><ChevronLeft size={18} /> {t.backShop}</button>
          <button onClick={() => { onClose(); scrollToTop(); }} className="btn" style={{ fontWeight: 900, fontSize: 15, letterSpacing: ".22em", textTransform: "lowercase", color: "var(--ink)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>@la_store</button>
          <button onClick={onClose} className="btn" aria-label="close" style={{ width: 38, height: 38, borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><X size={18} /></button>
        </div>
      </div>

      {/* product */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 0" }}>
        <div className="qv-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 36 }}>
          {/* gallery: main photo + thumbnails to pick others */}
          <div>
            <div style={{ position: "relative", aspectRatio: "4/5", borderRadius: 16, overflow: "hidden", background: "var(--photo)" }}>
              <img src={p.images[idx]} alt={p.title} onError={(e) => { e.currentTarget.src = tile(p.title, p.brand, idx); }} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "6%" }} />
              {len > 1 && <>
                <button onClick={() => setIdx((i) => (i - 1 + len) % len)} className="btn" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 99, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><ChevronLeft size={18} /></button>
                <button onClick={() => setIdx((i) => (i + 1) % len)} className="btn" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 99, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><ChevronRight size={18} /></button>
              </>}
            </div>
            {len > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {p.images.map((im, i) => (
                  <button key={i} onClick={() => setIdx(i)} style={{ width: 64, height: 80, borderRadius: 9, overflow: "hidden", padding: 0, cursor: "pointer", border: `2px solid ${i === idx ? "var(--ink)" : "var(--line)"}`, background: "var(--photo)", flexShrink: 0 }}>
                    <img src={im} alt="" onError={(e) => { e.currentTarget.src = tile(p.title, p.brand, i); }} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "6%" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h1 className="disp" style={{ margin: 0, fontSize: "clamp(26px,4vw,34px)", textAlign: "left", width: "100%", color: "var(--ink)" }}>{p.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ fontSize: 26, fontWeight: 900 }}>{money(p.price)}</span><Dot ok={p.in_stock} t={t} /></div>

            {p.sizes?.length > 0 && (
              <div style={{ width: "100%", textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10, textAlign: "left" }}>{t.sizeLabel}:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {p.sizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)} className="btn" style={{ minWidth: 44, height: 40, padding: "0 12px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", border: `1px solid ${size === s ? "var(--ink)" : "var(--line)"}`, background: size === s ? "var(--ink)" : "transparent", color: size === s ? "#fff" : "var(--text)" }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <button disabled={out} onClick={() => onAdd(p, size)} className="btn" style={{ marginTop: 6, padding: "18px 0", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: out ? "not-allowed" : "pointer", border: "none", background: out ? "var(--line)" : "var(--ink)", color: out ? "var(--muted)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <ShoppingBag size={19} /> {out ? t.soldOut : t.addToCart}
            </button>

            <div style={{ marginTop: 8 }}>
              <Accordion title={t.careTitle}>{t.careText}</Accordion>
              <Accordion title={t.shipReturnTitle}>{t.shipReturnText}</Accordion>
              <Accordion title={t.importantTitle}>
                <p style={{ margin: "0 0 10px" }}>{t.importantText1}</p>
                <p style={{ margin: 0 }}>{t.importantText2} <a href={LINKS.telegram} target="_blank" rel="noreferrer" className="uline" style={{ color: "var(--text)", fontWeight: 700, textDecoration: "none" }}>{t.importantLinkLabel}</a></p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* you may also like */}
      {related.length > 0 && (
        <div style={{ padding: "70px clamp(20px,4vw,72px) 0" }}>
          <h2 className="disp" style={{ margin: "0 0 22px", fontSize: "clamp(24px,4vw,36px)", color: "var(--ink)" }}>{t.youMayLike}</h2>
          <div className="prod-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18 }}>
            {related.map((rp, i) => <ProductCard key={rp.id} p={rp} t={t} onOpen={onPick} onAdd={onAdd} delay={i * 50} />)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 70 }}>
        <Marquee />
        <Footer t={t} lang={lang} setLang={setLang} onQuickLink={onGoShop} onInfoLink={onOpenPage} />
      </div>

      <style>{`@media(min-width:760px){.qv-grid{grid-template-columns:1fr 1.05fr!important}}`}</style>
    </div>
  );
}

/* ════════ mobile category menu (kkaitew-style hamburger, mobile only) ════════ */
function CatMenu({ open, t, category, onPick, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 92, pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", opacity: open ? 1 : 0, transition: "opacity .35s" }} />
      <aside className="tl-scroll" style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "min(300px,80%)", background: "var(--bg2)", borderRight: "1px solid var(--line)", transform: open ? "none" : "translateX(-100%)", transition: "transform .42s cubic-bezier(.22,1,.36,1)", display: "flex", flexDirection: "column", boxShadow: "var(--shadow)" }}>
        <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--line)" }}>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: ".18em", textTransform: "lowercase", color: "var(--ink)" }}>la_store</span>
          <button onClick={onClose} className="btn" aria-label="close" style={{ width: 36, height: 36, borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><X size={16} /></button>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", padding: 10 }}>
          <button onClick={() => onPick(null)} style={{ textAlign: "left", padding: "15px 14px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", fontSize: 17, fontWeight: !category ? 800 : 600, color: !category ? "var(--ink)" : "var(--muted)" }}>{t.all}</button>
          {HEADER_CATS.map((c) => (
            <button key={c} onClick={() => onPick(c)} style={{ textAlign: "left", padding: "15px 14px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", fontSize: 17, fontWeight: category === c ? 800 : 600, color: category === c ? "var(--ink)" : "var(--muted)" }}>{t.cat[c]}</button>
          ))}
        </nav>
      </aside>
    </div>
  );
}

/* ════════ cart ════════ */
function Cart({ open, items, t, onClose, onQty, onRemove, onCheckout }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", opacity: open ? 1 : 0, transition: "opacity .35s" }} />
      <aside className="tl-scroll" style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "min(420px,100%)", background: "var(--bg2)", borderLeft: "1px solid var(--line)", transform: open ? "none" : "translateX(100%)", transition: "transform .42s cubic-bezier(.22,1,.36,1)", display: "flex", flexDirection: "column", boxShadow: "var(--shadow)" }}>
        <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--line)" }}>
          <h3 className="disp" style={{ margin: 0, fontSize: 22, color: "var(--ink)" }}>{t.cart} <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>({items.reduce((s, i) => s + i.qty, 0)})</span></h3>
          <button onClick={onClose} className="btn" style={{ width: 38, height: 38, borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div className="tl-scroll" style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {items.length === 0 && <div style={{ margin: "auto", textAlign: "center", color: "var(--muted)", display: "grid", gap: 12, placeItems: "center", padding: 40 }}><ShoppingBag size={40} strokeWidth={1.2} /><p style={{ margin: 0 }}>{t.cartEmpty}</p></div>}
          {items.map((it) => (
            <div key={it.lineId} style={{ display: "flex", gap: 12, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 10 }}>
              <img src={it.image} alt="" onError={(e) => { e.currentTarget.src = tile(it.title, it.brand, 0); }} style={{ width: 66, height: 84, objectFit: "contain", padding: 4, background: "var(--photo)", borderRadius: 9 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>{it.size || ""}</span>
                <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</span>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => onQty(it.lineId, -1)} className="btn" style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><Minus size={13} /></button>
                    <span style={{ fontWeight: 700, fontSize: 14, minWidth: 18, textAlign: "center" }}>{it.qty}</span>
                    <button onClick={() => onQty(it.lineId, 1)} className="btn" style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><Plus size={13} /></button>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{money(it.price * it.qty)}</span>
                </div>
              </div>
              <button onClick={() => onRemove(it.lineId)} className="btn" aria-label="del" style={{ alignSelf: "flex-start", width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", color: "var(--muted)", display: "grid", placeItems: "center", cursor: "pointer" }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div style={{ padding: 20, borderTop: "1px solid var(--line)", display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ color: "var(--muted)", fontSize: 14 }}>{t.total}</span><span className="disp" style={{ fontSize: 26, color: "var(--ink)" }}>{money(total)}</span></div>
            <button onClick={onCheckout} className="btn" style={{ padding: "16px 0", borderRadius: 13, fontWeight: 900, fontSize: 15, border: "none", background: "var(--ink)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>{t.checkout} <ArrowRight size={18} /></button>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ════════ search overlay ════════ */
function SearchOverlay({ open, t, products, onClose, onPick }) {
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => { if (open) { setQ(""); setTimeout(() => ref.current?.focus(), 60); } }, [open]);
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  if (!open) return null;
  const res = q.trim() ? products.filter((p) => p.title.toLowerCase().includes(q.trim().toLowerCase())) : [];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(255,255,255,.92)", backdropFilter: "blur(16px)", animation: "fadeIn .3s ease" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 20px", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--line)", paddingBottom: 18 }}>
          <Search size={24} style={{ color: "var(--muted)" }} />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPh} style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 24, fontWeight: 500 }} />
          <button onClick={onClose} className="btn" style={{ width: 42, height: 42, borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div className="tl-scroll" style={{ flex: 1, overflow: "auto", paddingTop: 22 }}>
          {!q.trim() && <div style={{ color: "var(--muted)" }}>
            <div style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14 }}>{t.popular}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{BRANDS.map((b) => <button key={b} onClick={() => setQ(b)} className="btn" style={{ padding: "9px 16px", borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 13 }}>{b}</button>)}</div>
          </div>}
          {q.trim() && res.length === 0 && <p style={{ color: "var(--muted)" }}>{t.nothingFor} «{q}»</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 16 }}>
            {res.map((p) => (
              <button key={p.id} onClick={() => { onPick(p); onClose(); }} style={{ textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text)" }}>
                <div style={{ aspectRatio: "4/5", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", background: "var(--photo)" }}><img src={p.images[0]} alt="" onError={(e) => { e.currentTarget.src = tile(p.title, p.brand, 0); }} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "7%" }} /></div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{money(p.price)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════ reviews ════════ */
function Reviews({ t }) {
  const ref = useRef(null);
  const scroll = (d) => ref.current?.scrollBy({ left: d * 340, behavior: "smooth" });
  return (
    <section style={{ borderTop: "1px solid var(--line)", padding: "70px 0" }}>
      <div style={{ padding: "0 clamp(20px,4vw,72px)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 className="disp js-reveal" style={{ margin: "0 0 12px", fontSize: "clamp(28px,4.5vw,42px)", color: "var(--ink)" }}>{t.reviewsTitle}</h2>
            <a href={LINKS.reviewsChannel} target="_blank" rel="noreferrer" className="uline" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}><Send size={15} /> {t.allReviews}</a>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => scroll(-1)} className="btn" style={{ width: 46, height: 46, borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><ChevronLeft size={20} /></button>
            <button onClick={() => scroll(1)} className="btn" style={{ width: 46, height: 46, borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
      <div ref={ref} className="tl-scroll nosb snap" style={{ display: "flex", gap: 16, overflowX: "auto", padding: "4px clamp(20px,4vw,72px)" }}>
        {REVIEWS.map((r, i) => (
          <div key={i} className="js-reveal" style={{ animationDelay: `${i * 60}ms`, flex: "0 0 320px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 42, height: 42, borderRadius: 99, background: `hsl(${(i * 67) % 360} 30% 30%)`, display: "grid", placeItems: "center", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{r.name[0]}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
            </div>
            <div style={{ background: "var(--elev)", borderRadius: "4px 16px 16px 16px", padding: "13px 15px", fontSize: 14, lineHeight: 1.55 }}>{r.text}</div>
          </div>
        ))}
        <div style={{ flex: "0 0 4px" }} />
      </div>
    </section>
  );
}

/* ════════ policy / contact page overlay ════════ */
function PageOverlay({ page, t, lang, setLang, onClose, onQuickLink, onInfoLink }) {
  const rootRef = useRef(null);
  const [cName, setCName] = useState("");
  const [cTg, setCTg] = useState("");
  const [cMsg, setCMsg] = useState("");
  const [cState, setCState] = useState("idle"); // idle | sending | done | error
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); rootRef.current?.scrollTo(0, 0); return () => window.removeEventListener("keydown", k); }, [onClose, page]);
  const isContacts = page === "contacts";
  const data = !isContacts ? PAGES[page] : null;
  const forceEn = page === "terms" || page === "privacy";
  const L = forceEn ? "en" : lang;
  const title = isContacts ? t.contactTitle : (data.title[L] || data.title.en);
  const blocks = isContacts ? [] : (data.blocks[L] || data.blocks.en);

  const sendContactMessage = async () => {
    const handle = cTg.trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
    if (!handle || !cMsg.trim()) { setCState("error"); setTimeout(() => setCState("idle"), 3000); return; }
    setCState("sending");
    const html = `<div style="font-family:Arial,sans-serif">
      <h2>Нове повідомлення з форми контактів</h2>
      <p style="margin:4px 0"><b>Ім'я:</b> ${(cName.trim() || "—")}</p>
      <p style="margin:4px 0"><b>Telegram:</b> <a href="https://t.me/${handle}">@${handle}</a></p>
      <p style="margin:14px 0 4px"><b>Повідомлення:</b></p>
      <p style="margin:0;white-space:pre-wrap">${cMsg.trim()}</p>
    </div>`;
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "la_store", email: SENDER_EMAIL },
          to: [{ email: OWNER_EMAIL, name: "la_store" }],
          subject: `Повідомлення від @${handle}`,
          htmlContent: html,
        }),
      });
      if (res.ok) { setCState("done"); setCName(""); setCTg(""); setCMsg(""); }
      else { setCState("error"); }
    } catch (e) { console.error("contact email failed", e); setCState("error"); }
  };

  return (
    <div ref={rootRef} className="tl-scroll" style={{ position: "fixed", inset: 0, zIndex: 98, background: "var(--bg)", overflow: "auto", animation: "fadeIn .3s ease" }}>
      {/* top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,.8)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onClose} className="btn uline" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}><ChevronLeft size={18} /> {t.backShop}</button>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: ".22em", textTransform: "lowercase", color: "var(--ink)" }}>@la_store</span>
          <button onClick={onClose} className="btn" aria-label="close" style={{ width: 38, height: 38, borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><X size={18} /></button>
        </div>
      </div>

      {/* heading */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "54px 20px 0", textAlign: "center" }}>
        <h1 className="disp" style={{ margin: 0, fontSize: "clamp(34px,7vw,62px)", animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) both", color: "var(--ink)" }}>{title}</h1>
        <div style={{ height: 3, background: "var(--ink)", margin: "20px auto 0", borderRadius: 99, animation: "lineGrow .8s cubic-bezier(.22,1,.36,1) .15s both" }} />
      </div>

      {/* body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 70px" }}>
        {isContacts ? (
          <div style={{ display: "grid", gap: 18, animation: "fadeUp .6s ease .1s both" }}>
            <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6, textAlign: "center", margin: "0 0 8px" }}>{t.contactIntro}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }} className="cf-grid">
              <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder={t.fName} style={inp} />
              <input value={cTg} onChange={(e) => setCTg(e.target.value)} placeholder={t.fTelegram} style={inp} />
            </div>
            <textarea value={cMsg} onChange={(e) => setCMsg(e.target.value)} placeholder={t.fMsg} rows={5} style={{ ...inp, resize: "vertical", minHeight: 120 }} />
            <button onClick={sendContactMessage} disabled={cState === "sending"} className="btn" style={{ padding: "16px 0", borderRadius: 13, fontWeight: 800, fontSize: 15, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", cursor: cState === "sending" ? "default" : "pointer", opacity: cState === "sending" ? .6 : 1 }}>
              {cState === "sending" ? t.fSending : t.fSend}
            </button>
            {(cState === "done" || cState === "error") && (
              <p style={{ margin: 0, textAlign: "center", fontSize: 13, color: cState === "done" ? "#15803d" : "#dc2626" }}>{cState === "done" ? t.fSentOk : t.fSentErr}</p>
            )}
            <a href={LINKS.telegram} target="_blank" rel="noreferrer" className="btn" style={{ marginTop: 8, padding: "18px 0", borderRadius: 15, fontWeight: 900, fontSize: 16, border: "none", background: "var(--ink)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, textDecoration: "none" }}>
              <Send size={20} /> {t.tgSupport}
            </a>
            <style>{`@media(min-width:560px){.cf-grid{grid-template-columns:1fr 1fr!important}}`}</style>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 4 }}>
            {blocks.map(([tag, text], i) => (
              tag === "h"
                ? <h3 key={i} style={{ margin: "26px 0 6px", fontSize: 17, fontWeight: 800, animation: "fadeUp .5s ease both", animationDelay: `${i * 35}ms` }}>{text}</h3>
                : <p key={i} style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 15, lineHeight: 1.7, animation: "fadeUp .5s ease both", animationDelay: `${i * 35}ms` }}>{text}</p>
            ))}
          </div>
        )}
      </div>

      <Marquee />
      <Footer t={t} lang={lang} setLang={setLang} onQuickLink={onQuickLink} onInfoLink={onInfoLink} />
    </div>
  );
}
const inp = { width: "100%", padding: "15px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", outline: "none", fontSize: 15, fontFamily: "inherit" };

/* ════════ footer (shared by home page and product page) ════════ */
function Footer({ t, lang, setLang, onQuickLink, onInfoLink }) {
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState("idle"); // idle | loading | done | error
  const [subMsg, setSubMsg] = useState("");

  const subscribe = async () => {
    const val = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setSubState("error"); setSubMsg(t.subErr); setTimeout(() => setSubState("idle"), 2500); return; }
    setSubState("loading");
    try {
      const res = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({ email: val, listIds: [BREVO_LIST_ID], updateEnabled: true }),
      });
      if (res.ok) { setSubState("done"); setSubMsg(t.subDone); setEmail(""); }
      else { setSubState("error"); setSubMsg(t.subErrNet); }
    } catch { setSubState("error"); setSubMsg(t.subErrNet); }
    setTimeout(() => setSubState("idle"), 3500);
  };

  return (
    <footer style={{ borderTop: "1px solid var(--line)", background: "#f7f7f8" }}>
      <div style={{ padding: "60px clamp(20px,4vw,72px) 28px" }}>
        <div className="footer-grid" style={{ gap: 34, marginBottom: 44 }}>
          <div className="footer-about">
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: ".18em", textTransform: "lowercase", marginBottom: 14 }}>@la_store</div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 250, marginBottom: 18, whiteSpace: "pre-line" }}>{t.about}</p>
            <div className="footer-social" style={{ display: "flex", gap: 10 }}>
              {[[TikTok, LINKS.tiktok, "TikTok"], [Instagram, LINKS.instagram, "Instagram"], [Send, LINKS.telegram, "Telegram"]].map(([Ic, href, lbl], i) => (
                <a key={i} href={href} aria-label={lbl} target="_blank" rel="noreferrer" className="btn" style={{ width: 42, height: 42, borderRadius: 99, border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--text)" }}><Ic size={18} /></a>
              ))}
            </div>
          </div>
          <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{t.quickLinks}</div>
            <div className="footer-links-row">
              {[...CATEGORIES.map((c) => ({ key: c, label: t.cat[c] })), { key: null, label: t.quickAll }].map(({ key, label }) => (
                <a key={label} href="#shop" onClick={(e) => { e.preventDefault(); onQuickLink(key); }} className="uline" style={{ color: "var(--muted)", textDecoration: "none", fontSize: 14, padding: "5px 0" }}>{label}</a>
              ))}
            </div>
          </div>
          <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{t.info}</div>
            <div className="footer-links-row">
              {t.infoItems.map((label, idx) => <button key={label} onClick={() => onInfoLink(idx)} className="uline" style={{ color: "var(--muted)", textDecoration: "none", fontSize: 14, padding: "5px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>{label}</button>)}
            </div>
          </div>
          <div className="footer-sub">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{t.subscribe}</div>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10, lineHeight: 1.45 }}>{t.subBlurb}</p>
            <div style={{ display: "flex", gap: 8, maxWidth: 340 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && subscribe()}
                disabled={subState === "loading"}
                style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 10, border: `1px solid ${subState === "error" ? "#f87171" : "var(--line)"}`, background: "var(--card)", color: "var(--text)", outline: "none", fontSize: 13 }}
              />
              <button onClick={subscribe} disabled={subState === "loading"} className="btn" style={{ padding: "0 14px", borderRadius: 10, border: "none", background: "var(--ink)", color: "#fff", cursor: subState === "loading" ? "default" : "pointer", flexShrink: 0, display: "grid", placeItems: "center", opacity: subState === "loading" ? .55 : 1 }}>
                {subState === "done" ? <Check size={18} /> : <ArrowRight size={18} />}
              </button>
            </div>
            {subState !== "idle" && subState !== "loading" && (
              <p style={{ margin: "9px 0 0", fontSize: 12, color: subState === "done" ? "#15803d" : "#dc2626" }}>{subMsg}</p>
            )}
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 13, color: "var(--muted)" }}><Globe size={15} /> {t.region} (UAH ₴)</span>
            <div style={{ position: "relative" }}>
              <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ appearance: "none", padding: "8px 32px 8px 13px", borderRadius: 10, border: "1px solid var(--line)", background: "transparent", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>
                <option value="ua">Українська</option>
                <option value="en">English</option>
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }} />
            </div>
          </div>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>{t.rights}</span>
        </div>
      </div>
    </footer>
  );
}

/* ════════ checkout ════════ */
function Checkout({ items, t, lang, onClose, onOpenPage }) {
  const rootRef = useRef(null);
  const [name, setName] = useState("");
  const [tg, setTg] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); rootRef.current?.scrollTo(0, 0); return () => window.removeEventListener("keydown", k); }, [onClose]);

  // bottom policy links: refund, shipping, privacy, terms
  const policyLinks = [
    { idx: 2, label: t.infoItems[2] }, // Refund
    { idx: 1, label: t.infoItems[1] }, // Shipping
    { idx: 4, label: t.infoItems[4] }, // Privacy
    { idx: 3, label: t.infoItems[3] }, // Terms
  ];
  const canSubmit = items.length > 0 && name.trim() && tg.trim();

  const submitOrder = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const handle = tg.trim().replace(/^@/, "");
    const rows = items.map((it) =>
      `<tr><td style="padding:7px 10px;border-bottom:1px solid #eee">${it.title}${it.size ? " · розмір " + it.size : ""}</td>` +
      `<td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center">${it.qty}</td>` +
      `<td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:right">${money(it.price * it.qty)}</td></tr>`
    ).join("");
    const html = `<div style="font-family:Arial,sans-serif;max-width:540px;color:#111">
      <h2 style="margin:0 0 16px">🛍️ Нове замовлення — la_store</h2>
      <p style="margin:4px 0"><b>Ім'я:</b> ${name.trim()}</p>
      <p style="margin:4px 0"><b>Telegram:</b> <a href="https://t.me/${handle}">@${handle}</a></p>
      <p style="margin:4px 0"><b>Доставка:</b> ${t.coShippingVal}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead><tr><th style="text-align:left;padding:7px 10px;border-bottom:2px solid #111">Товар</th><th style="padding:7px 10px;border-bottom:2px solid #111">К-сть</th><th style="text-align:right;padding:7px 10px;border-bottom:2px solid #111">Сума</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:16px;font-size:18px"><b>Усього: ${money(subtotal)}</b></p>
    </div>`;
    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "la_store", email: SENDER_EMAIL },
          to: [{ email: OWNER_EMAIL, name: "la_store" }],
          subject: `Нове замовлення від @${handle}`,
          htmlContent: html,
        }),
      });
    } catch (e) { console.error("order email failed", e); }
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div ref={rootRef} className="tl-scroll" style={{ position: "fixed", inset: 0, zIndex: 96, background: "var(--bg)", overflow: "auto", animation: "fadeIn .3s ease" }}>
      {/* top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,.8)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onClose} className="btn uline" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}><ChevronLeft size={18} /> {t.coBack}</button>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: ".22em", textTransform: "lowercase", color: "var(--ink)" }}>la_store</span>
          <button onClick={onClose} className="btn" aria-label="close" style={{ width: 38, height: 38, borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><X size={18} /></button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px 60px" }}>
        <h1 className="disp" style={{ margin: "0 0 26px", fontSize: "clamp(28px,5vw,42px)", color: "var(--ink)" }}>{t.coTitle}</h1>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
            <ShoppingBag size={40} strokeWidth={1.2} />
            <p style={{ fontWeight: 700, color: "var(--text)", margin: "14px 0 6px" }}>{t.coEmptyTitle}</p>
            <p style={{ margin: 0 }}>{t.coEmptyText}</p>
          </div>
        ) : (
          <div className="co-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 30, alignItems: "start" }}>
            {/* LEFT — summary line + customer form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {/* items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {items.map((it) => (
                  <div key={it.id + (it.size || "")} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img src={it.image} alt="" onError={(e) => { e.currentTarget.src = tile(it.title, it.brand, 0); }} style={{ width: 66, height: 82, objectFit: "contain", padding: 4, background: "var(--photo)", borderRadius: 10, border: "1px solid var(--line)" }} />
                      <span style={{ position: "absolute", top: -7, right: -7, minWidth: 20, height: 20, padding: "0 5px", borderRadius: 99, background: "var(--ink)", color: "#fff", fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center" }}>{it.qty}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{it.title}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{it.size ? `${t.coSize} ${it.size}` : ""}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap" }}>{money(it.price * it.qty)}</div>
                  </div>
                ))}
              </div>

              {/* customer fields */}
              {done ? (
                <div style={{ border: "1px solid var(--line)", borderRadius: 16, padding: "26px 22px", background: "var(--card)", textAlign: "center", animation: "scaleIn .35s ease" }}>
                  <span style={{ width: 46, height: 46, borderRadius: 99, background: "var(--ink)", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Check size={24} strokeWidth={3} /></span>
                  <p style={{ margin: 0, color: "var(--text)", fontSize: 15, lineHeight: 1.6 }}>{t.coAfter}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.coYourName} style={inp} />
                  <input value={tg} onChange={(e) => setTg(e.target.value)} placeholder={t.coTelegram} style={inp} />
                  <button disabled={!canSubmit || submitting} onClick={submitOrder} className="btn" style={{ padding: "18px 0", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: canSubmit && !submitting ? "pointer" : "not-allowed", border: "none", background: canSubmit ? "var(--ink)" : "var(--line)", color: canSubmit ? "#fff" : "var(--muted)", opacity: submitting ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    {t.coSubmit} <ArrowRight size={18} />
                  </button>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>{t.coAfter}</p>
                </div>
              )}

              {/* bottom policy links */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20, display: "flex", flexWrap: "wrap", gap: "10px 22px" }}>
                {policyLinks.map((l) => (
                  <button key={l.idx} onClick={() => onOpenPage(l.idx)} className="uline" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--muted)", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>{l.label}</button>
                ))}
              </div>
            </div>

            {/* RIGHT — totals */}
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>{t.coSummary}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>{t.coSubtotal}</span>
                <span style={{ fontWeight: 700 }}>{money(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 14 }}>
                <span style={{ color: "var(--muted)", flexShrink: 0 }}>{t.coShipping}</span>
                <span style={{ color: "var(--text)", textAlign: "right" }}>{t.coShippingVal}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{t.coTotal}</span>
                <span className="disp" style={{ fontSize: 26, color: "var(--ink)" }}>{money(subtotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@media(min-width:820px){.co-grid{grid-template-columns:1.3fr .9fr!important;gap:46px!important}}`}</style>
    </div>
  );
}

/* ════════════════ APP ════════════════ */
export default function App() {
  const [lang, setLang] = useState("ua");
  const t = T[lang];
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState("dateNew");
  const [expanded, setExpanded] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchAirtableProducts();
        if (alive) { setProducts(list); setLoading(false); }
      } catch (e) {
        console.error("Airtable fetch failed:", e);
        if (alive) { setLoadError(true); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = useMemo(() => {
    const norm = (s) => (s || "").toString().trim().toLowerCase();
    let list = products.filter((p) => !category || norm(p.category) === norm(category));
    const by = { plow: (a, b) => a.price - b.price, phigh: (a, b) => b.price - a.price, dateOld: (a, b) => a.rowIndex - b.rowIndex, dateNew: (a, b) => b.rowIndex - a.rowIndex }[sort];
    return [...list].sort(by);
  }, [products, category, sort]);

  const visible = expanded ? filtered : filtered.slice(0, 8);
  useEffect(() => { setExpanded(false); }, [category, sort]);

  useEffect(() => {
    if (loading) return;
    const els = document.querySelectorAll(".js-reveal");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("reveal-in"); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading, filtered, expanded, lang]);

  const fire = (m) => { setToast(m); setTimeout(() => setToast(null), 2000); };
  const add = useCallback((p, size = null) => {
    const lineId = size ? `${p.id}__${size}` : p.id;
    setCart((c) => { const ex = c.find((i) => i.lineId === lineId); return ex ? c.map((i) => i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i) : [...c, { lineId, id: p.id, title: p.title, brand: p.brand, price: p.price, image: p.images[0], size, qty: 1 }]; });
    fire(`${p.title} ${T[lang].added}`);
  }, [lang]);
  const qty = (lineId, d) => setCart((c) => c.map((i) => i.lineId === lineId ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const remove = (lineId) => setCart((c) => c.filter((i) => i.lineId !== lineId));
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const toShop = () => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  const pickCat = (c) => { setCategory((p) => p === c ? null : c); toShop(); };
  const pickCatMobile = (c) => { setCategory((p) => (c === null ? null : (p === c ? null : c))); setCatMenuOpen(false); setTimeout(toShop, 60); };
  const goShopFromOverlay = (cat) => { setDetail(null); setCategory(cat ?? null); setTimeout(toShop, 60); };
  const goShopFromPage = (cat) => { setPage(null); setCategory(cat ?? null); setTimeout(toShop, 60); };
  const quickLinkGo = (cat) => { setCategory(cat ?? null); setTimeout(toShop, 60); };
  const openPageFromOverlay = (idx) => { setDetail(null); setTimeout(() => setPage(INFO_KEYS[idx]), 60); };
  const goCheckout = () => { setCartOpen(false); setDetail(null); setCheckoutOpen(true); };
  const openPageFromCheckout = (idx) => setPage(INFO_KEYS[idx]);

  return (
    <div className="tl-root" style={{ ...VARS }}>
      <style>{CSS}</style>

      {/* NAVBAR */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
        background: scrolled ? "rgba(255,255,255,.72)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
        transition: "background .35s ease, border-color .35s ease",
      }}>
        <div style={{ padding: "0 clamp(20px,4vw,72px)", height: 64, display: "flex", alignItems: "center", gap: 10 }}>
          {/* left: inline categories on desktop, hamburger on mobile */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
            <nav className="cat-desktop nosb" style={{ display: "flex", gap: 18, overflowX: "auto", alignItems: "center" }}>
              {HEADER_CATS.map((c) => (
                <button key={c} onClick={() => pickCat(c)} className="uline btn" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", color: category === c ? "var(--ink)" : (scrolled ? "var(--muted)" : "rgba(255,255,255,.86)"), padding: "2px 0" }}>{t.cat[c]}</button>
              ))}
            </nav>
            <button onClick={() => setCatMenuOpen(true)} className="cat-mobile-btn btn" aria-label="Menu" style={{ width: 40, height: 40, marginLeft: -8, borderRadius: 99, border: "none", background: "none", color: scrolled ? "var(--text)" : "#fff", cursor: "pointer" }}><Menu size={23} /></button>
          </div>
          {/* center logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }} style={{ fontWeight: 800, fontSize: "clamp(18px,5.2vw,20px)", letterSpacing: ".2em", color: scrolled ? "var(--ink)" : "#fff", textDecoration: "none", textTransform: "lowercase", whiteSpace: "nowrap" }}>la_store</a>
          {/* right: search + cart */}
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
            <button onClick={() => setSearchOpen(true)} className="btn" aria-label="Search" style={{ width: 40, height: 40, borderRadius: 99, border: "none", background: "none", color: scrolled ? "var(--text)" : "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><Search size={20} /></button>
            <button onClick={() => setCartOpen(true)} className="btn" aria-label={t.cart} style={{ position: "relative", width: 40, height: 40, borderRadius: 99, border: "none", background: "none", color: scrolled ? "var(--text)" : "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
              <ShoppingBag size={20} />
              {count > 0 && <span style={{ position: "absolute", top: 2, right: 2, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 99, background: "var(--ink)", color: "#fff", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center" }}>{count}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-full" style={{ position: "relative", overflow: "hidden", background: "#ffffff" }}>
        <HeroVideo src={HERO_VIDEO_URL} />
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}><div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent)", animation: "sheen 9s ease-in-out infinite" }} /></div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 50% 20%, transparent 30%, rgba(0,0,0,.65) 100%), linear-gradient(to top, rgba(0,0,0,.85), transparent 55%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", textAlign: "center", padding: "0 20px 54px" }}>
          <h1 className="disp js-reveal" style={{ margin: 0, fontSize: "clamp(30px,7.5vw,46px)", color: "#fff", letterSpacing: "-.02em" }}>{t.newIn}</h1>
          <p className="js-reveal" style={{ margin: "14px 0 0", color: "rgba(255,255,255,.8)", fontSize: "clamp(12.5px,3.2vw,14px)", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500 }}>Luxury streetwear · Worldwide delivery</p>
          <button onClick={toShop} className="cta js-reveal" style={{ marginTop: 24, padding: "17px 36px", borderRadius: 99, fontWeight: 800, fontSize: "clamp(14px,3.8vw,16px)", letterSpacing: ".06em", border: "none", background: "#fff", color: "#000", cursor: "pointer", whiteSpace: "nowrap" }}>{t.heroCta}</button>
        </div>
      </section>

      {/* CATALOG */}
      <main id="shop" style={{ padding: "48px clamp(20px,4vw,72px) 70px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
          <div>
            <h2 className="disp" style={{ margin: 0, fontSize: "clamp(28px,5vw,44px)", color: "var(--ink)" }}>{t.catalog}</h2>
          </div>
          <div style={{ position: "relative" }}>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ appearance: "none", padding: "11px 40px 11px 16px", borderRadius: 11, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              <option value="plow">{t.sort[0]}</option>
              <option value="phigh">{t.sort[1]}</option>
              <option value="dateOld">{t.sort[2]}</option>
              <option value="dateNew">{t.sort[3]}</option>
            </select>
            <ChevronDown size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }} />
          </div>
        </div>

        <div className="nosb" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginBottom: 26 }}>
          <Chip active={!category} onClick={() => setCategory(null)}>{t.all}</Chip>
          {CATEGORIES.map((c) => <Chip key={c} active={category === c} onClick={() => setCategory((p) => p === c ? null : c)}>{t.cat[c]}</Chip>)}
        </div>

        <div className="prod-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18 }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : visible.length === 0
              ? <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "70px 20px", color: "var(--muted)" }}>
                  <Search size={38} strokeWidth={1.2} />
                  <p style={{ fontWeight: 700, color: "var(--text)", margin: "12px 0 6px" }}>{loadError ? t.loadErr : t.notFound}</p>
                  {!loadError && <button onClick={() => setCategory(null)} className="uline" style={{ background: "none", border: "none", color: "var(--ink)", fontWeight: 700, cursor: "pointer" }}>{t.reset}</button>}
                </div>
              : visible.map((p, i) => <ProductCard key={p.id} p={p} t={t} onOpen={setDetail} onAdd={add} delay={(i % 8) * 55} />)}
        </div>

        {!loading && !expanded && filtered.length > 8 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
            <button onClick={() => setExpanded(true)} className="btn" style={{ padding: "15px 40px", borderRadius: 99, fontWeight: 700, fontSize: 14, letterSpacing: ".04em", border: "1px solid var(--line)", background: "transparent", color: "var(--text)", cursor: "pointer" }}>{t.showAll} ({filtered.length})</button>
          </div>
        )}
      </main>

      <Marquee />

      <Footer t={t} lang={lang} setLang={setLang} onQuickLink={quickLinkGo} onInfoLink={(idx) => setPage(INFO_KEYS[idx])} />

      {/* OVERLAYS */}
      <SearchOverlay open={searchOpen} t={t} products={products} onClose={() => setSearchOpen(false)} onPick={setDetail} />
      <CatMenu open={catMenuOpen} t={t} category={category} onPick={pickCatMobile} onClose={() => setCatMenuOpen(false)} />
      {detail && <QuickView p={detail} t={t} lang={lang} setLang={setLang} products={products} onClose={() => setDetail(null)} onAdd={add} onPick={setDetail} onGoShop={goShopFromOverlay} onOpenPage={openPageFromOverlay} />}
      <Cart open={cartOpen} items={cart} t={t} onClose={() => setCartOpen(false)} onQty={qty} onRemove={remove} onCheckout={goCheckout} />
      {checkoutOpen && <Checkout items={cart} t={t} lang={lang} onClose={() => setCheckoutOpen(false)} onOpenPage={openPageFromCheckout} />}
      {page && <PageOverlay page={page} t={t} lang={lang} setLang={setLang} onClose={() => setPage(null)} onQuickLink={goShopFromPage} onInfoLink={(idx) => setPage(INFO_KEYS[idx])} />}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 110, background: "#fff", color: "#000", padding: "13px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow)", animation: "fadeUp .3s ease" }}>
          <span style={{ width: 22, height: 22, borderRadius: 99, background: "#000", color: "#fff", display: "grid", placeItems: "center" }}><Check size={13} strokeWidth={3} /></span>{toast}
        </div>
      )}

      <style>{`
        @media(min-width:760px){ .prod-grid{grid-template-columns:repeat(3,1fr)!important} }
      `}</style>
    </div>
  );
}