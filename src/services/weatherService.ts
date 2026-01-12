const API_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // Free tier key for demo

export interface WeatherData {
    temp: number;
    description: string;
    icon: string;
    isRainy: boolean;
}

export async function getWeather(city: string, date: string): Promise<WeatherData | null> {
    try {
        // For free tier, we can only get current weather or 5 day forecast
        // We'll use 5 day forecast to find the closest match
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=zh_tw`
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

        // Find forecast closest to noon on the selected date
        const targetDate = new Date(date);

        // Filter for the specific date
        const forecasts = data.list.filter((item: any) => {
            const itemDate = new Date(item.dt * 1000);
            return itemDate.getDate() === targetDate.getDate() &&
                itemDate.getMonth() === targetDate.getMonth() &&
                itemDate.getFullYear() === targetDate.getFullYear();
        });

        // If date is too far in future (free tier limit), fallback to generic "partly cloudy"
        if (forecasts.length === 0) {
            console.warn('Date out of forecast range, returning mock data');
            return {
                temp: 25,
                description: '多雲時晴',
                icon: '02d',
                isRainy: false
            };
        }

        // Pick the noon forecast or the first one available
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
            isRainy
        };

    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}
