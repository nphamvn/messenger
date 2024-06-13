import { useEffect } from "react";
import { useAuth0 } from "react-native-auth0";

export default function useDebugger() {
  const { user, getCredentials } = useAuth0();

  useEffect(() => {
    if (user) {
      (async () => {
        const credentials = await getCredentials();
        console.log("accessToken", credentials?.accessToken);
      })();
    }
  }, [user]);
}
