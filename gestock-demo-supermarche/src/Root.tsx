import React from 'react';
import {Composition} from 'remotion';
import {DemoSupermarche} from './Demo';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="DemoSupermarche"
			component={DemoSupermarche}
			durationInFrames={900}
			fps={30}
			width={1920}
			height={1080}
			defaultProps={{}}
		/>
	);
};
