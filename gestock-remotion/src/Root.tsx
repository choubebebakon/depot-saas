import React from 'react';
import {Composition} from 'remotion';
import {LogoGesTock} from './Logo';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="LogoGesTock"
				component={LogoGesTock}
				durationInFrames={150}
				fps={30}
				width={1080}
				height={1080}
				defaultProps={{}}
			/>
		</>
	);
};
