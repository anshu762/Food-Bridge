import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from '../../utils/tw';

interface TabItem {
  key: string;
  title: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

export const Tabs = ({ tabs, activeTab, onChange }: TabsProps) => {
  return (
    <View style={tw`flex-row border-b border-neutral-200 w-full`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={[
                tw`px-16 py-12 border-b-2`,
                isActive ? tw`border-primary` : tw`border-transparent`,
              ]}
            >
              <Text
                style={[
                  isActive ? tw`text-body-emphasis text-primary` : tw`text-body text-neutral-600`,
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
