import { View, Text, ScrollView, RefreshControl, Share } from 'react-native';
import { useCallback } from 'react';
import { Heart, Utensils, Sparkles, Share2 } from 'lucide-react-native';
import { impactMedium } from '../utils/haptics';
import tw from '../utils/tw';
import { useMyImpact } from '../hooks/useImpact';
import { useQuery } from '@tanstack/react-query';
import { impactService } from '../services/impact';
import { Skeleton, EmptyState, ErrorState } from './ui/Feedback';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const statCardConfig = {
  DONOR: { label: 'Meals Provided', icon: Utensils, color: 'emerald', verb: "you've helped provide" },
  RECEIVER: { label: 'Meals Collected', icon: Heart, color: 'blue', verb: "you've collected" },
};

function StatCard({ value, label, icon: Icon, color }: { value: string; label: string; icon: any; color: string }) {
  const bgColor = color === 'emerald' ? 'bg-emerald-50' : 'bg-blue-50';
  const txtColor = color === 'emerald' ? 'text-emerald-700' : 'text-blue-700';
  const borderColor = color === 'emerald' ? 'border-emerald-100' : 'border-blue-100';
  return (
    <Card style={tw`flex-1 items-center py-6 ${bgColor} ${borderColor}`}>
      <Icon size={24} color={color === 'emerald' ? '#059669' : '#2563EB'} />
      <Text style={tw`text-3xl font-bold ${txtColor} mt-2`}>{value}</Text>
      <Text style={tw`text-sm font-medium text-gray-500 mt-1 text-center`}>{label}</Text>
    </Card>
  );
}

function PlatformStatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={tw`flex-row items-center justify-between py-3 border-b border-gray-100`}>
      <Text style={tw`text-sm text-gray-600`}>{label}</Text>
      <Text style={tw`text-lg font-bold text-primary-700`}>{value}</Text>
    </View>
  );
}

function ImpactSkeleton() {
  return (
    <View style={tw`p-6`}>
      <View style={tw`flex-row space-x-4 mb-8`}>
        <Skeleton style={tw`flex-1 h-32 rounded-2xl`} />
      </View>
      <Skeleton style={tw`h-6 w-40 mb-4`} />
      {[1, 2, 3].map((i) => <Skeleton key={i} style={tw`h-12 w-full mb-2`} />)}
    </View>
  );
}

export default function ImpactDashboard({ role }: { role: 'DONOR' | 'RECEIVER' }) {
  const { data: myImpact, isLoading: impactLoading, isError: impactError, refetch: refetchImpact, isRefetching } = useMyImpact();
  const { data: platformImpact, isLoading: platformLoading } = useQuery({
    queryKey: ['impact', 'platform'],
    queryFn: () => impactService.getPlatformImpact(),
  });

  const config = statCardConfig[role];
  const stats = {
    mealsCollected: myImpact?.collectedCount ?? 0,
    totalKg: myImpact?.totalQuantity ?? 0,
  };

  const handleShare = useCallback(async () => {
    const s = {
      mealsCollected: myImpact?.collectedCount ?? 0,
      totalKg: myImpact?.totalQuantity ?? 0,
    };
    try {
      const message = role === 'DONOR'
        ? `I've helped provide ${s.mealsCollected} meals (${s.totalKg}kg) through FoodBridge! Join me in reducing food waste.`
        : `I've collected ${s.mealsCollected} meals (${s.totalKg}kg) for my community through FoodBridge!`;
      impactMedium();
      await Share.share({ message });
    } catch {}
  }, [role, myImpact]);

  if (impactLoading) return <ImpactSkeleton />;
  if (impactError) {
    return <ErrorState message="Failed to load impact data" onRetry={() => refetchImpact()} />;
  }

  const hasImpact = stats.mealsCollected > 0 || stats.totalKg > 0;

  if (!hasImpact) {
    return (
      <ScrollView contentContainerStyle={tw`flex-1`} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchImpact} />}>
        <EmptyState
          title="No impact yet"
          subtitle={role === 'DONOR' ? "Start donating food — every meal makes a difference!" : "Start requesting food — you'll see your impact here."}
          icon={Sparkles}
          actionLabel="Get Started"
          onAction={undefined}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={tw`flex-1 bg-gray-50`}
      contentContainerStyle={tw`p-6 pb-12`}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchImpact} tintColor="#3B6D11" />}
    >
      <Text style={tw`text-xl font-bold text-gray-900 mb-1`}>Your Impact</Text>
      <Text style={tw`text-sm text-gray-500 mb-6`}>
        {role === 'DONOR' ? "Here's the difference you're making in your community." : "Here's the food you've collected for your community."}
      </Text>

      <View style={tw`flex-row space-x-4 mb-8`}>
        <StatCard
          value={String(stats.mealsCollected)}
          label={config.label}
          icon={config.icon}
          color={role === 'DONOR' ? 'emerald' : 'blue'}
        />
        <StatCard
          value={`${stats.totalKg} kg`}
          label="Total Food Saved"
          icon={Utensils}
          color={role === 'DONOR' ? 'blue' : 'emerald'}
        />
      </View>

      <Button variant="secondary" fullWidth onPress={handleShare} style={tw`mb-8`}>
        <View style={tw`flex-row items-center`}>
          <Share2 size={18} color="#ffffff" />
          <Text style={tw`text-white font-semibold ml-2`}>Share Your Impact</Text>
        </View>
      </Button>

      {!platformLoading && platformImpact && (
        <Card style={tw`p-5`}>
          <Text style={tw`text-base font-bold text-gray-900 mb-3`}>🌍 Platform Impact</Text>
          <PlatformStatCard label="Total Meals Saved" value={String(platformImpact.totalCollected ?? 0)} />
          <PlatformStatCard label="Total Food (kg)" value={String(platformImpact.totalQuantity ?? 0)} />
        </Card>
      )}
    </ScrollView>
  );
}
