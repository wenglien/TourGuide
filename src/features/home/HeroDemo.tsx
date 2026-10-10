import React, { useMemo, useState } from 'react';
import { RouteLine, type Segment } from '../route-line/RouteLine';
import { DayScrubber } from '../route-line/DayScrubber';
import { clockAt, linePosition, type Stop } from '../route-line/dayClock';
import { Segmented } from '../../ui/Segmented';
import { useLanguage } from '../../services/i18n';
import { toMinutes } from '../../lib/itinerary';
import { SAMPLES } from './samples';

/** The home page's live demo: switch a sample route, drag the train through its day. */
export const HeroDemo: React.FC = () => {
    const { t, language } = useLanguage();
    const li = language === 'en' ? 1 : 0;
    const [sampleId, setSampleId] = useState(SAMPLES[0].id);
    const sample = SAMPLES.find((s) => s.id === sampleId) || SAMPLES[0];
    const [minute, setMinute] = useState(() => toMinutes(SAMPLES[0].startAt));

    const { segments, stops } = useMemo(() => {
        const stops: Stop[] = [];
        const segments: Segment[] = sample.segments.map((seg, si) => ({
            key: `${sample.id}-${si}`,
            slot: seg.slot,
            slotLabel: t(`slot.${seg.slot}`),
            title: seg.title[li],
            stations: seg.stops.map((st, i) => {
                const arrive = toMinutes(st.arrive);
                stops.push({ name: st.name[li], arrive, depart: arrive + st.stay, slot: seg.slot });
                return {
                    key: `${sample.id}-${si}-${i}`,
                    name: st.name[li],
                    time: st.arrive,
                    legBefore: st.leg?.[li],
                    meta: <span>{st.meta[li]}</span>,
                };
            }),
        }));
        return { segments, stops };
    }, [sample, li, t]);

    const now = linePosition(stops, clockAt(stops, minute));

    return (
        <figure className="home-hero__sample">
            <div className="hero-demo__switch">
                <Segmented
                    label={t('home2.demo.switch')}
                    value={sampleId}
                    onChange={(id) => {
                        setSampleId(id);
                        const next = SAMPLES.find((s) => s.id === id);
                        if (next) setMinute(toMinutes(next.startAt));
                    }}
                    options={SAMPLES.map((s) => ({ value: s.id, label: s.label[li] }))}
                />
            </div>
            <DayScrubber stops={stops} value={minute} onChange={setMinute} className="hero-demo__scrub" />
            {/* keyed so switching samples replays the line drawing in */}
            <RouteLine key={sample.id} segments={segments} now={now} animate />
            <figcaption className="subtle">{sample.caption[li]}</figcaption>
        </figure>
    );
};

export default HeroDemo;
