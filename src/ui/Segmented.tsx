import React from 'react';

interface SegmentedProps<T extends string> {
    label: string;
    value: T;
    options: { value: T; label: React.ReactNode }[];
    onChange: (value: T) => void;
    block?: boolean;
}

export function Segmented<T extends string>({ label, value, options, onChange, block }: SegmentedProps<T>) {
    const onKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
        onChange(options[next].value);
        const group = (e.currentTarget as HTMLElement).parentElement;
        (group?.children[next] as HTMLElement | undefined)?.focus();
    };

    return (
        <div className={`segmented ${block ? 'segmented--block' : ''}`} role="radiogroup" aria-label={label}>
            {options.map((opt, i) => (
                <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={value === opt.value}
                    tabIndex={value === opt.value ? 0 : -1}
                    onClick={() => onChange(opt.value)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

export default Segmented;
