import { createContext, useContext } from "react";
import { UserData } from "./user.tsx";

export interface Environment {
  production?: boolean;
  mapAccessToken?: string;
  modelerURL?: string;
  chatURL?: string;
  screenBuilderURL?: string;
  screenBuilderAuthId?: string;
  screenBuilderRedirectURL?: string;
  screenBuilderOrgId?: string;
  baseURL?: string;
  cityOSURL?: string;
  kpiURL?: string;
  supersetURL?: string;
  tableauURL?: string;
  ssoURL?: string;
  ssoRealm?: string;
  ssoClientId?: string;
  firebase?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
    vapidKey?: string;
  };
}

export type MicroAppProp = {
  domElement: HTMLElement;
  userData: UserData;
  baseRoute: string;
  env?: Environment;
};

// Create a Context for the user data
export const AppPropsContext = createContext<MicroAppProp | any>({});

// Create a custom hook to use the UserContext
export const useAppProps = () => useContext(AppPropsContext);
