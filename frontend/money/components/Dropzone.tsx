import {
  DragDropContentView,
  DragDropContentViewProps,
  DropAsset,
} from "expo-drag-drop-content-view";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated from "react-native-reanimated";
import { useMediaPremissions } from "../hooks/useMediaPremissions";

const borderRadius = 0;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fefefe",
    borderRadius,
    overflow: "visible",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: "#2f95dc",
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  placeholderContainer: {
    paddingHorizontal: 30,
    backgroundColor: "#2f95dc",
    opacity: 0.5,
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius,
  },
  activePlaceholderContainer: {
    backgroundColor: "#2f95dc",
    opacity: 1,
  },
  readyPlaceholderContainer: {
    backgroundColor: "#2f95dc",
    opacity: 0.7,
  },
  placeholderText: {
    color: "white",
    textAlign: "center",
  },
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getSourceType = (source: DropAsset) => {
  if (source.type?.startsWith("image")) return "image";
  if (source.type?.startsWith("video")) return "video";
  if (source.type === "text") return "text";
  return "file";
};

export const Dropzone: React.FC<DragDropContentViewProps> = (props) => {
  useMediaPremissions();
  const [sources, setSources] = useState<DropAsset[] | null>(null);
  const [readyToReceive, setReadyToReceive] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // const handleClear = () => setSources(null);

  return (
    <>
      <DragDropContentView
        {...props}
        includeBase64={true}
        draggableSources={sources
          ?.filter((source) => getSourceType(source) !== undefined)
          ?.map((source) => ({
            type: getSourceType(source)!,
            value: source.uri || source.base64 || source.text || "",
          }))}
        onDropListeningStart={() => {
          setReadyToReceive(true);
        }}
        onEnter={() => {
          setIsActive(true);
        }}
        onExit={() => {
          setIsActive(false);
        }}
        onDragEnd={() => {
          setIsActive(false);
          setReadyToReceive(false);
        }}
        onDrop={(event) => {
          // console.log(JSON.stringify(event.assets));
          const newData = [...(sources ?? []), ...event.assets];
          setSources(newData);
          props.onDrop?.(event);
        }}
        style={[styles.container, props.style]}
      >
        <Animated.View
          style={[
            styles.placeholderContainer,
            readyToReceive && styles.readyPlaceholderContainer,
            isActive && styles.activePlaceholderContainer,
          ]}
        >
          <Text style={styles.placeholderText}>Drop here!</Text>
        </Animated.View>
      </DragDropContentView>
      {sources
        ? sources.map((source, index) => {
            const uri = (source.uri ? source.uri : source.base64) || "";
            const type = getSourceType(source);
            if (type !== "image") {
              return null;
            }

            return <Image key={index} source={{ uri }} style={styles.image} />;
          })
        : null}
    </>
  );
};
