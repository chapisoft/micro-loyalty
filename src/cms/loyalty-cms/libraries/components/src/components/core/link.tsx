import React from 'react';
import { Link, LinkProps, useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    nav: {
      navigateToURL: (to: string | number) => void;
    };
  }
}

export const AppLink = React.forwardRef<HTMLAnchorElement, LinkProps>(function LinkWithRef(props, ref) {
  // const { onClick, reloadDocument, target, to, relative, ...rest } = props;
  // const href = useHref(to, { relative });
  //
  // function handleClick(
  //   event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  // ) {
  //   if (onClick) {
  //     onClick(event);
  //   }
  //   event.preventDefault();
  //   window.nav?.navigateToURL(href);
  // }
  //
  // if (import.meta.env.DEV) return <Link {...props} ref={ref} />;
  //
  // return (
  //   <a
  //     {...rest}
  //     href={href}
  //     onClick={reloadDocument ? onClick : handleClick}
  //     ref={ref}
  //     target={target}
  //   />
  // );

  return <Link {...props} ref={ref} />;
});

export const useAppNavigate = () => {
  // const navigate = useNavigate();

  // const basename = useHref('/');
  // const {pathname: locationPathname} = useLocation();
  //
  // const microNavigate: NavigateFunction = (to: To | number, options: NavigateOptions = {}) => {
  //   if (typeof to === "number") {
  //     window.nav?.navigateToURL(to);
  //     return;
  //   }
  //
  //   const path = resolveTo(to, [locationPathname], locationPathname, options.relative === "path");
  //
  //   // If we're operating within a basename, prepend it to the pathname prior
  //   // to handing off to history (but only if we're not in a data router,
  //   // otherwise it'll prepend the basename inside the router).
  //   // If this is a root navigation, then we navigate to the raw basename
  //   // which allows the basename to have full control over the presence of a
  //   // trailing slash on root links
  //   if (basename !== "/") {
  //     path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
  //   }
  //
  //   window.nav?.navigateToURL(joinPaths([path.pathname, path.search]));
  // }
  // if (import.meta.env.DEV) return navigate;
  // return microNavigate;

  return useNavigate();
};
