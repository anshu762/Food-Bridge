import React from 'react';
import { View, Text } from 'react-native';
import tw from '../../utils/tw';

interface ProgressStepperProps {
  steps: string[];
  currentStepIndex: number;
}

export const ProgressStepper = ({ steps, currentStepIndex }: ProgressStepperProps) => {
  return (
    <View style={tw`w-full mb-24`}>
      <View style={tw`flex-row items-center justify-between mb-8 px-16`}>
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={index}>
              <View style={tw`items-center flex-1`}>
                <View
                  style={[
                    tw`w-24 h-24 rounded-pill items-center justify-center z-10`,
                    isActive ? tw`bg-primary` : tw`bg-neutral-200`,
                  ]}
                >
                  <Text
                    style={
                      isActive
                        ? tw`text-surface text-caption font-bold`
                        : tw`text-neutral-600 text-caption font-bold`
                    }
                  >
                    {index + 1}
                  </Text>
                </View>
              </View>
              {!isLast && (
                <View
                  style={[
                    tw`flex-1 h-4 -mx-16`,
                    index < currentStepIndex ? tw`bg-primary` : tw`bg-neutral-200`,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
      <View style={tw`flex-row justify-between px-8`}>
        {steps.map((step, index) => (
          <Text
            key={index}
            style={[
              tw`text-caption text-center w-64`,
              index <= currentStepIndex ? tw`text-neutral-900 font-semibold` : tw`text-neutral-500`,
            ]}
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
};
