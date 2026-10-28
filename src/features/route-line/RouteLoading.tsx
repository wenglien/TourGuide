import React from 'react';
import './RouteLine.css';

/** Waiting state: an 8-bit loading bar that fills slot by slot while the traveller runs along it. */
export const RouteLoading: React.FC<{ title: string; detail?: string }> = ({ title, detail }) => (
    <div className="route-loading" role="status" aria-live="polite">
        <div className="px-loader" aria-hidden="true">
            <span className="px-loader__sprite" />
            <span className="px-loader__bar px-meter"><span /></span>
        </div>
        <div>
            <p className="route-loading__title">{title}</p>
            {detail && <p className="muted">{detail}</p>}
        </div>
    </div>
);

export default RouteLoading;
