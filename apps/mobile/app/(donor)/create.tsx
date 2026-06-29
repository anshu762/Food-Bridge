import React, { useState } from 'react';
import { View, Text, BackHandler, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDraftStore, DraftListing } from '../../src/store/useDraftStore';
import { useCreateListing } from '../../src/hooks/useListings';
import { CreateListingStep1 } from '../../src/components/listings/CreateListingStep1';
import { CreateListingStep2 } from '../../src/components/listings/CreateListingStep2';
import { CreateListingStep3 } from '../../src/components/listings/CreateListingStep3';
import { CreateListingStep4 } from '../../src/components/listings/CreateListingStep4';
import { CreateListingReview } from '../../src/components/listings/CreateListingReview';
import { ChevronLeft } from 'lucide-react-native';
import tw from '../../src/utils/tw';

const TOTAL_STEPS = 5;

export default function CreateListing() {
  const router = useRouter();
  const { draft, setDraft, clearDraft } = useDraftStore();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createListingMutation = useCreateListing();

  const handleNext = (data: Partial<DraftListing>) => {
    setDraft(data);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitError(null);
      
      const payload = {
        title: draft.title!,
        foodType: draft.foodType!,
        description: draft.description || undefined,
        quantity: Number(draft.quantity!),
        unit: draft.unit!,
        pickupLat: draft.pickupLat!,
        pickupLng: draft.pickupLng!,
        pickupAddress: draft.pickupAddress!,
        photos: draft.photos!,
        preparedAt: draft.preparedAt!,
        safeUntil: draft.safeUntil!,
      };

      const result = await createListingMutation.mutateAsync(payload as any);
      
      // Success! Clear draft and go to listing details
      clearDraft();
      router.replace(`/(donor)/listing/${result.id}` as any);
    } catch (error: any) {
      // Extract precise error message
      const msg = error.response?.data?.error?.message || error.message || 'Failed to create listing';
      if (error.response?.status === 403) {
        setSubmitError(`${msg}. Please complete identity verification.`);
      } else {
        setSubmitError(msg);
      }
    }
  };

  // Prevent default back button if in middle of form
  React.useEffect(() => {
    const onBackPress = () => {
      if (step > 1) {
        setStep(step - 1);
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [step]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={tw`flex-1 bg-white`}
    >
      <View style={tw`px-4 py-4 flex-row items-center border-b border-gray-100`}>
        <TouchableOpacity onPress={handleBack} style={tw`p-2 -ml-2`}>
          <ChevronLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-gray-900 ml-2`}>Create Listing</Text>
        <View style={tw`flex-1`} />
        <Text style={tw`text-sm font-medium text-gray-500`}>Step {step} of {TOTAL_STEPS}</Text>
      </View>

      <View style={tw`h-1 bg-gray-100 w-full`}>
        <View 
          style={[tw`h-full bg-primary-600`, { width: `${(step / TOTAL_STEPS) * 100}%` }]} 
        />
      </View>

      <View style={tw`flex-1 p-6`}>
        {step === 1 && <CreateListingStep1 initialData={draft as any} onNext={handleNext} />}
        {step === 2 && <CreateListingStep2 initialData={draft} onNext={handleNext} onBack={handleBack} />}
        {step === 3 && <CreateListingStep3 initialData={draft} onNext={handleNext} onBack={handleBack} />}
        {step === 4 && <CreateListingStep4 initialData={draft} onNext={handleNext} onBack={handleBack} />}
        {step === 5 && (
          <CreateListingReview 
            data={draft as DraftListing} 
            onSubmit={handleSubmit} 
            onBack={handleBack} 
            isSubmitting={createListingMutation.isPending}
            error={submitError}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}