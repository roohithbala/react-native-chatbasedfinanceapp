import { useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const useAuthAnimations = () => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateModeSwitch = (isLogin: boolean, callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isLogin ? -width : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(callback);
  };

  const animateFocus = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const animateBlur = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return {
    slideAnim,
    fadeAnim,
    scaleAnim,
    animateModeSwitch,
    animateFocus,
    animateBlur,
  };
};