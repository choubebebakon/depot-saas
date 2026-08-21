import React from 'react';
import {
	AbsoluteFill,
	Img,
	Sequence,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {
	CaptionBar,
	COLORS,
	KPICard,
	Panel,
	SceneTitle,
	enter,
} from './components';

// ============ Fond persistant ============
const Background: React.FC = () => {
	const frame = useCurrentFrame();
	const gridShift = (frame * 0.3) % 60;
	return (
		<AbsoluteFill style={{backgroundColor: COLORS.bg}}>
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(circle at 20% 10%, rgba(34,211,238,0.07) 0%, rgba(10,15,26,0) 45%)',
				}}
			/>
			<AbsoluteFill
				style={{
					opacity: 0.05,
					backgroundImage:
						'linear-gradient(rgba(34,211,238,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.6) 1px, transparent 1px)',
					backgroundSize: '56px 56px',
					backgroundPosition: `${gridShift}px ${gridShift}px`,
				}}
			/>
		</AbsoluteFill>
	);
};

const Logo: React.FC<{size: number}> = ({size}) => (
	<Img
		src={staticFile('logo.png')}
		style={{
			width: size,
			height: size,
			objectFit: 'contain',
			filter:
				'drop-shadow(0 0 22px rgba(34,211,238,0.7)) drop-shadow(0 0 44px rgba(34,211,238,0.3))',
		}}
	/>
);

// ============ Scène 1 : intro logo ============
const SceneIntro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = spring({frame, fps, config: {damping: 14, stiffness: 90}});
	const scale = interpolate(e, [0, 1], [0.7, 1]);
	const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
			<div style={{transform: `scale(${scale})`, opacity, textAlign: 'center'}}>
				<Logo size={220} />
			</div>
		</AbsoluteFill>
	);
};

// ============ Scène 2 : dashboard KPI ============
const SceneDashboard: React.FC = () => {
	const cards = [
		{label: 'CA du jour', value: '1 284 500 F', accent: COLORS.green},
		{label: 'Transactions', value: '312', accent: COLORS.blue},
		{label: 'Ruptures stock', value: '6', accent: COLORS.red},
		{label: 'Promos actives', value: '11', accent: COLORS.purple},
	];

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Supermarché"
				title="Votre supermarché, en temps réel"
				delay={0}
			/>
			<div style={{position: 'relative', marginTop: 60, height: 150}}>
				{cards.map((c, i) => (
					<KPICard
						key={c.label}
						label={c.label}
						value={c.value}
						accent={c.accent}
						delay={10 + i * 5}
						x={i * 316}
					/>
				))}
			</div>
		</AbsoluteFill>
	);
};

// ============ Scène 3 : rayons ============
const CategoryTile: React.FC<{
	label: string;
	count: string;
	accent: string;
	delay: number;
	x: number;
	y: number;
}> = ({label, count, accent, delay, x, y}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps, delay);
	const opacity = interpolate(e, [0, 1], [0, 1]);
	const scale = interpolate(e, [0, 1], [0.85, 1]);

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: 520,
				height: 150,
				background: COLORS.panel,
				border: `1px solid ${COLORS.panelBorder}`,
				borderRadius: 16,
				opacity,
				transform: `scale(${scale})`,
				display: 'flex',
				alignItems: 'center',
				padding: '0 28px',
				gap: 20,
			}}
		>
			<div
				style={{
					width: 12,
					height: 90,
					borderRadius: 6,
					background: accent,
				}}
			/>
			<div>
				<div style={{color: COLORS.text, fontSize: 26, fontWeight: 700}}>
					{label}
				</div>
				<div style={{color: COLORS.textDim, fontSize: 17, marginTop: 6}}>
					{count} articles référencés
				</div>
			</div>
		</div>
	);
};

const SceneRayons: React.FC = () => {
	const rayons = [
		{label: 'Alimentaire', count: '482', accent: COLORS.green},
		{label: 'Hygiène', count: '210', accent: COLORS.blue},
		{label: 'Électronique', count: '96', accent: COLORS.purple},
		{label: 'Bazar', count: '164', accent: COLORS.orange},
		{label: 'Liquide', count: '138', accent: COLORS.cyan},
		{label: 'Frais', count: '221', accent: COLORS.red},
	];

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Organisation"
				title="Tout organisé par rayons"
				delay={0}
			/>
			<div style={{position: 'relative', marginTop: 50, height: 480}}>
				{rayons.map((r, i) => (
					<CategoryTile
						key={r.label}
						{...r}
						delay={10 + i * 6}
						x={(i % 2) * 560}
						y={Math.floor(i / 2) * 170}
					/>
				))}
			</div>
		</AbsoluteFill>
	);
};

// ============ Scène 4 : promotions ============
const PromoCard: React.FC<{
	type: string;
	badge: string;
	product: string;
	accent: string;
	delay: number;
	x: number;
}> = ({type, badge, product, accent, delay, x}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps, delay);
	const opacity = interpolate(e, [0, 1], [0, 1]);
	const translateY = interpolate(e, [0, 1], [30, 0]);

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: 0,
				width: 480,
				height: 340,
				background: COLORS.panel,
				border: `1px solid ${COLORS.panelBorder}`,
				borderRadius: 20,
				opacity,
				transform: `translateY(${translateY}px)`,
				padding: 32,
				boxSizing: 'border-box',
			}}
		>
			<div
				style={{
					color: COLORS.textDim,
					fontSize: 15,
					letterSpacing: 1.5,
					textTransform: 'uppercase',
					fontWeight: 700,
				}}
			>
				{type}
			</div>
			<div
				style={{
					marginTop: 18,
					display: 'inline-block',
					background: accent,
					color: '#08111f',
					fontSize: 42,
					fontWeight: 800,
					padding: '10px 22px',
					borderRadius: 12,
				}}
			>
				{badge}
			</div>
			<div style={{color: COLORS.text, fontSize: 22, marginTop: 26}}>
				{product}
			</div>
		</div>
	);
};

const ScenePromotions: React.FC = () => {
	const promos = [
		{
			type: 'Pourcentage',
			badge: '-20%',
			product: 'Huile végétale 1L',
			accent: COLORS.green,
		},
		{
			type: 'Montant fixe',
			badge: '-500 F',
			product: 'Lessive en poudre 2kg',
			accent: COLORS.orange,
		},
		{
			type: 'Prix fixe',
			badge: '1 000 F',
			product: 'Pack 6 yaourts',
			accent: COLORS.cyan,
		},
	];

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Promotions"
				title="Trois types de promotions, à la carte"
				delay={0}
			/>
			<div style={{position: 'relative', marginTop: 60, height: 340}}>
				{promos.map((p, i) => (
					<PromoCard key={p.type} {...p} delay={12 + i * 10} x={i * 520} />
				))}
			</div>
		</AbsoluteFill>
	);
};

// ============ Scène 5 : POS rapide ============
const SceneCaisse: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const items = [
		{name: 'Eau minérale 1.5L', price: 500},
		{name: 'Pain de mie', price: 1200},
		{name: 'Riz parfumé 5kg', price: 4500},
		{name: 'Savon liquide', price: 1800},
	];

	let total = 0;

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Point de vente"
				title="Une caisse rapide, même aux heures de pointe"
				delay={0}
			/>
			<div style={{display: 'flex', gap: 40, marginTop: 50}}>
				<Panel x={0} y={0} width={900} height={470} title="Ticket en cours" delay={10}>
					{items.map((it, i) => {
						const e = enter(frame, fps, 20 + i * 10);
						const opacity = interpolate(e, [0, 1], [0, 1]);
						const x = interpolate(e, [0, 1], [-24, 0]);
						if (e > 0.05) total += it.price;
						return (
							<div
								key={it.name}
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									padding: '14px 4px',
									borderBottom: `1px solid ${COLORS.panelBorder}`,
									opacity,
									transform: `translateX(${x}px)`,
								}}
							>
								<span style={{color: COLORS.text, fontSize: 20}}>
									{it.name}
								</span>
								<span style={{color: COLORS.textDim, fontSize: 20}}>
									{it.price.toLocaleString('fr-FR')} F
								</span>
							</div>
						);
					})}
					<div
						style={{
							marginTop: 24,
							display: 'flex',
							justifyContent: 'space-between',
							paddingTop: 16,
							borderTop: `2px solid ${COLORS.panelBorder}`,
						}}
					>
						<span style={{color: COLORS.text, fontSize: 24, fontWeight: 700}}>
							Total
						</span>
						<span
							style={{
								color: COLORS.cyan,
								fontSize: 28,
								fontWeight: 800,
							}}
						>
							{total.toLocaleString('fr-FR')} F
						</span>
					</div>
				</Panel>

				<Panel x={940} y={0} width={480} height={470} title="Scan code-barres" delay={20}>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							height: 340,
							gap: 18,
						}}
					>
						<div
							style={{
								display: 'flex',
								gap: 4,
								alignItems: 'flex-end',
							}}
						>
							{[6, 3, 8, 4, 2, 7, 3, 5, 8, 3, 6, 4].map((w, i) => (
								<div
									key={i}
									style={{
										width: w,
										height: 90,
										background: COLORS.cyan,
										opacity: 0.9,
									}}
								/>
							))}
						</div>
						<div style={{color: COLORS.textDim, fontSize: 16}}>
							Compatible codes-barres multiples par article
						</div>
					</div>
				</Panel>
			</div>
		</AbsoluteFill>
	);
};

// ============ Scène 6 : outro ============
const SceneOutro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = spring({frame, fps, config: {damping: 14, stiffness: 100}});
	const opacity = interpolate(e, [0, 1], [0, 1]);
	const scale = interpolate(e, [0, 1], [0.85, 1]);

	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
			<div style={{textAlign: 'center', opacity, transform: `scale(${scale})`}}>
				<Logo size={130} />
				<div
					style={{
						color: COLORS.text,
						fontSize: 26,
						fontWeight: 600,
						marginTop: 24,
					}}
				>
					Votre supermarché, sous contrôle.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ============ Timeline complète ============
export const DemoSupermarche: React.FC = () => {
	return (
		<AbsoluteFill>
			<Background />

			<Sequence from={0} durationInFrames={90}>
				<SceneIntro />
				<CaptionBar text="GesTock — Supermarché" visible />
			</Sequence>

			<Sequence from={90} durationInFrames={180}>
				<SceneDashboard />
				<CaptionBar
					text="Votre chiffre d'affaires, vos transactions et vos ruptures de stock, en direct."
					visible
				/>
			</Sequence>

			<Sequence from={270} durationInFrames={180}>
				<SceneRayons />
				<CaptionBar
					text="Organisez votre supermarché par rayons, en un coup d'œil."
					visible
				/>
			</Sequence>

			<Sequence from={450} durationInFrames={180}>
				<ScenePromotions />
				<CaptionBar
					text="Créez des promotions en pourcentage, montant fixe ou prix fixe."
					visible
				/>
			</Sequence>

			<Sequence from={630} durationInFrames={180}>
				<SceneCaisse />
				<CaptionBar
					text="Un point de vente rapide, même aux heures de pointe."
					visible
				/>
			</Sequence>

			<Sequence from={810} durationInFrames={90}>
				<SceneOutro />
			</Sequence>

			{/*
			  Voix off : place ton fichier audio dans /public/voiceover.mp3
			  puis décommente la ligne ci-dessous (et ajoute Audio à
			  l'import 'remotion' en haut du fichier).

			  <Audio src={staticFile('voiceover.mp3')} />
			*/}
		</AbsoluteFill>
	);
};
