const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY || 'bd5e378503939ddaee76f12ad7a97608';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
    temp: number;
    description: string;
    icon: string;
    isRainy: boolean;
    humidity?: number;
    windSpeed?: number;
    feelsLike?: number;
}

async function parseForecastResponse(data: any, date: string): Promise<WeatherData | null> {
    const targetDate = new Date(date);

    const forecasts = data.list.filter((item: any) => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate.getDate() === targetDate.getDate() &&
            itemDate.getMonth() === targetDate.getMonth() &&
            itemDate.getFullYear() === targetDate.getFullYear();
    });

    if (forecasts.length === 0) {
        console.warn('Date out of forecast range, returning default data');
        return {
            temp: 25,
            description: '多雲時晴',
            icon: '02d',
            isRainy: false,
        };
    }

    const forecast = forecasts.find((item: any) => {
        const hours = new Date(item.dt * 1000).getHours();
        return hours >= 11 && hours <= 14;
    }) || forecasts[0];

    const isRainy = forecast.weather[0].main.toLowerCase().includes('rain') ||
        forecast.weather[0].description.includes('雨');

    return {
        temp: Math.round(forecast.main.temp),
        description: forecast.weather[0].description,
        icon: forecast.weather[0].icon,
        isRainy,
        humidity: forecast.main.humidity,
        windSpeed: Math.round(forecast.wind?.speed ?? 0),
        feelsLike: Math.round(forecast.main.feels_like ?? forecast.main.temp),
    };
}

/**
 * Get weather by city name for a specific date (supports 5-day forecast)
 */
export async function getWeather(city: string, date: string): Promise<WeatherData | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=zh_tw`
        );

        if (response.status === 429) {
            console.warn('Weather API rate limit exceeded, skipping weather check');
            return null;
        }
        if (!response.ok) {
            console.warn('Weather API request failed:', response.status);
            return null;
        }

        const data = await response.json();
        return parseForecastResponse(data, date);
    } catch (error) {
        console.error('Error fetching weather by city:', error);
        return null;
    }
}

/**
 * Get current weather by coordinates (lat/lng) — for companion mode live monitoring
 */
export async function getCurrentWeatherByCoords(lat: number, lng: number): Promise<WeatherData | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=zh_tw`
        );

        if (response.status === 429) {
            console.warn('Weather API rate limit exceeded');
            return null;
        }
        if (!response.ok) {
            console.warn('Weather API request failed:', response.status);
            return null;
        }

        const data = await response.json();
        const isRainy = data.weather[0].main.toLowerCase().includes('rain') ||
            data.weather[0].description.includes('雨');

        return {
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            isRainy,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind?.speed ?? 0),
            feelsLike: Math.round(data.main.feels_like ?? data.main.temp),
        };
    } catch (error) {
        console.error('Error fetching weather by coords:', error);
        return null;
    }
}

/**
 * Get weather forecast by coordinates for a specific date
 */
export async function getWeatherByCoords(lat: number, lng: number, date: string): Promise<WeatherData | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=zh_tw`
        );

        if (response.status === 429) {
            console.warn('Weather API rate limit exceeded');
            return null;
        }
        if (!response.ok) {
            console.warn('Weather API request failed:', response.status);
            return null;
        }

        const data = await response.json();
        return parseForecastResponse(data, date);
    } catch (error) {
        console.error('Error fetching weather by coords:', error);
        return null;
    }
}
