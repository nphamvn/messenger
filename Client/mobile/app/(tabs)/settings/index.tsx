import {
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  View,
  Image,
} from "react-native";
import { useAuth0 } from "react-native-auth0";

export default function SettingsScreen() {
  const { clearSession, user } = useAuth0();
  const onPressLogout = async () => {
    Alert.alert("Logout confirm", "Are you sure you want to logout?", [
      {
        text: "Cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          await clearSession();
        },
      },
    ]);
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: user?.picture }}
            style={{ height: 60, width: 60, borderRadius: 25 }}
          />
          <View>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              {user?.name}
            </Text>
            <Text>{user?.sub}</Text>
          </View>
        </View>
        <Pressable
          style={{
            marginTop: "auto",
            padding: 14,
            backgroundColor: "white",
            borderRadius: 8,
          }}
          onPress={onPressLogout}
        >
          <Text style={{ color: "red" }}>Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
