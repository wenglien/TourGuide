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
    'generator.setup.title': { 'zh-TW': '旅程設定', 'en': 'Trip Setup' },
    'generator.setup.desc': { 'zh-TW': '先把目的地、時間與玩法整理好，下一步就能交給 AI 排路線。', 'en': 'Set the destination, timing, and travel style first, then let AI arrange the route.' },
    'generator.setup.basics': { 'zh-TW': '基礎資訊', 'en': 'Basics' },
    'generator.setup.style': { 'zh-TW': '玩法偏好', 'en': 'Travel Style' },
    'generator.setup.review': { 'zh-TW': '生成前確認', 'en': 'Review Before Generating' },
    'generator.setup.ready': { 'zh-TW': '已準備好規劃', 'en': 'Ready to plan' },
    'generator.setup.needDestination': { 'zh-TW': '尚未選目的地', 'en': 'No destination yet' },
    'generator.setup.needCategory': { 'zh-TW': '尚未選玩法', 'en': 'No travel style yet' },
    'generator.setup.interests': { 'zh-TW': '興趣', 'en': 'Interests' },
    'generator.setup.when': { 'zh-TW': '時間', 'en': 'When' },
    'generator.setup.mode': { 'zh-TW': '模式', 'en': 'Mode' },
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
    'generator.route.optimize': { 'zh-TW': '最佳化', 'en': 'Optimize' },
    'generator.route.optimizeDay': { 'zh-TW': '最佳化今日路線', 'en': 'Optimize Day Route' },
    'generator.route.openMaps': { 'zh-TW': '開啟 Google Maps', 'en': 'Open Google Maps' },
    'generator.route.alreadyOptimized': { 'zh-TW': '目前順序已經很接近最佳路線', 'en': 'This order is already close to optimal' },

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
    'profile.insight.favorite': { 'zh-TW': '最常選擇', 'en': 'Favorite Style' },
    'profile.insight.checkins': { 'zh-TW': '旅行打卡', 'en': 'Check-ins' },
    'profile.insight.nextLevel': { 'zh-TW': '升級還差', 'en': 'To Next Level' },
    'profile.insight.none': { 'zh-TW': '尚未累積', 'en': 'Not enough data' },
    'profile.search.placeholder': { 'zh-TW': '搜尋行程（城市、日期、類型...）', 'en': 'Search itineraries (city, date, type...)' },
    'profile.tab.itineraries': { 'zh-TW': '我的收藏', 'en': 'My Itineraries' },
    'profile.tab.checkins': { 'zh-TW': '旅行打卡', 'en': 'Check-ins' },
    'profile.tab.diary': { 'zh-TW': '旅遊日記', 'en': 'Travel Diary' },
    'profile.diary.totalCheckins': { 'zh-TW': '打卡次數', 'en': 'Check-ins' },
    'profile.diary.withPhotos': { 'zh-TW': '含照片', 'en': 'With Photos' },
    'profile.diary.avgRating': { 'zh-TW': '平均評分', 'en': 'Avg Rating' },
    'profile.diary.viewPhoto': { 'zh-TW': '查看照片', 'en': 'View Photo' },
    'profile.checkin.delete.confirm': { 'zh-TW': '確定要刪除這筆打卡記錄嗎？', 'en': 'Are you sure you want to delete this check-in?' },
    'achievement.explorer': { 'zh-TW': '資深探索者', 'en': 'Explorer' },
    'achievement.explorer.desc': { 'zh-TW': '累計 10 次打卡記錄', 'en': 'Record 10 check-ins' },
    'achievement.weekPlanner': { 'zh-TW': '週遊達人', 'en': 'Week Planner' },
    'achievement.weekPlanner.desc': { 'zh-TW': '規劃一次 7 天的行程', 'en': 'Plan a 7-day itinerary' },
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
    'route.planner.routePreview': { 'zh-TW': '路線預覽', 'en': 'Route Preview' },
    'route.planner.nowViewing': { 'zh-TW': '目前查看', 'en': 'Now Viewing' },
    'route.planner.backupPlan': { 'zh-TW': '備案建議', 'en': 'Backup Plan' },
    'route.planner.rainBackup': { 'zh-TW': '雨天替代', 'en': 'Rain Backup' },
    'route.planner.rainBackup.desc': { 'zh-TW': '優先保留室內、商場、展館與咖啡廳，減少長距離步行。', 'en': 'Favor indoor stops, malls, galleries, and cafes while reducing long walks.' },
    'route.planner.crowdBackup': { 'zh-TW': '人潮替代', 'en': 'Crowd Backup' },
    'route.planner.crowdBackup.desc': { 'zh-TW': '遇到排隊或擁擠時，先前往下一站，再回頭補上熱門景點。', 'en': 'If a stop is crowded, visit the next stop first and return later.' },
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

    // ==================== Redesign (v2) ====================
    'scrub.state.before': { 'zh-TW': '還沒出發', 'en': 'Not started' },
    'scrub.state.at': { 'zh-TW': '此刻在', 'en': 'Now at' },
    'scrub.state.moving': { 'zh-TW': '前往', 'en': 'Heading to' },
    'scrub.state.after': { 'zh-TW': '行程結束', 'en': 'Day finished' },
    'scrub.detail.arrive': { 'zh-TW': '{time} 抵達', 'en': 'Arrive {time}' },
    'scrub.detail.until': { 'zh-TW': '停留到 {time}', 'en': 'Until {time}' },
    'scrub.detail.left': { 'zh-TW': '{time} 離開', 'en': 'Left {time}' },
    'quick.label': { 'zh-TW': '快速選擇目的地', 'en': 'Quick destination picks' },
    'quick.locate': { 'zh-TW': '用目前位置', 'en': 'Use my location' },
    'quick.locate.busy': { 'zh-TW': '定位中', 'en': 'Locating' },
    'quick.locate.here': { 'zh-TW': '目前位置', 'en': 'Current location' },
    'quick.locate.denied': { 'zh-TW': '沒有定位權限。請在瀏覽器允許定位，或直接輸入地點。', 'en': 'Location access is off. Allow it in your browser, or type a place.' },
    'quick.locate.failed': { 'zh-TW': '無法取得位置，請直接輸入地點。', 'en': 'Couldn\'t get your location. Type a place instead.' },
    'quick.locate.unsupported': { 'zh-TW': '這個瀏覽器不支援定位，請直接輸入地點。', 'en': 'This browser can\'t share location. Type a place instead.' },
    'shell.homeLabel': { 'zh-TW': 'TourGuide 首頁', 'en': 'TourGuide home' },
    'trip.facts.stops': { 'zh-TW': '站', 'en': 'stops' },
    'trip.facts.moveMin': { 'zh-TW': '分鐘移動', 'en': 'min travelling' },
    'trip.navigateDay': { 'zh-TW': '導航這一天', 'en': 'Navigate the day' },
    'trip.loginToSave': { 'zh-TW': '登入儲存', 'en': 'Sign in to save' },
    'trip.more.optimize.desc': { 'zh-TW': '依距離重新排列各時段的站點順序。', 'en': 'Reorders the stops in each slot by distance.' },
    'trip.swapPlace': { 'zh-TW': '換一個地點', 'en': 'Swap this place' },
    'plan2.place.replacing': { 'zh-TW': '正在換', 'en': 'Swapping' },
    'trip.error.destination': { 'zh-TW': '先輸入要去的地方，例如「大稻埕」或「台南」。', 'en': 'Enter where you\'re going first, such as “Dadaocheng” or “Tainan”.' },
    'trip.status.needCity': { 'zh-TW': '輸入目的地就能開始。', 'en': 'Enter a destination to start.' },
    'trip.status.mix': { 'zh-TW': '{city}：沒選興趣，會排綜合路線。', 'en': '{city}: no interests picked, so you\'ll get a mix.' },
    'trip.optional': { 'zh-TW': '可不選', 'en': 'optional' },
    'trip.generating.walk': { 'zh-TW': '通常 10 到 20 秒。', 'en': 'Usually 10 to 20 seconds.' },
    'trip.cancel': { 'zh-TW': '取消', 'en': 'Cancel' },
    'trip.example': { 'zh-TW': '看一個例子', 'en': 'See an example' },
    'trip.edit': { 'zh-TW': '修改條件', 'en': 'Edit' },
    'trip.span.label': { 'zh-TW': '多久', 'en': 'How long' },
    'trip.span.quick': { 'zh-TW': '2 小時', 'en': '2 hours' },
    'trip.span.half': { 'zh-TW': '半天', 'en': 'Half day' },
    'trip.mode.walk': { 'zh-TW': '散步路線：', 'en': 'A walk:' },
    'trip.mode.walk.desc': { 'zh-TW': '一條順路的路線，從現在出發。', 'en': 'one route in a sensible order, starting now.' },
    'trip.mode.plan': { 'zh-TW': '分時段行程：', 'en': 'A trip:' },
    'trip.mode.plan.desc': { 'zh-TW': '每天分上午、下午、傍晚、晚上排。', 'en': 'each day laid out by morning, afternoon, evening and night.' },
    'trip.more': { 'zh-TW': '其他設定', 'en': 'More settings' },
    'trip.resume': { 'zh-TW': '回到剛才的結果', 'en': 'Back to your last result' },
    'trip.templates.desc': { 'zh-TW': '選一個，會填進上面的表單。', 'en': 'Pick one to fill in the form above.' },
    'trip.templates.applied': { 'zh-TW': '已套用「{name}」', 'en': 'Applied “{name}”' },
    'home2.demo.switch': { 'zh-TW': '換一條範例路線', 'en': 'Switch sample route' },
    'scrub.label': { 'zh-TW': '拖曳列車，看那時你會在哪裡', 'en': 'Drag through the day to see where you\'ll be' },
    'scrub.before': { 'zh-TW': '還沒出發，{time} 抵達{name}', 'en': 'Not started. Arrive at {name} at {time}' },
    'scrub.at': { 'zh-TW': '在{name}，停留到 {time}', 'en': 'At {name} until {time}' },
    'scrub.moving': { 'zh-TW': '前往{name}，{time} 抵達', 'en': 'Heading to {name}, arriving {time}' },
    'scrub.after': { 'zh-TW': '這一天的行程走完了', 'en': 'That\'s the end of the day' },
    'scrub.play': { 'zh-TW': '播放這一天', 'en': 'Play the day' },
    'scrub.pause': { 'zh-TW': '暫停', 'en': 'Pause' },
    'scrub.prev': { 'zh-TW': '上一站', 'en': 'Previous stop' },
    'scrub.next': { 'zh-TW': '下一站', 'en': 'Next stop' },
    'scrub.now': { 'zh-TW': '現在', 'en': 'Now' },
    'plan2.shape.title': { 'zh-TW': 'AI 會排出的時段', 'en': 'Time slots the AI will fill' },
    'plan2.shape.off': { 'zh-TW': '這個步調不排', 'en': 'Not planned at this pace' },
    'plan2.shape.days': { 'zh-TW': '× {n} 天', 'en': '× {n} days' },
    'plan2.stamp.done': { 'zh-TW': '蓋好了', 'en': 'Stamped' },
    'shell.home': { 'zh-TW': '首頁', 'en': 'Home' },
    'shell.walk': { 'zh-TW': '散步', 'en': 'Walk' },
    'shell.plan': { 'zh-TW': '規劃', 'en': 'Plan' },
    'shell.me': { 'zh-TW': '我的旅程', 'en': 'My trips' },
    'shell.login': { 'zh-TW': '登入', 'en': 'Sign in' },
    'shell.loginFailed': { 'zh-TW': '登入沒有完成，請再試一次。', 'en': 'Sign-in didn\'t finish. Try again.' },
    'shell.navLabel': { 'zh-TW': '主要導覽', 'en': 'Main navigation' },
    'shell.skip': { 'zh-TW': '跳到主要內容', 'en': 'Skip to content' },
    'common.unit.days': { 'zh-TW': '天', 'en': 'days' },
    'home2.title': { 'zh-TW': '今天，\n去哪裡走走？', 'en': 'Where are you\nwalking today?' },
    'home2.lede': { 'zh-TW': '輸入目的地，拿到一條走得完的路線：幾點到哪裡、怎麼過去、下雨改去哪。', 'en': 'Enter a place and get a route you can actually walk: when to be where, how to get there, and where to go if it rains.' },
    'home2.destination': { 'zh-TW': '目的地', 'en': 'Destination' },
    'home2.destination.placeholder': { 'zh-TW': '城市、街區或景點', 'en': 'City, neighbourhood or landmark' },
    'home2.mode.walk': { 'zh-TW': '排散步路線', 'en': 'Plan a walk' },
    'home2.mode.walk.desc': { 'zh-TW': '今天，1 到 8 小時', 'en': 'Today, 1 to 8 hours' },
    'home2.mode.plan': { 'zh-TW': '排完整行程', 'en': 'Plan a trip' },
    'home2.mode.plan.desc': { 'zh-TW': '1 到 7 天', 'en': '1 to 7 days' },
    'home2.recent': { 'zh-TW': '最近的行程', 'en': 'Recent trips' },
    'home2.recent.all': { 'zh-TW': '全部行程與紀念章', 'en': 'All trips and stamps' },
    'home2.templates': { 'zh-TW': '從範本開始', 'en': 'Start from a template' },
    'home2.templates.desc': { 'zh-TW': '選一個，再改成你要的樣子。', 'en': 'Pick one, then make it yours.' },
    'plan2.title': { 'zh-TW': '排一趟行程', 'en': 'Plan a trip' },
    'plan2.lede': { 'zh-TW': '選好地點、天數和想做的事，我們依時段排出每天的路線。', 'en': 'Choose the place, the days and what you want to do. We\'ll lay out each day by time of day.' },
    'plan2.hint.apply': { 'zh-TW': '套用這些偏好', 'en': 'Use these preferences' },
    'plan2.templates': { 'zh-TW': '用範本填寫', 'en': 'Fill from a template' },
    'plan2.templates.days': { 'zh-TW': '{n} 天', 'en': '{n} days' },
    'plan2.where': { 'zh-TW': '去哪裡', 'en': 'Where' },
    'plan2.nearby': { 'zh-TW': '附近熱門：', 'en': 'Popular nearby: ' },
    'plan2.when': { 'zh-TW': '什麼時候', 'en': 'When' },
    'plan2.days': { 'zh-TW': '天數', 'en': 'Days' },
    'plan2.days.n': { 'zh-TW': '{n} 天', 'en': '{n}d' },
    'plan2.what': { 'zh-TW': '想做什麼', 'en': 'What you\'re into' },
    'plan2.what.hint': { 'zh-TW': '可以選好幾個。', 'en': 'Choose as many as you like.' },
    'plan2.how': { 'zh-TW': '怎麼走', 'en': 'How you travel' },
    'plan2.options': { 'zh-TW': '其他', 'en': 'Options' },
    'plan2.rain': { 'zh-TW': '雨天版本', 'en': 'Rainy-day version' },
    'plan2.rain.desc': { 'zh-TW': '優先排室內景點。', 'en': 'Prefer indoor places.' },
    'plan2.ai': { 'zh-TW': 'AI 排程', 'en': 'AI planning' },
    'plan2.ai.desc': { 'zh-TW': '關掉會改用內建規則，速度較快但選擇較少。', 'en': 'Off uses built-in rules: faster, fewer choices.' },
    'plan2.missing': { 'zh-TW': '還需要：{items}', 'en': 'Still needed: {items}' },
    'plan2.missing.destination': { 'zh-TW': '目的地', 'en': 'a destination' },
    'plan2.missing.interests': { 'zh-TW': '至少一項興趣', 'en': 'at least one interest' },
    'plan2.ready': { 'zh-TW': '{city}，{n} 天，準備好了。', 'en': '{city}, {n} days. Ready.' },
    'plan2.generate': { 'zh-TW': '生成行程', 'en': 'Generate trip' },
    'plan2.generating': { 'zh-TW': '正在排{city}的路線', 'en': 'Planning your route in {city}' },
    'plan2.generating.detail': { 'zh-TW': '查天氣、找景點、排順序，大約需要 20 秒。', 'en': 'Checking weather, finding places and ordering stops. This takes about 20 seconds.' },
    'plan2.rain.title': { 'zh-TW': '那天可能會下雨', 'en': 'Rain is likely that day' },
    'plan2.rain.use': { 'zh-TW': '改排雨天版', 'en': 'Use rainy-day version' },
    'plan2.rain.keep': { 'zh-TW': '維持原樣', 'en': 'Keep as is' },
    'plan2.facts.stops': { 'zh-TW': '站數', 'en': 'Stops' },
    'plan2.facts.distance': { 'zh-TW': '總距離', 'en': 'Distance' },
    'plan2.facts.travel': { 'zh-TW': '移動時間', 'en': 'Travel time' },
    'plan2.facts.budget': { 'zh-TW': '預算', 'en': 'Budget' },
    'plan2.day.refresh': { 'zh-TW': '重排第 {n} 天', 'en': 'Redo day {n}' },
    'plan2.rain.active': { 'zh-TW': '這是雨天版本，以室內景點為主。', 'en': 'This is the rainy-day version, mostly indoors.' },
    'plan2.companion.stop': { 'zh-TW': '停止', 'en': 'Stop' },
    'plan2.view': { 'zh-TW': '顯示方式', 'en': 'View' },
    'plan2.view.line': { 'zh-TW': '路線', 'en': 'Route' },
    'plan2.view.map': { 'zh-TW': '地圖', 'en': 'Map' },
    'plan2.map': { 'zh-TW': '行程地圖', 'en': 'Trip map' },
    'plan2.empty': { 'zh-TW': '這個時段沒有找到合適的地點。換個興趣或範圍試試。', 'en': 'No suitable places were found. Try other interests or a wider area.' },
    'plan2.editPrefs': { 'zh-TW': '修改偏好', 'en': 'Edit preferences' },
    'plan2.slot.refresh': { 'zh-TW': '換一組', 'en': 'Swap set' },
    'plan2.slot.refreshing': { 'zh-TW': '換一組中', 'en': 'Swapping' },
    'plan2.slot.optimize': { 'zh-TW': '最短順序', 'en': 'Shortest order' },
    'plan2.slot.edit': { 'zh-TW': '調整順序', 'en': 'Reorder' },
    'plan2.slot.doneEditing': { 'zh-TW': '完成', 'en': 'Done' },
    'plan2.place.replace': { 'zh-TW': '換一個', 'en': 'Swap' },
    'plan2.place.navigate': { 'zh-TW': '導航', 'en': 'Directions' },
    'plan2.place.stamp': { 'zh-TW': '蓋章', 'en': 'Stamp' },
    'plan2.place.details': { 'zh-TW': '查看詳情', 'en': 'view details' },
    'plan2.place.reviews': { 'zh-TW': '{n} 則評論', 'en': '{n} reviews' },
    'plan2.place.wait': { 'zh-TW': '，約等 {n} 分鐘', 'en': '; about {n} min wait' },
    'plan2.place.getThere': { 'zh-TW': '從上一站過去', 'en': 'From the previous stop' },
    'plan2.place.hours': { 'zh-TW': '營業時間', 'en': 'Opening hours' },
    'plan2.leg.walking': { 'zh-TW': '步行', 'en': 'Walk' },
    'plan2.leg.public': { 'zh-TW': '大眾運輸', 'en': 'Transit' },
    'plan2.leg.uber': { 'zh-TW': '計程車', 'en': 'Taxi' },
    'plan2.leg.free': { 'zh-TW': '{mode} {n} 分', 'en': '{mode} {n} min' },
    'plan2.leg.withCost': { 'zh-TW': '{mode} {n} 分，約 NT${cost}', 'en': '{mode} {n} min, about NT${cost}' },
    'plan2.day.optimize': { 'zh-TW': '整天改成最短順序', 'en': 'Shortest order for the day' },
    'plan2.day.openMaps': { 'zh-TW': '在 Google 地圖開啟', 'en': 'Open in Google Maps' },
    'plan2.budget.saveFirst': { 'zh-TW': '儲存行程後就能記錄實際花費。', 'en': 'Save the trip to start tracking what you spend.' },
    'plan2.save': { 'zh-TW': '儲存行程', 'en': 'Save trip' },
    'plan2.saveAgain': { 'zh-TW': '再存一份', 'en': 'Save a copy' },
    'plan2.share': { 'zh-TW': '分享', 'en': 'Share' },
    'plan2.loginToSave': { 'zh-TW': '登入以儲存行程', 'en': 'Sign in to save' },
    'plan2.more.title': { 'zh-TW': '更多', 'en': 'More' },
    'plan2.more.rainy': { 'zh-TW': '改排雨天版', 'en': 'Switch to rainy-day version' },
    'plan2.more.sunny': { 'zh-TW': '改回晴天版', 'en': 'Switch back to sunny version' },
    'plan2.more.rainy.desc': { 'zh-TW': '會重新生成這一天。', 'en': 'Regenerates this day.' },
    'plan2.more.companion': { 'zh-TW': '開啟隨行模式', 'en': 'Turn on travel companion' },
    'plan2.more.companion.desc': { 'zh-TW': '出發後留意天氣與人潮，必要時建議調整。', 'en': 'Watches weather and crowds while you\'re out and suggests changes.' },
    'plan2.more.pdf': { 'zh-TW': '下載 PDF', 'en': 'Download PDF' },
    'plan2.more.calendar': { 'zh-TW': '加入 Google 日曆', 'en': 'Add to Google Calendar' },
    'plan2.needLocation': { 'zh-TW': '從建議清單選一個目的地，才能使用這個功能。', 'en': 'Pick a destination from the suggestions to use this.' },
    'plan2.remove.title': { 'zh-TW': '從路線移除「{name}」？', 'en': 'Remove “{name}” from the route?' },
    'plan2.remove.confirm': { 'zh-TW': '移除', 'en': 'Remove' },
    'plan2.reorder.hint': { 'zh-TW': '拖曳或用箭頭調整順序。', 'en': 'Drag, or use the arrows, to reorder.' },
    'plan2.reorder.up': { 'zh-TW': '把 {name} 往前移', 'en': 'Move {name} up' },
    'plan2.reorder.down': { 'zh-TW': '把 {name} 往後移', 'en': 'Move {name} down' },
    'plan2.reorder.remove': { 'zh-TW': '移除 {name}', 'en': 'Remove {name}' },
    'plan2.stamp.title': { 'zh-TW': '蓋一個紀念章', 'en': 'Collect a stamp' },
    'plan2.stamp.desc': { 'zh-TW': '紀念章會收進「我的」裡的紀念章冊。', 'en': 'Stamps are kept in your stamp book under Me.' },
    'plan2.stamp.stars': { 'zh-TW': '{n} 顆星', 'en': '{n} stars' },
    'plan2.stamp.submit': { 'zh-TW': '蓋章', 'en': 'Stamp it' },
    'plan2.stamp.uploading': { 'zh-TW': '上傳照片 {n}%', 'en': 'Uploading photo {n}%' },
    'plan2.toast.saved': { 'zh-TW': '已儲存行程', 'en': 'Trip saved' },
    'plan2.toast.linkCopied': { 'zh-TW': '已複製分享連結', 'en': 'Share link copied' },
    'plan2.toast.optimized': { 'zh-TW': '已改成最短順序', 'en': 'Changed to the shortest order' },
    'plan2.toast.rainOn': { 'zh-TW': '已改成雨天版', 'en': 'Switched to rainy-day version' },
    'plan2.toast.rainOff': { 'zh-TW': '已改回晴天版', 'en': 'Switched back to sunny version' },
    'plan2.toast.dayRefreshed': { 'zh-TW': '第 {n} 天已重排', 'en': 'Day {n} redone' },
    'plan2.toast.stamped': { 'zh-TW': '已在「{name}」蓋章', 'en': 'Stamp collected at {name}' },
    'plan2.toast.companionOn': { 'zh-TW': '隨行模式已開啟', 'en': 'Travel companion is on' },
    'place.crowdLevel.not_busy': { 'zh-TW': '不擁擠', 'en': 'Not busy' },
    'walk2.title': { 'zh-TW': '排一條散步路線', 'en': 'Plan a walk' },
    'walk2.lede': { 'zh-TW': '今天就出門的話，給你一條順路的路線，每站說明為什麼值得去。', 'en': 'Heading out today? Get one route in a sensible order, with a reason for every stop.' },
    'walk2.howLong': { 'zh-TW': '走多久', 'en': 'How long' },
    'walk2.ready': { 'zh-TW': '{city}，準備好了。', 'en': '{city}. Ready.' },
    'walk2.generate': { 'zh-TW': '生成路線', 'en': 'Generate route' },
    'walk2.facts.total': { 'zh-TW': '總時間', 'en': 'Total time' },
    'walk2.leaveAt': { 'zh-TW': '出發時間', 'en': 'Leave at' },
    'walk2.stay': { 'zh-TW': '停留 {d}', 'en': 'Stay {d}' },
    'walk2.tips': { 'zh-TW': '出發前', 'en': 'Before you go' },
    'walk2.showOnMap': { 'zh-TW': '在地圖上顯示', 'en': 'show on map' },
    'walk2.copied': { 'zh-TW': '已複製路線', 'en': 'Route copied' },
    'walk2.copyFailed': { 'zh-TW': '無法複製，請長按選取文字。', 'en': 'Couldn\'t copy. Select the text instead.' },
    'walk2.again': { 'zh-TW': '重新排', 'en': 'Start over' },
    'trips.title': { 'zh-TW': '我的旅程', 'en': 'My trips' },
    'trips.signedOut.title': { 'zh-TW': '你的行程與紀念章', 'en': 'Your trips and stamps' },
    'trips.signedOut.desc': { 'zh-TW': '登入後，儲存的行程、蓋過的紀念章和花費紀錄都會放在這裡。', 'en': 'Sign in to keep saved trips, the stamps you\'ve collected and your spending here.' },
    'trips.signedOut.cta': { 'zh-TW': '用 Google 登入', 'en': 'Sign in with Google' },
    'trips.stats.trips': { 'zh-TW': '行程', 'en': 'Trips' },
    'trips.stats.cities': { 'zh-TW': '城市', 'en': 'Cities' },
    'trips.stats.stamps': { 'zh-TW': '紀念章', 'en': 'Stamps' },
    'trips.tab.trips': { 'zh-TW': '行程', 'en': 'Trips' },
    'trips.tab.stamps': { 'zh-TW': '紀念章冊', 'en': 'Stamp book' },
    'trips.tab.activity': { 'zh-TW': '動態', 'en': 'Activity' },
    'trips.tab.achievements': { 'zh-TW': '成就', 'en': 'Achievements' },
    'trips.empty.trips': { 'zh-TW': '還沒有儲存的行程。', 'en': 'No saved trips yet.' },
    'trips.empty.trips.cta': { 'zh-TW': '排第一趟行程', 'en': 'Plan your first trip' },
    'trips.empty.stamps': { 'zh-TW': '還沒有紀念章。在行程中的任一站按「蓋章」，就會收進這裡。', 'en': 'No stamps yet. Tap Stamp on any stop in a trip and it\'ll land here.' },
    'trips.empty.stamps.cta': { 'zh-TW': '去排一趟行程', 'en': 'Plan a trip' },
    'trips.search.none': { 'zh-TW': '沒有符合「{q}」的行程。', 'en': 'No trips match “{q}”.' },
    'trips.stops': { 'zh-TW': '{n} 站', 'en': '{n} stops' },
    'trips.shared': { 'zh-TW': '已分享', 'en': 'Shared' },
    'trips.delete.title': { 'zh-TW': '刪除「{city}」行程？', 'en': 'Delete the {city} trip?' },
    'trips.delete.desc': { 'zh-TW': '分享出去的連結也會失效。', 'en': 'Any shared link will stop working.' },
    'trips.delete.confirm': { 'zh-TW': '刪除行程', 'en': 'Delete trip' },
    'trips.toast.deleted': { 'zh-TW': '已刪除行程', 'en': 'Trip deleted' },
    'trips.activity.deleted': { 'zh-TW': '刪除行程', 'en': 'Deleted a trip' },
    'trips.stamp.delete.title': { 'zh-TW': '刪除「{name}」的紀念章？', 'en': 'Delete the stamp from {name}?' },
    'trips.stamp.delete.confirm': { 'zh-TW': '刪除紀念章', 'en': 'Delete stamp' },
    'trips.toast.stampDeleted': { 'zh-TW': '已刪除紀念章', 'en': 'Stamp deleted' },
    'trips.achievement.done': { 'zh-TW': '已達成', 'en': 'Done' },
    'shared.missing.title': { 'zh-TW': '找不到這個行程', 'en': 'This trip isn\'t available' },
    'shared.missing.desc': { 'zh-TW': '連結可能已失效，或行程已被刪除。', 'en': 'The link may have expired or the trip was deleted.' },
    'shared.cta': { 'zh-TW': '排我自己的行程', 'en': 'Plan my own trip' },
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
