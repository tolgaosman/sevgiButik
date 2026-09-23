export type NavColumn = {
  title: string;
  items: { label: string; href: string }[];
};

export type NavItem = {
  label: string;
  href: string;
  columns: NavColumn[];
};

export const primaryNav: NavItem[] = [
  {
    label: "Ana Sayfa",
    href: "/",
    columns: [],
  },
  {
    label: "Giyim",
    href: "/giyim",
    columns: [
      {
        title: "Elbise",
        items: [
          { label: "Midi Elbise", href: "/giyim?sub=midi-elbise" },
          { label: "Maxi Elbise", href: "/giyim?sub=maxi-elbise" },
          { label: "Günlük Elbise", href: "/giyim?sub=gunluk-elbise" },
          { label: "Abiye", href: "/giyim?sub=abiye" },
        ],
      },
      {
        title: "Üst Giyim",
        items: [
          { label: "Bluz & Gömlek", href: "/giyim?sub=bluz-gomlek" },
          { label: "T-Shirt", href: "/giyim?sub=tisort" },
          { label: "Örgü & Triko", href: "/giyim?sub=orgu-triko" },
          { label: "Ceket & Blazer", href: "/giyim?sub=ceket-blazer" },
        ],
      },
      {
        title: "Alt Giyim",
        items: [
          { label: "Pantolon", href: "/giyim?sub=pantolon" },
          { label: "Etek", href: "/giyim?sub=etek" },
          { label: "Şort", href: "/giyim?sub=sort" },
          { label: "Jean", href: "/giyim?sub=jean" },
        ],
      },
    ],
  },
  {
    label: "Elbise",
    href: "/elbise",
    columns: [
      {
        title: "Elbise",
        items: [
          { label: "Midi Elbise", href: "/elbise?sub=midi" },
          { label: "Maxi Elbise", href: "/elbise?sub=maxi" },
          { label: "Mini Elbise", href: "/elbise?sub=mini" },
          { label: "Günlük Elbise", href: "/elbise?sub=gunluk" },
          { label: "Abiye & Davet", href: "/elbise?sub=abiye" },
        ],
      },
    ],
  },
  {
    label: "Üst Giyim",
    href: "/ust-giyim",
    columns: [
      {
        title: "Üst Giyim",
        items: [
          { label: "Bluz & Gömlek", href: "/ust-giyim?sub=bluz-gomlek" },
          { label: "T-Shirt & Body", href: "/ust-giyim?sub=tisort-body" },
          { label: "Örgü & Triko", href: "/ust-giyim?sub=orgu-triko" },
          { label: "Ceket & Blazer", href: "/ust-giyim?sub=ceket-blazer" },
          { label: "Hırka", href: "/ust-giyim?sub=hirka" },
        ],
      },
    ],
  },
  {
    label: "Alt Giyim",
    href: "/alt-giyim",
    columns: [
      {
        title: "Alt Giyim",
        items: [
          { label: "Pantolon", href: "/alt-giyim?sub=pantolon" },
          { label: "Jean", href: "/alt-giyim?sub=jean" },
          { label: "Etek", href: "/alt-giyim?sub=etek" },
          { label: "Şort", href: "/alt-giyim?sub=sort" },
          { label: "Tayt", href: "/alt-giyim?sub=tayt" },
        ],
      },
    ],
  },
  {
    label: "Aksesuar",
    href: "/aksesuar",
    columns: [
      {
        title: "Aksesuar",
        items: [
          { label: "Çanta", href: "/aksesuar?sub=canta" },
          { label: "Takı", href: "/aksesuar?sub=taki" },
          { label: "Kemer", href: "/aksesuar?sub=kemer" },
          { label: "Şal & Fular", href: "/aksesuar?sub=sal-fular" },
          { label: "Güneş Gözlüğü", href: "/aksesuar?sub=gunes-gozlugu" },
        ],
      },
    ],
  },
  {
    label: "Makyaj Malzemesi",
    href: "/makyaj-malzemesi",
    columns: [
      {
        title: "Makyaj",
        items: [
          { label: "Yüz", href: "/makyaj-malzemesi?sub=yuz" },
          { label: "Göz", href: "/makyaj-malzemesi?sub=goz" },
          { label: "Dudak", href: "/makyaj-malzemesi?sub=dudak" },
        ],
      },
    ],
  },
  {
    label: "İç Çamaşırı",
    href: "/ic-camasiri",
    columns: [
      {
        title: "İç Çamaşırı",
        items: [
          { label: "Sütyen", href: "/ic-camasiri?sub=sutyen" },
          { label: "Külot", href: "/ic-camasiri?sub=kulot" },
          { label: "Gecelik", href: "/ic-camasiri?sub=gecelik" },
        ],
      },
    ],
  },
  {
    label: "Çocuk",
    href: "/cocuk",
    columns: [
      {
        title: "Çocuk",
        items: [
          { label: "Kız Çocuk", href: "/cocuk?sub=kiz-cocuk" },
          { label: "Erkek Çocuk", href: "/cocuk?sub=erkek-cocuk" },
          { label: "Bebek Giyim", href: "/cocuk?sub=bebek-giyim" },
        ],
      },
    ],
  },
] as const;

export function hasGenderFilter(category?: string, subcategory?: string): boolean {
  if (!category && !subcategory) return false;

  const disallowedCategories = ["elbise", "makyaj", "makyaj-malzemesi", "cocuk"];
  const disallowedSubcategories = [
    "midi-elbise",
    "maxi-elbise",
    "mini-elbise",
    "gunluk-elbise",
    "abiye",
    "abiye-davet",
    "midi",
    "maxi",
    "mini",
    "gunluk",
    "yuz",
    "goz",
    "dudak",
    "kiz-cocuk",
    "erkek-cocuk",
    "bebek-giyim",
  ];

  if (category && disallowedCategories.includes(category.toLowerCase())) {
    return false;
  }

  if (
    subcategory &&
    (disallowedCategories.includes(subcategory.toLowerCase()) ||
      disallowedSubcategories.includes(subcategory.toLowerCase()))
  ) {
    return false;
  }

  return true;
}

export const footerLinks = {
  magaza: [
    { label: "Ana Sayfa", href: "/" },
    { label: "Giyim", href: "/giyim" },
    { label: "Elbise", href: "/elbise" },
    { label: "Üst Giyim", href: "/ust-giyim" },
    { label: "Alt Giyim", href: "/alt-giyim" },
    { label: "Makyaj Malzemesi", href: "/makyaj-malzemesi" },
    { label: "İç Çamaşırı", href: "/ic-camasiri" },
    { label: "Çocuk", href: "/cocuk" },
  ],
  musteriHizmetleri: [
    { label: "Kargo ve Teslimat", href: "/kargo-teslimat" },
    { label: "Beden Rehberi", href: "/beden-rehberi" },
    { label: "İletişim", href: "/iletisim" },
  ],
  hakkimizda: [
    { label: "Bize Ulaşın", href: "/iletisim" },
  ],
} as const;
