import { SafeAreaView, Text, Button, View } from "react-native";
import { useAuth0 } from "react-native-auth0";

export default function LoginScreen() {
  const { authorize } = useAuth0();
  const login = async () => {
    try {
      await authorize({
        audience: "https://dev.api.messenger.com",
      });
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: "center", paddingTop: 60 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          Welcome, login to start.{" "}
        </Text>
        <Button title="Login" onPress={login} />
      </View>
    </SafeAreaView>
  );
}
