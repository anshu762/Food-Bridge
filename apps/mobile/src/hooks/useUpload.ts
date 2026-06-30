import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useUploadSignature } from './useListings';

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({ uploading: false, progress: 0, error: null });
  const { mutateAsync: getSignature } = useUploadSignature();

  const pickAndUpload = useCallback(async (): Promise<string | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return null;

      setState({ uploading: true, progress: 0, error: null });

      const manipResult = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 1024 } }], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const sig = await getSignature();
      setState((s) => ({ ...s, progress: 0.3 }));

      const formData = new FormData();
      formData.append('file', {
        uri: manipResult.uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as any);
      formData.append('api_key', sig.apiKey);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('signature', sig.signature);

      setState((s) => ({ ...s, progress: 0.6 }));

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: 'POST', body: formData },
      );
      const cloudinaryData = await cloudinaryRes.json();
      if (!cloudinaryRes.ok) throw new Error(cloudinaryData.error?.message || 'Upload failed');

      setState((s) => ({ ...s, progress: 1 }));
      setState({ uploading: false, progress: 0, error: null });
      return cloudinaryData.secure_url;
    } catch (err: any) {
      const msg = err?.message || 'Upload failed';
      setState({ uploading: false, progress: 0, error: msg });
      return null;
    }
  }, [getSignature]);

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null });
  }, []);

  return { ...state, pickAndUpload, reset };
}
