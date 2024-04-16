import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

export const shareImage = async (uri: string) => {
    let canShare = await Sharing.isAvailableAsync();
    if(canShare){
      Sharing.shareAsync(uri);
    }
  };

export const retrieveImage = async (option: number) => {
    try {
        await (option === 0) ? ImagePicker.requestMediaLibraryPermissionsAsync() : ImagePicker.requestCameraPermissionsAsync()
        let result = await ((option === 0) ? ImagePicker.launchImageLibraryAsync : ImagePicker.launchCameraAsync)({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            return result.assets[0].uri;
        } else {
            return "";
        }
    } catch (error) {
        console.log("Error occurred while loading image: ", error);
        return "";
    }
};