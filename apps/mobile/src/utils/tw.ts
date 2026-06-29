import { create } from 'twrnc';

// Create a custom twrnc instance with our FoodBridge theme colors.
// Usage: import { tw } from '../utils/tw';
//        <View style={tw`bg-primary-600 p-4`}>
const tw = create(require('../../tailwind.config.js'));

export { tw };
export default tw;
