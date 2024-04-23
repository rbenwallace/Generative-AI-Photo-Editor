import * as jpeg from 'jpeg-js'
import * as tf from '@tensorflow/tfjs';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import {Alert} from 'react-native';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';

export class Tensor {
  private model: any;
  private modelLoaded: boolean;

  constructor() {
    this.modelLoaded = false;
    this.model = null;
  }

  public transformImage = async (image?: string) => {
    if(!image) { return ""; }
    if(!this.modelLoaded){
      await this.loadModel();
    }
    const img = await this.modelPredict(image, this.model);
    return (img) ? img : "";
  }

  // Tensorflow Code
  public loadModel = async () => {
    try {
      console.log('Loading model');
      await tf.ready();
      const model = await tf.loadLayersModel('https://ilyassharif.github.io/model.json');
      console.log('Loaded Model Successfully');
      this.model = model;
      this.modelLoaded = true;
    } catch (error) {
      Alert.alert("Error loading model, please make sure you are connected to the internet");
      console.log("Error occured while loading model: ", error);
    }
  }
  
  private imageToTensor = async (uri: string) => {
    try {
      const manipResult = await manipulateAsync(
        uri, [], { base64: true, format: SaveFormat.JPEG }
      );
      const imgBase64 = manipResult.base64 || "";
      //const imgBase64 = await FileSystem.readAsStringAsync(uri, {encoding:FileSystem.EncodingType.Base64});
      const imgBuffer =  tf.util.encodeString(imgBase64, 'base64').buffer;
      const imgUint8 = new Uint8Array(imgBuffer);
      const imgJPEG = decodeJpeg(imgUint8);
      const imgResized = tf.image.resizeNearestNeighbor(imgJPEG, [400, 400]);
      const imgNormalized = imgResized.div(tf.scalar(127.5)).sub(tf.scalar(1));
      const imgPadded = tf.pad(imgNormalized, [[56, 56],[56, 56],[0, 0]]);
      const imgFinal = tf.reshape(imgPadded, [1,512,512,3]);
      tf.dispose([imgJPEG, imgResized, imgNormalized, imgPadded]);
      return imgFinal;
    } catch (error) {
      console.log("Error occured while transforming image to tensor", error)
    }
  }

  private tensorToImage = async (tensor: tf.Tensor) => {
    try {
      const [height, width] = tensor.shape;
      const imgTensor = tensor.add(tf.scalar(1)).mul(tf.scalar(127.5));
      const imgInt = await imgTensor.toInt().data();
      tf.dispose(imgTensor);
      const frameData = new Uint8Array(width * height * 4);

      let offset = 0;
      for (let i = 0; i < frameData.length; i += 4) {
        frameData[i] = imgInt[offset];
        frameData[i + 1] = imgInt[offset + 1];
        frameData[i + 2] = imgInt[offset + 2];
        frameData[i + 3] = 0xff;
        offset += 3;
      }

      const imgRawData = {data: frameData, width, height,};
      const imgJpegData = jpeg.encode(imgRawData, 100);
      const imgBase64 = tf.util.decodeString(imgJpegData.data, 'base64');
      const imgJpeg = `data:image/jpeg;base64,${imgBase64}`;
      return imgJpeg;
    } catch (error) {
      console.log("Error occured while transforming tensor to image", error)
    }
  }

  private modelPredict = async (image: string, model: tf.LayersModel) => {
      try {
          const img = await this.imageToTensor(image);
          if(!img) { throw new Error("Image to tensor returned null") }
          console.log('Image successfully converted into Tensor');
          const prediction:any = await model.predict(img);
          console.log('Model successfully predicted');
          const imgString = await this.tensorToImage(prediction.squeeze());
          console.log('Tensor successfully converted into Image');
          return imgString;
      } catch (error) {
          console.log("Error occured while model was predicting on image", error)
      }
  }
}
