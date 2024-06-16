import { useNavigation } from "expo-router";
import { Button, SafeAreaView, Text } from "react-native";

export default function SearchScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView>
      <Button
        title="Cancel"
        onPress={() => {
          navigation.goBack();
        }}
      />
      <Text>Search</Text>
    </SafeAreaView>
  );
}
