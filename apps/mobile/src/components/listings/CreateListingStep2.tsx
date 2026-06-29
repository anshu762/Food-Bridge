import React, { useState } from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Button } from '../ui/Button';

interface Step2FormData {
  preparedAt: string;
  safeUntil: string;
}

interface Props {
  initialData: Partial<Step2FormData>;
  onNext: (data: Step2FormData) => void;
  onBack: () => void;
}

export function CreateListingStep2({ initialData, onNext, onBack }: Props) {
  const [preparedAt, setPreparedAt] = useState<Date>(
    initialData.preparedAt ? new Date(initialData.preparedAt) : new Date()
  );
  const [safeUntil, setSafeUntil] = useState<Date>(
    initialData.safeUntil ? new Date(initialData.safeUntil) : new Date(Date.now() + 3600000)
  );

  const [showPreparedPicker, setShowPreparedPicker] = useState(false);
  const [showSafePicker, setShowSafePicker] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    const now = new Date();
    if (preparedAt > now) {
      setError('Prepared time cannot be in the future.');
      return;
    }
    if (safeUntil <= preparedAt) {
      setError('Safe until time must be after prepared time.');
      return;
    }
    if (safeUntil <= now) {
      setError('Safe until time must be in the future.');
      return;
    }
    setError('');
    onNext({
      preparedAt: preparedAt.toISOString(),
      safeUntil: safeUntil.toISOString(),
    });
  };

  return (
    <View className="flex-1 space-y-6">
      <Text className="text-lg font-bold text-gray-900 mb-2">When was this prepared?</Text>

      {error ? <Text className="text-red-500 font-medium mb-4">{error}</Text> : null}

      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-700">Prepared At</Text>
        <TouchableOpacity
          onPress={() => setShowPreparedPicker(true)}
          className="border border-gray-300 rounded-lg p-3 bg-gray-50"
        >
          <Text>{format(preparedAt, 'PPp')}</Text>
        </TouchableOpacity>
        {showPreparedPicker && (
          <DateTimePicker
            value={preparedAt}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event, date) => {
              setShowPreparedPicker(false);
              if (date) setPreparedAt(date);
            }}
          />
        )}
      </View>

      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-700">Safe Until</Text>
        <TouchableOpacity
          onPress={() => setShowSafePicker(true)}
          className="border border-gray-300 rounded-lg p-3 bg-gray-50"
        >
          <Text>{format(safeUntil, 'PPp')}</Text>
        </TouchableOpacity>
        {showSafePicker && (
          <DateTimePicker
            value={safeUntil}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={preparedAt}
            onChange={(event, date) => {
              setShowSafePicker(false);
              if (date) setSafeUntil(date);
            }}
          />
        )}
      </View>

      <View className="flex-row space-x-4 mt-8">
        <View className="flex-1">
          <Button variant="ghost" onPress={onBack}>Back</Button>
        </View>
        <View className="flex-1">
          <Button onPress={handleNext}>Next</Button>
        </View>
      </View>
    </View>
  );
}
