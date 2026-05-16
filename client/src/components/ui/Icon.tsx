import React from 'react';
import * as FaIcons from 'react-icons/fa6';

export type IconType = 'solid' | 'regular' | 'brands';

interface FaIconProps extends React.HTMLAttributes<HTMLElement> {
    iconName: keyof typeof FaIcons;
    type?: IconType; // optional grouping (for future use)
    size?: number | string;
    color?: string;
    inlineColor?: string;
}

export const Icon: React.FC<FaIconProps> = ({
        iconName,
        className = '',
        size = 24,
        color,
        inlineColor,
        style,
        ...rest
    }) => {

    const IconComponent = FaIcons[iconName];

    if (!IconComponent) {
        console.warn(`Icon "${iconName}" not found in react-icons/fa6`);
        return null;
    }

    const inlineStyles: React.CSSProperties = {
        fontSize: typeof size === 'number' ? `${size}px` : size,
        color: inlineColor,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style,
    };

    return (
        <span
            className={`${className} ${color} shrink-0 transition-colors duration-200`}
            style={inlineStyles}
            {...rest}
            >
            <IconComponent size={size} />
        </span>
    );
};

export default Icon;