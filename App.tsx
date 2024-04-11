import React, { useState, useEffect} from 'react';
import { Button, Image, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ImageView from "react-native-image-viewing";
import * as tf from "@tensorflow/tfjs"
import "@tensorflow/tfjs-react-native"

const App = () => {

  const [image, setImage] = useState(null);
  const [imageFullScreen, setImageFullScreen] = useState(false);
  const images = [{ uri: image, },];
  const fullScreenImage = async() => {
    setImageFullScreen(true);
  };

  useEffect(() => {
    async function loadModel() {
      console.log("[+] Waiting for TensorFlow to be ready");
      await tf.ready();
      console.log("[+] Loading TensorFlow model");
      const modelURL = 'https://ilyassharif.github.io/model.json'
      const loadedModel = await tf.loadLayersModel(modelURL);
      console.log("[+] Loaded TensorFlow model");
      // return model
    }
    loadModel().catch(console.error);
  }, []); // Empty dependency array means this effect runs once after initial render


  const retrieveImage = async (option) => {
    try {
      await (option === 0) ? ImagePicker.requestMediaLibraryPermissionsAsync() : ImagePicker.requestCameraPermissionsAsync()
      let result = await ((option === 0) ? ImagePicker.launchImageLibraryAsync : ImagePicker.launchCameraAsync)({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      } 
    } catch (error) {
      console.log("Error occurred while loading image: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={() => setImageFullScreen(true)} activeOpacity={1.0}>
          {image && <Image source={{ uri: image }} style={styles.image} />} 
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => retrieveImage(0)}
          activeOpacity={0.6}>
          <Text style={styles.buttonText}>Choose Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => retrieveImage(1)}
          activeOpacity={0.6}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
      <ImageView
        images={images}
        imageIndex={0}
        visible={image && imageFullScreen}
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
    height: 512,
    width: 512,
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