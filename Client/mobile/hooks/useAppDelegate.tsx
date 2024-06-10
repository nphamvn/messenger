import { ReactNode, createContext, useContext } from "react";
import { User } from "@schemas/index";
import * as signalR from "@microsoft/signalr";
import { useSyncMessages } from "./useSyncMessages";
import { useRouteGuard } from "./useRouteGuard";
import { useDataCleaner } from "./useDataCleaner";
import { useMessage } from "./useMessage";
import { useUser } from "./useUser";
import { useConnector } from "./useConnector";

interface AppDelegateContextType {
  connection: signalR.HubConnection | undefined;
  user: User | undefined;
}

export const AppDelegateContext = createContext<
  AppDelegateContextType | undefined
>(undefined);

export default function useAppDelegate(): AppDelegateContextType {
  const context = useContext(AppDelegateContext);
  if (!context) {
    throw new Error("useAppDelegate must be used within a AppDelegateProvider");
  }
  return context;
}

export const AppDelegateProvider = ({ children }: { children: ReactNode }) => {
  useRouteGuard();
  useDataCleaner();

  const user = useUser();
  const connection = useConnector();

  useSyncMessages(user);
  useMessage(connection);

  return (
    <AppDelegateContext.Provider value={{ user, connection }}>
      {children}
    </AppDelegateContext.Provider>
  );
};
