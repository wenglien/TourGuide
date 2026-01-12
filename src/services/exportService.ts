// Export Service for PDF and Google Calendar
import jsPDF from 'jspdf';
import type { GeneratedItinerary, MultiDayItinerary, TrailScore } from '../types';
import { getAITrail } from './aiItineraryService';
import { getTrailById } from '../data/trails';

/**
 * Helper function to format local date for Google Calendar (YYYYMMDDTHHMMSS)
 * Google Calendar needs local time without 'Z' suffix for proper timezone handling
 */
function formatLocalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Helper function to collect itinerary data for export
 */
function collectItineraryData(itinerary: GeneratedItinerary | MultiDayItinerary, city: string, date: string): {
    title: string;
    dateStr: string;
    days: Array<{
        dayNumber: number;
        slots: Array<{
            slotName: string;
            places: Array<{ name: string; address: string }>;
        }>;
    }>;
} {
    const slotNames: Record<string, string> = {
        morning: '上午',
        afternoon: '下午',
        evening: '傍晚',
        night: '晚上'
    };
    const timeSlots = ['morning', 'afternoon', 'evening', 'night'] as const;

    const data = {
        title: `${city} 行程規劃`,
        dateStr: date,
        days: [] as Array<{
            dayNumber: number;
            slots: Array<{
                slotName: string;
                places: Array<{ name: string; address: string }>;
            }>;
        }>
    };

    if ('days' in itinerary) {
        // Multi-day itinerary
        itinerary.days.forEach((day) => {
            const dayData = {
                dayNumber: day.dayNumber,
                slots: [] as Array<{
                    slotName: string;
                    places: Array<{ name: string; address: string }>;
                }>
            };

            timeSlots.forEach(slot => {
                const slotData = day.itinerary[slot] as TrailScore | undefined;
                if (slotData && 'trailId' in slotData) {
                    const trail = getAITrail(slotData.trailId) || getTrailById(slotData.trailId);
                    const places = trail?.places || [];
                    if (places.length > 0) {
                        dayData.slots.push({
                            slotName: slotNames[slot],
                            places: places.map((p: any) => ({
                                name: p.name,
                                address: p.address || p.formatted_address || ''
                            }))
                        });
                    }
                }
            });

            if (dayData.slots.length > 0) {
                data.days.push(dayData);
            }
        });
    } else {
        // Single-day itinerary
        const dayData = {
            dayNumber: 1,
            slots: [] as Array<{
                slotName: string;
                places: Array<{ name: string; address: string }>;
            }>
        };

        timeSlots.forEach(slot => {
            const slotData = itinerary[slot] as TrailScore | undefined;
            if (slotData && 'trailId' in slotData) {
                const trail = getAITrail(slotData.trailId) || getTrailById(slotData.trailId);
                const places = trail?.places || [];
                if (places.length > 0) {
                    dayData.slots.push({
                        slotName: slotNames[slot],
                        places: places.map((p: any) => ({
                            name: p.name,
                            address: p.address || p.formatted_address || ''
                        }))
                    });
                }
            }
        });

        if (dayData.slots.length > 0) {
            data.days.push(dayData);
        }
    }

    return data;
}

/**
 * Export itinerary to PDF using HTML rendering for proper Chinese support
 */
export async function exportToPDF(
    itinerary: GeneratedItinerary | MultiDayItinerary,
    city: string,
    date: string
): Promise<void> {
    // Show loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = '正在生成 PDF...';
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#333;color:#fff;padding:20px 40px;border-radius:8px;z-index:10000;font-size:16px;';
    document.body.appendChild(loadingMsg);

    try {
        // Collect data
        const data = collectItineraryData(itinerary, city, date);

        // Create a temporary container for HTML rendering
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 595px;
            padding: 40px;
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif;
            color: #333;
            line-height: 1.6;
        `;

        // Build HTML content
        let html = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 28px; margin: 0 0 10px 0; color: #1a1a1a;">${data.title}</h1>
                <p style="font-size: 16px; color: #666; margin: 0;">日期：${data.dateStr}</p>
            </div>
        `;

        data.days.forEach((day, dayIndex) => {
            if (data.days.length > 1) {
                html += `
                    <div style="margin-top: ${dayIndex > 0 ? '30px' : '0'}; padding: 10px 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-bottom: 15px;">
                        <h2 style="margin: 0; font-size: 18px;">第 ${day.dayNumber} 天</h2>
                    </div>
                `;
            }

            day.slots.forEach(slot => {
                html += `
                    <div style="margin-bottom: 20px;">
                        <h3 style="font-size: 16px; color: #667eea; margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #667eea;">${slot.slotName}</h3>
                        <ul style="margin: 0; padding: 0; list-style: none;">
                `;

                slot.places.forEach(place => {
                    html += `
                        <li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
                            <span style="position: absolute; left: 0; color: #667eea;">●</span>
                            <div style="font-size: 15px; font-weight: 500; color: #333;">${place.name}</div>
                            ${place.address ? `<div style="font-size: 13px; color: #888; margin-top: 2px;">${place.address}</div>` : ''}
                        </li>
                    `;
                });

                html += `
                        </ul>
                    </div>
                `;
            });
        });

        // Add footer
        html += `
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                由 TourGuide 生成 • ${new Date().toLocaleDateString('zh-TW')}
            </div>
        `;

        container.innerHTML = html;
        document.body.appendChild(container);

        // Use html2canvas to render the HTML
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Remove the temporary container
        document.body.removeChild(container);

        // Create PDF from canvas
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20; // 10mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Handle multi-page content
        let yPosition = 10;
        let remainingHeight = imgHeight;
        let sourceY = 0;

        while (remainingHeight > 0) {
            const availableHeight = pageHeight - 20; // 10mm margin top and bottom
            const heightToRender = Math.min(remainingHeight, availableHeight);

            // Calculate source rectangle in canvas pixels
            const sourceHeight = (heightToRender / imgHeight) * canvas.height;

            // Create a temporary canvas for this page section
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = sourceHeight;
            const ctx = pageCanvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(
                    canvas,
                    0, sourceY, canvas.width, sourceHeight,
                    0, 0, canvas.width, sourceHeight
                );

                const pageImgData = pageCanvas.toDataURL('image/png');
                doc.addImage(pageImgData, 'PNG', 10, yPosition, imgWidth, heightToRender);
            }

            remainingHeight -= heightToRender;
            sourceY += sourceHeight;

            if (remainingHeight > 0) {
                doc.addPage();
                yPosition = 10;
            }
        }

        // Save PDF
        doc.save(`${city}_${date}_行程.pdf`);

        // Remove loading indicator
        if (document.body.contains(loadingMsg)) {
            document.body.removeChild(loadingMsg);
        }
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        // Remove loading indicator on error
        if (document.body.contains(loadingMsg)) {
            document.body.removeChild(loadingMsg);
        }
        alert('PDF 導出失敗，請稍後再試');
        throw error;
    }
}

/**
 * Export itinerary to Google Calendar
 */
export function exportToGoogleCalendar(
    itinerary: GeneratedItinerary | MultiDayItinerary,
    city: string,
    date: string
): void {
    try {
        const baseDate = new Date(date + 'T00:00:00');
        const events: Array<{
            title: string;
            start: Date;
            end: Date;
            description: string;
            location: string;
        }> = [];

        const slotTimes: Record<string, { start: number; end: number }> = {
            morning: { start: 9, end: 12 },
            afternoon: { start: 13, end: 17 },
            evening: { start: 17, end: 20 },
            night: { start: 20, end: 23 }
        };

        if ('days' in itinerary) {
            // Multi-day itinerary
            itinerary.days.forEach((day, dayIndex) => {
                const currentDate = new Date(baseDate);
                currentDate.setDate(currentDate.getDate() + dayIndex);

                const timeSlots = ['morning', 'afternoon', 'evening', 'night'] as const;

                timeSlots.forEach(slot => {
                    const slotData = day.itinerary[slot] as TrailScore | undefined;
                    if (slotData && 'trailId' in slotData) {
                        const trail = getAITrail(slotData.trailId) || getTrailById(slotData.trailId);
                        const places = trail?.places || [];
                        if (places.length > 0) {
                            const times = slotTimes[slot];
                            const startTime = new Date(currentDate);
                            startTime.setHours(times.start, 0, 0, 0);
                            const endTime = new Date(currentDate);
                            endTime.setHours(times.end, 0, 0, 0);

                            const placeNames = places.map((p: any) => p.name).join('、');
                            const addresses = places
                                .map((p: any) => p.address || p.formatted_address || p.name)
                                .filter(Boolean)
                                .join(' / ');

                            events.push({
                                title: `${city} - ${placeNames}`,
                                start: startTime,
                                end: endTime,
                                description: `行程：${placeNames}\n地址：${addresses}`,
                                location: places[0]?.address || places[0]?.formatted_address || city
                            });
                        }
                    }
                });
            });
        } else {
            // Single-day itinerary
            const timeSlots = ['morning', 'afternoon', 'evening', 'night'] as const;

            timeSlots.forEach(slot => {
                const slotData = itinerary[slot] as TrailScore | undefined;
                if (slotData && 'trailId' in slotData) {
                    const trail = getAITrail(slotData.trailId) || getTrailById(slotData.trailId);
                    const places = trail?.places || [];
                    if (places.length > 0) {
                        const times = slotTimes[slot];
                        const startTime = new Date(baseDate);
                        startTime.setHours(times.start, 0, 0, 0);
                        const endTime = new Date(baseDate);
                        endTime.setHours(times.end, 0, 0, 0);

                        const placeNames = places.map((p: any) => p.name).join('、');
                        const addresses = places
                            .map((p: any) => p.address || p.formatted_address || p.name)
                            .filter(Boolean)
                            .join(' / ');

                        events.push({
                            title: `${city} - ${placeNames}`,
                            start: startTime,
                            end: endTime,
                            description: `行程：${placeNames}\n地址：${addresses}`,
                            location: places[0]?.address || places[0]?.formatted_address || city
                        });
                    }
                }
            });
        }

        // Generate Google Calendar URL
        if (events.length === 0) {
            alert('沒有可匯出的行程事件');
            return;
        }

        // Open the first event immediately (user-initiated, won't be blocked)
        const openCalendarEvent = (event: typeof events[0]) => {
            // Use local time format (without Z) so Google Calendar respects the local timezone
            const startStr = formatLocalDateTime(event.start);
            const endStr = formatLocalDateTime(event.end);

            const params = new URLSearchParams({
                action: 'TEMPLATE',
                text: event.title,
                dates: `${startStr}/${endStr}`,
                details: event.description,
                location: event.location,
                // Don't specify ctz - let Google use user's default timezone
            });

            const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        };

        if (events.length === 1) {
            // Single event - open directly
            openCalendarEvent(events[0]);
        } else {
            // Multiple events - show selection dialog
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                border-radius: 16px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            `;

            content.innerHTML = `
                <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">選擇要加入日曆的行程</h3>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">共有 ${events.length} 個時段，請選擇要加入 Google 日曆的行程：</p>
                <div id="calendar-events-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button id="add-all-btn" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;">全部加入</button>
                    <button id="close-dialog-btn" style="flex: 1; padding: 12px; background: #f0f0f0; color: #333; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;">關閉</button>
                </div>
            `;

            dialog.appendChild(content);
            document.body.appendChild(dialog);

            // Populate events list
            const eventsList = content.querySelector('#calendar-events-list')!;
            events.forEach((event) => {
                const eventBtn = document.createElement('button');
                const timeStr = `${event.start.getHours().toString().padStart(2, '0')}:00 - ${event.end.getHours().toString().padStart(2, '0')}:00`;
                const dateStr = event.start.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });

                eventBtn.innerHTML = `
                    <div style="text-align: left;">
                        <div style="font-weight: 500; color: #333;">${event.title}</div>
                        <div style="font-size: 12px; color: #888; margin-top: 4px;">${dateStr} ${timeStr}</div>
                    </div>
                `;
                eventBtn.style.cssText = `
                    padding: 12px 16px;
                    background: #f8f8f8;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                `;
                eventBtn.onmouseover = () => eventBtn.style.background = '#f0f0f0';
                eventBtn.onmouseout = () => eventBtn.style.background = '#f8f8f8';
                eventBtn.onclick = () => {
                    openCalendarEvent(event);
                };
                eventsList.appendChild(eventBtn);
            });

            // Add all button
            content.querySelector('#add-all-btn')!.addEventListener('click', () => {
                events.forEach((event, index) => {
                    setTimeout(() => openCalendarEvent(event), index * 500);
                });
                document.body.removeChild(dialog);
            });

            // Close button
            content.querySelector('#close-dialog-btn')!.addEventListener('click', () => {
                document.body.removeChild(dialog);
            });

            // Close on backdrop click
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    document.body.removeChild(dialog);
                }
            });
        }
    } catch (error) {
        console.error('Error exporting to Google Calendar:', error);
        alert('匯出到 Google 日曆時發生錯誤');
    }
}
