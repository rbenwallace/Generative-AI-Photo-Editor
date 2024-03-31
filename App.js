import React, { useState } from 'react';
import { Button, Image, View, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const App = () => {

  const [image, setImage] = useState(null);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (result.canceled) {
        console.log(result);
      } else {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error occurred while opening media library: ", error);
    }
  };

  const cameraImage = async () => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (result.canceled) {
        console.log(result);
      } else {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error occurred while launching the camera: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {image && <Image source={{ uri: image }} style={styles.image} />} 
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Select from Gallery" onPress={pickImage} />
        <Button title="Take Photo" onPress={cameraImage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: 350,
    width: 350,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
});

export default App;