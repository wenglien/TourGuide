import React from 'react';
import './RouteLine.css';

/** Waiting state: a line that keeps extending, station by station. */
export const RouteLoading: React.FC<{ title: string; detail?: string }> = ({ title, detail }) => (
    <div className="route-loading" role="status" aria-live="polite">
        <div className="route-loading__line" aria-hidden="true">
            <span data-slot="morning" />
            <span data-slot="afternoon" />
            <span data-slot="evening" />
        </div>
        <div>
            <p className="route-loading__title">{title}</p>
            {detail && <p className="muted">{detail}</p>}
        </div>
    </div>
);

export default RouteLoading;
