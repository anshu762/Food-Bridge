import React, { useState } from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Button } from '../ui/Button';
import tw from '../../utils/tw';

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
    initialData.preparedAt ? new Date(initialData.preparedAt) : new Date(),
  );
  const [safeUntil, setSafeUntil] = useState<Date>(
    initialData.safeUntil ? new Date(initialData.safeUntil) : new Date(Date.now() + 3600000),
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
    <View style={tw`flex-1 space-y-16`}>
      <Text style={tw`text-h3 text-neutral-900 mb-8`}>When was this prepared?</Text>

      {error ? <Text style={tw`text-caption text-danger font-medium mb-16`}>{error}</Text> : null}

      <View style={tw`mb-16 w-full`}>
        <Text style={tw`mb-8 text-body-emphasis text-neutral-900`}>Prepared At</Text>
        <TouchableOpacity
          onPress={() => setShowPreparedPicker(true)}
          style={tw`w-full rounded-md border border-neutral-200 bg-neutral-50 px-16 py-12 flex-row justify-between items-center`}
        >
          <Text style={tw`text-body text-neutral-900`}>{format(preparedAt, 'PPp')}</Text>
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

      <View style={tw`mb-16 w-full`}>
        <Text style={tw`mb-8 text-body-emphasis text-neutral-900`}>Safe Until</Text>
        <TouchableOpacity
          onPress={() => setShowSafePicker(true)}
          style={tw`w-full rounded-md border border-neutral-200 bg-neutral-50 px-16 py-12 flex-row justify-between items-center`}
        >
          <Text style={tw`text-body text-neutral-900`}>{format(safeUntil, 'PPp')}</Text>
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

      <View style={tw`flex-row space-x-4 mt-8`}>
        <View style={tw`flex-1`}>
          <Button variant="ghost" onPress={onBack}>
            Back
          </Button>
        </View>
        <View style={tw`flex-1`}>
          <Button onPress={handleNext}>Next</Button>
        </View>
      </View>
    </View>
  );
}
