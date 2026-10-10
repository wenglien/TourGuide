import type { PreferenceCategory } from '../types';

export interface PopularPlace {
    id: string;
    name: [zh: string, en: string];
    /** Used only when the user hasn't picked any interests yet. */
    interests: PreferenceCategory[];
}

/** Places people most often start a day out from; tapping one fills the destination. */
export const POPULAR_PLACES: PopularPlace[] = [
    { id: 'dadaocheng', name: ['大稻埕', 'Dadaocheng'], interests: ['culture', 'food'] },
    { id: 'jiufen', name: ['九份老街', 'Jiufen Old Street'], interests: ['photography', 'food'] },
    { id: 'tainan', name: ['台南中西區', 'West Central Tainan'], interests: ['food', 'culture'] },
    { id: 'pier2', name: ['駁二藝術特區', 'Pier-2 Art Center'], interests: ['exhibition', 'photography'] },
    { id: 'shenji', name: ['審計新村', 'Shenji New Village'], interests: ['shopping', 'food'] },
    { id: 'tamsui', name: ['淡水老街', 'Tamsui Old Street'], interests: ['walking', 'food'] },
    { id: 'ximen', name: ['西門町', 'Ximending'], interests: ['shopping', 'nightlife'] },
    { id: 'xiangshan', name: ['象山步道', 'Elephant Mountain'], interests: ['walking', 'photography'] },
];
