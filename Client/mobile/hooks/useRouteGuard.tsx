import { useEffect } from "react";
import { useAuth0 } from "react-native-auth0";
import { useRouter, useSegments } from "expo-router";

const protectedSegments = ["_sitemap", "(tabs)", "(screens)"];

export function useRouteGuard() {
  const { user } = useAuth0();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    const isInProtectedGroup = protectedSegments.includes(segments[0]);
    if (!user && isInProtectedGroup) {
      console.log("Redirecting to login");
      router.replace("/login");
    } else if (user && !isInProtectedGroup) {
      console.log("Redirecting to home");
      router.replace("/");
    }
  }, [user, segments]);
}
