import { useEffect } from "react";
import { useAuth0 } from "react-native-auth0";
import { useRouter, useSegments } from "expo-router";

export function useRouteGuard() {
  const { user } = useAuth0();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    const isInProtectedGroup = segments[0] === "(tabs)";
    if (!user && isInProtectedGroup) {
      router.replace("/login");
    } else if (user && !isInProtectedGroup) {
      router.replace("/");
    }
  }, [user, segments]);
}
