import React, { useState} from 'react';
import { Image, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import ImageView from "react-native-image-viewing";
import { shareImage, retrieveImage } from "./components/helper"
import { Tensor } from "./Tensor"

const App = () => {
  const [image, setImage] = useState<string>("");
  const [imageFullScreen, setImageFullScreen] = useState<boolean>(false);
  const [imageTransformed, setImageTransformed] = useState<boolean>(true);
  const images = [{ uri: image, },];
  const tensor = new Tensor()

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={() => setImageFullScreen(true)} activeOpacity={1.0}>
          {(image !== "") && <Image source={{ uri: image }} style={styles.image} />} 
        </TouchableOpacity>
        {
          ((image !== "") && imageTransformed) &&
          <TouchableOpacity
            style={styles.button}
            onPress={() => shareImage(image)}
            activeOpacity={0.6}>
            <Text style={styles.buttonText}>Share Photo</Text>
          </TouchableOpacity>
        }
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => setImage(await tensor.transformImage(await retrieveImage(0)))}
          activeOpacity={0.6}>
          <Text style={styles.buttonText}>Choose Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => setImage(await tensor.transformImage(await retrieveImage(1)))}
          activeOpacity={0.6}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
      <ImageView
        images={images}
        imageIndex={0}
        visible={(image !== "") && imageFullScreen}
        onRequestClose={() => setImageFullScreen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d6aea7',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: 300,
    width: 300,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: "45%",
    borderRadius: 10,
    backgroundColor: '#745049',
  },
  buttonText: {
    padding: 20,
    fontSize: 16,
    color: "#FFFFFF",
  },
});

export default App;