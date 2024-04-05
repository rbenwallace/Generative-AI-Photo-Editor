import React, { useState } from 'react';
import { Button, Image, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
//import * as offlineModel from './offline-model/tfModel';
import * as tf from '@tensorflow/tfjs'
import {bundleResourceIO, decodeJpeg} from '@tensorflow/tfjs-react-native'
import * as FileSystem from 'expo-file-system';
import ImageView from "react-native-image-viewing";

const App = () => {

  const [image, setImage] = useState(null);
  const [imageFullScreen, setImageFullScreen] = useState(false);
  const images = [{ uri: image, },];

  // const modelJSON = require('./model.json')
  // const modelWeights = require('./group1-shard1of1.bin')

  const modelJSON = require('./offline-model/model.json')
  const modelWeights = require('./offline-model/group1-shard1of1.bin')

  const fullScreenImage = async() => {
    setImageFullScreen(true);
  };

  const loadModel = async()=>{
      //.ts: const loadModel = async ():Promise<void|tf.LayersModel>=>{
      const model = await tf.loadLayersModel(
          bundleResourceIO(modelJSON, modelWeights)
      ).catch((e)=>{
      console.log("[LOADING ERROR] info:",e)
      })
      return model
  }

  const transformImageToTensor = async (uri)=>{
      //.ts: const transformImageToTensor = async (uri:string):Promise<tf.Tensor>=>{
      //read the image as base64
      const img64 = await FileSystem.readAsStringAsync(uri, {encoding:FileSystem.EncodingType.Base64})
      const imgBuffer =  tf.util.encodeString(img64, 'base64').buffer
      const raw = new Uint8Array(imgBuffer)
      let imgTensor = decodeJpeg(raw)
      const scalar = tf.scalar(255)
      //resize the image
      imgTensor = tf.image.resizeNearestNeighbor(imgTensor, [512, 512])
      //normalize; if a normalization layer is in the model, this step can be skipped
      const tensorScaled = imgTensor.div(scalar)
      //final shape of the rensor
      const img = tf.reshape(tensorScaled, [1,512,512,3])
      return img
  }

  const makePredictions = async ( batch, model, imagesTensor )=>{
      //.ts: const makePredictions = async (batch:number, model:tf.LayersModel,imagesTensor:tf.Tensor<tf.Rank>):Promise<tf.Tensor<tf.Rank>[]>=>{
      //cast output prediction to tensor
      const predictionsdata= model.predict(imagesTensor)
      //.ts: const predictionsdata:tf.Tensor = model.predict(imagesTensor) as tf.Tensor
      let pred = predictionsdata.split(batch) //split by batch size
      //return predictions 
      return pred
  }

  const getPredictions = async (image)=>{
    await tf.ready()
    const model = await loadModel() as tf.LayersModel
    const tensor_image = await transformImageToTensor(image)
    const predictions = await makePredictions(1, model, tensor_image)
    return predictions
}

  const expandImage = async(imageUri) => {
    try {
      let result = await getPredictions(imageUri)
      console.log("Not setting image / image trnasformation not working")
      setImage(result);
    } catch (error) {
      console.log("Error occurred expanding image: ", error);
    }
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
        //expandImage(result.assets[0].uri)
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
    height: 250,
    width: 250,
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