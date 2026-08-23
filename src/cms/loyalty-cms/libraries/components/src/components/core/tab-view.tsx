import { TabPanel, TabPanelProps, TabView, TabViewProps } from 'primereact/tabview';
import React from 'react';
type AppTabViewProps = TabViewProps & { tabPanels?: TabPanelProps[] };

const AppTabView: React.FC<AppTabViewProps> = ({ tabPanels, ...props }: AppTabViewProps) => {
  return (
    <TabView {...props}>
      {tabPanels?.map((_, index) => {
        return <TabPanel key={index} {...tabPanels[index]} />;
      })}
    </TabView>
  );
};

export { AppTabView };
