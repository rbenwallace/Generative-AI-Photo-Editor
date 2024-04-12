import React, { useState, useEffect} from 'react';
import { Button, Image, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import ImageView from "react-native-image-viewing";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem  from 'expo-file-system';
import * as jpeg        from 'jpeg-js'
import * as tf          from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";


const App = () => {
  const [model, setModel] = useState(null);
  const [image, setImage] = useState(null);
  const [imageFullScreen, setImageFullScreen] = useState(false);
  const images = [{ uri: image, },];
  const fullScreenImage = async() => {
    setImageFullScreen(true);
  };

  const loadModel = async () => {
    console.log("[+] Waiting for TensorFlow to be ready");
    await tf.ready();
    console.log("[+] Loading TensorFlow model");
    const modelURL = 'https://ilyassharif.github.io/model.json';
    const model = await tf.loadLayersModel(modelURL);
    setModel(model);  // Set the loaded model in the state
    return model
  };

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
        // Load the model
        const model = await loadModel()
        console.log("[+] Successfully Loaded TensorFlow model");

        // Transform image to tensor
        const img = await transformImageToTensor(result.assets[0].uri)
        console.log('[+] Image Successfully Transformed to Tensor')

        // Make a prediction on the image
        const predictions = await model.predict(img)
        console.log("[+] Successfully Predicted Model on Image");

        const rsPredictions = predictions.squeeze();
        const encodedJpeg = await transformTensorToImage(rsPredictions)
        const ImageDataa = `data:image/jpeg;base64,${encodedJpeg}`;
        setImage(ImageDataa)
        console.log('[+] Successfuly set converted Image')
      } 
    } catch (error) {
      console.log("Error occurred while loading image: ", error);
    }
  };

  // Tensorflow <-> Image Functions
  const transformImageToTensor = async (uri)=>{
    const img64 = await FileSystem.readAsStringAsync(uri, {encoding:FileSystem.EncodingType.Base64})
    const imgBuffer =  tf.util.encodeString(img64, 'base64').buffer
    const raw = new Uint8Array(imgBuffer)
    let imgTensor = decodeJpeg(raw)
    imgTensor = tf.image.resizeNearestNeighbor(imgTensor, [400, 400])
    const tensorScaled = imgTensor.div(tf.scalar(127.5)).sub(tf.scalar(1));
    // Converting 400x400 Tensor into 512x512
    const buffer = Number(56)
    const padding = [
      [buffer, buffer],
      [buffer, buffer],
      [0, 0]
    ];
    const paddedImageTensor = tf.pad(tensorScaled, padding);
    const img = tf.reshape(paddedImageTensor, [1,512,512,3])
    return img
  }
  async function transformTensorToImage(imageTensor) {
    const [height, width] = imageTensor.shape;
    const denormalizedTensor = imageTensor.add(tf.scalar(1)).mul(tf.scalar(127.5));
    const buffer = await denormalizedTensor.toInt().data();
    const frameData = new Uint8Array(width * height * 4);
    let offset = 0;
    for (let i = 0; i < frameData.length; i += 4) {
      frameData[i] = buffer[offset];
      frameData[i + 1] = buffer[offset + 1];
      frameData[i + 2] = buffer[offset + 2];
      frameData[i + 3] = 0xff;
      offset += 3;
    }
    const rawImageData = {data: frameData,width,height,};
    const jpegImageData = jpeg.encode(rawImageData, 100);
    const base64Encoding = tf.util.decodeString(jpegImageData.data, "base64");
    return base64Encoding;
  }

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