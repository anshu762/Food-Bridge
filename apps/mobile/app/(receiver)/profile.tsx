import { View, Text } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/authStore';
import tw from '../../src/utils/tw';

export default function ReceiverProfile() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <View style={tw`flex-1 items-center justify-center p-6`}>
      <Text style={tw`text-xl mb-6`}>Receiver Profile Placeholder</Text>
      <Button variant="danger" onPress={logout} fullWidth>
        Log Out
      </Button>
    </View>
  );
}