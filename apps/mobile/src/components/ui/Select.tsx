import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import tw from '../../utils/tw';

interface Option {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  options: Option[];
  value?: string | number;
  onSelect: (val: string | number) => void;
  placeholder?: string;
  error?: string;
}

export const Select = ({
  label,
  options,
  value,
  onSelect,
  placeholder = 'Select...',
  error,
}: SelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={tw`mb-16 w-full`}>
      {label && <Text style={tw`mb-8 text-body-emphasis text-neutral-900`}>{label}</Text>}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsOpen(true)}
        style={[
          tw`w-full rounded-md border bg-neutral-50 px-16 py-12 flex-row justify-between items-center`,
          error ? tw`border-danger` : tw`border-neutral-200`,
        ]}
      >
        <Text
          style={selectedOption ? tw`text-body text-neutral-900` : tw`text-body text-neutral-600`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown color="#4B5563" size={20} />
      </TouchableOpacity>

      {error && <Text style={tw`mt-4 text-caption text-danger`}>{error}</Text>}

      <Modal visible={isOpen} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-neutral-900/50`}>
          <View style={tw`bg-surface rounded-t-xl max-h-[80%]`}>
            <View
              style={tw`p-16 border-b border-neutral-200 flex-row justify-between items-center`}
            >
              <Text style={tw`text-h3 text-neutral-900`}>{label || 'Select an option'}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={tw`p-4`}>
                <Text style={tw`text-body-emphasis text-primary`}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={tw`p-16 border-b border-neutral-100 flex-row justify-between items-center`}
                  onPress={() => {
                    onSelect(item.value);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    style={[
                      tw`text-body`,
                      item.value === value ? tw`text-primary font-semibold` : tw`text-neutral-900`,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && <Check color="#1B7A4D" size={20} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
