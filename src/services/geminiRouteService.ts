// Gemini AI Route Planning Service
// Simple flow: User input destination -> Generate prompt -> Send to Gemini -> Return route suggestions

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface RoutePreferences {
    destination: string;
    categories: string[]; // 'food' | 'culture' | 'shopping' | 'nature' | 'nightlife' | 'photography'
    duration: 'half_day' | 'full_day' | 'quick';
    walkingLevel: 'low' | 'medium' | 'high';
}

export interface PlaceRecommendation {
    name: string;
    address: string;
    category: string;
    reason: string;
    estimatedStayTime: number; // minutes
    tips?: string;
    lat?: number;
    lng?: number;
}

export interface AIGeneratedRoute {
    id: string;
    title: string;
    description: string;
    theme: string;
    places: PlaceRecommendation[];
    totalEstimatedTime: number; // minutes
    walkingLevel: 'low' | 'medium' | 'high';
    highlights: string[];
    tips: string[];
    budgetRange?: {
        min: number;
        max: number;
        currency: string;
    };
}

/**
 * Generate AI route recommendation using Gemini
 * Simple flow: destination + preferences -> Gemini prompt -> AI response
 */
export async function generateRouteWithGemini(
    preferences: RoutePreferences
): Promise<AIGeneratedRoute> {
    // Build the prompt
    const prompt = buildRoutePrompt(preferences);

    console.log('Sending prompt to Groq AI...');
    console.log('Destination:', preferences.destination);

    try {
        const response = await fetch(
            GROQ_API_URL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful travel assistant that outputs JSON only.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 2048,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Groq API error details:', errorData);
            throw new Error(`Groq API 錯誤: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) {
            throw new Error('AI 沒有回應');
        }

        console.log('Gemini response received');

        // Parse the JSON response from Gemini
        const route = parseGeminiResponse(text, preferences);
        return route;

    } catch (error) {
        console.error('Error generating route with Gemini:', error);
        throw error;
    }
}

/**
 * Build the prompt for Gemini AI
 */
function buildRoutePrompt(preferences: RoutePreferences): string {
    const categoryLabels: Record<string, string> = {
        food: '美食餐廳',
        culture: '文化古蹟',
        shopping: '購物商圈',
        nature: '自然景觀',
        nightlife: '夜生活',
        photography: '攝影景點',
    };

    const durationLabels: Record<string, string> = {
        quick: '1-2小時快速瀏覽',
        half_day: '半天行程（約4小時）',
        full_day: '一天行程（約8小時）',
    };

    const walkingLabels: Record<string, string> = {
        low: '少走路，以交通工具為主',
        medium: '適中，步行與交通並用',
        high: '願意多走路，享受散步',
    };

    const placesCount = preferences.duration === 'quick' ? '2-3' :
        preferences.duration === 'half_day' ? '4-5' : '6-8';

    const selectedCategories = preferences.categories
        .map(c => categoryLabels[c] || c)
        .join('、');

    return `你是一位擁有 10 年經驗的專業旅遊規劃師和在地導遊，擅長挖掘城市中的隱藏寶石與規劃流暢的行程。請根據以下資訊，為遊客規劃一條極具深度且詳細的推薦路線。

## 使用者需求
- **目的地**: ${preferences.destination}
- **興趣類別**: ${selectedCategories}
- **行程時長**: ${durationLabels[preferences.duration]}
- **步行量偏好**: ${walkingLabels[preferences.walkingLevel]}

## 規劃要求（請務必遵守）
1. **地點挑選**: 根據目的地「${preferences.destination}」，推薦 ${placesCount} 個真實存在、評價優良且符合興趣的地點。
2. **深度內容**: 每個地點的「推薦理由」必須包含其獨特性（例如：某道必點菜色、某個最佳拍照角度、或是其歷史背景）。
3. **流暢度**: 地點之間的安排必須考慮地理位置的連貫性，減少不必要的往返路程。
4. **實用建議**: 提供具體的「在地小撇步」（例如：哪條巷子進去比較快、哪個時段光線最美、是否需要預約）。
5. **時間管理**: 精確估算每個地點的停留時間與總行程時間。
6. **豐富描述**: 路線描述應吸引人且具備故事感，讓使用者能想像當天的體驗。

## 回覆格式
請嚴格以 JSON 格式回覆，格式如下：
{
  "title": "路線標題（例如：信義區文青散策：從老眷村到現代藝術的時空旅行）",
  "description": "詳細的路線特色介紹（100-150字，說明這條路線的氛圍、適合的對象以及為什麼值得造訪）",
  "theme": "路線主題（例如：老屋新生、極致美食、攝影秘境）",
  "places": [
    {
      "name": "地點名稱（必須是真實存在的地點）",
      "address": "詳細地址",
      "category": "類別（餐廳/咖啡廳/博物館/公園/商場等）",
      "reason": "深度推薦理由（40-80字，請具體說明該地點的特色與必看/必吃點）",
      "estimatedStayTime": 60,
      "tips": "實用小建議（例如：建議從 2 號出口步行較近，或是某道隱藏菜單）"
    }
  ],
  "totalEstimatedTime": 240,
  "walkingLevel": "${preferences.walkingLevel}",
  "highlights": ["亮點1：具體描述", "亮點2：具體描述", "亮點3：具體描述"],
  "tips": ["專業導遊建議1：關於交通或天氣的提醒", "專業導遊建議2：關於服裝或裝備的建議", "專業導遊建議3：關於預約或門票的資訊"],
  "budgetRange": {
    "min": 500,
    "max": 1500,
    "currency": "TWD"
  }
}

請只回覆 JSON，不要有任何前言或後記。`;
}

/**
 * Parse Gemini response and convert to AIGeneratedRoute
 */
function parseGeminiResponse(text: string, preferences: RoutePreferences): AIGeneratedRoute {
    try {
        // Try to extract JSON from the response
        let jsonStr = text.trim();

        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.slice(7);
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
            jsonStr = jsonStr.slice(0, -3);
        }
        jsonStr = jsonStr.trim();

        // Try to find JSON object in the response
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('無法從 AI 回應中解析 JSON');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate and transform the response
        const route: AIGeneratedRoute = {
            id: `gemini_route_${Date.now()}`,
            title: parsed.title || `探索${preferences.destination}`,
            description: parsed.description || `精選${preferences.destination}周邊景點`,
            theme: parsed.theme || '在地探索',
            places: (parsed.places || []).map((place: any) => ({
                name: place.name || '未命名地點',
                address: place.address || '',
                category: place.category || '景點',
                reason: place.reason || '當地熱門地點',
                estimatedStayTime: place.estimatedStayTime || 45,
                tips: place.tips || '',
                lat: place.lat,
                lng: place.lng,
            })),
            totalEstimatedTime: parsed.totalEstimatedTime ||
                (parsed.places?.reduce((sum: number, p: any) => sum + (p.estimatedStayTime || 45), 0) || 180),
            walkingLevel: parsed.walkingLevel || preferences.walkingLevel,
            highlights: parsed.highlights || [],
            tips: parsed.tips || [],
            budgetRange: parsed.budgetRange || undefined,
        };

        return route;
    } catch (error) {
        console.error('Error parsing Gemini response:', error);
        console.log('Raw response:', text);

        // Return a fallback response
        return {
            id: `gemini_route_${Date.now()}`,
            title: `探索${preferences.destination}`,
            description: `根據您的偏好規劃的${preferences.destination}行程`,
            theme: '在地探索',
            places: [],
            totalEstimatedTime: 180,
            walkingLevel: preferences.walkingLevel,
            highlights: [],
            tips: ['AI 回應解析失敗，請重試'],
            budgetRange: undefined,
        };
    }
}

/**
 * Stream route generation for real-time updates (future enhancement)
 */
export async function streamRouteGeneration(
    preferences: RoutePreferences,
    _onChunk: (chunk: string) => void
): Promise<AIGeneratedRoute> {
    // For now, use the regular generation
    // Can be enhanced to use streaming API for real-time updates
    return generateRouteWithGemini(preferences);
}
