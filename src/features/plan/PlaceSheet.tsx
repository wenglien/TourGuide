import React from 'react';
import { Navigation, ExternalLink, RefreshCw, Stamp as StampIcon, Star } from 'lucide-react';
import { Sheet } from '../../ui/Sheet';
import { BudgetService } from '../../services/budgetService';
import { useLanguage } from '../../services/i18n';
import { mapsDirectionsUrl, placeAddress, type TrailPlace } from '../../lib/itinerary';
import type { Planner } from './usePlanner';

export const PlaceSheet: React.FC<{ planner: Planner; onCheckIn?: (p: TrailPlace) => void }> = ({ planner: p, onCheckIn }) => {
    const { t } = useLanguage();
    const place = p.selectedPlace;
    const close = () => p.setSelectedPlace(null);
    if (!place) return null;

    const crowd = p.crowdInfo[place.place_id];
    const transport = p.transportOptions[place.place_id] || [];
    const booking = p.bookingInfo;
    const trailId = p.slots.find(({ trail }) => trail.places.some((x) => x.place_id === place.place_id))?.trail.id;
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.place_id)}`;

    return (
        <Sheet
            open
            onClose={close}
            flush
            title={place.name}
            closeLabel={t('common.close')}
            footer={(
                <div className="sheet__actions sheet__actions--wrap">
                    {trailId && (
                        <button
                            className="btn btn-secondary"
                            disabled={p.busyPlaceId !== null}
                            onClick={() => { close(); p.replacePlace(trailId, place.place_id); }}
                        >
                            <RefreshCw size={16} aria-hidden="true" /> {t('trip.swapPlace')}
                        </button>
                    )}
                    {onCheckIn && (
                        <button className="btn btn-secondary" onClick={() => { close(); onCheckIn(place); }}>
                            <StampIcon size={16} aria-hidden="true" /> {t('plan2.place.stamp')}
                        </button>
                    )}
                    <a className="btn btn-primary" href={mapsDirectionsUrl(place)} target="_blank" rel="noopener noreferrer">
                        <Navigation size={16} aria-hidden="true" /> {t('place.navigate.start')}
                    </a>
                </div>
            )}
        >
            {place.photos && place.photos.length > 0 && (
                <div className="place-photos">
                    {place.photos.slice(0, 3).map((src: string, i: number) => (
                        <img key={i} src={src} alt="" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
                    ))}
                </div>
            )}

            <div className="place-detail">
                <div className="place-detail__facts">
                    {place.rating && (
                        <span className="meta-rating">
                            <Star size={14} aria-hidden="true" /> {place.rating}
                            {place.totalRatings ? <span className="subtle">（{t('plan2.place.reviews', { n: place.totalRatings.toLocaleString() })}）</span> : null}
                        </span>
                    )}
                    {place.openingHours && (
                        <span className={place.openingHours.open_now ? 'is-open' : 'is-closed'}>
                            {place.openingHours.open_now ? t('place.openNow') : t('place.closed')}
                        </span>
                    )}
                    {place.priceLevel != null && <span>{'$'.repeat(Math.max(1, place.priceLevel + 1))}</span>}
                </div>
                {placeAddress(place) && <p className="muted">{placeAddress(place)}</p>}

                {crowd && (
                    <section className="place-detail__block">
                        <h3>{t('place.crowdLevel')}</h3>
                        <p>
                            {crowd.currentBusyness && <strong>{t(`place.crowdLevel.${crowd.currentBusyness}`)}</strong>}
                            {crowd.estimatedWaitTime > 0 && <>{t('plan2.place.wait', { n: crowd.estimatedWaitTime })}</>}
                        </p>
                        {crowd.recommendation && <p className="muted">{crowd.recommendation}</p>}
                        {crowd.peakHours?.length > 0 && (
                            <p className="subtle">{t('place.crowdLevel.peak')}：{crowd.peakHours.map((h: number) => `${h}:00`).join('、')}</p>
                        )}
                    </section>
                )}

                {transport.length > 0 && (
                    <section className="place-detail__block">
                        <h3>{t('plan2.place.getThere')}</h3>
                        <ul className="transport">
                            {transport.map((opt) => (
                                <li key={opt.mode}>
                                    <span>{t(`plan2.leg.${opt.mode.toLowerCase()}`)}</span>
                                    <span className="num">{opt.duration} {t('common.unit.minutes')}</span>
                                    <span className="num">{opt.cost > 0 ? `NT$ ${opt.cost}` : t('place.transport.free')}</span>
                                    {opt.mode === 'Uber' && place.location && (
                                        <a
                                            className="btn btn-ghost btn-sm"
                                            href={BudgetService.getInstance().getUberDeepLink(place.location, place.name)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {t('place.transport.callUber')}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {booking && (booking.bookingUrl || booking.hasCoupon) && (
                    <section className="place-detail__block">
                        <h3>{t('place.budget.title')}</h3>
                        {booking.hasCoupon && <p>{t('place.budget.couponCode')}：<strong>{booking.couponCode}</strong></p>}
                        {booking.bookingUrl && (
                            <a className="btn btn-secondary btn-sm" href={booking.bookingUrl} target="_blank" rel="noopener noreferrer">
                                {t('place.budget.bookNow')}
                            </a>
                        )}
                    </section>
                )}

                {place.openingHours?.weekday_text && (
                    <section className="place-detail__block">
                        <h3>{t('plan2.place.hours')}</h3>
                        <ul className="hours">
                            {place.openingHours.weekday_text.map((line: string) => <li key={line}>{line}</li>)}
                        </ul>
                    </section>
                )}

                {place.reviews?.length > 0 && (
                    <section className="place-detail__block">
                        <h3>{t('place.reviews.title')}</h3>
                        <ul className="reviews">
                            {place.reviews.slice(0, 3).map((r: any, i: number) => (
                                <li key={i}>
                                    <p className="reviews__head">
                                        <strong>{r.author_name}</strong>
                                        <span className="subtle">{r.rating} ★，{r.relative_time_description}</span>
                                    </p>
                                    <p className="muted">{r.text}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <a className="btn btn-ghost btn-sm place-detail__gmaps" href={searchUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} aria-hidden="true" /> {t('place.viewOnGoogleMaps')}
                </a>
            </div>
        </Sheet>
    );
};

export default PlaceSheet;
