import { useState, useEffect, useRef } from 'react';
import { View, Text, Dimensions, Animated } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../src/components/ui/Button';
import { useAuthStore } from '../src/store/authStore';
import tw from '../src/utils/tw';

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
  const scrollX = useRef(new Animated.Value(0)).current;

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

  if (checking) return null;

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
    listener: (event: any) => {
      const slide = Math.round(event.nativeEvent.contentOffset.x / width);
      if (slide !== currentSlide) setCurrentSlide(slide);
    },
  });

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  const completeOnboardingRegister = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/register');
  };

  return (
    <View style={tw`flex-1 bg-surface`}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={tw`flex-1`}
      >
        {slides.map((slide, index) => (
          <View key={index} style={[{ width }, tw`flex-1 items-center justify-center p-24`]}>
            <View
              style={tw`w-full aspect-square bg-primary-50 rounded-pill mb-32 items-center justify-center`}
            >
              <Text style={tw`text-primary text-display`}>FB</Text>
            </View>
            <Text style={tw`text-h1 text-neutral-900 text-center mb-16`}>{slide.title}</Text>
            <Text style={tw`text-body text-neutral-600 text-center`}>{slide.subtitle}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={tw`p-24 pb-48 pt-16`}>
        <View style={tw`flex-row justify-center mb-32`}>
          {slides.map((_, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 32, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: ['#E5E7EB', '#1B7A4D', '#E5E7EB'],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[tw`h-8 rounded-pill mx-4`, { width: dotWidth, opacity, backgroundColor }]}
              />
            );
          })}
        </View>

        <Button variant="primary" fullWidth style={tw`mb-16`} onPress={completeOnboardingRegister}>
          Get Started
        </Button>
        <Button variant="ghost" fullWidth onPress={completeOnboarding}>
          I already have an account
        </Button>
      </View>
    </View>
  );
}
