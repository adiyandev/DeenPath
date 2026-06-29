import { Surah, Ayah } from '../types';

const OFFLINE_PREFIX = 'deenpath_offline_surah_';

export async function saveSurahOffline(surahNumber: number, data: { surah: Surah; ayahs: Ayah[] }): Promise<boolean> {
  try {
    const key = `${OFFLINE_PREFIX}${surahNumber}`;
    window.localStorage.setItem(key, JSON.stringify(data));
    
    // Update list of downloaded surahs
    const downloadedIds = getDownloadedSurahIds();
    if (!downloadedIds.includes(surahNumber)) {
      window.localStorage.setItem('deenpath_offline_list', JSON.stringify([...downloadedIds, surahNumber]));
    }
    
    // Also save the offline list to fire an event for other tabs or the widget to update
    window.dispatchEvent(new Event('offline-storage-updated'));
    
    return true;
  } catch (error) {
    console.error('Failed to save Surah offline (may have exceeded quota)', error);
    return false;
  }
}

export function removeSurahOffline(surahNumber: number): void {
  try {
    const key = `${OFFLINE_PREFIX}${surahNumber}`;
    window.localStorage.removeItem(key);
    
    let downloadedIds = getDownloadedSurahIds();
    downloadedIds = downloadedIds.filter(id => id !== surahNumber);
    window.localStorage.setItem('deenpath_offline_list', JSON.stringify(downloadedIds));
    
    window.dispatchEvent(new Event('offline-storage-updated'));
  } catch (error) {
    console.error('Failed to remove offline surah', error);
  }
}

export function getDownloadedSurahIds(): number[] {
  try {
    const ids = window.localStorage.getItem('deenpath_offline_list');
    return ids ? JSON.parse(ids) : [];
  } catch {
    return [];
  }
}

export function getOfflineSurah(surahNumber: number): { surah: Surah; ayahs: Ayah[] } | null {
  try {
    const key = `${OFFLINE_PREFIX}${surahNumber}`;
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
