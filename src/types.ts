export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface HijriDate {
  date: string;
  format: string;
  day: string;
  weekday: {
    en: string;
    ar?: string;
  };
  month: {
    number: number;
    en: string;
    ar?: string;
  };
  year: string;
  designation: {
    abbreviated: string;
  };
}

export interface GregorianDate {
  date: string;
  format: string;
  day: string;
  weekday: {
    en: string;
  };
  month: {
    number: number;
    en: string;
  };
  year: string;
}

export interface PrayerData {
  times: PrayerTimes;
  gregorian: GregorianDate;
  hijri: HijriDate;
  location: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
  juz: number;
}

export interface Dua {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  transliteration?: string;
  reference: string;
  category: string;
}

export type BookmarkType = 'verse' | 'dua';

export interface Bookmark {
  id: string;
  type: BookmarkType;
  title: string;
  arabic?: string;
  translation: string;
  reference: string;
  dateAdded: string;
}
