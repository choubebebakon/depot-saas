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
		{label: 'Ventes du jour', value: '187 400 F', accent: COLORS.green},
		{label: 'Stock critique', value: '4 articles', accent: COLORS.orange},
		{label: 'Livraisons en cours', value: '3', accent: COLORS.blue},
		{label: 'Caisse du jour', value: '412 000 F', accent: COLORS.purple},
		{label: 'Clients débiteurs', value: '9', accent: COLORS.red},
		{label: 'Tournées actives', value: '2', accent: COLORS.cyan},
	];

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Dépôt de Boissons"
				title="Tout votre dépôt, en un coup d'œil"
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

// ============ Scène 3 : top articles + évolution stock ============
const Bar: React.FC<{
	label: string;
	pct: number;
	value: string;
	delay: number;
	accent: string;
}> = ({label, pct, value, delay, accent}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps, delay);
	const width = interpolate(e, [0, 1], [0, pct]);
	return (
		<div style={{marginBottom: 18}}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					color: COLORS.text,
					fontSize: 18,
					marginBottom: 6,
				}}
			>
				<span>{label}</span>
				<span style={{color: COLORS.textDim}}>{value}</span>
			</div>
			<div
				style={{
					height: 14,
					borderRadius: 8,
					background: '#1a2338',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						height: '100%',
						width: `${width}%`,
						background: accent,
						borderRadius: 8,
					}}
				/>
			</div>
		</div>
	);
};

const SceneArticles: React.FC = () => {
	const articles = [
		{label: 'Bière 33 Export', pct: 92, value: '842 u.', accent: COLORS.cyan},
		{label: 'Eau minérale 1.5L', pct: 78, value: '710 u.', accent: COLORS.green},
		{label: 'Soda Orange 33cl', pct: 64, value: '588 u.', accent: COLORS.orange},
		{label: 'Jus Ananas 1L', pct: 47, value: '401 u.', accent: COLORS.blue},
		{label: 'Bière Guinness', pct: 35, value: '312 u.', accent: COLORS.purple},
	];

	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps,40);
	const stockLevel = interpolate(e, [0, 1], [30, 82]);

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Rapports"
				title="Vos articles les plus vendus"
				delay={0}
			/>
			<div style={{display: 'flex', gap: 40, marginTop: 50}}>
				<Panel x={0} y={0} width={760} height={430} title="Top Articles" delay={10}>
					{articles.map((a, i) => (
						<Bar key={a.label} {...a} delay={20 + i * 6} />
					))}
				</Panel>
				<Panel
					x={800}
					y={0}
					width={500}
					height={430}
					title="Évolution du stock"
					delay={20}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'flex-end',
							height: 280,
							gap: 14,
						}}
					>
						{[40, 55, 48, 65, 60, 74, stockLevel].map((h, i) => (
							<div
								key={i}
								style={{
									flex: 1,
									height: `${h}%`,
									background:
										i === 6
											? COLORS.cyan
											: 'linear-gradient(180deg, #1e2a42, #16203380)',
									borderRadius: '6px 6px 0 0',
								}}
							/>
						))}
					</div>
					<div
						style={{
							color: COLORS.textDim,
							fontSize: 14,
							marginTop: 12,
							textAlign: 'center',
						}}
					>
						7 derniers jours
					</div>
				</Panel>
			</div>
		</AbsoluteFill>
	);
};

// ============ Scène 4 : tournées de livraison ============
const SceneTournees: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const e = enter(frame, fps,15);
	const pathProgress = interpolate(e, [0, 1], [0, 1]);

	const stops = [
		{x: 60, y: 210, label: 'Dépôt Principal', done: true},
		{x: 260, y: 90, label: 'Client - Bar Le Central', done: true},
		{x: 480, y: 180, label: 'Client - Supérette Nkolo', done: false},
		{x: 700, y: 70, label: 'Client - Restaurant Waza', done: false},
	];

	const truckX = interpolate(pathProgress, [0, 1], [60, 700]);

	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Livraisons"
				title="Planifiez vos tournées en un clic"
				delay={0}
			/>
			<Panel x={0} y={50} width={1700} height={430} title="Tournée #12 — Zone Akwa" delay={15}>
				<svg width={1640} height={280} viewBox="0 0 760 260">
					<path
						d="M60,210 C160,140 200,60 260,90 C340,130 420,220 480,180 C560,130 620,50 700,70"
						fill="none"
						stroke={COLORS.panelBorder}
						strokeWidth={4}
					/>
					<path
						d="M60,210 C160,140 200,60 260,90 C340,130 420,220 480,180 C560,130 620,50 700,70"
						fill="none"
						stroke={COLORS.cyan}
						strokeWidth={4}
						strokeDasharray={900}
						strokeDashoffset={900 - pathProgress * 900}
					/>
					{stops.map((s) => (
						<g key={s.label}>
							<circle
								cx={s.x}
								cy={s.y}
								r={10}
								fill={s.done ? COLORS.green : COLORS.panel}
								stroke={s.done ? COLORS.green : COLORS.textDim}
								strokeWidth={3}
							/>
							<text
								x={s.x}
								y={s.y - 22}
								fill={COLORS.text}
								fontSize={16}
								textAnchor="middle"
							>
								{s.label}
							</text>
						</g>
					))}
					<circle cx={truckX} cy={interpolate(truckX, [60,260,480,700],[210,90,180,70])} r={12} fill={COLORS.orange} />
				</svg>
			</Panel>
		</AbsoluteFill>
	);
};

// ============ Scène 5 : clients débiteurs ============
const SceneDebiteurs: React.FC = () => {
	const clients = [
		{name: 'Bar Le Central', amount: '45 000 F'},
		{name: 'Supérette Nkolo', amount: '128 500 F'},
		{name: 'Restaurant Waza', amount: '22 000 F'},
	];
	return (
		<AbsoluteFill style={{padding: '90px 110px'}}>
			<SceneTitle
				kicker="Clients"
				title="Le contrôle sur vos créances"
				delay={0}
			/>
			<Panel x={0} y={50} width={900} height={340} title="Clients débiteurs" delay={15}>
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
									color: COLORS.red,
									fontSize: 20,
									fontWeight: 700,
									background: 'rgba(248,113,113,0.12)',
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
					La gestion de votre dépôt, simplifiée.
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ============ Timeline complète ============
export const DemoDepotBoissons: React.FC = () => {
	return (
		<AbsoluteFill>
			<Background />

			<Sequence from={0} durationInFrames={90}>
				<SceneIntro />
				<CaptionBar text="GesTock — Dépôt de Boissons" visible />
			</Sequence>

			<Sequence from={90} durationInFrames={180}>
				<SceneDashboard />
				<CaptionBar
					text="Suivez vos ventes, votre stock et votre caisse, en temps réel."
					visible
				/>
			</Sequence>

			<Sequence from={270} durationInFrames={210}>
				<SceneArticles />
				<CaptionBar
					text="Visualisez vos articles les plus vendus et l'évolution de votre stock."
					visible
				/>
			</Sequence>

			<Sequence from={480} durationInFrames={210}>
				<SceneTournees />
				<CaptionBar text="Planifiez vos tournées de livraison en un clic." visible />
			</Sequence>

			<Sequence from={690} durationInFrames={120}>
				<SceneDebiteurs />
				<CaptionBar
					text="Gardez le contrôle sur les créances de vos clients."
					visible
				/>
			</Sequence>

			<Sequence from={810} durationInFrames={60}>
				<SceneOutro />
			</Sequence>

			{/*
			  Voix off : une fois ton fichier audio généré (ex. via ElevenLabs ou
			  HeyGen), place-le dans /public/voiceover.mp3 et décommente ce bloc.
			  Importe Audio depuis 'remotion' en haut du fichier.

			  <Audio src={staticFile('voiceover.mp3')} />
			*/}
		</AbsoluteFill>
	);
};
