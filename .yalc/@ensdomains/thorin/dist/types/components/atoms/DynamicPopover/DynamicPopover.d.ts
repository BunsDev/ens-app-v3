import * as React from 'react';
export declare type DynamicPopoverSide = 'top' | 'right' | 'bottom' | 'left';
export declare type DynamicPopoverAlignment = 'start' | 'center' | 'end';
export declare type DynamicPopoverAnimationFunc = (horizonalClearance: number, verticalClearance: number, side: DynamicPopoverSide, mobileSide: DynamicPopoverSide) => {
    translate: string;
    mobileTranslate: string;
};
export declare type DynamicPopoverButtonProps = {
    pressed?: boolean;
    onClick?: React.MouseEventHandler<HTMLElement>;
};
export interface DynamicPopoverProps {
    /** A react node that has includes the styling and content of the popover */
    popover: React.ReactNode;
    /** The side and alignment of the popover in relation to the target */
    placement?: DynamicPopoverSide;
    /** The side and alignment of the popover in relation to the target on mobile screen sizes */
    mobilePlacement?: DynamicPopoverSide;
    /** A function that returns string of the css state for open and closed popover */
    animationFn?: DynamicPopoverAnimationFunc;
    /** A React reference to the tooltip element */
    tooltipRef?: React.RefObject<HTMLDivElement>;
    /** The id of the target element the tooltip will emerge from */
    targetId: string;
    /** Function that will be called when the DynamicPopover is shown */
    onShowCallback?: () => void;
    /** Width of the DynamicPopover*/
    width?: number;
    /** Width of the DynamicPopover on mobile*/
    mobileWidth?: number;
    /** Dynamic popover will switch sides if there is not enough room*/
    useIdealSide?: boolean;
    /** Add to the default gap between the popover and its target */
    additionalGap?: number;
}
export declare const DynamicPopover: {
    ({ popover, placement, mobilePlacement, animationFn: _animationFn, tooltipRef, targetId, onShowCallback, width, mobileWidth, useIdealSide, additionalGap, }: DynamicPopoverProps): React.ReactPortal;
    displayName: string;
};
