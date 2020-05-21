import React, { RefObject } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  and,
  block,
  cond,
  diff,
  eq,
  multiply,
  neq,
  not,
  or,
  set,
  stopClock,
  sub,
  useCode,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import {
  Vector,
  pinchActive,
  pinchBegan,
  translate,
  useClock,
  usePinchGestureHandler,
  useValue,
  useVector,
  vec,
} from "react-native-redash";
import { decayVector } from "./AnimationUtil";

const { width, height } = Dimensions.get("window");
export const CANVAS = vec.create(width, height);
const CENTER = vec.divide(CANVAS, 2);
const styles = StyleSheet.create({
  container: {
    width,
    height,
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    resizeMode: "cover",
  },
});

interface ImageViewerProps {
  source: number;
  isActive: Animated.Node<0 | 1>;
  panState: Animated.Node<State>;
  panTranslation: Vector<Animated.Node<number>>;
  panVelocity: Vector<Animated.Node<number>>;
  swipeX: Animated.Value<number>;
  panRef: RefObject<PanGestureHandler>;
  pinchRef: RefObject<PinchGestureHandler>;
}

const ImageViewer = ({
  source,
  isActive,
  panState,
  panTranslation,
  panVelocity,
  swipeX,
}: ImageViewerProps) => {
  const shouldDecay = useValue(0);
  const clockX = useClock();
  const clockY = useClock();
  const origin = useVector(0, 0);
  const {
    gestureHandler: pinchGestureHandler,
    state: pinchState,
    numberOfPointers,
    scale: gestureScale,
    focal,
  } = usePinchGestureHandler();

  const scaleOffset = useValue(1);
  const scale = useValue(1);
  const offset = useVector(0, 0);
  const translation = useVector(0, 0);
  const adjustedFocal = vec.sub(focal, vec.add(CENTER, offset));

  const minVec = vec.min(vec.multiply(-0.5, CANVAS, sub(scale, 1)), 0);
  const maxVec = vec.max(vec.minus(minVec), 0);
  const clamped = vec.sub(
    vec.clamp(vec.add(offset, panTranslation), minVec, maxVec),
    offset
  );
  useCode(
    () =>
      block([
        // Calculate the extra value left to send to the swiper
        cond(and(isActive, eq(panState, State.ACTIVE)), [
          vec.set(translation, clamped),
          set(swipeX, sub(panTranslation.x, clamped.x)),
        ]),
        // PinchBegan: the focal value is the transformation of origin
        cond(pinchBegan(pinchState), vec.set(origin, adjustedFocal)),
        // PinchActive, the focal value (minus its value at began) is the translation
        cond(pinchActive(pinchState, numberOfPointers), [
          vec.set(
            translation,
            vec.add(
              vec.sub(adjustedFocal, origin),
              origin,
              vec.multiply(-1, gestureScale, origin)
            )
          ),
        ]),
        // Gesture ended, keep offset, reset values,
        cond(
          and(
            isActive,
            or(eq(pinchState, State.UNDETERMINED), eq(pinchState, State.END)),
            or(eq(panState, State.UNDETERMINED), eq(panState, State.END))
          ),
          [
            vec.set(offset, vec.add(offset, translation)),
            set(scaleOffset, scale),
            set(gestureScale, 1),
            vec.set(translation, 0),
            vec.set(focal, 0),
          ]
        ),
        // Decay animation (when releasing the pan gesture within the active image)
        cond(
          and(
            isActive,
            or(eq(panState, State.ACTIVE), eq(pinchState, State.ACTIVE))
          ),
          [stopClock(clockX), stopClock(clockY), set(shouldDecay, 0)]
        ),
        cond(
          and(
            isActive,
            neq(diff(panState), 0),
            eq(panState, State.END),
            neq(pinchState, State.ACTIVE)
          ),
          set(shouldDecay, 1)
        ),
        cond(shouldDecay, [
          vec.set(
            offset,
            vec.clamp(
              decayVector(offset, panVelocity, clockX, clockY),
              minVec,
              maxVec
            )
          ),
        ]),
        // Reset states when the image is not active anymore
        cond(not(isActive), [
          stopClock(clockX),
          stopClock(clockY),
          vec.set(offset, 0),
          set(scaleOffset, 1),
          set(gestureScale, 1),
          vec.set(translation, 0),
          vec.set(focal, 0),
        ]),
        // Calulate scale
        set(scale, multiply(gestureScale, scaleOffset)),
      ]),
    []
  );
  return (
    <View style={styles.container}>
      <PinchGestureHandler {...pinchGestureHandler}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.Image
            style={[
              styles.image,
              {
                transform: [
                  ...translate(vec.add(offset, translation)),
                  { scale },
                ],
              },
            ]}
            {...{ source }}
          />
        </Animated.View>
      </PinchGestureHandler>
    </View>
  );
};

export default ImageViewer;