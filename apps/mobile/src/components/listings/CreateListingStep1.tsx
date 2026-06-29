import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import tw from '../../utils/tw';

const step1Schema = z.object({
  foodType: z.string().min(1, 'Food type is required'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be greater than 0'),
  unit: z.enum(['KG', 'LITER', 'ITEM', 'PORTION']),
});

export type Step1FormData = z.infer<typeof step1Schema>;

interface Props {
  initialData: Partial<Step1FormData>;
  onNext: (data: Step1FormData) => void;
}

export function CreateListingStep1({ initialData, onNext }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      foodType: initialData.foodType || '',
      description: initialData.description || '',
      quantity: initialData.quantity as any || '',
      unit: initialData.unit || 'ITEM',
    },
  });

  return (
    <View style={tw`flex-1 space-y-4`}>
      <View>
        <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>What are you donating?</Text>
      </View>
      
      <Controller
        control={control}
        name="foodType"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Food Type"
            placeholder="e.g., Bread, Rice, Mixed Vegetables"
            value={value}
            onChangeText={onChange}
            error={errors.foodType?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Description (Optional)"
            placeholder="Any additional details..."
            value={value}
            onChangeText={onChange}
            error={errors.description?.message}
            multiline
            numberOfLines={3}
          />
        )}
      />

      <View style={tw`flex-row space-x-4`}>
        <View style={tw`flex-1`}>
          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Quantity"
                keyboardType="numeric"
                value={String(value)}
                onChangeText={onChange}
                error={errors.quantity?.message}
              />
            )}
          />
        </View>
        <View style={tw`flex-1`}>
          <Controller
            control={control}
            name="unit"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Unit"
                placeholder="KG/LITER/ITEM"
                value={value}
                onChangeText={onChange}
                error={errors.unit?.message}
              />
            )}
          />
        </View>
      </View>

      <Button onPress={handleSubmit(onNext)} style={tw`mt-8`}>Next</Button>
    </View>
  );
}