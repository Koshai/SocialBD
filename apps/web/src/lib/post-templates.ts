/** Categories appear in this order in the template picker dropdown. */
export const POST_TEMPLATE_CATEGORY_ORDER = [
  "festival",
  "promo",
  "ecommerce",
  "engagement",
  "general",
  "bangla",
] as const;

export type PostTemplateCategory = (typeof POST_TEMPLATE_CATEGORY_ORDER)[number];

export type PostTemplate = {
  id: string;
  name: string;
  category: PostTemplateCategory;
  caption: string;
};

/** Starter captions — replace text in [brackets] before publishing. */
export const POST_TEMPLATES: PostTemplate[] = [
  // —— Festivals & national days ——
  {
    id: "eid-greeting",
    name: "Eid Mubarak",
    category: "festival",
    caption:
      "Eid Mubarak from [Your business name]!\n\nWishing you and your family joy, peace, and blessings. Thank you for being part of our community.\n\n#EidMubarak #EidUlFitr #Bangladesh",
  },
  {
    id: "eid-offer",
    name: "Eid collection / offer",
    category: "festival",
    caption:
      "Celebrate Eid with [Your business name]!\n\n[Collection or offer details] — available until [date].\n\nVisit [location/link] or inbox us to order.\n\n#EidCollection #EidMubarak #Bangladesh",
  },
  {
    id: "puja-greeting",
    name: "Durga Puja wishes",
    category: "festival",
    caption:
      "Shubho Durga Puja from [Your business name]!\n\nMay Maa Durga bless you with happiness and prosperity.\n\n#DurgaPuja #ShubhoPuja #Bangladesh",
  },
  {
    id: "kali-puja",
    name: "Kali Puja / Diwali",
    category: "festival",
    caption:
      "Shubho [Kali Puja/Diwali] from [Your business name]!\n\nWishing you light, joy, and togetherness this festival.\n\n#KaliPuja #Diwali #Bangladesh",
  },
  {
    id: "pohela-boishakh",
    name: "Pohela Boishakh",
    category: "festival",
    caption:
      "Shubho Noboborsho!\n\n[Your business name] wishes you a colourful Bengali New Year. [Offer or event details].\n\nVisit us at [location/link].\n\n#PohelaBoishakh #Noboborsho #Bangladesh",
  },
  {
    id: "independence-day",
    name: "Independence Day (26 March)",
    category: "festival",
    caption:
      "26 March — Independence Day of Bangladesh.\n\n[Your business name] honours the courage of 1971. #IndependenceDay #26March #Bangladesh",
  },
  {
    id: "victory-day",
    name: "Victory Day (16 December)",
    category: "festival",
    caption:
      "16 December — Victory Day.\n\n[Your business name] remembers the spirit of 1971 with pride. #VictoryDay #16December #Bangladesh",
  },
  {
    id: "christmas",
    name: "Christmas wishes",
    category: "festival",
    caption:
      "Merry Christmas from [Your business name]!\n\nWishing you peace and joy this holiday season.\n\n#MerryChristmas #Bangladesh",
  },

  // —— Offers & launches ——
  {
    id: "flash-sale",
    name: "Flash sale",
    category: "promo",
    caption:
      "⚡ Flash sale at [Your business name]!\n\n[Discount]% off [product/category] — today only until [time/date].\n\nDM or visit [location/link] to grab yours.\n\n#FlashSale #Bangladesh #ShopLocal",
  },
  {
    id: "weekend-sale",
    name: "Weekend sale",
    category: "promo",
    caption:
      "Weekend special at [Your business name]!\n\n[Deal details] — Friday to Sunday.\n\nInbox us or call [phone] to order.\n\n#WeekendSale #Bangladesh",
  },
  {
    id: "new-arrival",
    name: "New arrival",
    category: "promo",
    caption:
      "Just dropped at [Your business name]!\n\n[Product name] — [one-line benefit].\n\nAvailable now at [location/link]. Limited stock.\n\n#NewArrival #Bangladesh",
  },
  {
    id: "bundle-deal",
    name: "Bundle / combo offer",
    category: "promo",
    caption:
      "Bundle & save at [Your business name]!\n\nBuy [item A] + [item B] and get [discount/free gift].\n\nValid until [date]. Order via inbox.\n\n#BundleDeal #Bangladesh",
  },
  {
    id: "grand-opening",
    name: "Grand opening",
    category: "promo",
    caption:
      "We're open! [Your business name] launches at [location].\n\nJoin us on [date] for [offer/event]. See you there!\n\n#GrandOpening #NewShop #Bangladesh",
  },
  {
    id: "clearance",
    name: "Clearance / stock clearance",
    category: "promo",
    caption:
      "Clearance at [Your business name]!\n\nUp to [discount]% off selected items while stocks last.\n\nVisit [location/link] before it's gone.\n\n#ClearanceSale #Bangladesh",
  },

  // —— E-commerce & orders ——
  {
    id: "cod-order",
    name: "Cash on delivery",
    category: "ecommerce",
    caption:
      "Order from [Your business name] with Cash on Delivery!\n\n1. Inbox your name, phone & address\n2. Confirm your order\n3. Pay when it arrives\n\nDelivery: [areas/timeframe]. #COD #Bangladesh",
  },
  {
    id: "bkash-payment",
    name: "bKash / mobile payment",
    category: "ecommerce",
    caption:
      "Pay easily at [Your business name]!\n\nWe accept bKash: [number]. Send payment screenshot to confirm your order.\n\n#bKash #Bangladesh #ShopLocal",
  },
  {
    id: "delivery-update",
    name: "Delivery update",
    category: "ecommerce",
    caption:
      "Delivery update from [Your business name]:\n\nOrders placed before [time] ship [today/tomorrow]. Nationwide delivery in [X] days.\n\nTrack via inbox. Thank you for your patience!",
  },
  {
    id: "daraz-promo",
    name: "Daraz / marketplace",
    category: "ecommerce",
    caption:
      "Find us on Daraz! Search [Your shop name] for [category].\n\n[Current offer]. Link in bio / comments.\n\n#Daraz #Bangladesh #OnlineShopping",
  },
  {
    id: "fb-shop",
    name: "Facebook Shop / inbox order",
    category: "ecommerce",
    caption:
      "Shop from [Your business name] on Facebook!\n\nBrowse our album / shop tab, then inbox to order.\n\n[Payment: COD / bKash]. Delivery across [area].",
  },

  // —— Engagement & community ——
  {
    id: "poll-question",
    name: "This or that / poll",
    category: "engagement",
    caption:
      "Help us choose! [Your business name] wants your vote:\n\nA) [Option A]\nB) [Option B]\n\nComment A or B below. We'll announce the winner on [date]!",
  },
  {
    id: "testimonial",
    name: "Customer shout-out",
    category: "engagement",
    caption:
      "Thank you [customer name] for sharing your experience with [Your business name]!\n\n[Short quote or paraphrase].\n\nTag us in your photos — we love reposting our community. #CustomerLove",
  },
  {
    id: "giveaway",
    name: "Giveaway / contest",
    category: "engagement",
    caption:
      "GIVEAWAY from [Your business name]!\n\nPrize: [prize]. To enter:\n1. Like this post\n2. Follow our page\n3. Tag 2 friends in the comments\n\nWinner announced [date]. Good luck!",
  },
  {
    id: "behind-scenes",
    name: "Behind the scenes",
    category: "engagement",
    caption:
      "Behind the scenes at [Your business name]!\n\n[What you're showing — packing orders, new stock, team].\n\nWhat would you like to see next? Comment below.",
  },
  {
    id: "milestone",
    name: "Follower / milestone thanks",
    category: "engagement",
    caption:
      "We hit [number] followers! Thank you for growing with [Your business name].\n\n[Small thank-you offer optional]. Here's to the next chapter together.",
  },

  // —— Everyday business ——
  {
    id: "hours-update",
    name: "Shop hours",
    category: "general",
    caption:
      "Hours update — [Your business name]:\n\n[Weekday hours]. [Friday/weekend hours if different].\n\nClosed on [holiday] if applicable. Questions? Message us anytime.",
  },
  {
    id: "location-pin",
    name: "Visit us / location",
    category: "general",
    caption:
      "Find [Your business name] at:\n\n[Address / landmark], [city].\n\nOpen [hours]. Parking [details]. See you soon!",
  },
  {
    id: "thank-you",
    name: "Thank customers",
    category: "general",
    caption:
      "Thank you for choosing [Your business name]!\n\nYour trust keeps our team going. See you again soon.\n\n#ThankYou #CustomerLove #Bangladesh",
  },
  {
    id: "hiring",
    name: "We're hiring",
    category: "general",
    caption:
      "[Your business name] is hiring!\n\nRole: [position]. Location: [city/remote].\n\nSend CV to [email/inbox] by [date]. #Hiring #Jobs #Bangladesh",
  },
  {
    id: "quality-promise",
    name: "Quality / service promise",
    category: "general",
    caption:
      "At [Your business name], we stand behind every order.\n\n[Quality guarantee / return policy in one sentence].\n\nQuestions? Inbox us — we're here to help.",
  },
  {
    id: "ramadan-hours",
    name: "Ramadan hours",
    category: "general",
    caption:
      "Ramadan schedule for [Your business name]:\n\nOpen [iftar/sehri hours]. Closed during [Jummah if applicable].\n\nRamadan Mubarak to you and your family.",
  },

  // —— বাংলা (Bangla script) ——
  {
    id: "bn-eid",
    name: "ঈদের শুভেচ্ছা",
    category: "bangla",
    caption:
      "[আপনার ব্যবসার নাম] থেকে ঈদ মোবারক!\n\nআপনার পরিবারের জন্য শান্তি, আনন্দ ও বরকত কামনা করছি। আমাদের সঙ্গে থাকার জন্য ধন্যবাদ।\n\n#ঈদমোবারক #বাংলাদেশ",
  },
  {
    id: "bn-noboborsho",
    name: "পহেলা বৈশাখ",
    category: "bangla",
    caption:
      "শুভ নববর্ষ!\n\n[আপনার ব্যবসার নাম] রঙিন বাংলা নববর্ষের শুভেচ্ছা জানাচ্ছে। [অফার/ইভেন্ট বিবরণ]।\n\nঠিকানা: [লোকেশন/লিংক]\n\n#পহেলাবৈশাখ #নববর্ষ #বাংলাদেশ",
  },
  {
    id: "bn-sale",
    name: "অফার / সেল",
    category: "bangla",
    caption:
      "[আপনার ব্যবসার নাম]-এ বিশেষ অফার!\n\n[পণ্য/ক্যাটাগরি]-এ [ছাড়ার পরিমাণ] — শেষ তারিখ [তারিখ]।\n\nঅর্ডার করতে ইনবক্স করুন বা কল করুন [ফোন]।\n\n#অফার #বাংলাদেশ",
  },
  {
    id: "bn-thank-you",
    name: "ধন্যবাদ",
    category: "bangla",
    caption:
      "[আপনার ব্যবসার নাম] বেছে নেওয়ার জন্য আপনাকে অনেক ধন্যবাদ!\n\nআপনার বিশ্বাস আমাদের অনুপ্রেরণা। আবার দেখা হবে।\n\n#ধন্যবাদ #গ্রাহকপ্রেম",
  },
  {
    id: "bn-cod",
    name: "ক্যাশ অন ডেলিভারি",
    category: "bangla",
    caption:
      "[আপনার ব্যবসার নাম] — ক্যাশ অন ডেলিভারিতে অর্ডার করুন!\n\n১) ইনবক্সে নাম, ফোন ও ঠিকানা পাঠান\n২) অর্ডার কনফার্ম করুন\n৩) পণ্য পেয়ে টাকা দিন\n\nডেলিভারি: [এলাকা/সময়]।",
  },
  {
    id: "bn-hours",
    name: "খোলার সময়",
    category: "bangla",
    caption:
      "[আপনার ব্যবসার নাম] — সময়সূচি:\n\n[সপ্তাহের দিন]: [সময়]। [ছুটি/বিশেষ সময় থাকলে লিখুন]।\n\nকোনো প্রশ্ন থাকলে মেসেজ করুন।",
  },
];

export function getTemplatesByCategory(category: PostTemplateCategory) {
  return POST_TEMPLATES.filter((template) => template.category === category);
}
