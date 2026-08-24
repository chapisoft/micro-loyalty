import { Accordion, AccordionProps, AccordionTab, AccordionTabProps } from 'primereact/accordion';
import React from 'react';
type AppAccordionProps = AccordionProps & { accordionTabs?: AccordionTabProps[] };

const AppAccordion: React.FC<AppAccordionProps> = ({ accordionTabs, ...props }: AppAccordionProps) => {
  return (
    <Accordion {...props}>
      {accordionTabs?.map((_, index) => {
        return <AccordionTab key={index} {...accordionTabs[index]} />;
      })}
    </Accordion>
  );
};

export { AppAccordion };
