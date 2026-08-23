import { Outlet, useLocation } from 'react-router-dom';
import './animation-outlet.scss';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['router-outlet']: any;
    }
  }
}

const AnimationOutlet = () => {
  const location = useLocation();

  return (
    <router-outlet key={location.pathname}>
      <Outlet />
    </router-outlet>
  );
};

export { AnimationOutlet };
