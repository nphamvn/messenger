import { useEffect } from "react";
import { useAuth0 } from "react-native-auth0";
import { useRealm } from "@realm/react";

export function useDataCleaner() {
  const { user, isLoading } = useAuth0();
  const realm = useRealm();

  useEffect(() => {
    if (!user && !isLoading) {
      console.log("Deleting all data");
      realm.write(() => {
        realm.deleteAll();
      });
    }
  }, [user, isLoading]);
}
