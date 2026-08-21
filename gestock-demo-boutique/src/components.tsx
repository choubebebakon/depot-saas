import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const COLORS = {
	bg: '#0a0f1a',
	panel: '#121a2b',
	panelBorder: '#1e2a42',
	cyan: '#22d3ee',
	green: '#34d399',
	orange: '#fb923c',
	blue: '#60a5fa',
	purple: '#c084fc',
	red: '#f87171',
	textDim: '#8895ab',
	text: '#e8edf5',
};

export const enter = (frame: number, fps: number, delay: number) =>
	spring({
		frame: frame - delay,
		fps,
		config: {damping: 16, mass: 0.7, stiffness: 120},
		durationInFrames: 22,
	});

export const KPICard: React.FC<{
	label: string;
	value: string;
	accent: string;
	delay: number;
	x: number;
}> = ({label, value, accent, delay, x}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps, delay);
	const opacity = interpolate(e, [0, 1], [0, 1]);
	const translateY = interpolate(e, [0, 1], [26, 0]);

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: 0,
				width: 300,
				height: 150,
				background: COLORS.panel,
				border: `1px solid ${COLORS.panelBorder}`,
				borderRadius: 16,
				opacity,
				transform: `translateY(${translateY}px)`,
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: 4,
					background: accent,
				}}
			/>
			<div style={{padding: '26px 24px'}}>
				<div
					style={{
						color: COLORS.textDim,
						fontSize: 15,
						letterSpacing: 1.2,
						fontWeight: 600,
						textTransform: 'uppercase',
					}}
				>
					{label}
				</div>
				<div
					style={{
						color: COLORS.text,
						fontSize: 44,
						fontWeight: 800,
						marginTop: 14,
						fontFamily: 'Arial, sans-serif',
					}}
				>
					{value}
				</div>
			</div>
		</div>
	);
};

export const Panel: React.FC<{
	x: number;
	y: number;
	width: number;
	height: number;
	title: string;
	delay: number;
	children?: React.ReactNode;
}> = ({x, y, width, height, title, delay, children}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps, delay);
	const opacity = interpolate(e, [0, 1], [0, 1]);
	const translateY = interpolate(e, [0, 1], [26, 0]);

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width,
				height,
				background: COLORS.panel,
				border: `1px solid ${COLORS.panelBorder}`,
				borderRadius: 16,
				opacity,
				transform: `translateY(${translateY}px)`,
				padding: 28,
				boxSizing: 'border-box',
			}}
		>
			<div
				style={{
					color: COLORS.text,
					fontSize: 22,
					fontWeight: 700,
					marginBottom: 20,
				}}
			>
				{title}
			</div>
			{children}
		</div>
	);
};

export const SceneTitle: React.FC<{
	kicker: string;
	title: string;
	delay: number;
}> = ({kicker, title, delay}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps, delay);
	const opacity = interpolate(e, [0, 1], [0, 1]);
	const translateX = interpolate(e, [0, 1], [-40, 0]);

	return (
		<div style={{opacity, transform: `translateX(${translateX}px)`}}>
			<div
				style={{
					color: COLORS.cyan,
					fontSize: 18,
					fontWeight: 700,
					letterSpacing: 3,
					textTransform: 'uppercase',
				}}
			>
				{kicker}
			</div>
			<div
				style={{
					color: COLORS.text,
					fontSize: 46,
					fontWeight: 800,
					marginTop: 8,
					fontFamily: 'Arial, sans-serif',
				}}
			>
				{title}
			</div>
		</div>
	);
};

export const CaptionBar: React.FC<{text: string; visible: boolean}> = ({
	text,
	visible,
}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame % 1000, [0, 8], [0, 1], {
		extrapolateRight: 'clamp',
	});
	if (!visible) return null;
	return (
		<div
			style={{
				position: 'absolute',
				bottom: 56,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				opacity,
			}}
		>
			<div
				style={{
					background: 'rgba(10,15,26,0.85)',
					border: `1px solid ${COLORS.panelBorder}`,
					borderRadius: 999,
					padding: '14px 34px',
					color: COLORS.text,
					fontSize: 24,
					fontWeight: 600,
					maxWidth: 1200,
					textAlign: 'center',
				}}
			>
				{text}
			</div>
		</div>
	);
};
