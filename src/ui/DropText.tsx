import React from 'react';

/** Headline text whose letters drop in one by one like bricks (motion.css .drop-char).
    Screen readers get the plain string; the split letters are hidden from them. */
export const DropText: React.FC<{ text: string }> = ({ text }) => (
    <>
        <span className="sr-only">{text}</span>
        <span aria-hidden="true">
            {Array.from(text).map((ch, i) =>
                ch === '\n' || ch === ' '
                    ? ch
                    : <span key={i} className="drop-char" style={{ '--i': i } as React.CSSProperties}>{ch}</span>,
            )}
        </span>
    </>
);

export default DropText;
