import {
  Wifi, Car, Coffee, Waves, Users, Bed, Bath, Wind
} from 'lucide-react';

const iconMap = {
  'Free WiFi': Wifi,
  'Air Conditioning': Wind,
  'Room Service': Bed,
  'Coffee Machine': Coffee,
  'Mini Bar': Coffee,
  'Champagne Service': Coffee,
  'Premium Dining': Coffee,
  'Butler Service': Coffee,
  'Balcony': Waves,
  'Floor-to-ceiling Windows': Waves,
  'Rose Petals': Waves,
  'Parking': Car,
  'Premium Bedding': Bed,
  'King Bed': Bed,
  'Seating Area': Bed,
  'Living Area': Bed,
};

const AmenityIcon = ({ name, className = "w-4 h-4" }) => {
  const Icon = iconMap[name] || Coffee;
  return <Icon className={className} />;
};

export default AmenityIcon;