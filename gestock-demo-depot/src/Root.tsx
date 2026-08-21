import React from 'react';
import {Composition} from 'remotion';
import {DemoDepotBoissons} from './Demo';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="DemoDepotBoissons"
			component={DemoDepotBoissons}
			durationInFrames={870}
			fps={30}
			width={1920}
			height={1080}
			defaultProps={{}}
		/>
	);
};
