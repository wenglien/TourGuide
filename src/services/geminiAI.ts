// Gemini AI API Service
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
import { GROQ_MODEL, GROQ_MODEL_OPTIONS } from './llm';


export interface GeminiTrailRecommendation {
  title: string;
  theme: string;
  description: string;
  places: Array<{
    name: string;
    type: string;
    reason: string;
    estimatedTime: number;
  }>;
  totalTime: number;
  walkingLevel: 'low' | 'medium' | 'high';
  timeTags: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  highlights: string[];
}

export interface UserPreferences {
  city: string;
  date: string;
  categories: string[];
  pace: 'relaxed' | 'moderate' | 'packed';
  startTime?: string;
  maxWalkingLevel?: 'low' | 'medium' | 'high';
  proximity?: 'close' | 'far';
}

/**
 * Generate trail recommendations using Gemini AI
 */
export async function generateTrailRecommendations(
  preferences: UserPreferences,
  availablePlaces: Array<{
    name: string;
    address: string;
    type: string;
    rating?: number;
    location: { lat: number; lng: number };
  }>
): Promise<GeminiTrailRecommendation[]> {
  try {
    const prompt = `你是一位擁有 10 年經驗的專業旅遊規劃師。根據以下資訊，為用戶生成 3-5 個極具深度、主題鮮明且詳細的路線推薦：

用戶偏好：
- 城市：${preferences.city}
- 日期：${preferences.date}
- 興趣類別：${preferences.categories.join('、')}
- 行程步調：${preferences.pace === 'relaxed' ? '悠閒' : preferences.pace === 'moderate' ? '中等' : '緊湊'}
- 開始時間：${preferences.startTime || '未指定'}
- 最大步行量：${preferences.maxWalkingLevel || '未限制'}
- 景點距離偏好：${preferences.proximity === 'close' ? '景點需集中（近距離）' : '可接受跨區景點（遠距離）'}

可用地點（請優先考慮這些地點，但可根據主題加入其他真實存在的知名景點）：
${availablePlaces.map(p => `- ${p.name} (${p.type}) - 評分: ${p.rating || 'N/A'}`).join('\n')}

請為每個路線提供詳細的資訊（以 JSON 格式回覆）：
{
  "recommendations": [
    {
      "title": "富有吸引力的路線標題",
      "theme": "鮮明的主題（如：午後文青咖啡巡禮、城市歷史深度探索等）",
      "description": "詳細的路線特色介紹（80-120字，說明這條路線的氛圍、為什麼這樣安排以及預期體驗）",
      "places": [
        {
          "name": "地點名稱",
          "type": "地點類型",
          "reason": "深度推薦原因（40-60字，說明該地點的具體亮點或必看之處）",
          "estimatedTime": 60
        }
      ],
      "totalTime": 240,
      "walkingLevel": "low|medium|high",
      "timeTags": ["morning", "afternoon", "evening", "night"],
      "budgetRange": {
        "min": 300,
        "max": 1000
      },
      "highlights": ["具體亮點1：詳細描述", "具體亮點2：詳細描述", "具體亮點3：詳細描述"]
    }
  ]
}

請確保：
1. 路線主題鮮明，且完全符合用戶的興趣類別。
2. 地點之間的交通銜接合理，考慮到步行或短程接駁。
3. 推薦理由要具體且具備專業導遊的見解。
4. 預算與時間安排需精確且符合邏輯。
5. 提供多樣化的視角，讓用戶有驚喜感。
6. 如果用戶偏好「近距離」，請確保景點之間的地理位置非常接近；如果偏好「遠距離」，則可以安排跨區但具備高度關聯性的特色景點。`;

    const response = await fetch(
      GROQ_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          ...GROQ_MODEL_OPTIONS,
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
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error details:', errorData);
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response from Groq API');
    }

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.recommendations || [];
    }

    throw new Error('Could not parse Groq response');
  } catch (error) {
    console.error('Error generating trail recommendations:', error);
    return [];
  }
}

/**
 * Analyze places and generate route suggestions
 */
export async function analyzePlacesForRoute(
  places: Array<{
    name: string;
    address: string;
    type: string;
    rating?: number;
    location: { lat: number; lng: number };
  }>,
  preferences: {
    timeOfDay: string;
    walkingLevel: string;
    budget?: string;
  }
): Promise<{
  suggestedOrder: number[];
  estimatedTime: number;
  walkingDistance: number;
  recommendations: string;
}> {
  try {
    const prompt = `分析以下地點，為用戶規劃最佳路線順序：

地點列表：
${places.map((p, i) => `${i + 1}. ${p.name} (${p.type}) - ${p.address}`).join('\n')}

用戶偏好：
- 時段：${preferences.timeOfDay}
- 步行量：${preferences.walkingLevel}
- 預算：${preferences.budget || '未指定'}

請提供：
1. 最佳參觀順序（地點編號陣列）
2. 預估總時間（分鐘）
3. 預估步行距離（公里）
4. 路線建議說明

以 JSON 格式回覆：
{
  "suggestedOrder": [1, 3, 2],
  "estimatedTime": 240,
  "walkingDistance": 2.5,
  "recommendations": "建議說明..."
}`;

    const response = await fetch(
      GROQ_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          ...GROQ_MODEL_OPTIONS,
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
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error details:', errorData);
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response from Groq API');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Could not parse Groq response');
  } catch (error) {
    console.error('Error analyzing places:', error);
    return {
      suggestedOrder: places.map((_, i) => i),
      estimatedTime: 180,
      walkingDistance: 2,
      recommendations: '無法分析路線，請參考預設順序',
    };
  }
}

/**
 * Get personalized recommendations based on user preferences
 */
export async function getPersonalizedRecommendations(
  userQuery: string,
  context?: {
    location?: string;
    previousPreferences?: string[];
  }
): Promise<string> {
  try {
    const prompt = `作為專業的旅遊顧問，請根據以下查詢提供建議：

用戶查詢：${userQuery}
${context?.location ? `位置：${context.location}` : ''}
${context?.previousPreferences ? `先前偏好：${context.previousPreferences.join('、')}` : ''}

請提供具體、實用的建議，包括：
1. 推薦的地點或活動
2. 最佳參觀時間
3. 實用建議和注意事項
4. 相關的替代方案

請用繁體中文回覆，語氣友善且專業。`;

    const response = await fetch(
      GROQ_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          ...GROQ_MODEL_OPTIONS,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful travel assistant.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error details:', errorData);
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '無法生成建議';
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return '抱歉，目前無法提供建議';
  }
}


