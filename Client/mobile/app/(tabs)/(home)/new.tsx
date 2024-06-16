import { Link, Stack } from "expo-router";
import React from "react";
import { View, TextInput } from "react-native";

export default function NewScreen() {
  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Link
              href=".."
              style={{
                color: "#007AFF",
              }}
            >
              Cancel
            </Link>
          ),
        }}
      />
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View>
          <TextInput
            placeholder="To"
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#ddd",
            }}
          ></TextInput>
        </View>
      </View>
    </React.Fragment>
  );
}
