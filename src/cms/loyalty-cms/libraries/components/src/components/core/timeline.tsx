import React from 'react';

import { Timeline, TimelineProps } from 'primereact/timeline';

type AppTimelineProps = TimelineProps;

const AppTimeline: React.FC<AppTimelineProps> = ({ ...props }: AppTimelineProps) => {
  return <Timeline {...props}></Timeline>;
};

export { AppTimeline };
