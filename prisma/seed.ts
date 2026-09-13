/**
 * Демо-наповнення: 10 категорій, 32 товари, налаштування магазину,
 * способи доставки й оплати, промокоди, адміністратор та історія замовлень.
 * Запуск: npm run db:seed
 */
import { PrismaClient, type PricingMode, type OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const uah = (n: number) => Math.round(n * 100);

const CATEGORIES = [
  { slug: 'beef', name: 'Яловичина', description: 'Стейки сухого визрівання, вирізка, фарш', kind: 'ribeye', tone: 'beef' },
  { slug: 'pork', name: 'Свинина', description: 'Ребра, ошийок, корейка, грудинка', kind: 'ribs', tone: 'pork' },
  { slug: 'chicken', name: 'Курятина', description: 'Філе, стегна, крила, ціла тушка', kind: 'drumstick', tone: 'chicken' },
  { slug: 'turkey', name: 'Індичка', description: 'Дієтичне філе та стегно', kind: 'fillet', tone: 'turkey' },
  { slug: 'lamb', name: 'Баранина', description: 'Каре ягняти, лопатка', kind: 'chop', tone: 'lamb' },
  { slug: 'sausage', name: 'Ковбаси', description: 'Домашні, мисливські, сиров’ялені', kind: 'sausage', tone: 'sausage' },
  { slug: 'smoked', name: 'Копченості', description: 'Балик, грудинка, хамон', kind: 'smoked', tone: 'smoked' },
  { slug: 'semi', name: 'Напівфабрикати', description: 'Котлети, пельмені, готові до приготування', kind: 'box', tone: 'semi' },
  { slug: 'bbq', name: 'BBQ і гриль', description: 'Мариноване м’ясо для мангала', kind: 'skewer', tone: 'bbq' },
  { slug: 'set', name: 'Набори', description: 'Готові м’ясні бокси на компанію', kind: 'skewer', tone: 'set' },
];

type Seed = {
  slug: string; name: string; category: string; meat: string; type: string;
  mode: PricingMode; price: number; old?: number; cost?: number; packG?: number;
  stock: number; low: number; rating: number; reviews: number;
  kind: string; tone?: string; hit?: boolean; fresh?: boolean;
  short: string; comp: string; origin?: string; producer?: string;
  storage?: string; shelf: number; kcal: number; protein: number; fat: number;
  tips?: string;
};

const P: Seed[] = [
  { slug: 'stejk-ribeye-suhogo-vyzrivannia', name: 'Стейк Ribeye сухого визрівання', category: 'beef', meat: 'beef', type: 'steak', mode: 'PER_KG', price: uah(1290), old: uah(1490), cost: uah(880), stock: 18400, low: 4000, rating: 4.9, reviews: 128, kind: 'ribeye', hit: true, short: 'Товстий край із мармуровою сіткою жиру, 28 діб сухого визрівання у власній камері.', comp: 'Яловичина (товстий край)', producer: 'М’ясна Лавка · власне визрівання', shelf: 7, kcal: 271, protein: 24, fat: 20, tips: 'Дістаньте з холодильника за 40 хвилин, обсушіть, посоліть перед смаженням. По 2–3 хвилини з кожного боку до medium rare, потім 5 хвилин відпочинку.' },
  { slug: 'stejk-new-york', name: 'Стейк New York', category: 'beef', meat: 'beef', type: 'steak', mode: 'PER_KG', price: uah(1180), cost: uah(820), stock: 12600, low: 4000, rating: 4.8, reviews: 94, kind: 'tbone', short: 'Тонкий край із рівною жировою смугою по краю. Класика для сковороди-гриль.', comp: 'Яловичина (тонкий край)', shelf: 7, kcal: 258, protein: 25, fat: 18 },
  { slug: 'file-minjon', name: 'Філе Міньйон', category: 'beef', meat: 'beef', type: 'steak', mode: 'PER_KG', price: uah(1450), cost: uah(1010), stock: 7800, low: 4000, rating: 4.9, reviews: 61, kind: 'fillet', fresh: true, short: 'Найніжніша частина вирізки, майже без сполучної тканини. Готується за 6 хвилин.', comp: 'Яловича вирізка', shelf: 6, kcal: 212, protein: 27, fat: 11 },
  { slug: 'stejk-t-bone', name: 'Стейк T-Bone', category: 'beef', meat: 'beef', type: 'steak', mode: 'PER_KG', price: uah(1090), cost: uah(760), stock: 9200, low: 4000, rating: 4.7, reviews: 52, kind: 'tbone', short: 'Дві текстури в одному відрубі: тонкий край і вирізка, розділені Т-подібною кісткою.', comp: 'Яловичина на кістці', shelf: 7, kcal: 247, protein: 24, fat: 17 },
  { slug: 'jalovycha-vyrizka', name: 'Яловича вирізка', category: 'beef', meat: 'beef', type: 'fillet', mode: 'PER_KG', price: uah(980), cost: uah(690), stock: 15000, low: 4000, rating: 4.6, reviews: 37, kind: 'fillet', short: 'Ціла зачищена вирізка. Підходить для медальйонів, карпачо й Веллінгтона.', comp: 'Яловича вирізка', shelf: 6, kcal: 212, protein: 27, fat: 11 },
  { slug: 'jalovychyj-farsh', name: 'Яловичий фарш добірний', category: 'beef', meat: 'beef', type: 'mince', mode: 'PER_KG', price: uah(340), cost: uah(240), stock: 42000, low: 6000, rating: 4.5, reviews: 210, kind: 'mince', hit: true, short: 'Крупне рублення з лопатки й грудинки, 20 % жиру — саме стільки, скільки треба бургеру.', comp: 'Яловичина (лопатка, грудинка)', shelf: 2, kcal: 254, protein: 19, fat: 20 },
  { slug: 'jalovychi-rebra', name: 'Яловичі ребра', category: 'beef', meat: 'beef', type: 'ribs', mode: 'PER_KG', price: uah(420), old: uah(480), cost: uah(300), stock: 11000, low: 4000, rating: 4.4, reviews: 44, kind: 'ribs', short: 'М’ясисті ребра для повільного томління. Після трьох годин м’ясо сходить із кістки.', comp: 'Яловичина на ребровій кістці', shelf: 5, kcal: 230, protein: 18, fat: 18 },

  { slug: 'svynjachi-rebra', name: 'Свинячі ребра', category: 'pork', meat: 'pork', type: 'ribs', mode: 'PER_KG', price: uah(285), cost: uah(195), stock: 26000, low: 5000, rating: 4.6, reviews: 156, kind: 'ribs', hit: true, short: 'Молоді ребра з рівним шаром м’яса. Ідеальні для духовки під глазур’ю.', comp: 'Свинина на кістці', shelf: 5, kcal: 277, protein: 18, fat: 23, tips: 'Повільне запікання: 150 °C протягом 2,5–3 годин під фольгою, останні 20 хвилин — відкрито, під глазур’ю.' },
  { slug: 'svynjachyj-oshyjok', name: 'Свинячий ошийок', category: 'pork', meat: 'pork', type: 'steak', mode: 'PER_KG', price: uah(320), cost: uah(225), stock: 31000, low: 5000, rating: 4.7, reviews: 189, kind: 'ribeye', short: 'Найпопулярніший відруб для шашлику: жирові прошарки не дають м’ясу пересохнути.', comp: 'Свинина (шийна частина)', shelf: 5, kcal: 267, protein: 17, fat: 22 },
  { slug: 'svynjacha-korejka', name: 'Свиняча корейка', category: 'pork', meat: 'pork', type: 'steak', mode: 'PER_KG', price: uah(295), cost: uah(205), stock: 18000, low: 5000, rating: 4.4, reviews: 73, kind: 'ribeye', short: 'Пісний відруб із тонкою жировою шапкою. Тримає форму й гарно рожевіє всередині.', comp: 'Свинина (корейка)', shelf: 5, kcal: 242, protein: 21, fat: 17 },
  { slug: 'svynjachyj-farsh', name: 'Свинячий фарш', category: 'pork', meat: 'pork', type: 'mince', mode: 'PER_KG', price: uah(210), cost: uah(145), stock: 36000, low: 6000, rating: 4.3, reviews: 88, kind: 'mince', short: 'Класичний фарш середнього рублення для котлет, тефтель і домашніх пельменів.', comp: 'Свинина (лопатка)', shelf: 2, kcal: 263, protein: 17, fat: 21 },
  { slug: 'svynjacha-hrudynka', name: 'Свиняча грудинка', category: 'pork', meat: 'pork', type: 'ribs', mode: 'PER_KG', price: uah(265), old: uah(310), cost: uah(180), stock: 9000, low: 4000, rating: 4.5, reviews: 41, kind: 'ribs', short: 'Шаруватий відруб зі шкіркою. Запікайте повільно — і отримаєте хрустку кірку.', comp: 'Свинина (грудинка)', shelf: 5, kcal: 295, protein: 15, fat: 26 },

  { slug: 'kurjache-file', name: 'Куряче філе охолоджене', category: 'chicken', meat: 'chicken', type: 'fillet', mode: 'PER_KG', price: uah(219), cost: uah(150), stock: 58000, low: 8000, rating: 4.6, reviews: 402, kind: 'fillet', hit: true, short: 'Грудка без шкіри та кістки. Найпопулярніша позиція каталогу вже третій місяць поспіль.', comp: 'Куряче філе', producer: 'Птахокомплекс «Зелений Гай»', shelf: 4, kcal: 113, protein: 23, fat: 2 },
  { slug: 'kurjachi-stehna', name: 'Курячі стегна', category: 'chicken', meat: 'chicken', type: 'fillet', mode: 'PER_KG', price: uah(165), cost: uah(112), stock: 44000, low: 8000, rating: 4.5, reviews: 233, kind: 'drumstick', short: 'Соковите темне м’ясо на кістці. Прощає перетримку в духовці на десять хвилин.', comp: 'Куряче стегно', producer: 'Птахокомплекс «Зелений Гай»', shelf: 4, kcal: 185, protein: 18, fat: 12 },
  { slug: 'kurjachi-kryla', name: 'Курячі крила', category: 'chicken', meat: 'chicken', type: 'fillet', mode: 'PER_KG', price: uah(149), old: uah(179), cost: uah(98), stock: 22000, low: 6000, rating: 4.4, reviews: 167, kind: 'drumstick', short: 'Дві фаланги, зачищені. Беруть найчастіше разом із соусом BBQ.', comp: 'Курячі крила', producer: 'Птахокомплекс «Зелений Гай»', shelf: 4, kcal: 203, protein: 18, fat: 14 },
  { slug: 'kurka-cila-fermerska', name: 'Курка ціла фермерська', category: 'chicken', meat: 'chicken', type: 'fillet', mode: 'PER_UNIT', price: uah(260), cost: uah(180), stock: 40, low: 8, rating: 4.7, reviews: 95, kind: 'bird', short: 'Тушка вільного вигулу, приблизно 1,7 кг. Вирощена без стимуляторів росту.', comp: 'Курка потрошена', producer: 'Ферма «Ясені»', shelf: 4, kcal: 198, protein: 19, fat: 13 },
  { slug: 'kurjachi-homilky', name: 'Курячі гомілки', category: 'chicken', meat: 'chicken', type: 'fillet', mode: 'PER_KG', price: uah(139), cost: uah(92), stock: 27000, low: 6000, rating: 4.3, reviews: 76, kind: 'drumstick', short: 'Бюджетна позиція з темним м’ясом. Добре йде в маринаді з паприкою.', comp: 'Курячі гомілки', producer: 'Птахокомплекс «Зелений Гай»', shelf: 4, kcal: 172, protein: 18, fat: 11 },

  { slug: 'file-indychky', name: 'Філе індички', category: 'turkey', meat: 'turkey', type: 'fillet', mode: 'PER_KG', price: uah(349), cost: uah(245), stock: 14000, low: 4000, rating: 4.7, reviews: 58, kind: 'fillet', fresh: true, short: 'Найпісніше м’ясо в каталозі: 1 г жиру на 100 г. Основа дієтичного меню.', comp: 'Філе індички', producer: 'Ферма «Ясені»', shelf: 4, kcal: 104, protein: 24, fat: 1 },
  { slug: 'stehno-indychky', name: 'Стегно індички', category: 'turkey', meat: 'turkey', type: 'fillet', mode: 'PER_KG', price: uah(275), cost: uah(190), stock: 11000, low: 4000, rating: 4.5, reviews: 31, kind: 'drumstick', short: 'Темніше й соковитіше за філе. Тримає смак спецій краще, ніж грудка.', comp: 'Стегно індички без кістки', producer: 'Ферма «Ясені»', shelf: 4, kcal: 144, protein: 20, fat: 7 },

  { slug: 'kare-jahniaty', name: 'Каре ягняти', category: 'lamb', meat: 'lamb', type: 'steak', mode: 'PER_KG', price: uah(890), cost: uah(640), stock: 5200, low: 3000, rating: 4.8, reviews: 27, kind: 'chop', fresh: true, short: 'Вісім ребер, зачищених по-французьки. Молоде ягня без різкого запаху.', comp: 'Ягнятина на кістці', producer: 'Господарство «Карпатська отара»', shelf: 6, kcal: 243, protein: 21, fat: 18 },
  { slug: 'baranjacha-lopatka', name: 'Бараняча лопатка', category: 'lamb', meat: 'lamb', type: 'ribs', mode: 'PER_KG', price: uah(620), cost: uah(430), stock: 6800, low: 3000, rating: 4.5, reviews: 19, kind: 'chop', short: 'Відруб для плову й повільного запікання. Витримує довге приготування без втрати соку.', comp: 'Ягнятина (лопатка)', producer: 'Господарство «Карпатська отара»', shelf: 6, kcal: 235, protein: 19, fat: 17 },

  { slug: 'kovbasa-domashnja', name: 'Ковбаса домашня смажена', category: 'sausage', meat: 'pork', type: 'sausage', mode: 'PER_KG', price: uah(385), cost: uah(255), stock: 12000, low: 4000, rating: 4.8, reviews: 145, kind: 'sausage', tone: 'sausage', hit: true, short: 'Свинина, часник, чорний перець і натуральна оболонка. Готується щоранку в нашому цеху.', comp: 'Свинина, сало, часник, сіль, перець чорний, оболонка натуральна', producer: 'М’ясна Лавка · власний цех', shelf: 7, kcal: 301, protein: 16, fat: 26 },
  { slug: 'kovbasky-myslyvski', name: 'Ковбаски мисливські', category: 'sausage', meat: 'pork', type: 'sausage', mode: 'PER_KG', price: uah(420), cost: uah(280), stock: 8600, low: 3000, rating: 4.6, reviews: 88, kind: 'sausage', tone: 'sausage', short: 'Підкопчені ковбаски з кмином і паприкою. Тримають форму на грилі.', comp: 'Свинина, яловичина, паприка, кмин, сіль нітритна', producer: 'М’ясна Лавка · власний цех', shelf: 14, kcal: 326, protein: 18, fat: 28 },
  { slug: 'saljami-vytrymana', name: 'Салямі витримана', category: 'sausage', meat: 'pork', type: 'smoked', mode: 'PER_100G', price: uah(78), cost: uah(52), stock: 4300, low: 1500, rating: 4.7, reviews: 54, kind: 'sausage', tone: 'smoked', short: 'Сиров’ялена салямі шістдесятиденної витримки з благородною білою пліснявою.', comp: 'Свинина, сало, сіль морська, перець, стартові культури', storage: 'від 0 до +12 °C', shelf: 30, kcal: 412, protein: 21, fat: 36 },

  { slug: 'balyk-kopchenyj', name: 'Балик копчений', category: 'smoked', meat: 'pork', type: 'smoked', mode: 'PER_100G', price: uah(92), cost: uah(61), stock: 3800, low: 1200, rating: 4.8, reviews: 66, kind: 'smoked', tone: 'smoked', short: 'Свиняча корейка холодного копчення на буковій тріску. Мінімум солі, чистий смак м’яса.', comp: 'Свинина, сіль, спеції, дим натуральний', producer: 'М’ясна Лавка · коптильня', storage: 'від 0 до +6 °C', shelf: 21, kcal: 238, protein: 24, fat: 15 },
  { slug: 'hrudynka-kopchena', name: 'Грудинка копчена', category: 'smoked', meat: 'pork', type: 'smoked', mode: 'PER_100G', price: uah(68), old: uah(79), cost: uah(44), stock: 5100, low: 1500, rating: 4.6, reviews: 72, kind: 'smoked', tone: 'smoked', short: 'Шарувата грудинка гарячого копчення. Найкраще розкривається тонко нарізаною.', comp: 'Свинина, сіль, часник, дим натуральний', producer: 'М’ясна Лавка · коптильня', storage: 'від 0 до +6 °C', shelf: 21, kcal: 389, protein: 12, fat: 38 },
  { slug: 'hamon-18-misjaciv', name: 'Хамон витриманий 18 місяців', category: 'smoked', meat: 'pork', type: 'smoked', mode: 'PER_100G', price: uah(145), cost: uah(98), stock: 1900, low: 800, rating: 4.9, reviews: 23, kind: 'smoked', tone: 'smoked', fresh: true, short: 'Сиров’ялений окіст вісімнадцятимісячної витримки. Ріжеться напівпрозорими пелюстками.', comp: 'Свинячий окіст, сіль морська', origin: 'Іспанія', producer: 'Bodega Serrano', storage: 'від +10 до +18 °C', shelf: 60, kcal: 241, protein: 31, fat: 13 },

  { slug: 'kotlety-domashni', name: 'Котлети домашні', category: 'semi', meat: 'beef', type: 'semi', mode: 'PER_PACKAGE', price: uah(165), cost: uah(110), packG: 400, stock: 60, low: 10, rating: 4.5, reviews: 112, kind: 'box', tone: 'semi', short: 'Чотири котлети по 100 г із суміші яловичини та свинини. Без сої й панірувальних сухарів.', comp: 'Яловичина, свинина, цибуля, яйце, спеції', producer: 'М’ясна Лавка · власний цех', shelf: 3, kcal: 221, protein: 15, fat: 16 },
  { slug: 'pelmeni-z-teljatynoju', name: 'Пельмені з телятиною', category: 'semi', meat: 'beef', type: 'semi', mode: 'PER_PACKAGE', price: uah(189), cost: uah(126), packG: 500, stock: 45, low: 10, rating: 4.6, reviews: 134, kind: 'box', tone: 'semi', short: 'Ліплені вручну, тонке тісто, начинка з телятини й цибулі. Варяться сім хвилин.', comp: 'Борошно, вода, телятина, цибуля, сіль, перець', storage: 'від -18 °C', shelf: 90, kcal: 248, protein: 13, fat: 12 },

  { slug: 'shashlyk-svynjachyj', name: 'Шашлик зі свинини маринований', category: 'bbq', meat: 'pork', type: 'bbq', mode: 'PER_KG', price: uah(295), cost: uah(198), stock: 24000, low: 5000, rating: 4.7, reviews: 198, kind: 'skewer', tone: 'bbq', hit: true, short: 'Ошийок кубиками в маринаді на цибулі та мінеральній воді. Готовий до мангала.', comp: 'Свинячий ошийок, цибуля, спеції, сіль', producer: 'М’ясна Лавка · власний цех', shelf: 3, kcal: 249, protein: 16, fat: 20 },
  { slug: 'bbq-set-family', name: 'BBQ Set Family', category: 'set', meat: 'pork', type: 'set', mode: 'SET', price: uah(1290), old: uah(1490), cost: uah(880), packG: 2400, stock: 12, low: 4, rating: 4.9, reviews: 47, kind: 'skewer', tone: 'set', hit: true, short: '2,4 кг на компанію: свинячий шашлик, ребра, ковбаски й курячі крила в маринаді.', comp: 'Свинячий ошийок, свинячі ребра, ковбаски, курячі крила', producer: 'М’ясна Лавка', shelf: 3, kcal: 255, protein: 17, fat: 20 },
  { slug: 'nabir-stejkova-kolekcija', name: 'Набір «Стейкова колекція»', category: 'set', meat: 'beef', type: 'set', mode: 'SET', price: uah(2190), cost: uah(1520), packG: 1100, stock: 6, low: 3, rating: 4.9, reviews: 18, kind: 'ribeye', tone: 'set', short: 'Три стейки на вибір шеф-різника: Ribeye, New York і Філе Міньйон, разом близько 1,1 кг.', comp: 'Яловичина сухого визрівання', producer: 'М’ясна Лавка · власне визрівання', shelf: 7, kcal: 250, protein: 25, fat: 17 },
];

const SETTINGS: Array<[string, string, string]> = [
  ['shopName', 'М’ясна Лавка', 'general'],
  ['tagline', 'Різниця з 2014', 'general'],
  ['description', 'Власна різниця й коптильня в Києві. Фермерське м’ясо без посередників.', 'general'],
  ['phone', '+38 (067) 412-38-90', 'contacts'],
  ['email', 'hello@myasna-lavka.ua', 'contacts'],
  ['address', 'вул. Різницька, 14, Київ', 'contacts'],
  ['workingHours', 'Щодня 08:00 – 21:00', 'contacts'],
  ['telegram', 'https://t.me/myasna_lavka', 'social'],
  ['instagram', 'https://instagram.com/myasna_lavka', 'social'],
  ['facebook', 'https://facebook.com/myasnalavka', 'social'],
  ['viber', '', 'social'],
  ['freeShippingFrom', String(uah(1200)), 'commerce'],
  ['minOrderTotal', String(uah(400)), 'commerce'],
  ['heroTitle', 'Свіже м’ясо преміальної якості', 'content'],
  ['heroSubtitle', 'Відбираємо найкраще м’ясо у фермерів і доставляємо його до вашого столу — у вакуумі, з датою розбирання й точною вагою на етикетці.', 'content'],
  ['heroCtaLabel', 'Перейти до каталогу', 'content'],
  ['footerNote', 'Власна різниця й коптильня в Києві. Працюємо з фермерськими господарствами Полтавщини та Карпат без посередників.', 'content'],
  ['seoTitle', 'М’ясна Лавка — свіже м’ясо преміальної якості з доставкою по Києву', 'seo'],
  ['seoDescription', 'Стейки сухого визрівання, фермерська курятина, домашні ковбаси та копченості. Доставка по Києву того ж дня, Нова Пошта по Україні.', 'seo'],
];

async function main() {
  console.log('→ Налаштування магазину');
  for (const [key, value, group] of SETTINGS) {
    await prisma.siteSetting.upsert({ where: { key }, create: { key, value, group }, update: {} });
  }

  console.log('→ Адміністратор');
  const email = (process.env.ADMIN_EMAIL || 'owner@myasna-lavka.ua').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ZminiCejParol2026!';
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, name: 'Власник магазину', role: 'OWNER', passwordHash: await bcrypt.hash(password, 12) },
    update: {},
  });

  console.log('→ Доставка й оплата');
  const delivery = [
    { code: 'courier', name: 'Кур’єр по Києву', description: 'Сьогодні, двогодинне вікно на вибір', price: uah(129), sortOrder: 1 },
    { code: 'np', name: 'Нова Пошта', description: 'Наступного дня, термопакування', price: uah(95), sortOrder: 2 },
    { code: 'pickup', name: 'Самовивіз', description: 'вул. Різницька, 14, Київ · Щодня 08:00 – 21:00', price: 0, sortOrder: 3 },
    { code: 'other', name: 'Інша служба доставки', description: 'Узгоджуємо телефоном після замовлення', price: uah(150), sortOrder: 4 },
  ];
  for (const d of delivery) {
    await prisma.deliveryMethod.upsert({ where: { code: d.code }, create: d, update: {} });
  }
  const payments = [
    { code: 'card', name: 'Банківська картка онлайн', provider: 'LiqPay', instructions: 'Visa, Mastercard · безпечна оплата', sortOrder: 1 },
    { code: 'cod', name: 'Оплата при отриманні', instructions: 'Готівкою або карткою кур’єру', sortOrder: 2 },
    { code: 'wallet', name: 'Apple Pay / Google Pay', provider: 'LiqPay', instructions: 'Оплата в один дотик', sortOrder: 3 },
    { code: 'invoice', name: 'Рахунок для юридичних осіб', instructions: 'Надішлемо рахунок на email', sortOrder: 4, isActive: false },
  ];
  for (const p of payments) {
    await prisma.paymentMethod.upsert({ where: { code: p.code }, create: p, update: {} });
  }

  console.log('→ Категорії');
  const categoryIds = new Map<string, string>();
  for (const [index, c] of CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug, name: c.name, description: c.description, sortOrder: index + 1,
        imageUrl: `/api/img/${c.kind}/${c.tone}/${index + 1}`,
        seoTitle: `${c.name} — купити з доставкою по Києву`,
        seoDescription: `${c.name}: ${c.description}. Свіже м’ясо від М’ясної Лавки з доставкою того ж дня.`,
      },
      update: {},
    });
    categoryIds.set(c.slug, row.id);
  }

  console.log('→ Товари');
  for (const [index, p] of P.entries()) {
    const sku = `ML-${String(index + 1).padStart(3, '0')}`;
    const categoryId = categoryIds.get(p.category)!;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug, sku, name: p.name, categoryId, meat: p.meat, type: p.type,
        pricingMode: p.mode, price: p.price, oldPrice: p.old ?? null, costPrice: p.cost ?? null,
        packWeightG: p.packG ?? null, stock: p.stock, lowStockThreshold: p.low,
        rating: p.rating, reviewCount: p.reviews, isHit: !!p.hit, isNew: !!p.fresh,
        isRecommended: !!p.hit,
        shortDescription: p.short,
        description: `${p.short}\n\nМи розбираємо туші у власному цеху щоранку, тож між розбиранням і доставкою минає менше доби. Кожен відруб зважується окремо, пакується у вакуум і отримує етикетку з фактичною вагою, датою й номером партії.`,
        composition: p.comp, origin: p.origin ?? 'Україна',
        producer: p.producer ?? 'Ферма «Полтавський двір»',
        storageConditions: p.storage ?? 'від 0 до +4 °C',
        shelfLifeDays: p.shelf, kcal: p.kcal, protein: p.protein, fat: p.fat, carbs: 0,
        cookingTips: p.tips ?? null,
        seoTitle: `${p.name} — купити з доставкою | М’ясна Лавка`,
        seoDescription: p.short.slice(0, 160),
        images: {
          create: [0, 1, 2, 3].map((i) => ({
            url: `/api/img/${p.kind}/${p.tone ?? p.meat}/${index * 4 + i + 1}`,
            alt: `${p.name} — фото ${i + 1}`,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        },
      },
    });

    if (p.mode === 'PER_KG' || p.mode === 'PER_100G') {
      const grams = p.mode === 'PER_KG' ? (p.price > 80000 ? [300, 500, 1000] : [500, 1000, 2000]) : [100, 200, 500];
      for (const [gi, g] of grams.entries()) {
        await prisma.weightOption.upsert({
          where: { productId_grams: { productId: product.id, grams: g } },
          create: {
            productId: product.id, grams: g, isDefault: gi === 1,
            label: g >= 1000 ? `${g / 1000} кг` : `${g} г`,
          },
          update: {},
        });
      }
    }
  }

  console.log('→ Промокоди й банери');
  const coupons = [
    { code: 'BBQ10', type: 'PERCENT' as const, value: 10, usageLimit: 500, minOrderTotal: 0 },
    { code: 'МЯСО200', type: 'FIXED' as const, value: uah(200), usageLimit: 200, minOrderTotal: uah(1500) },
    { code: 'ДОСТАВКА', type: 'FREE_SHIPPING' as const, value: 0, minOrderTotal: 0 },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, create: c, update: {} });
  }
  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.create({
      data: {
        placement: 'promo', title: 'Мангальний набір на компанію',
        subtitle: '2,4 кг маринованого м’яса: шашлик з ошийку, свинячі ребра, ковбаски й курячі крила. Знижка діє до неділі.',
        ctaLabel: 'Замовити набір', ctaUrl: '/product/bbq-set-family',
        imageUrl: '/api/img/skewer/bbq/900', sortOrder: 1,
      },
    });
  }

  console.log('→ Демо-замовлення');
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const products = await prisma.product.findMany({ take: 12 });
    const customers = [
      ['Олена', 'Ткаченко', '+38 (067) 300-10-40'],
      ['Дмитро', 'Кравець', '+38 (068) 307-11-41'],
      ['Ірина', 'Волошин', '+38 (069) 314-12-42'],
      ['Андрій', 'Лисенко', '+38 (067) 321-13-43'],
      ['Марина', 'Стеценко', '+38 (068) 328-14-44'],
      ['Богдан', 'Кучер', '+38 (069) 335-15-45'],
      ['Наталія', 'Гриценко', '+38 (067) 342-16-46'],
      ['Сергій', 'Мельник', '+38 (068) 349-17-47'],
    ];
    const statuses: OrderStatus[] = ['DELIVERED', 'DELIVERED', 'ON_THE_WAY', 'PACKED', 'PREPARING', 'CONFIRMED', 'NEW', 'CANCELLED'];
    const year = new Date().getFullYear();

    for (let i = 0; i < 24; i++) {
      const [first, last, phone] = customers[i % customers.length];
      const picked = [products[i % products.length], products[(i * 3 + 1) % products.length]];
      const items = picked.map((product) => {
        const grams = product.pricingMode === 'PER_KG' ? 1000 : product.pricingMode === 'PER_100G' ? 200 : 0;
        const quantity = 1 + (i % 2);
        const div = product.pricingMode === 'PER_KG' ? 1000 : product.pricingMode === 'PER_100G' ? 100 : 0;
        const total = div ? Math.round((product.price * grams) / div) * quantity : product.price * quantity;
        return {
          productId: product.id, nameSnapshot: product.name, skuSnapshot: product.sku,
          imageSnapshot: `/api/img/ribeye/beef/${i + 1}`, pricingMode: product.pricingMode,
          unitPrice: product.price, grams, quantity, lineTotal: total,
        };
      });
      const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
      const deliveryFee = subtotal >= uah(1200) ? 0 : uah(95);
      const createdAt = new Date(Date.now() - i * 30 * 3600 * 1000);
      const status = statuses[i % statuses.length];

      await prisma.order.create({
        data: {
          number: `ML-${year}-${String(900 + i).padStart(4, '0')}`,
          status,
          paymentStatus: status === 'DELIVERED' ? 'PAID' : 'PENDING',
          customerFirstName: first, customerLastName: last, phone,
          email: `${first.toLowerCase()}@example.com`,
          deliveryMethodCode: i % 3 === 0 ? 'courier' : i % 3 === 1 ? 'np' : 'pickup',
          deliveryMethodName: i % 3 === 0 ? 'Кур’єр по Києву' : i % 3 === 1 ? 'Нова Пошта' : 'Самовивіз',
          city: 'Київ', street: 'вул. Січових Стрільців', house: String(10 + i), branch: `№ ${20 + i}`,
          paymentMethodCode: i % 2 === 0 ? 'card' : 'cod',
          paymentMethodName: i % 2 === 0 ? 'Банківська картка онлайн' : 'Оплата при отриманні',
          subtotal, discount: 0, deliveryFee, total: subtotal + deliveryFee,
          createdAt, updatedAt: createdAt,
          paidAt: status === 'DELIVERED' ? createdAt : null,
          items: { create: items },
          events: { create: { to: status, note: 'Демо-дані', createdAt } },
        },
      });
    }
  }

  console.log('→ Демо-покупець');
  const demoEmail = (process.env.DEMO_CUSTOMER_EMAIL || 'olena@example.com').toLowerCase();
  const demoPassword = process.env.DEMO_CUSTOMER_PASSWORD || 'Demo12345!';
  const demoPhone = '+38 (067) 300-10-40';
  const customer = await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      passwordHash: await bcrypt.hash(demoPassword, 12),
      firstName: 'Олена',
      lastName: 'Ткаченко',
      phone: demoPhone,
      bonusBalance: 240,
      addresses: {
        create: [
          { label: 'Дім', city: 'Київ', street: 'вул. Січових Стрільців', house: '14-Б', apartment: '27', isDefault: true },
          { label: 'Офіс', city: 'Київ', street: 'вул. Хрещатик', house: '22' },
        ],
      },
    },
    update: {},
  });

  // Замовлення, зроблені за тим самим телефоном, прив'язуємо до акаунта.
  await prisma.order.updateMany({ where: { phone: demoPhone, userId: null }, data: { userId: customer.id } });

  const favCount = await prisma.favorite.count({ where: { userId: customer.id } });
  if (favCount === 0) {
    const favSlugs = ['file-minjon', 'kovbasa-domashnja', 'kurjache-file'];
    for (const slug of favSlugs) {
      const product = await prisma.product.findUnique({ where: { slug } });
      if (product) {
        await prisma.favorite.create({ data: { userId: customer.id, productId: product.id } });
      }
    }
  }

  console.log('→ Відгуки');
  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    const ribeye = await prisma.product.findUnique({ where: { slug: 'stejk-ribeye-suhogo-vyzrivannia' } });
    if (ribeye) {
      await prisma.review.createMany({
        data: [
          { productId: ribeye.id, authorName: 'Марина С.', rating: 5, status: 'APPROVED', text: 'Вага збіглася з етикеткою до грама, вакуум цілий, запах свіжий. Рекомендую брати з вечора на завтра.' },
          { productId: ribeye.id, authorName: 'Андрій Л.', rating: 4, status: 'APPROVED', text: 'Смак відмінний, але хотілося б варіант меншої фасовки — кілограм на двох забагато.' },
          { productId: ribeye.id, authorName: 'Олег В.', rating: 5, status: 'PENDING', text: 'Візьму ще раз на вихідні.' },
        ],
      });
    }
  }

  const [products, orders] = await Promise.all([prisma.product.count(), prisma.order.count()]);
  console.log(`\n✓ Готово: ${products} товарів, ${orders} замовлень`);
  console.log(`✓ Адмінка: /${process.env.ADMIN_PATH || 'admin'} — ${email}`);
  console.log(`✓ Демо-покупець: ${demoEmail} / ${demoPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
