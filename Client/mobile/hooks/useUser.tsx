import { useEffect, useState } from "react";
import { User } from "@schemas/index";
import { useAuth0 } from "react-native-auth0";
import { useRealm } from "@realm/react";

export function useUser() {
  const { user: authUser } = useAuth0();
  const realm = useRealm();
  const [user, setUser] = useState<User>();

  useEffect(() => {
    if (authUser) {
      let user = realm.objectForPrimaryKey(User, authUser?.sub!);
      if (!user) {
        console.log("Creating user");
        realm.write(() => {
          user = realm.create(User, {
            id: authUser?.sub!,
            fullName: authUser?.name!,
            picture: authUser?.picture!,
          });
        });
      }
      setUser(user!);
    } else {
      setUser(undefined);
    }
  }, [authUser]);

  return user;
}
