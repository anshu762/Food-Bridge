import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../src/components/ui/Button';
import { useAuthStore } from '../src/store/authStore';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Food Bridge',
    subtitle: 'Bridging surplus. Nourishing lives.',
  },
  {
    title: 'For Donors',
    subtitle: 'Easily list surplus food and reduce waste in your community.',
  },
  {
    title: 'For Receivers',
    subtitle: 'Find and request available food listings nearby.',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [checking, setChecking] = useState(true);
  const { user, isHydrated } = useAuthStore();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (hasSeen === 'true' && !user) {
          router.replace('/(auth)/login');
        } else if (user) {
          // Handled by global layout redirection
        } else {
          setChecking(false);
        }
      } catch (e) {
        setChecking(false);
      }
    };

    if (isHydrated) {
      checkOnboarding();
    }
  }, [isHydrated, user]);

  if (checking) return null; // Wait until we know where to route

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slide);
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  const completeOnboardingRegister = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/register');
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        className="flex-1"
      >
        {slides.map((slide, index) => (
          <View key={index} style={{ width }} className="flex-1 items-center justify-center px-6">
            <View className="w-full aspect-square bg-primary-50 rounded-full mb-8 items-center justify-center">
              <Text className="text-primary-600 text-6xl font-bold">FB</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900 text-center mb-4">{slide.title}</Text>
            <Text className="text-lg text-gray-500 text-center">{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="px-6 pb-12 pt-4">
        <View className="flex-row justify-center mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                currentSlide === index ? 'w-8 bg-primary-600' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </View>

        <Button variant="primary" fullWidth className="mb-4" onPress={completeOnboardingRegister}>
          Get Started (Register)
        </Button>
        <Button variant="ghost" fullWidth onPress={completeOnboarding}>
          I already have an account
        </Button>
      </View>
    </View>
  );
}
