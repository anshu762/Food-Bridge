import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button } from '../ui/Button';
import { useUploadSignature } from '../../hooks/useListings';
import { CloudUpload, X } from 'lucide-react-native';

interface Step3FormData {
  photos: string[];
}

interface Props {
  initialData: Partial<Step3FormData>;
  onNext: (data: Step3FormData) => void;
  onBack: () => void;
}

interface PhotoUpload {
  uri: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  cloudinaryUrl?: string;
}

export function CreateListingStep3({ initialData, onNext, onBack }: Props) {
  const [photos, setPhotos] = useState<PhotoUpload[]>(
    (initialData.photos || []).map(url => ({ uri: url, status: 'success', cloudinaryUrl: url }))
  );
  const uploadSignatureMutation = useUploadSignature();

  const pickImage = async () => {
    if (photos.length >= 5) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const newPhoto: PhotoUpload = { uri, status: 'pending' };
      setPhotos([...photos, newPhoto]);
      handleUpload(newPhoto);
    }
  };

  const handleUpload = async (photo: PhotoUpload) => {
    try {
      // 1. Compress
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setPhotos(prev => prev.map(p => p.uri === photo.uri ? { ...p, status: 'uploading' } : p));

      // 2. Get signature
      const { signature, timestamp, apiKey, cloudName } = await uploadSignatureMutation.mutateAsync();

      // 3. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', {
        uri: manipResult.uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as any);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const data = await response.json();
      
      if (data.secure_url) {
        setPhotos(prev => prev.map(p => p.uri === photo.uri ? { ...p, status: 'success', cloudinaryUrl: data.secure_url } : p));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setPhotos(prev => prev.map(p => p.uri === photo.uri ? { ...p, status: 'error' } : p));
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos(photos.filter(p => p.uri !== uri));
  };

  const handleNext = () => {
    const uploadedPhotos = photos.filter(p => p.status === 'success' && p.cloudinaryUrl).map(p => p.cloudinaryUrl!);
    if (uploadedPhotos.length === 0) return;
    onNext({ photos: uploadedPhotos });
  };

  const allSuccess = photos.length > 0 && photos.every(p => p.status === 'success');
  const anyUploading = photos.some(p => p.status === 'uploading');

  return (
    <View className="flex-1 space-y-6">
      <Text className="text-lg font-bold text-gray-900">Add Photos</Text>
      <Text className="text-sm text-gray-500 mb-4">Upload up to 5 photos (min 1).</Text>

      <ScrollView horizontal className="flex-row space-x-4 mb-6">
        {photos.map((photo, index) => (
          <View key={index} className="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100 items-center justify-center border border-gray-200">
            <Image source={{ uri: photo.uri }} className="w-full h-full" />
            
            <TouchableOpacity 
              className="absolute top-1 right-1 bg-white/80 rounded-full p-1"
              onPress={() => removePhoto(photo.uri)}
            >
              <X size={16} color="black" />
            </TouchableOpacity>

            {photo.status === 'uploading' && (
              <View className="absolute inset-0 bg-black/50 items-center justify-center">
                <ActivityIndicator color="white" />
              </View>
            )}

            {photo.status === 'error' && (
              <TouchableOpacity 
                className="absolute inset-0 bg-red-500/80 items-center justify-center"
                onPress={() => handleUpload(photo)}
              >
                <CloudUpload color="white" size={24} />
                <Text className="text-white text-xs font-bold mt-1">Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {photos.length < 5 && (
          <TouchableOpacity 
            className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50"
            onPress={pickImage}
          >
            <CloudUpload color="#9ca3af" size={32} />
            <Text className="text-gray-500 mt-2 font-medium">Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View className="flex-row space-x-4 mt-auto">
        <View className="flex-1">
          <Button variant="ghost" onPress={onBack}>Back</Button>
        </View>
        <View className="flex-1">
          <Button 
            onPress={handleNext} 
            disabled={!allSuccess || anyUploading || photos.length === 0} 
          >
            Next
          </Button>
        </View>
      </View>
    </View>
  );
}
