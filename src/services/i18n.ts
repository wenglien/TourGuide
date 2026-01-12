// Internationalization (i18n) Service - Complete Translation System
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'zh-TW' | 'en';

interface Translations {
    [key: string]: {
        'zh-TW': string;
        'en': string;
    };
}

const translations: Translations = {
    // ==================== Navigation ====================
    'nav.home': { 'zh-TW': '首頁', 'en': 'Home' },
    'nav.route': { 'zh-TW': 'AI路線', 'en': 'AI Route' },
    'nav.generator': { 'zh-TW': '規劃', 'en': 'Plan' },
    'nav.profile': { 'zh-TW': '個人', 'en': 'Profile' },
    'nav.login': { 'zh-TW': '登入', 'en': 'Login' },
    'nav.logout': { 'zh-TW': '登出', 'en': 'Logout' },
    'nav.back': { 'zh-TW': '返回', 'en': 'Back' },

    // ==================== Homepage ====================
    'home.eyebrow': { 'zh-TW': 'AI 智慧行程規劃', 'en': 'AI Smart Itinerary Planning' },
    'home.title': { 'zh-TW': '探索城市的', 'en': 'Explore Cities' },
    'home.title.highlight': { 'zh-TW': '另一種方式', 'en': 'in a Different Way' },
    'home.subtitle': { 'zh-TW': '策展式主題路線，帶你深入在地文化，發現旅行的無限可能', 'en': 'Curated themed routes that take you deep into local culture and discover infinite travel possibilities' },
    'home.create': { 'zh-TW': '打造我的行程', 'en': 'Create My Itinerary' },
    'home.route': { 'zh-TW': 'AI 路線規劃', 'en': 'AI Route Planning' },
    'home.feature1.title': { 'zh-TW': '主題策展', 'en': 'Themed Curation' },
    'home.feature1.desc': { 'zh-TW': '不只是排行榜，而是精心策劃的體驗路線', 'en': 'Not just rankings, but carefully curated experience routes' },
    'home.feature2.title': { 'zh-TW': '時段考量', 'en': 'Time Consideration' },
    'home.feature2.desc': { 'zh-TW': '早晚不同風貌，雨天也有備案', 'en': 'Different vibes for day and night, rain backup included' },
    'home.feature3.title': { 'zh-TW': '可執行性', 'en': 'Practicality' },
    'home.feature3.desc': { 'zh-TW': '考慮交通、步行量，實際可行', 'en': 'Considering transportation and walking distance' },
    'home.featured': { 'zh-TW': '精選路線', 'en': 'Featured Routes' },
    'home.explore': { 'zh-TW': '探索 AI 路線', 'en': 'Explore AI Routes' },
    'home.cta.title': { 'zh-TW': '讓我們幫你規劃', 'en': 'Let Us Plan For You' },
    'home.cta.desc': { 'zh-TW': '告訴我們你的偏好，AI 自動推薦最適合的行程', 'en': 'Tell us your preferences, AI will recommend the best itinerary' },
    'home.cta.button': { 'zh-TW': '開始規劃', 'en': 'Start Planning' },

    // ==================== Itinerary Generator ====================
    'generator.subtitle': { 'zh-TW': '告訴我們你的偏好，我們幫你規劃一天', 'en': 'Tell us your preferences, we\'ll plan your day' },
    'generator.step1': { 'zh-TW': '偏好設定', 'en': 'Preferences' },
    'generator.step2': { 'zh-TW': '建構中', 'en': 'Building' },
    'generator.step3': { 'zh-TW': '行程結果', 'en': 'Results' },
    'generator.personalized': { 'zh-TW': '個人化推薦', 'en': 'Personalized Recommendation' },
    'generator.apply': { 'zh-TW': '套用推薦', 'en': 'Apply Recommendation' },
    'generator.template': { 'zh-TW': '行程範本', 'en': 'Itinerary Templates' },
    'generator.showTemplate': { 'zh-TW': '查看範本', 'en': 'View Templates' },
    'generator.hideTemplate': { 'zh-TW': '隱藏範本', 'en': 'Hide Templates' },
    'generator.destination': { 'zh-TW': '旅遊目的地', 'en': 'Destination' },
    'generator.destination.placeholder': { 'zh-TW': '輸入地址或地點名稱...', 'en': 'Enter address or place name...' },
    'generator.nearby': { 'zh-TW': '附近熱門景點', 'en': 'Nearby Popular Attractions' },
    'generator.duration': { 'zh-TW': '行程天數', 'en': 'Trip Duration' },
    'generator.date': { 'zh-TW': '出發日期', 'en': 'Departure Date' },
    'generator.categories': { 'zh-TW': '你想要什麼樣的旅程？（可複選）', 'en': 'What kind of journey do you want? (Multiple selection)' },
    'generator.pace': { 'zh-TW': '旅程步調', 'en': 'Travel Pace' },
    'generator.walking': { 'zh-TW': '步行量偏好', 'en': 'Walking Preference' },
    'generator.proximity': { 'zh-TW': '景點距離偏好', 'en': 'Distance Preference' },
    'generator.ai.enable': { 'zh-TW': 'AI 智能規劃', 'en': 'AI Smart Planning' },
    'generator.rain.mode': { 'zh-TW': '雨天模式', 'en': 'Rainy Day Mode' },
    'generator.generate': { 'zh-TW': '生成行程', 'en': 'Generate Itinerary' },
    'generator.loading': { 'zh-TW': '正在為您規劃行程...', 'en': 'Planning your itinerary...' },
    'generator.loading.tips': { 'zh-TW': '正在搜尋最佳景點組合...', 'en': 'Searching for the best attraction combinations...' },
    'generator.error.destination': { 'zh-TW': '請輸入旅遊目的地', 'en': 'Please enter a destination' },
    'generator.error.categories': { 'zh-TW': '請至少選擇一個興趣類別', 'en': 'Please select at least one category' },
    'generator.result.title': { 'zh-TW': '您的專屬行程', 'en': 'Your Custom Itinerary' },
    'generator.day': { 'zh-TW': '第 {n} 天', 'en': 'Day {n}' },
    'generator.regenerate.day': { 'zh-TW': '重新生成', 'en': 'Regenerate' },
    'generator.companion': { 'zh-TW': '同行模式', 'en': 'Companion Mode' },
    'generator.companion.start': { 'zh-TW': '開啟同行模式', 'en': 'Start Companion Mode' },
    'generator.companion.stop': { 'zh-TW': '關閉同行模式', 'en': 'Stop Companion Mode' },
    'generator.save': { 'zh-TW': '收藏行程', 'en': 'Save Itinerary' },
    'generator.saving': { 'zh-TW': '儲存中...', 'en': 'Saving...' },
    'generator.share': { 'zh-TW': '分享行程', 'en': 'Share Itinerary' },
    'generator.export.pdf': { 'zh-TW': '匯出 PDF', 'en': 'Export PDF' },
    'generator.export.calendar': { 'zh-TW': '加入 Google 日曆', 'en': 'Add to Google Calendar' },
    'generator.new': { 'zh-TW': '新行程', 'en': 'New Itinerary' },
    'generator.back': { 'zh-TW': '返回設定', 'en': 'Back to Settings' },
    'generator.slots.more': { 'zh-TW': '更多操作', 'en': 'More Actions' },
    'generator.regenerate.slot': { 'zh-TW': '重新生成此時段', 'en': 'Regenerate This Slot' },
    'generator.regenerating': { 'zh-TW': '重新生成中...', 'en': 'Regenerating...' },
    'generator.error.update': { 'zh-TW': '更新行程時發生錯誤', 'en': 'Error updating itinerary' },
    'generator.error.suggestionAction': { 'zh-TW': '執行建議時發生錯誤', 'en': 'Error executing suggestion' },
    'generator.optimizing': { 'zh-TW': '正在為您優化行程...', 'en': 'Optimizing your itinerary...' },
    'generator.rain.suggestion': { 'zh-TW': '偵測到 {date} {city} 可能會下雨 ({desc})，建議開啟「雨天模式」以獲得最佳室內行程推薦。是否切換？', 'en': 'Rain detected in {city} on {date} ({desc}). Suggest enabling "Rainy Mode" for indoor recommendations. Switch now?' },
    'generator.success.message': { 'zh-TW': '生成了位於 {city} 的 {days} 天 AI 智能行程', 'en': 'Generated {days}-day AI itinerary for {city}' },
    'generator.error.generic': { 'zh-TW': '生成行程時發生錯誤', 'en': 'Error generating itinerary' },
    'generator.error.regenerate': { 'zh-TW': '重新生成行程時發生錯誤', 'en': 'Error regenerating itinerary' },
    'generator.error.minSpots': { 'zh-TW': '每個時段至少需要保留一個景點', 'en': 'Each slot must have at least one spot' },
    'generator.confirm.remove': { 'zh-TW': '確定要移除這個景點嗎？', 'en': 'Are you sure you want to remove this spot?' },
    'generator.error.replace': { 'zh-TW': '更換地點時發生錯誤', 'en': 'Error replacing place' },
    'generator.save.success.message': { 'zh-TW': '收藏了位於 {city} 的行程 ({date})', 'en': 'Saved itinerary for {city} ({date})' },
    'generator.save.success': { 'zh-TW': '行程已成功收藏！', 'en': 'Itinerary saved successfully!' },
    'generator.save.failed': { 'zh-TW': '收藏失敗：{error}', 'en': 'Save failed: {error}' },
    'generator.spots.title': { 'zh-TW': '行程景點', 'en': 'Itinerary Spots' },
    'generator.spots.dragHint': { 'zh-TW': '拖曳調整順序', 'en': 'Drag to reorder' },
    'generator.spots.empty': { 'zh-TW': '尚未添加任何景點', 'en': 'No spots added yet' },

    // ==================== Time Slots ====================
    'slot.morning': { 'zh-TW': '上午', 'en': 'Morning' },
    'slot.afternoon': { 'zh-TW': '下午', 'en': 'Afternoon' },
    'slot.evening': { 'zh-TW': '傍晚', 'en': 'Evening' },
    'slot.night': { 'zh-TW': '晚上', 'en': 'Night' },

    // ==================== Duration ====================
    'duration.1': { 'zh-TW': '1 天', 'en': '1 Day' },
    'duration.1.desc': { 'zh-TW': '輕鬆一日遊', 'en': 'Easy Day Trip' },
    'duration.2': { 'zh-TW': '2 天', 'en': '2 Days' },
    'duration.2.desc': { 'zh-TW': '週末小旅行', 'en': 'Weekend Getaway' },
    'duration.3': { 'zh-TW': '3 天', 'en': '3 Days' },
    'duration.3.desc': { 'zh-TW': '深度探索', 'en': 'Deep Exploration' },
    'duration.4': { 'zh-TW': '4 天', 'en': '4 Days' },
    'duration.4.desc': { 'zh-TW': '悠閒假期', 'en': 'Relaxed Vacation' },
    'duration.5': { 'zh-TW': '5 天', 'en': '5 Days' },
    'duration.5.desc': { 'zh-TW': '完整體驗', 'en': 'Full Experience' },
    'duration.7': { 'zh-TW': '7 天', 'en': '7 Days' },
    'duration.7.desc': { 'zh-TW': '深度長假', 'en': 'Extended Vacation' },

    // ==================== Categories ====================
    'category.food': { 'zh-TW': '美食', 'en': 'Food' },
    'category.walking': { 'zh-TW': '散步', 'en': 'Walking' },
    'category.exhibition': { 'zh-TW': '展覽', 'en': 'Exhibition' },
    'category.photography': { 'zh-TW': '攝影', 'en': 'Photography' },
    'category.nightlife': { 'zh-TW': '夜生活', 'en': 'Nightlife' },
    'category.shopping': { 'zh-TW': '購物', 'en': 'Shopping' },
    'category.culture': { 'zh-TW': '文化', 'en': 'Culture' },

    // ==================== Pace ====================
    'pace.relaxed': { 'zh-TW': '悠閒', 'en': 'Relaxed' },
    'pace.relaxed.desc': { 'zh-TW': '每天 1-2 個行程，慢慢享受', 'en': '1-2 activities per day, slow enjoyment' },
    'pace.moderate': { 'zh-TW': '中等', 'en': 'Moderate' },
    'pace.moderate.desc': { 'zh-TW': '每天 2-3 個行程，輕鬆充實', 'en': '2-3 activities per day, relaxed and fulfilling' },
    'pace.packed': { 'zh-TW': '緊湊', 'en': 'Packed' },
    'pace.packed.desc': { 'zh-TW': '每天 3-4 個行程，玩好玩滿', 'en': '3-4 activities per day, maximize fun' },

    // ==================== Walking Level ====================
    'walking.low': { 'zh-TW': '少走路', 'en': 'Less Walking' },
    'walking.medium': { 'zh-TW': '適中', 'en': 'Moderate' },
    'walking.high': { 'zh-TW': '願意多走', 'en': 'More Walking' },

    // ==================== Proximity ====================
    'proximity.close': { 'zh-TW': '近距離', 'en': 'Close Distance' },
    'proximity.close.desc': { 'zh-TW': '景點集中在目的地附近', 'en': 'Attractions near the destination' },
    'proximity.far': { 'zh-TW': '遠距離', 'en': 'Far Distance' },
    'proximity.far.desc': { 'zh-TW': '可以接受前往較遠的特色景點', 'en': 'Accept traveling to distant attractions' },

    // ==================== Place Details ====================
    'place.rating': { 'zh-TW': '評分', 'en': 'Rating' },
    'place.reviews': { 'zh-TW': '則評論', 'en': 'reviews' },
    'place.address': { 'zh-TW': '地址', 'en': 'Address' },
    'place.openNow': { 'zh-TW': '營業中', 'en': 'Open Now' },
    'place.closed': { 'zh-TW': '已打烊', 'en': 'Closed' },
    'place.priceLevel': { 'zh-TW': '價格等級', 'en': 'Price Level' },
    'place.crowdLevel': { 'zh-TW': '即時人潮資訊', 'en': 'Real-time Crowd Info' },
    'place.crowdLevel.current': { 'zh-TW': '目前人潮', 'en': 'Current Crowds' },
    'place.crowdLevel.extremely_busy': { 'zh-TW': '極度擁擠', 'en': 'Extremely Busy' },
    'place.crowdLevel.very_busy': { 'zh-TW': '非常擁擠', 'en': 'Very Busy' },
    'place.crowdLevel.moderately_busy': { 'zh-TW': '適中', 'en': 'Moderate' },
    'place.crowdLevel.a_little_busy': { 'zh-TW': '較少', 'en': 'A Little Busy' },
    'place.crowdLevel.low': { 'zh-TW': '不擁擠', 'en': 'Not Crowded' },
    'place.crowdLevel.medium': { 'zh-TW': '稍微擁擠', 'en': 'Slightly Crowded' },
    'place.crowdLevel.high': { 'zh-TW': '擁擠', 'en': 'Crowded' },
    'place.waitTime': { 'zh-TW': '預計等待', 'en': 'Estimated Wait' },
    'place.replace': { 'zh-TW': '更換', 'en': 'Replace' },
    'place.replacing': { 'zh-TW': '更換中...', 'en': 'Replacing...' },
    'place.remove': { 'zh-TW': '移除', 'en': 'Remove' },
    'place.navigate': { 'zh-TW': '導航', 'en': 'Navigate' },
    'place.book': { 'zh-TW': '立即預約', 'en': 'Book Now' },
    'place.checkin': { 'zh-TW': '打卡', 'en': 'Check In' },
    'place.reviews.title': { 'zh-TW': '評論', 'en': 'Reviews' },
    'place.viewOnGoogleMaps': { 'zh-TW': '查看 Google Maps', 'en': 'View on Google Maps' },
    'place.navigate.start': { 'zh-TW': '開始導航', 'en': 'Start Navigation' },
    'place.budget.title': { 'zh-TW': '預算神算手建議', 'en': 'Budget Tips' },
    'place.budget.todayOffer': { 'zh-TW': '今日優惠', 'en': 'Today\'s Offer' },
    'place.budget.couponCode': { 'zh-TW': '代碼', 'en': 'Code' },
    'place.budget.bookNow': { 'zh-TW': '立即預約 / 查看優惠票價', 'en': 'Book Now / View Offers' },
    'place.transport.compare': { 'zh-TW': '交通方式比較', 'en': 'Transport Comparison' },
    'place.transport.uber': { 'zh-TW': 'Uber', 'en': 'Uber' },
    'place.transport.public': { 'zh-TW': '大眾運輸', 'en': 'Public Transit' },
    'place.transport.walking': { 'zh-TW': '步行', 'en': 'Walking' },
    'place.transport.free': { 'zh-TW': '免費', 'en': 'Free' },
    'place.transport.callUber': { 'zh-TW': '一鍵叫車', 'en': 'Call Uber' },
    'place.crowdLevel.peak': { 'zh-TW': '尖峰時段', 'en': 'Peak Hours' },

    // ==================== Transport ====================
    'transport.title': { 'zh-TW': '交通方式', 'en': 'Transportation' },
    'transport.walking': { 'zh-TW': '步行', 'en': 'Walking' },
    'transport.driving': { 'zh-TW': '開車', 'en': 'Driving' },
    'transport.transit': { 'zh-TW': '大眾運輸', 'en': 'Transit' },
    'transport.minutes': { 'zh-TW': '分鐘', 'en': 'min' },

    // ==================== Map ====================
    'map.error.service': { 'zh-TW': '無法載入地圖服務，請直接輸入地址', 'en': 'Could not load map service, please enter address directly' },
    'map.error.load': { 'zh-TW': 'Google Maps API 載入失敗，請直接輸入地址', 'en': 'Google Maps API failed to load, please enter address directly' },
    'map.noResults': { 'zh-TW': '找不到相關地點', 'en': 'No results found' },
    'map.loading': { 'zh-TW': '載入地圖服務中...', 'en': 'Loading map services...' },
    'map.loading.map': { 'zh-TW': '載入地圖中...', 'en': 'Loading map...' },
    'map.distance': { 'zh-TW': '距離', 'en': 'Distance' },
    'map.time': { 'zh-TW': '時間', 'en': 'Time' },
    'map.spots': { 'zh-TW': '地點', 'en': 'Spots' },
    'map.start': { 'zh-TW': '起點', 'en': 'Start' },
    'map.waypoint': { 'zh-TW': '途經點', 'en': 'Waypoint' },
    'map.end': { 'zh-TW': '終點', 'en': 'End' },
    'map.destination': { 'zh-TW': '目的地', 'en': 'Destination' },
    'map.recommended': { 'zh-TW': '推薦景點', 'en': 'Recommended' },
    'map.viewDetails': { 'zh-TW': '點擊查看詳情', 'en': 'Click to view details' },
    'map.noData': { 'zh-TW': '尚無地點資料', 'en': 'No location data' },
    'map.morePlaces': { 'zh-TW': '+{n} 更多地點', 'en': '+{n} more places' },
    'checkin.title': { 'zh-TW': '景點打卡', 'en': 'Check In' },
    'checkin.place': { 'zh-TW': '地點', 'en': 'Place' },
    'checkin.note': { 'zh-TW': '備註', 'en': 'Note' },
    'checkin.note.placeholder': { 'zh-TW': '分享此刻的心情...', 'en': 'Share your moment...' },
    'checkin.rating': { 'zh-TW': '評分', 'en': 'Rating' },
    'checkin.photo': { 'zh-TW': '上傳照片', 'en': 'Upload Photo' },
    'checkin.photo.change': { 'zh-TW': '更換照片', 'en': 'Change Photo' },
    'checkin.submit': { 'zh-TW': '完成打卡', 'en': 'Complete Check-in' },
    'checkin.submitting': { 'zh-TW': '打卡中...', 'en': 'Checking in...' },
    'checkin.success': { 'zh-TW': '打卡成功！', 'en': 'Check-in successful!' },
    'checkin.failed': { 'zh-TW': '打卡失敗，請稍後再試', 'en': 'Check-in failed, please try again' },
    'checkin.cancel': { 'zh-TW': '取消', 'en': 'Cancel' },

    // ==================== Profile ====================
    'profile.title': { 'zh-TW': '個人專區', 'en': 'Profile' },
    'profile.loading': { 'zh-TW': '正在準備您的專屬空間', 'en': 'Preparing your personal space' },
    'profile.level': { 'zh-TW': '等級', 'en': 'Level' },
    'profile.tag.explorer': { 'zh-TW': '城市探險家', 'en': 'City Explorer' },
    'profile.tag.foodie': { 'zh-TW': '美食愛好者', 'en': 'Foodie' },
    'profile.stats.itineraries': { 'zh-TW': '收藏行程', 'en': 'Saved Itineraries' },
    'profile.stats.cities': { 'zh-TW': '探索城市', 'en': 'Cities Explored' },
    'profile.stats.points': { 'zh-TW': '探險積分', 'en': 'Adventure Points' },
    'profile.search.placeholder': { 'zh-TW': '搜尋行程（城市、日期、類型...）', 'en': 'Search itineraries (city, date, type...)' },
    'profile.tab.itineraries': { 'zh-TW': '我的收藏', 'en': 'My Itineraries' },
    'profile.tab.checkins': { 'zh-TW': '旅行打卡', 'en': 'Check-ins' },
    'profile.tab.activity': { 'zh-TW': '最近活動', 'en': 'Recent Activity' },
    'profile.tab.achievements': { 'zh-TW': '成就', 'en': 'Achievements' },
    'profile.empty.itineraries': { 'zh-TW': '還沒有收藏的行程嗎？', 'en': 'No saved itineraries yet?' },
    'profile.empty.itineraries.cta': { 'zh-TW': '開始規劃第一個行程', 'en': 'Start Planning Your First Itinerary' },
    'profile.empty.checkins': { 'zh-TW': '還沒有打卡記錄', 'en': 'No check-ins yet' },
    'profile.empty.checkins.hint': { 'zh-TW': '在行程中的景點點擊「打卡」開始記錄旅行足跡！', 'en': 'Click "Check In" at attractions to start recording your travels!' },
    'profile.empty.activity': { 'zh-TW': '尚無活動紀錄', 'en': 'No activity yet' },
    'profile.itinerary.spots': { 'zh-TW': '景點', 'en': 'Spots' },
    'profile.itinerary.duration': { 'zh-TW': '行程', 'en': 'Duration' },
    'profile.itinerary.duration.half': { 'zh-TW': '半天', 'en': 'Half Day' },
    'profile.itinerary.duration.full': { 'zh-TW': '一日', 'en': 'Full Day' },
    'profile.itinerary.duration.deep': { 'zh-TW': '深度', 'en': 'In-depth' },
    'profile.itinerary.walking': { 'zh-TW': '步行', 'en': 'Walking' },
    'profile.itinerary.walking.low': { 'zh-TW': '輕鬆', 'en': 'Easy' },
    'profile.itinerary.walking.medium': { 'zh-TW': '適中', 'en': 'Moderate' },
    'profile.itinerary.walking.high': { 'zh-TW': '挑戰', 'en': 'Challenge' },
    'profile.itinerary.view': { 'zh-TW': '查看詳情', 'en': 'View Details' },
    'profile.itinerary.delete': { 'zh-TW': '刪除', 'en': 'Delete' },
    'profile.itinerary.delete.confirm': { 'zh-TW': '確定要刪除此行程嗎？', 'en': 'Are you sure you want to delete this itinerary?' },

    // ==================== Achievements ====================
    'achievement.firstPlan': { 'zh-TW': '初試啼聲', 'en': 'First Steps' },
    'achievement.firstPlan.desc': { 'zh-TW': '完成第一次行程規劃', 'en': 'Complete your first itinerary' },
    'achievement.photographer': { 'zh-TW': '快門殺手', 'en': 'Shutter Bug' },
    'achievement.photographer.desc': { 'zh-TW': '查看過專屬路線詳情', 'en': 'Viewed a route detail' },
    'achievement.planner': { 'zh-TW': '行程達人', 'en': 'Planning Pro' },
    'achievement.planner.desc': { 'zh-TW': '收藏超過 5 個行程', 'en': 'Saved more than 5 itineraries' },
    'achievement.traveler': { 'zh-TW': '環島之星', 'en': 'Island Hopper' },
    'achievement.traveler.desc': { 'zh-TW': '在 3 個不同的城市規劃行程', 'en': 'Planned itineraries in 3 different cities' },

    // ==================== Trail ====================
    'trail.notFound': { 'zh-TW': '找不到這條路線', 'en': 'Trail not found' },
    'trail.backToList': { 'zh-TW': '回到路線列表', 'en': 'Back to Trail List' },
    'trail.save': { 'zh-TW': '收藏', 'en': 'Save' },
    'trail.saved': { 'zh-TW': '已收藏', 'en': 'Saved' },

    // ==================== Notifications ====================
    'notification.dismiss': { 'zh-TW': '關閉', 'en': 'Dismiss' },
    'notification.apply': { 'zh-TW': '套用建議', 'en': 'Apply Suggestion' },

    // ==================== Export ====================
    'export.pdf.generating': { 'zh-TW': '正在生成 PDF...', 'en': 'Generating PDF...' },
    'export.pdf.failed': { 'zh-TW': 'PDF 導出失敗，請稍後再試', 'en': 'PDF export failed, please try again' },
    'export.calendar.title': { 'zh-TW': '選擇要加入日曆的行程', 'en': 'Select itinerary to add to calendar' },
    'export.calendar.count': { 'zh-TW': '共有 {n} 個時段，請選擇要加入 Google 日曆的行程：', 'en': '{n} time slots available, select which to add to Google Calendar:' },
    'export.calendar.addAll': { 'zh-TW': '全部加入', 'en': 'Add All' },
    'export.calendar.close': { 'zh-TW': '關閉', 'en': 'Close' },
    'export.calendar.noEvents': { 'zh-TW': '沒有可匯出的行程事件', 'en': 'No events to export' },
    'export.calendar.error': { 'zh-TW': '匯出到 Google 日曆時發生錯誤', 'en': 'Error exporting to Google Calendar' },


    // ==================== Weather ====================
    'weather.rainy': { 'zh-TW': '偵測到可能會下雨，建議開啟「雨天模式」', 'en': 'Rain detected, recommend enabling "Rainy Day Mode"' },
    'weather.switch': { 'zh-TW': '是否切換？', 'en': 'Would you like to switch?' },

    // ==================== Common ====================
    'common.loading': { 'zh-TW': '載入中...', 'en': 'Loading...' },
    'common.error': { 'zh-TW': '發生錯誤', 'en': 'An error occurred' },
    'common.success': { 'zh-TW': '成功', 'en': 'Success' },
    'common.cancel': { 'zh-TW': '取消', 'en': 'Cancel' },
    'common.confirm': { 'zh-TW': '確認', 'en': 'Confirm' },
    'common.delete': { 'zh-TW': '刪除', 'en': 'Delete' },
    'common.edit': { 'zh-TW': '編輯', 'en': 'Edit' },
    'common.done': { 'zh-TW': '完成', 'en': 'Done' },
    'common.update': { 'zh-TW': '更新', 'en': 'Update' },
    'common.save': { 'zh-TW': '儲存', 'en': 'Save' },
    'common.close': { 'zh-TW': '關閉', 'en': 'Close' },
    'common.next': { 'zh-TW': '下一步', 'en': 'Next' },
    'common.previous': { 'zh-TW': '上一步', 'en': 'Previous' },
    'common.yes': { 'zh-TW': '是', 'en': 'Yes' },
    'common.no': { 'zh-TW': '否', 'en': 'No' },
    'common.sunny': { 'zh-TW': '晴天模式', 'en': 'Sunny Mode' },
    'common.rainy': { 'zh-TW': '雨天模式', 'en': 'Rainy Mode' },
    'common.or': { 'zh-TW': '或', 'en': 'or' },
    'common.and': { 'zh-TW': '和', 'en': 'and' },
    'common.just.now': { 'zh-TW': '剛剛', 'en': 'Just now' },
    'common.unnamed': { 'zh-TW': '未命名行程', 'en': 'Unnamed Itinerary' },
    'common.unit.count': { 'zh-TW': '個', 'en': '' },
    'common.unit.places': { 'zh-TW': '個地點', 'en': 'places' },
    'common.unit.hours': { 'zh-TW': '小時', 'en': 'hours' },
    'common.unit.minutes': { 'zh-TW': '分鐘', 'en': 'minutes' },
    'common.unit.currency': { 'zh-TW': '元', 'en': 'TWD' },
    'common.error.imageSize': { 'zh-TW': '圖片大小不能超過 10MB', 'en': 'Image size cannot exceed 10MB' },
    'common.destination': { 'zh-TW': '目的地', 'en': 'Destination' },
    'common.more': { 'zh-TW': '更多功能', 'en': 'More Options' },
    'common.modifyPrefs': { 'zh-TW': '修改偏好', 'en': 'Modify Preferences' },
    'common.remove': { 'zh-TW': '移除', 'en': 'Remove' },
    'common.uploading': { 'zh-TW': '上傳中...', 'en': 'Uploading...' },
    'common.preview': { 'zh-TW': '預覽', 'en': 'Preview' },
    'common.error.imageOnly': { 'zh-TW': '請選擇圖片檔案', 'en': 'Please select an image file' },
    'common.ignore': { 'zh-TW': '忽略', 'en': 'Ignore' },

    // ==================== Generator Extended ====================
    'generator.selectDate': { 'zh-TW': '選擇日期與時間', 'en': 'Select Date & Time' },
    'generator.departureDate': { 'zh-TW': '出發日期', 'en': 'Departure Date' },
    'generator.singleDate': { 'zh-TW': '日期', 'en': 'Date' },
    'generator.startTime': { 'zh-TW': '開始時間', 'en': 'Start Time' },
    'generator.dateRange': { 'zh-TW': '行程期間', 'en': 'Trip Period' },
    'generator.summary.spots': { 'zh-TW': '景點', 'en': 'Spots' },
    'generator.summary.time': { 'zh-TW': '總時長', 'en': 'Total Time' },
    'generator.summary.budget': { 'zh-TW': '預算', 'en': 'Budget' },
    'generator.match': { 'zh-TW': '匹配度', 'en': 'Match' },
    'generator.enableCompanion': { 'zh-TW': '開啟人、車流檢測', 'en': 'Enable Crowd Detection' },
    'generator.budgetTracker': { 'zh-TW': '預算追蹤', 'en': 'Budget Tracker' },
    'generator.estimated': { 'zh-TW': '預估', 'en': 'Estimated' },
    'generator.saveToTrack': { 'zh-TW': '儲存行程後即可開始追蹤實際支出', 'en': 'Save itinerary to start tracking expenses' },
    'generator.routeMap': { 'zh-TW': '行程路線圖', 'en': 'Route Map' },
    'generator.transport.estimate': { 'zh-TW': 'Uber/大眾運輸車資估算', 'en': 'Uber/Transit fare estimate' },
    'generator.companion.active': { 'zh-TW': '檢測已開啟：正在監測即時天氣與人潮', 'en': 'Detection active: Monitoring real-time weather and crowds' },



    // ==================== Check-in Extended ====================
    'checkin.rating.label': { 'zh-TW': '評分', 'en': 'Rating' },
    'checkin.photo.optional': { 'zh-TW': '上傳照片（選填）', 'en': 'Upload Photo (Optional)' },
    'checkin.photo.select': { 'zh-TW': '點擊選擇照片', 'en': 'Click to select photo' },
    'checkin.photo.change.hint': { 'zh-TW': '點擊更換照片', 'en': 'Click to change photo' },
    'checkin.photo.remove': { 'zh-TW': '移除照片', 'en': 'Remove Photo' },
    'checkin.note.label': { 'zh-TW': '心得筆記（選填）', 'en': 'Notes (Optional)' },
    'checkin.note.placeholder2': { 'zh-TW': '記錄你的旅行感受...', 'en': 'Record your travel experience...' },
    'checkin.confirm': { 'zh-TW': '確認打卡', 'en': 'Confirm Check-in' },
    'checkin.at': { 'zh-TW': '打卡：', 'en': 'Check-in: ' },
    'checkin.photo.failed': { 'zh-TW': '照片上傳失敗，將繼續儲存打卡記錄（不含照片）', 'en': 'Photo upload failed. Continuing check-in without photo.' },
    'checkin.success.message': { 'zh-TW': '在「{name}」完成打卡！', 'en': 'Checked in at "{name}"!' },




    // ==================== Auth ====================
    'auth.loginFailed': { 'zh-TW': '登入失敗', 'en': 'Login failed' },
    'auth.popupBlocked': { 'zh-TW': '登入視窗被瀏覽器封鎖了，請允許彈出視窗後再試一次。', 'en': 'Login popup was blocked by your browser. Please allow popups and try again.' },
    'auth.loginRequired': { 'zh-TW': '請先登入', 'en': 'Please login first' },

    // ==================== Share ====================
    'share.title': { 'zh-TW': '之旅', 'en': 'Trip' },
    'share.text': { 'zh-TW': '來看看我的旅行行程！', 'en': 'Check out my travel itinerary!' },
    'share.copied': { 'zh-TW': '分享連結已複製到剪貼簿！', 'en': 'Share link copied to clipboard!' },
    'share.copyPrompt': { 'zh-TW': '請複製以下連結：', 'en': 'Please copy this link:' },
    'share.failed': { 'zh-TW': '分享失敗：', 'en': 'Sharing failed:' },
    'share.permissionDenied': { 'zh-TW': '權限不足，請確認您已登入', 'en': 'Permission denied, please confirm you are logged in' },
    'share.tooLarge': { 'zh-TW': '資料量過大，請嘗試減少行程景點', 'en': 'Data too large, please reduce itinerary spots' },
    'share.copy': { 'zh-TW': '複製路線', 'en': 'Copy Route' },

    // ==================== Route Planner ====================
    'route.planner.title': { 'zh-TW': '路線規劃', 'en': 'Route Planner' },
    'route.planner.whereToGo': { 'zh-TW': '你想去哪裡？', 'en': 'Where do you want to go?' },
    'route.planner.placeholder': { 'zh-TW': '輸入目的地（例如：大稻埕、淡水...）', 'en': 'Enter destination (e.g. Dadaocheng, Tamsui...)' },
    'route.planner.hint': { 'zh-TW': '輸入你想去的地方，AI 將為您規劃最佳路線', 'en': 'Enter where you want to go, AI will plan the best route for you' },
    'route.planner.next': { 'zh-TW': '下一步', 'en': 'Next' },
    'route.planner.destination': { 'zh-TW': '目的地', 'en': 'Destination' },
    'route.planner.modify': { 'zh-TW': '修改', 'en': 'Modify' },
    'route.planner.experience': { 'zh-TW': '你想體驗什麼？', 'en': 'What do you want to experience?' },
    'route.planner.time': { 'zh-TW': '你有多少時間？', 'en': 'How much time do you have?' },
    'route.planner.walking': { 'zh-TW': '步行量偏好', 'en': 'Walking Preference' },
    'route.planner.generating': { 'zh-TW': 'AI 分析中...', 'en': 'AI Analyzing...' },
    'route.planner.generate': { 'zh-TW': '生成路線', 'en': 'Generate Route' },
    'route.planner.replanning': { 'zh-TW': '重新規劃', 'en': 'Replan' },
    'route.planner.recommended': { 'zh-TW': '推薦行程', 'en': 'Recommended Itinerary' },
    'route.planner.stayTime': { 'zh-TW': '建議停留 {n} 分鐘', 'en': 'Suggested stay: {n} min' },
    'route.planner.spotsCount': { 'zh-TW': '地點數量', 'en': 'Spots Count' },
    'route.planner.walkingLevel': { 'zh-TW': '步行量', 'en': 'Walking Level' },
    'route.planner.budget': { 'zh-TW': '預估預算', 'en': 'Estimated Budget' },
    'route.planner.highlights': { 'zh-TW': '路線亮點', 'en': 'Route Highlights' },
    'route.planner.copy': { 'zh-TW': '複製路線', 'en': 'Copy Route' },
    'route.planner.copy.format': { 'zh-TW': '{n}. {name}\n   地址: {address}\n   停留: {time}分鐘', 'en': '{n}. {name}\n   Address: {address}\n   Stay: {time}min' },
    'route.planner.copied': { 'zh-TW': '路線已複製到剪貼板！', 'en': 'Route copied to clipboard!' },
    'route.planner.loading': { 'zh-TW': 'AI 正在分析「{city}」...', 'en': 'AI is analyzing "{city}"...' },
    'route.planner.loadingSub': { 'zh-TW': '根據您的偏好生成最佳路線', 'en': 'Generating the best route based on your preferences' },
    'route.planner.error.destination': { 'zh-TW': '請輸入目的地', 'en': 'Please enter a destination' },
    'route.planner.error.categories': { 'zh-TW': '請至少選擇一個興趣類別', 'en': 'Please select at least one category' },
    'route.planner.error.ai': { 'zh-TW': 'AI 無法生成有效的路線，請嘗試其他目的地', 'en': 'AI could not generate a valid route, please try another destination' },
    'route.planner.error.generic': { 'zh-TW': '生成路線時發生錯誤，請稍後再試', 'en': 'Error generating route, please try again later' },
    'route.planner.walking.low': { 'zh-TW': '輕鬆', 'en': 'Easy' },
    'route.planner.walking.medium': { 'zh-TW': '適中', 'en': 'Moderate' },
    'route.planner.walking.high': { 'zh-TW': '挑戰', 'en': 'Challenging' },

    // ==================== Template Selector ====================
    'template.title': { 'zh-TW': '行程範本', 'en': 'Itinerary Templates' },
    'template.subtitle': { 'zh-TW': '選擇一個熱門範本快速開始', 'en': 'Choose a popular template to start quickly' },
    'template.filter.popular': { 'zh-TW': '熱門推薦', 'en': 'Popular' },
    'template.filter.city': { 'zh-TW': '{city} 專屬', 'en': 'Exclusive to {city}' },
    'template.filter.matching': { 'zh-TW': '符合偏好', 'en': 'Matching Preferences' },
    'template.popularity': { 'zh-TW': '熱門度 {n}%', 'en': 'Popularity {n}%' },
    'template.empty': { 'zh-TW': '找不到符合條件的範本', 'en': 'No matching templates found' },
    'template.viewPopular': { 'zh-TW': '查看熱門範本', 'en': 'View Popular Templates' },

    // ==================== Public Itinerary ====================
    'public.title': { 'zh-TW': '行程', 'en': 'Itinerary' },
    'public.by': { 'zh-TW': '由', 'en': 'by' },
    'public.shared': { 'zh-TW': '分享', 'en': 'shared' },
    'public.notFound': { 'zh-TW': '找不到此行程', 'en': 'Itinerary not found' },
    'public.private': { 'zh-TW': '該行程為私人行程', 'en': 'This itinerary is private' },
    'public.createOwn': { 'zh-TW': '建立自己的行程', 'en': 'Create Your Own Itinerary' },
    'public.tripTitle': { 'zh-TW': '{city} 之旅', 'en': '{city} Trip' },
    'public.sharedBy': { 'zh-TW': '{date} • 由 {user} 分享', 'en': '{date} • Shared by {user}' },
    'public.user': { 'zh-TW': '使用者', 'en': 'User' },
    'public.guest': { 'zh-TW': '遊客', 'en': 'Guest' },
    'public.share': { 'zh-TW': '分享行程', 'en': 'Share Itinerary' },
    'public.copied': { 'zh-TW': '已複製連結！', 'en': 'Link copied!' },
    'public.mapTitle': { 'zh-TW': '行程路線圖', 'en': 'Itinerary Route Map' },
    'public.navigate': { 'zh-TW': '導航前往', 'en': 'Navigate' },
    'public.shareText': { 'zh-TW': '來看看我的 {city} 旅行行程！', 'en': 'Check out my trip to {city}!' },

    // ==================== Route Planner ====================
    'route.title': { 'zh-TW': 'AI 路線規劃', 'en': 'AI Route Planning' },
    'route.subtitle': { 'zh-TW': '輸入目的地，讓 AI 為你規劃最佳探索路線', 'en': 'Enter a destination and let AI plan the best exploration route for you' },
    'route.step.destination': { 'zh-TW': '目的地', 'en': 'Destination' },
    'route.step.preferences': { 'zh-TW': '偏好設定', 'en': 'Preferences' },
    'route.step.result': { 'zh-TW': '路線結果', 'en': 'Route Result' },
    'route.whereToGo': { 'zh-TW': '你想去哪裡？', 'en': 'Where do you want to go?' },
    'route.placeholder': { 'zh-TW': '輸入目的地，例如：台北信義區、東京淺草、首爾明洞...', 'en': 'Enter a destination, e.g., Taipei Xinyi, Tokyo Asakusa, Seoul Myeongdong...' },
    'route.hint': { 'zh-TW': '可以輸入城市名稱、區域名稱或知名地標', 'en': 'You can enter city name, district name, or famous landmark' },
    'route.next': { 'zh-TW': '下一步', 'en': 'Next' },
    'route.previous': { 'zh-TW': '上一步', 'en': 'Previous' },
    'route.edit': { 'zh-TW': '修改', 'en': 'Edit' },
    'route.whatToExperience': { 'zh-TW': '你想體驗什麼？', 'en': 'What do you want to experience?' },
    'route.multiSelect': { 'zh-TW': '（可複選）', 'en': '(Multiple selection)' },
    'route.howMuchTime': { 'zh-TW': '你有多少時間？', 'en': 'How much time do you have?' },
    'route.walkingPref': { 'zh-TW': '步行量偏好', 'en': 'Walking Preference' },
    'route.generating': { 'zh-TW': 'AI 分析中...', 'en': 'AI Analyzing...' },
    'route.generate': { 'zh-TW': '生成路線', 'en': 'Generate Route' },
    'route.replan': { 'zh-TW': '重新規劃', 'en': 'Re-plan' },
    'route.recommendedItinerary': { 'zh-TW': '推薦行程', 'en': 'Recommended Itinerary' },
    'route.suggestedStay': { 'zh-TW': '建議停留', 'en': 'Suggested stay' },
    'route.minutes': { 'zh-TW': '分鐘', 'en': 'minutes' },
    'route.hours': { 'zh-TW': '小時', 'en': 'hours' },
    'route.places': { 'zh-TW': '地點數量', 'en': 'Number of Places' },
    'route.estimatedDuration': { 'zh-TW': '預估時長', 'en': 'Estimated Duration' },
    'route.about': { 'zh-TW': '約', 'en': 'About' },
    'route.walkingLevel': { 'zh-TW': '步行量', 'en': 'Walking Level' },
    'route.budget': { 'zh-TW': '預估預算', 'en': 'Estimated Budget' },
    'route.highlights': { 'zh-TW': '路線亮點', 'en': 'Route Highlights' },
    'route.copyRoute': { 'zh-TW': '複製路線', 'en': 'Copy Route' },
    'route.routeCopied': { 'zh-TW': '路線已複製到剪貼板！', 'en': 'Route copied to clipboard!' },
    'route.loadingAnalysis': { 'zh-TW': '根據您的偏好生成最佳路線', 'en': 'Generating the best route based on your preferences' },
    'route.error.destination': { 'zh-TW': '請輸入目的地', 'en': 'Please enter a destination' },
    'route.error.categories': { 'zh-TW': '請至少選擇一個興趣類別', 'en': 'Please select at least one category' },
    'route.error.generic': { 'zh-TW': '生成路線時發生錯誤，請稍後再試', 'en': 'Error generating route, please try again later' },
    'route.error.invalid': { 'zh-TW': 'AI 無法生成有效的路線，請嘗試其他目的地', 'en': 'AI could not generate a valid route, please try another destination' },

    // Route Planner Categories
    'route.category.food': { 'zh-TW': '美食', 'en': 'Food' },
    'route.category.culture': { 'zh-TW': '文化', 'en': 'Culture' },
    'route.category.shopping': { 'zh-TW': '購物', 'en': 'Shopping' },
    'route.category.nature': { 'zh-TW': '自然', 'en': 'Nature' },
    'route.category.nightlife': { 'zh-TW': '夜生活', 'en': 'Nightlife' },
    'route.category.photography': { 'zh-TW': '攝影', 'en': 'Photography' },

    // Route Planner Duration
    'route.duration.quick': { 'zh-TW': '快速瀏覽', 'en': 'Quick Tour' },
    'route.duration.quick.desc': { 'zh-TW': '1-2 小時', 'en': '1-2 hours' },
    'route.duration.half_day': { 'zh-TW': '半天行程', 'en': 'Half Day' },
    'route.duration.half_day.desc': { 'zh-TW': '約 4 小時', 'en': 'About 4 hours' },
    'route.duration.full_day': { 'zh-TW': '一天行程', 'en': 'Full Day' },
    'route.duration.full_day.desc': { 'zh-TW': '約 8 小時', 'en': 'About 8 hours' },

    // Route Planner Walking
    'route.walking.low': { 'zh-TW': '少走路', 'en': 'Less Walking' },
    'route.walking.low.desc': { 'zh-TW': '以交通工具為主', 'en': 'Mainly by transportation' },
    'route.walking.medium': { 'zh-TW': '適中', 'en': 'Moderate' },
    'route.walking.medium.desc': { 'zh-TW': '步行與交通並用', 'en': 'Walking and transit combined' },
    'route.walking.high': { 'zh-TW': '多走路', 'en': 'More Walking' },
    'route.walking.high.desc': { 'zh-TW': '享受散步的樂趣', 'en': 'Enjoy the pleasure of walking' },
    'route.walking.easy': { 'zh-TW': '輕鬆', 'en': 'Easy' },
    'route.walking.moderate': { 'zh-TW': '適中', 'en': 'Moderate' },
    'route.walking.challenging': { 'zh-TW': '挑戰', 'en': 'Challenging' },

    // ==================== Budget Tracker ====================
    'budget.title': { 'zh-TW': '預算追蹤', 'en': 'Budget Tracker' },
    'budget.add': { 'zh-TW': '+ 記錄支出', 'en': '+ Record Expense' },
    'budget.cancel': { 'zh-TW': '取消', 'en': 'Cancel' },
    'budget.type': { 'zh-TW': '類型', 'en': 'Type' },
    'budget.amount': { 'zh-TW': '金額 ({currency})', 'en': 'Amount ({currency})' },
    'budget.description': { 'zh-TW': '說明', 'en': 'Description' },
    'budget.placeholder': { 'zh-TW': '例如：午餐、門票...', 'en': 'e.g. Lunch, Tickets...' },
    'budget.submit': { 'zh-TW': '新增', 'en': 'Add' },
    'budget.estimated': { 'zh-TW': '預估預算', 'en': 'Estimated Budget' },
    'budget.actual': { 'zh-TW': '實際支出', 'en': 'Actual Spent' },
    'budget.remaining': { 'zh-TW': '剩餘預算', 'en': 'Remaining Budget' },
    'budget.used': { 'zh-TW': '已使用 {n}%', 'en': 'Used {n}%' },
    'budget.status.sufficient': { 'zh-TW': '預算充足', 'en': 'Sufficient' },
    'budget.status.normal': { 'zh-TW': '預算正常', 'en': 'Normal' },
    'budget.status.over': { 'zh-TW': '超出預算', 'en': 'Over Budget' },
    'budget.status.exceeded': { 'zh-TW': '嚴重超支', 'en': 'Severely Exceeded' },
    'budget.breakdown': { 'zh-TW': '支出分類', 'en': 'Expense Breakdown' },
    'budget.recommendations': { 'zh-TW': '建議', 'en': 'Recommendations' },
    'budget.history': { 'zh-TW': '支出記錄', 'en': 'Expense History' },
    'budget.error.add': { 'zh-TW': '新增支出失敗', 'en': 'Failed to add expense' },
    'budget.category.food': { 'zh-TW': '餐飲', 'en': 'Food' },
    'budget.category.transport': { 'zh-TW': '交通', 'en': 'Transport' },
    'budget.category.activity': { 'zh-TW': '活動', 'en': 'Activity' },
    'budget.category.shopping': { 'zh-TW': '購物', 'en': 'Shopping' },
    'budget.category.other': { 'zh-TW': '其他', 'en': 'Other' },
    'footer.generatedBy': { 'zh-TW': '由 TourGuide 生成', 'en': 'Generated by TourGuide' },
};

let currentLanguage: Language = 'zh-TW';

/**
 * Set current language
 */
export function setLanguage(lang: Language): void {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
}

/**
 * Get current language
 */
export function getLanguage(): Language {
    return currentLanguage;
}

/**
 * Initialize language from localStorage or browser
 */
export function initLanguage(): void {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'zh-TW' || saved === 'en')) {
        setLanguage(saved);
    } else {
        // Detect browser language
        const browserLang = navigator.language || navigator.languages[0];
        if (browserLang.startsWith('en')) {
            setLanguage('en');
        } else {
            setLanguage('zh-TW');
        }
    }
}

/**
 * Translate a key with optional interpolation
 * Example: t('generator.day', { n: 1 }) => "Day 1"
 */
export function t(key: string, params?: Record<string, string | number>): string {
    const translation = translations[key];
    let result = translation
        ? (translation[currentLanguage] || translation['zh-TW'] || key)
        : key;

    // Handle interpolation
    if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
            result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
        });
    }

    return result;
}

/**
 * Get all translations for a language
 */
export function getTranslations(lang: Language): Record<string, string> {
    const result: Record<string, string> = {};
    Object.keys(translations).forEach(key => {
        result[key] = translations[key][lang] || translations[key]['zh-TW'];
    });
    return result;
}

// ==================== React Context for Language ====================

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLang] = useState<Language>(() => {
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'zh-TW' || saved === 'en')) {
            return saved;
        }
        const browserLang = navigator.language || navigator.languages[0];
        return browserLang.startsWith('en') ? 'en' : 'zh-TW';
    });

    useEffect(() => {
        setLanguage(language);
    }, [language]);

    const handleSetLanguage = (lang: Language) => {
        setLang(lang);
        setLanguage(lang);
    };

    const translate = (key: string, params?: Record<string, string | number>): string => {
        const translation = translations[key];
        let result = translation
            ? (translation[language] || translation['zh-TW'] || key)
            : key;

        // If result is empty string but zh-TW exists, use zh-TW
        if (result === '' && translation && translation['zh-TW']) {
            result = translation['zh-TW'];
        }

        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
            });
        }

        return result;
    };

    return React.createElement(
        LanguageContext.Provider,
        { value: { language, setLanguage: handleSetLanguage, t: translate } },
        children
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

