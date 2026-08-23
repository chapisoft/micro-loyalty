import React from "react";
import { createRoot, Root } from "react-dom/client";
import { UserProvider } from "../context/user.tsx";
import { AppPropsContext, MicroAppProp } from "../context/app-props.tsx";
import { ApiClient } from "../utils/api-client";

const MicroApp = (App: React.JSX.Element, apiClient?: ApiClient) => {
  let root: Root | null = null;

  const bootstrap = async (props: MicroAppProp) => {
    console.log("react app bootstraped, props:", props);
  };

  const mount = async (props: MicroAppProp) => {
    console.log("mount microapp");
    const { userData, env } = props;
    if (apiClient) {
      if (userData.accessToken) apiClient.setAccessToken(userData.accessToken);
      if (env?.baseURL) apiClient.setBaseURL(env.baseURL);
    }
    const rootContainer = props.domElement;

    if (!rootContainer) {
      console.error("root container not found");
    } else {
      root = createRoot(rootContainer);
    }

    if (root) {
      root.render(
        <AppPropsContext.Provider value={props}>
          <UserProvider userData={userData}>{App}</UserProvider>
        </AppPropsContext.Provider>
      );
    } else {
      console.error("mount: root is not initialized");
    }
  };

  const update = async (props: MicroAppProp) => {
    console.log("update microapp");
    const { userData, env } = props;
    if (apiClient) {
      if (userData.accessToken) apiClient.setAccessToken(userData.accessToken);
      if (env?.baseURL) apiClient.setBaseURL(env.baseURL);
    }

    if (root) {
      root.render(
        <AppPropsContext.Provider value={props}>
          <UserProvider userData={userData}>{App}</UserProvider>
        </AppPropsContext.Provider>
      );
    } else {
      console.error("mount: root is not initialized");
    }
  };

  const unmount = async () => {
    console.log("unmount microapp");
    if (root) {
      root.unmount();
    } else {
      console.error("unmount: root is not initialized");
    }
  };

  return { bootstrap, mount, update, unmount };
};

export { MicroApp };
