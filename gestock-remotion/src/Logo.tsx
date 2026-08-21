import React from 'react';
import {
	AbsoluteFill,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
	Easing,
} from 'remotion';

export const LogoGesTock: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();

	// --- Entrance: scale + opacity spring ---
	const entrance = spring({
		frame,
		fps,
		config: {damping: 14, mass: 0.9, stiffness: 90},
		durationInFrames: 35,
	});
	const scale = interpolate(entrance, [0, 1], [0.6, 1]);
	const opacity = interpolate(frame, [0, 18], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// --- Gentle floating (breathing) after entrance ---
	const floatY = Math.sin((frame - 35) / 22) * 8;

	// --- Glow pulse (continuous breathing glow on the cyan lines) ---
	const glowPulse =
		18 + Math.sin(frame / 14) * 10 + interpolate(frame, [0, 35], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) * 6;

	// --- Diagonal light sweep across the logo (like a reflection) ---
	const sweepStart = 55;
	const sweepDuration = 26;
	const sweepProgress = interpolate(
		frame,
		[sweepStart, sweepStart + sweepDuration],
		[-1.4, 1.4],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.inOut(Easing.cubic),
		}
	);
	const sweepOpacity = interpolate(
		frame,
		[sweepStart, sweepStart + 6, sweepStart + sweepDuration - 6, sweepStart + sweepDuration],
		[0, 0.9, 0.9, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
	);

	// --- Background radial glow intensifying with entrance ---
	const bgGlow = interpolate(frame, [0, 40], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// --- Subtle background grid drift ---
	const gridShift = (frame * 0.4) % 60;

	const logoSize = Math.min(width, height) * 0.62;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#07090b',
				overflow: 'hidden',
			}}
		>
			{/* Base radial ambience */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(circle at 50% 45%, rgba(34,211,238,0.10) 0%, rgba(7,9,11,0) 60%)',
				}}
			/>

			{/* Animated radial glow that grows in with the logo */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at 50% 48%, rgba(34,211,238,${
						0.22 * bgGlow
					}) 0%, rgba(7,9,11,0) 55%)`,
				}}
			/>

			{/* Faint drifting grid for a techy backdrop */}
			<AbsoluteFill
				style={{
					opacity: 0.08 * bgGlow,
					backgroundImage:
						'linear-gradient(rgba(34,211,238,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.6) 1px, transparent 1px)',
					backgroundSize: '60px 60px',
					backgroundPosition: `${gridShift}px ${gridShift}px`,
				}}
			/>

			{/* Logo + sweep */}
			<AbsoluteFill
				style={{
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<div
					style={{
						position: 'relative',
						width: logoSize,
						height: logoSize,
						transform: `scale(${scale}) translateY(${floatY}px)`,
						opacity,
					}}
				>
					<Img
						src={staticFile('logo.png')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							filter: `drop-shadow(0 0 ${glowPulse}px rgba(34,211,238,0.85)) drop-shadow(0 0 ${
								glowPulse * 2
							}px rgba(34,211,238,0.35))`,
						}}
					/>

					{/* Diagonal shine sweep, masked to the logo's own silhouette */}
					<div
						style={{
							position: 'absolute',
							inset: 0,
							opacity: sweepOpacity,
							WebkitMaskImage: `url(${staticFile('logo.png')})`,
							maskImage: `url(${staticFile('logo.png')})`,
							WebkitMaskSize: 'contain',
							maskSize: 'contain',
							WebkitMaskRepeat: 'no-repeat',
							maskRepeat: 'no-repeat',
							WebkitMaskPosition: 'center',
							maskPosition: 'center',
							background: `linear-gradient(115deg, transparent ${
								40 + sweepProgress * 40
							}%, rgba(255,255,255,0.95) ${50 + sweepProgress * 40}%, transparent ${
								60 + sweepProgress * 40
							}%)`,
						}}
					/>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
