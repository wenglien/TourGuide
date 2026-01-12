// Pre-defined Itinerary Templates
import type { UserPreferences, PreferenceCategory } from '../types';

export interface ItineraryTemplate {
    id: string;
    title: string;
    description: string;
    city: string;
    duration: number; // days
    categories: PreferenceCategory[];
    pace: 'relaxed' | 'moderate' | 'packed';
    maxWalkingLevel: 'low' | 'medium' | 'high';
    proximity: 'close' | 'far';
    theme: string;
    tags: string[];
    estimatedBudget: { min: number; max: number };
    bestSeasons: string[];
    icon: string;
    popularity: number; // 0-100
}

export const itineraryTemplates: ItineraryTemplate[] = [
    {
        id: 'taipei-foodie',
        title: '台北美食之旅',
        description: '探索台北最受歡迎的美食景點，從傳統小吃到米其林餐廳，體驗台北的飲食文化',
        city: '台北',
        duration: 2,
        categories: ['food', 'culture'],
        pace: 'moderate',
        maxWalkingLevel: 'medium',
        proximity: 'close',
        theme: '美食探索',
        tags: ['美食', '小吃', '夜市', '餐廳'],
        estimatedBudget: { min: 2000, max: 5000 },
        bestSeasons: ['spring', 'summer', 'autumn', 'winter'],
        icon: '',
        popularity: 95,
    },
    {
        id: 'taipei-culture',
        title: '台北文化深度遊',
        description: '走訪台北的歷史古蹟、博物館和文創園區，深入了解台北的文化底蘊',
        city: '台北',
        duration: 3,
        categories: ['culture', 'exhibition', 'walking'],
        pace: 'relaxed',
        maxWalkingLevel: 'medium',
        proximity: 'close',
        theme: '文化探索',
        tags: ['博物館', '古蹟', '文創', '歷史'],
        estimatedBudget: { min: 1500, max: 4000 },
        bestSeasons: ['spring', 'autumn'],
        icon: '',
        popularity: 85,
    },
    {
        id: 'taipei-nightlife',
        title: '台北夜生活體驗',
        description: '體驗台北豐富的夜生活，從夜市到酒吧，感受不夜城的魅力',
        city: '台北',
        duration: 1,
        categories: ['nightlife', 'food'],
        pace: 'moderate',
        maxWalkingLevel: 'low',
        proximity: 'close',
        theme: '夜生活',
        tags: ['夜市', '酒吧', '夜店', '宵夜'],
        estimatedBudget: { min: 1500, max: 3500 },
        bestSeasons: ['spring', 'summer', 'autumn'],
        icon: '',
        popularity: 80,
    },
    {
        id: 'taipei-shopping',
        title: '台北購物天堂',
        description: '逛遍台北最熱門的購物區，從百貨公司到特色小店，滿足購物慾望',
        city: '台北',
        duration: 2,
        categories: ['shopping', 'food'],
        pace: 'moderate',
        maxWalkingLevel: 'low',
        proximity: 'close',
        theme: '購物',
        tags: ['購物', '百貨', '商圈', '特色店'],
        estimatedBudget: { min: 3000, max: 10000 },
        bestSeasons: ['spring', 'summer', 'autumn', 'winter'],
        icon: '',
        popularity: 90,
    },
    {
        id: 'taipei-nature',
        title: '台北自然步道',
        description: '親近大自然，走訪台北周邊的步道和公園，享受清新的空氣和美景',
        city: '台北',
        duration: 1,
        categories: ['walking', 'photography'],
        pace: 'moderate',
        maxWalkingLevel: 'high',
        proximity: 'far',
        theme: '自然步道',
        tags: ['步道', '公園', '自然', '健行'],
        estimatedBudget: { min: 500, max: 1500 },
        bestSeasons: ['spring', 'autumn'],
        icon: '',
        popularity: 75,
    },
    {
        id: 'taipei-photography',
        title: '台北攝影之旅',
        description: '捕捉台北最美的風景，從城市天際線到傳統建築，記錄台北的多元面貌',
        city: '台北',
        duration: 2,
        categories: ['photography', 'culture', 'walking'],
        pace: 'moderate',
        maxWalkingLevel: 'medium',
        proximity: 'close',
        theme: '攝影',
        tags: ['攝影', '景點', '夜景', '建築'],
        estimatedBudget: { min: 1000, max: 3000 },
        bestSeasons: ['spring', 'autumn', 'winter'],
        icon: '',
        popularity: 70,
    },
    {
        id: 'kaohsiung-coastal',
        title: '高雄海岸風光',
        description: '探索高雄的海岸線，從駁二藝術特區到西子灣，感受港都的獨特魅力',
        city: '高雄',
        duration: 2,
        categories: ['culture', 'walking', 'photography'],
        pace: 'relaxed',
        maxWalkingLevel: 'medium',
        proximity: 'close',
        theme: '海岸風光',
        tags: ['海岸', '藝術', '港口', '夕陽'],
        estimatedBudget: { min: 2000, max: 4500 },
        bestSeasons: ['spring', 'autumn', 'winter'],
        icon: '',
        popularity: 80,
    },
    {
        id: 'tainan-historical',
        title: '台南古都巡禮',
        description: '走訪台南的歷史古蹟和傳統小吃，體驗台灣最古老城市的文化底蘊',
        city: '台南',
        duration: 2,
        categories: ['culture', 'food', 'walking'],
        pace: 'relaxed',
        maxWalkingLevel: 'medium',
        proximity: 'close',
        theme: '古都文化',
        tags: ['古蹟', '小吃', '歷史', '傳統'],
        estimatedBudget: { min: 1500, max: 3500 },
        bestSeasons: ['spring', 'autumn', 'winter'],
        icon: '',
        popularity: 88,
    },
    {
        id: 'taichung-modern',
        title: '台中現代文青',
        description: '探索台中的文創園區、特色咖啡廳和現代建築，感受台中的文青氛圍',
        city: '台中',
        duration: 2,
        categories: ['culture', 'food', 'exhibition'],
        pace: 'moderate',
        maxWalkingLevel: 'low',
        proximity: 'close',
        theme: '文青之旅',
        tags: ['文創', '咖啡', '藝術', '現代'],
        estimatedBudget: { min: 2000, max: 5000 },
        bestSeasons: ['spring', 'summer', 'autumn'],
        icon: '',
        popularity: 82,
    },
    {
        id: 'hualien-nature',
        title: '花蓮山海之旅',
        description: '親近花蓮的山海美景，從太魯閣到七星潭，體驗東台灣的自然風光',
        city: '花蓮',
        duration: 3,
        categories: ['walking', 'photography', 'culture'],
        pace: 'moderate',
        maxWalkingLevel: 'high',
        proximity: 'far',
        theme: '山海自然',
        tags: ['自然', '山景', '海景', '健行'],
        estimatedBudget: { min: 3000, max: 6000 },
        bestSeasons: ['spring', 'autumn'],
        icon: '',
        popularity: 78,
    },
];

/**
 * Get templates by city
 */
export function getTemplatesByCity(city: string): ItineraryTemplate[] {
    return itineraryTemplates.filter(t => t.city === city);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: PreferenceCategory): ItineraryTemplate[] {
    return itineraryTemplates.filter(t => t.categories.includes(category));
}

/**
 * Get popular templates
 */
export function getPopularTemplates(limit: number = 5): ItineraryTemplate[] {
    return [...itineraryTemplates]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit);
}

/**
 * Get templates matching preferences
 */
export function getMatchingTemplates(preferences: Partial<UserPreferences>): ItineraryTemplate[] {
    return itineraryTemplates.filter(template => {
        if (preferences.city && template.city !== preferences.city) {
            return false;
        }
        if (preferences.categories && preferences.categories.length > 0) {
            const hasMatchingCategory = preferences.categories.some(cat =>
                template.categories.includes(cat)
            );
            if (!hasMatchingCategory) return false;
        }
        if (preferences.pace && template.pace !== preferences.pace) {
            return false;
        }
        if (preferences.maxWalkingLevel && template.maxWalkingLevel !== preferences.maxWalkingLevel) {
            return false;
        }
        return true;
    }).sort((a, b) => b.popularity - a.popularity);
}

/**
 * Convert template to UserPreferences
 */
export function templateToPreferences(template: ItineraryTemplate): UserPreferences {
    return {
        city: template.city,
        date: new Date().toISOString().split('T')[0],
        categories: template.categories,
        pace: template.pace,
        maxWalkingLevel: template.maxWalkingLevel,
        proximity: template.proximity,
    };
}
