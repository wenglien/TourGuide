import type { TimeOfDay } from '../../types';

type L = [zh: string, en: string];

export interface SampleStop {
    name: L;
    arrive: string;
    stay: number;
    meta: L;
    /** Travel from the previous stop. */
    leg?: L;
}

export interface SampleSegment {
    slot: TimeOfDay;
    title: L;
    stops: SampleStop[];
}

export interface SampleRoute {
    id: string;
    label: L;
    caption: L;
    /** Where the scrubber starts, so the demo opens mid-journey. */
    startAt: string;
    segments: SampleSegment[];
}

export const SAMPLES: SampleRoute[] = [
    {
        id: 'dadaocheng',
        label: ['大稻埕', 'Dadaocheng'],
        caption: ['範例：台北大稻埕，下午到晚上', 'Example: Dadaocheng, Taipei, afternoon into evening'],
        startAt: '14:38',
        segments: [
            {
                slot: 'afternoon', title: ['老街與茶行', 'Old street and tea houses'],
                stops: [
                    { name: ['迪化街', 'Dihua Street'], arrive: '13:30', stay: 60, meta: ['南北貨、布行，約 1 小時', 'Dried goods and fabric shops, about 1 hour'] },
                    { name: ['有記名茶', 'Wang Tea Co.'], arrive: '14:45', stay: 75, leg: ['步行 9 分', '9 min walk'], meta: ['百年焙茶廠，可預約導覽', 'A century-old tea roastery'] },
                ],
            },
            {
                slot: 'evening', title: ['河岸看夕陽', 'Sunset on the river'],
                stops: [
                    { name: ['大稻埕碼頭', 'Dadaocheng Wharf'], arrive: '17:20', stay: 80, meta: ['貨櫃市集，日落約 17:40', 'Container market, sunset around 17:40'] },
                    { name: ['寧夏夜市', 'Ningxia Night Market'], arrive: '19:00', stay: 90, leg: ['步行 14 分', '14 min walk'], meta: ['雨天可改永樂市場', 'If it rains, switch to Yongle Market'] },
                ],
            },
        ],
    },
    {
        id: 'tainan',
        label: ['台南府城', 'Tainan old town'],
        caption: ['範例：台南中西區，上午到下午', 'Example: West Central District, Tainan, morning to afternoon'],
        startAt: '10:34',
        segments: [
            {
                slot: 'morning', title: ['府城古蹟', 'Old capital landmarks'],
                stops: [
                    { name: ['赤崁樓', 'Chihkan Tower'], arrive: '09:30', stay: 60, meta: ['開門就到，避開旅行團', 'Arrive at opening to beat the tour groups'] },
                    { name: ['祀典武廟', 'Sacrificial Rites Martial Temple'], arrive: '10:38', stay: 45, leg: ['步行 8 分', '8 min walk'], meta: ['就在對街巷內', 'Just across the street'] },
                ],
            },
            {
                slot: 'afternoon', title: ['老百貨與孔廟', 'Department store and Confucius Temple'],
                stops: [
                    { name: ['林百貨', 'Hayashi Department Store'], arrive: '13:30', stay: 60, meta: ['頂樓神社遺跡，有冷氣', 'Rooftop shrine ruins, air-conditioned'] },
                    { name: ['臺南孔廟', 'Tainan Confucius Temple'], arrive: '14:42', stay: 50, leg: ['步行 12 分', '12 min walk'], meta: ['對面府中街有冰店', 'Ice shops on Fuzhong Street opposite'] },
                ],
            },
        ],
    },
    {
        id: 'ximen',
        label: ['西門到中山', 'Ximen to Zhongshan'],
        caption: ['範例：台北西門到中山，傍晚到深夜', 'Example: Ximen to Zhongshan, Taipei, evening to late night'],
        startAt: '18:02',
        segments: [
            {
                slot: 'evening', title: ['紅樓與商圈', 'Red House and the shops'],
                stops: [
                    { name: ['西門紅樓', 'Ximen Red House'], arrive: '17:00', stay: 50, meta: ['文創市集週末才有', 'Craft market on weekends only'] },
                    { name: ['中山站商圈', 'Zhongshan Station area'], arrive: '18:10', stay: 80, leg: ['捷運 12 分，約 NT$20', 'MRT 12 min, about NT$20'], meta: ['選物店多在巷內', 'Most select shops are down the lanes'] },
                ],
            },
            {
                slot: 'night', title: ['巷弄小酒館', 'Lane bars'],
                stops: [
                    { name: ['赤峰街', 'Chifeng Street'], arrive: '19:45', stay: 70, meta: ['老五金行改建的酒吧', 'Bars in old hardware shops'] },
                    { name: ['光點台北', 'SPOT Taipei'], arrive: '21:05', stay: 60, leg: ['步行 6 分', '6 min walk'], meta: ['晚場電影 21:30 前後', 'Late screenings around 21:30'] },
                ],
            },
        ],
    },
];
