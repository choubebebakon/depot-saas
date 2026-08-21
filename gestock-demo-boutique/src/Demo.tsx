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
		{label: 'CA du jour', value: '96 300 F', accent: COLORS.green},
		{label: 'Ventes du jour', value: '27', accent: COLORS.blue},
		{label: 'Clients actifs', value: '54', accent: COLORS.purple},
		{label: 'Ruptures stock', value: '2', accent: COLORS.red},
	];

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Boutique"
				title="Votre boutique, en un clin d'œil"
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

// ============ Scène 3 : types de boutique + catégories dynamiques ============
const TypeTab: React.FC<{
	label: string;
	active: boolean;
	delay: number;
	x: number;
}> = ({label, active, delay, x}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps, delay);
	const opacity = interpolate(e, [0, 1], [0, 1]);
	const translateY = interpolate(e, [0, 1], [-16, 0]);

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: 0,
				opacity,
				transform: `translateY(${translateY}px)`,
				padding: '12px 26px',
				borderRadius: 999,
				background: active ? COLORS.cyan : COLORS.panel,
				border: `1px solid ${active ? COLORS.cyan : COLORS.panelBorder}`,
				color: active ? '#08111f' : COLORS.textDim,
				fontSize: 18,
				fontWeight: 700,
			}}
		>
			{label}
		</div>
	);
};

const CategoryTag: React.FC<{label: string; delay: number; x: number}> = ({
	label,
	delay,
	x,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps, delay);
	const opacity = interpolate(e, [0, 1], [0, 1]);
	const scale = interpolate(e, [0, 1], [0.7, 1]);

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: 0,
				opacity,
				transform: `scale(${scale})`,
				padding: '20px 34px',
				borderRadius: 16,
				background: COLORS.panel,
				border: `1px solid ${COLORS.panelBorder}`,
				color: COLORS.text,
				fontSize: 22,
				fontWeight: 600,
			}}
		>
			{label}
		</div>
	);
};

const SceneCategories: React.FC = () => {
	const types = ['Mode', 'Électronique', 'Alimentaire', 'Beauté', 'Librairie'];
	const categories = ['Hommes', 'Femmes', 'Enfants', 'Accessoires'];

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Configuration"
				title="Des catégories qui s'adaptent à votre commerce"
				delay={0}
			/>
			<div style={{position: 'relative', marginTop: 60, height: 60}}>
				{types.map((t, i) => (
					<TypeTab
						key={t}
						label={t}
						active={i === 0}
						delay={10 + i * 5}
						x={i * 210}
					/>
				))}
			</div>
			<div
				style={{
					color: COLORS.textDim,
					fontSize: 18,
					marginTop: 60,
				}}
			>
				Boutique Mode → catégories pré-configurées :
			</div>
			<div style={{position: 'relative', marginTop: 24, height: 90}}>
				{categories.map((c, i) => (
					<CategoryTag key={c} label={c} delay={45 + i * 8} x={i * 280} />
				))}
			</div>
		</AbsoluteFill>
	);
};

// ============ Scène 4 : crédit client ============
const SceneCredit: React.FC = () => {
	const clients = [
		{name: 'Mme Ngo Ateba', amount: '18 000 F'},
		{name: 'M. Fotso Éric', amount: '32 500 F'},
		{name: 'Mlle Biya Carine', amount: '7 000 F'},
	];

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Clients"
				title="Le crédit client, sous contrôle"
				delay={0}
			/>
			<Panel x={0} y={50} width={900} height={340} title="Crédit en cours" delay={15}>
				{clients.map((c, i) => {
					const frame = useCurrentFrame();
					const {fps} = useVideoConfig();
					const e = enter(frame, fps, 25 + i * 8);
					const opacity = interpolate(e, [0, 1], [0, 1]);
					const x = interpolate(e, [0, 1], [-30, 0]);
					return (
						<div
							key={c.name}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: '16px 4px',
								borderBottom: `1px solid ${COLORS.panelBorder}`,
								opacity,
								transform: `translateX(${x}px)`,
							}}
						>
							<span style={{color: COLORS.text, fontSize: 20}}>{c.name}</span>
							<span
								style={{
									color: COLORS.orange,
									fontSize: 20,
									fontWeight: 700,
									background: 'rgba(251,146,60,0.12)',
									padding: '6px 16px',
									borderRadius: 999,
								}}
							>
								{c.amount}
							</span>
						</div>
					);
				})}
			</Panel>
		</AbsoluteFill>
	);
};

// ============ Scène 5 : interface simplifiée / vente ============
const SceneVente: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const items = [
		{name: 'Robe imprimée', price: 12000},
		{name: 'Sac à main', price: 8500},
	];
	let total = 0;

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Ventes"
				title="Simple, rapide, sans détour"
				delay={0}
			/>
			<Panel x={0} y={50} width={760} height={340} title="Nouvelle vente" delay={15}>
				{items.map((it, i) => {
					const e = enter(frame, fps, 25 + i * 10);
					const opacity = interpolate(e, [0, 1], [0, 1]);
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
							}}
						>
							<span style={{color: COLORS.text, fontSize: 20}}>{it.name}</span>
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
					<span style={{color: COLORS.cyan, fontSize: 28, fontWeight: 800}}>
						{total.toLocaleString('fr-FR')} F
					</span>
				</div>
			</Panel>
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
					Votre boutique, simplifiée.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ============ Timeline complète ============
export const DemoBoutique: React.FC = () => {
	return (
		<AbsoluteFill>
			<Background />

			<Sequence from={0} durationInFrames={90}>
				<SceneIntro />
				<CaptionBar text="GesTock — Boutique" visible />
			</Sequence>

			<Sequence from={90} durationInFrames={180}>
				<SceneDashboard />
				<CaptionBar
					text="Votre chiffre d'affaires, vos ventes et votre stock, en un clin d'œil."
					visible
				/>
			</Sequence>

			<Sequence from={270} durationInFrames={180}>
				<SceneCategories />
				<CaptionBar
					text="Mode, Électronique, Beauté, Librairie : les catégories s'adaptent à votre commerce."
					visible
				/>
			</Sequence>

			<Sequence from={450} durationInFrames={180}>
				<SceneCredit />
				<CaptionBar text="Gérez le crédit de vos clients sans perdre le fil." visible />
			</Sequence>

			<Sequence from={630} durationInFrames={180}>
				<SceneVente />
				<CaptionBar
					text="Une interface simple, pensée pour les petites structures."
					visible
				/>
			</Sequence>

			<Sequence from={810} durationInFrames={60}>
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
