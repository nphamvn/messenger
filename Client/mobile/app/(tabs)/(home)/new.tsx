import React from "react";
import { View, Text, TextInput, Modal } from "react-native";

export default function NewScreen() {
  return (
    <React.Fragment>
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