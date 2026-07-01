import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import tw from '../../src/utils/tw';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { Card, TouchableCard } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Select } from '../../src/components/ui/Select';
import { Tabs } from '../../src/components/ui/Tabs';
import { ProgressStepper } from '../../src/components/ui/ProgressStepper';
import { MapPreview } from '../../src/components/ui/MapPreview';
import { PushNotificationBanner } from '../../src/components/ui/PushNotificationBanner';
import { Skeleton, EmptyState, ErrorState } from '../../src/components/ui/Feedback';
import { useUI } from '../../src/components/ui/Providers';

export default function ComponentsDevScreen() {
  const [activeTab, setActiveTab] = React.useState('tab1');
  const { showToast, showDialog } = useUI();

  const handleToast = (type: 'success' | 'error' | 'info') => {
    showToast({ message: `This is a ${type} toast message!`, type });
  };

  const handleDialog = (type: 'default' | 'destructive') => {
    showDialog({
      title: type === 'destructive' ? 'Delete Account?' : 'Confirm Action',
      message: 'Are you sure you want to proceed with this action? This cannot be undone.',
      type,
    });
  };

  return (
    <ScrollView style={tw`flex-1 bg-neutral-50`} contentContainerStyle={tw`p-24 pb-64`}>
      <Text style={tw`text-display text-neutral-900 mb-24`}>UI Components</Text>

      {/* Buttons */}
      <View style={tw`mb-32 space-y-16`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Buttons</Text>
        <View style={tw`flex-row flex-wrap gap-12`}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </View>
        <Button variant="primary" loading>
          Loading
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </View>

      {/* Inputs */}
      <View style={tw`mb-32`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Inputs</Text>
        <Input label="Default Input" placeholder="Type here..." />
        <Input label="Error Input" error="This field is required" placeholder="Error state" />
        <Input label="Password" secureTextEntry secureTextEntryToggle placeholder="Password" />
        <Select
          label="Dropdown Select"
          options={[
            { label: 'Option 1', value: '1' },
            { label: 'Option 2', value: '2' },
          ]}
          onSelect={() => {}}
        />
      </View>

      {/* Badges */}
      <View style={tw`mb-32`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Badges</Text>
        <View style={tw`flex-row flex-wrap gap-12`}>
          <Badge status="AVAILABLE" />
          <Badge status="RESERVED" />
          <Badge status="COLLECTED" />
          <Badge status="CANCELLED" />
        </View>
      </View>

      {/* Avatars */}
      <View style={tw`mb-32`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Avatars</Text>
        <View style={tw`flex-row items-center space-x-16`}>
          <Avatar fallback="JD" size="sm" />
          <Avatar fallback="JD" size="md" />
          <Avatar fallback="JD" size="lg" />
        </View>
      </View>

      {/* Cards */}
      <View style={tw`mb-32`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Cards</Text>
        <Card style={tw`mb-16`}>
          <Text style={tw`text-h3 text-neutral-900`}>Static Card</Text>
          <Text style={tw`text-body text-neutral-600`}>Resting shadow applied</Text>
        </Card>
        <TouchableCard>
          <Text style={tw`text-h3 text-neutral-900`}>Touchable Card</Text>
          <Text style={tw`text-body text-neutral-600`}>Press to see animation</Text>
        </TouchableCard>
      </View>

      {/* Navigation */}
      <View style={tw`mb-32`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Tabs & Stepper</Text>
        <Tabs
          tabs={[
            { key: 'tab1', title: 'Details' },
            { key: 'tab2', title: 'Activity' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <View style={tw`mt-24`}>
          <ProgressStepper steps={['Details', 'Photo', 'Confirm']} currentStepIndex={1} />
        </View>
      </View>

      {/* Map Preview */}
      <View style={tw`mb-32`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Map Preview</Text>
        <MapPreview distance="2.4 km" locationName="Downtown Shelter" />
      </View>

      {/* Overlays */}
      <View style={tw`mb-32`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Overlays & Modals</Text>
        <View style={tw`flex-row flex-wrap gap-12`}>
          <Button variant="secondary" size="sm" onPress={() => handleToast('success')}>
            Success Toast
          </Button>
          <Button variant="secondary" size="sm" onPress={() => handleToast('error')}>
            Error Toast
          </Button>
          <Button variant="secondary" size="sm" onPress={() => handleDialog('default')}>
            Dialog
          </Button>
          <Button variant="danger" size="sm" onPress={() => handleDialog('destructive')}>
            Destructive
          </Button>
        </View>
      </View>

      {/* Notifications */}
      <View style={tw`mb-32`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Notifications</Text>
        <PushNotificationBanner
          title="Food Request Accepted!"
          body="Your donation of 50 Meals was accepted by local shelter."
        />
      </View>

      {/* Feedback States */}
      <View style={tw`mb-32`}>
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Feedback States</Text>
        <View style={tw`bg-surface rounded-xl p-16 mb-16 shadow-resting`}>
          <Skeleton style={tw`h-24 w-1/2 mb-12`} />
          <Skeleton style={tw`h-12 w-full mb-8`} />
          <Skeleton style={tw`h-12 w-3/4`} />
        </View>
        <View style={tw`bg-surface rounded-xl mb-16 shadow-resting overflow-hidden`}>
          <EmptyState title="No active listings" subtitle="Create one to get started" />
        </View>
        <View style={tw`bg-surface rounded-xl shadow-resting overflow-hidden`}>
          <ErrorState />
        </View>
      </View>
    </ScrollView>
  );
}
