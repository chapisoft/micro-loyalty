import React from 'react';

import { Sidebar, SidebarProps } from 'primereact/sidebar';

type AppSidebarProps = SidebarProps;

const AppSidebar: React.FC<SidebarProps> = ({ ...props }: AppSidebarProps) => {
  return <Sidebar {...props}></Sidebar>;
};

export { AppSidebar };
