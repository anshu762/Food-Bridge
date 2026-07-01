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
  DONOR: {
    label: 'Meals Provided',
    icon: Utensils,
    color: 'emerald',
    verb: "you've helped provide",
  },
  RECEIVER: { label: 'Meals Collected', icon: Heart, color: 'blue', verb: "you've collected" },
};

function StatCard({
  value,
  label,
  icon: Icon,
  color,
}: {
  value: string;
  label: string;
  icon: any;
  color: string;
}) {
  const bgColor = color === 'emerald' ? 'bg-primary-50' : 'bg-info/10';
  const txtColor = color === 'emerald' ? 'text-primary-700' : 'text-info';
  const borderColor = color === 'emerald' ? 'border-primary-100' : 'border-info/20';
  return (
    <Card style={tw`flex-1 items-center py-24 ${bgColor} ${borderColor}`}>
      <Icon size={24} color={color === 'emerald' ? '#1B7A4D' : '#2E7BD9'} />
      <Text style={tw`text-display font-bold ${txtColor} mt-8`}>{value}</Text>
      <Text style={tw`text-caption font-medium text-neutral-500 mt-4 text-center`}>{label}</Text>
    </Card>
  );
}

function PlatformStatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={tw`flex-row items-center justify-between py-12 border-b border-neutral-100`}>
      <Text style={tw`text-body text-neutral-600`}>{label}</Text>
      <Text style={tw`text-h3 font-bold text-primary-700`}>{value}</Text>
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
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} style={tw`h-12 w-full mb-2`} />
      ))}
    </View>
  );
}

export default function ImpactDashboard({ role }: { role: 'DONOR' | 'RECEIVER' }) {
  const {
    data: myImpact,
    isLoading: impactLoading,
    isError: impactError,
    refetch: refetchImpact,
    isRefetching,
  } = useMyImpact();
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
      const message =
        role === 'DONOR'
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
      <ScrollView
        contentContainerStyle={tw`flex-1`}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchImpact} />}
      >
        <EmptyState
          title="No impact yet"
          subtitle={
            role === 'DONOR'
              ? 'Start donating food — every meal makes a difference!'
              : "Start requesting food — you'll see your impact here."
          }
          icon={Sparkles}
          actionLabel="Get Started"
          onAction={undefined}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={tw`flex-1 bg-neutral-50`}
      contentContainerStyle={tw`p-16 pb-32`}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetchImpact} tintColor="#1B7A4D" />
      }
    >
      <Text style={tw`text-h1 font-bold text-neutral-900 mb-4`}>Your Impact</Text>
      <Text style={tw`text-body text-neutral-500 mb-24`}>
        {role === 'DONOR'
          ? "Here's the difference you're making in your community."
          : "Here's the food you've collected for your community."}
      </Text>

      <View style={tw`flex-row space-x-12 mb-32`}>
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

      <Button variant="secondary" fullWidth onPress={handleShare} style={tw`mb-32`}>
        <View style={tw`flex-row items-center`}>
          <Share2 size={18} color="#ffffff" />
          <Text style={tw`text-white font-semibold ml-8`}>Share Your Impact</Text>
        </View>
      </Button>

      {!platformLoading && platformImpact && (
        <Card style={tw`p-16 bg-surface border-neutral-200`}>
          <Text style={tw`text-body-emphasis text-neutral-900 mb-12`}>🌍 Platform Impact</Text>
          <PlatformStatCard
            label="Total Meals Saved"
            value={String(platformImpact.totalCollected ?? 0)}
          />
          <PlatformStatCard
            label="Total Food (kg)"
            value={String(platformImpact.totalQuantity ?? 0)}
          />
        </Card>
      )}
    </ScrollView>
  );
}
