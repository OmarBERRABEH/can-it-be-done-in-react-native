import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import ZSvg from "./components/ZSvg";
import ZEllipse from "./components/ZEllipse";
import ZRect from "./components/ZRect";

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

const canvas = {
  x: width,
  y: width,
  z: width,
};

const strokeWidth = 0.1;
const colors = ["#FFC27A", "#7EDAB9", "#45A6E5", "#FE8777"];

const Arc = () => {
  const z1 = useSharedValue(0.4);
  const z2 = useSharedValue(-0.4);
  return (
    <View style={styles.container}>
      <ZSvg canvas={canvas}>
        <ZEllipse
          rx={0.4}
          ry={0.4}
          z={z1}
          strokeWidth={strokeWidth}
          stroke={colors[2]}
        />
        <ZRect
          width={0.8}
          height={0.8}
          z={z2}
          strokeWidth={strokeWidth}
          stroke={colors[1]}
          fill
        />
      </ZSvg>
    </View>
  );
};

export default Arc;
