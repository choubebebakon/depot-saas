import React from 'react';
import {Composition} from 'remotion';
import {DemoBoutique} from './Demo';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="DemoBoutique"
			component={DemoBoutique}
			durationInFrames={870}
			fps={30}
			width={1920}
			height={1080}
			defaultProps={{}}
		/>
	);
};
