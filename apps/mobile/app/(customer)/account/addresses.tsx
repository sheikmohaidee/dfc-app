/**
 * DFC Location Setup & Saved Addresses Screen - Full Stitch Design Implementation
 * Map Pin Dropper, "Use Current Location" button, Search Area Bar, and Saved Addresses Drawer.
 */

import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Briefcase,
  Check,
  Compass,
  Crosshair,
  Home,
  MapPin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { localityById, LOCALITIES } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { DEMO_MODE } from '@/demo/config';
import { mockProfileRepository } from '@/demo/repositories/profile.repository';
import type { SavedAddress } from '@/demo/types';
import { Screen } from '@/ui';

export default function AddressesScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [searchArea, setSearchArea] = React.useState('');
  const [addingNew, setAddingNew] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState<'Home' | 'Work' | 'Other'>('Home');
  const [newTitle, setNewTitle] = React.useState('');
  const [newStreet, setNewStreet] = React.useState('');
  const [newLocalityId, setNewLocalityId] = React.useState('anna-nagar');

  const [addresses, setAddresses] = React.useState<SavedAddress[]>(() => {
    if (profile && (profile as any).addresses && Array.isArray((profile as any).addresses)) {
      return (profile as any).addresses;
    }
    return mockProfileRepository.getAddresses();
  });

  React.useEffect(() => {
    if (profile && (profile as any).addresses && Array.isArray((profile as any).addresses) && (profile as any).addresses.length > 0) {
      setAddresses((profile as any).addresses);
    }
  }, [profile]);

  const handleUseCurrentLocation = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('GPS Location Acquired', 'Current location set to Anna Nagar, Madurai.');
  };

  const handleMakeDefault = async (id: string) => {
    void Haptics.selectionAsync();
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    if (!DEMO_MODE && profile) {
      const def = updated.find((a) => a.id === id);
      void updateProfile({
        ...(def ? { addressLine: `${def.street}, ${def.title}`, localityId: def.localityId } : {}),
        ...({ addresses: updated } as any),
      });
    }
  };

  const handleSaveAddress = async () => {
    if (!newTitle.trim() || !newStreet.trim()) {
      Alert.alert('Missing Info', 'Please enter a name and street address.');
      return;
    }

    const created = {
      id: `addr-${Date.now()}`,
      label: newLabel,
      title: newTitle.trim(),
      street: newStreet.trim(),
      localityId: newLocalityId,
      pincode: '625020',
      phone: profile?.phone ?? '+919876543210',
      isDefault: addresses.length === 0,
    };

    const nextAddresses = [...addresses, created];
    setAddresses(nextAddresses);
    setAddingNew(false);
    setNewTitle('');
    setNewStreet('');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!DEMO_MODE && profile) {
      void updateProfile({
        ...(created.isDefault ? { addressLine: `${created.street}, ${created.title}`, localityId: created.localityId } : {}),
        ...({ addresses: nextAddresses } as any),
      });
    }
  };

  return (
    <Screen edges={['top']}>
      {/* Top Header */}
      <View
        style={{
          height: 60,
          backgroundColor: '#F9F9FF',
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#DAC0C430',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#E9EDFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color="#7A1F3D" strokeWidth={2.2} />
        </Pressable>
        <Text style={{ fontFamily: 'Archivo', fontSize: 20, fontWeight: '800', color: '#7A1F3D' }}>
          Select Location
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Visual Map Area with Pin Drop */}
        <View
          style={{
            height: 200,
            backgroundColor: '#E1E8FD',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Map Pin Target */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#7A1F3D',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: '#FFFFFF',
              shadowColor: '#7A1F3D',
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <MapPin size={26} color="#FFFFFF" />
          </View>

          {/* Use Current Location Floating Button */}
          <Pressable
            onPress={handleUseCurrentLocation}
            style={{
              position: 'absolute',
              bottom: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 9999,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: '#7A1F3D30',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Crosshair size={16} color="#7A1F3D" strokeWidth={2.5} />
            <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#7A1F3D' }}>
              Use Current Location
            </Text>
          </Pressable>
        </View>

        {/* Drawer Content */}
        <View
          style={{
            backgroundColor: '#F9F9FF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -20,
            padding: 20,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          {/* Search Area Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#DAC0C4',
              borderRadius: 12,
              paddingHorizontal: 14,
              height: 48,
              marginBottom: 20,
            }}
          >
            <Search size={18} color="#887275" />
            <TextInput
              value={searchArea}
              onChangeText={setSearchArea}
              placeholder="Search area, apartment, street..."
              placeholderTextColor="#887275"
              style={{
                flex: 1,
                paddingHorizontal: 10,
                fontFamily: 'Archivo',
                fontSize: 14,
                color: '#141B2B',
              }}
            />
          </View>

          {/* Saved Addresses Section */}
          <Text
            style={{
              fontFamily: 'Archivo',
              fontSize: 11,
              fontWeight: '700',
              color: '#7A1F3D',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 12,
            }}
          >
            Saved Delivery Addresses
          </Text>

          <View className="gap-3 mb-6">
            {addresses.map((addr) => {
              const isDefault = addr.isDefault;
              return (
                <Pressable
                  key={addr.id}
                  onPress={() => handleMakeDefault(addr.id)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isDefault ? '#7A1F3D' : '#DAC0C4',
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isDefault ? '#FDF2F5' : '#E9EDFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    {addr.label === 'Home' ? (
                      <Home size={18} color="#7A1F3D" />
                    ) : addr.label === 'Work' ? (
                      <Briefcase size={18} color="#7A1F3D" />
                    ) : (
                      <MapPin size={18} color="#7A1F3D" />
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                        {addr.title} ({addr.label})
                      </Text>
                      {isDefault ? (
                        <View
                          style={{
                            backgroundColor: '#ECFDF5',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: '#05966930',
                          }}
                        >
                          <Text style={{ fontFamily: 'Archivo', fontSize: 9, fontWeight: '800', color: '#065F46' }}>
                            DEFAULT
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245', lineHeight: 18 }}>
                      {addr.street}, {addr.pincode}
                    </Text>
                  </View>

                  {isDefault ? <Check size={18} color="#7A1F3D" strokeWidth={3} /> : null}
                </Pressable>
              );
            })}

            {/* Add New Address Button */}
            {!addingNew ? (
              <Pressable
                onPress={() => setAddingNew(true)}
                style={{
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: '#7A1F3D',
                  borderRadius: 14,
                  padding: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Plus size={18} color="#7A1F3D" strokeWidth={2.5} />
                <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#7A1F3D' }}>
                  Add New Address
                </Text>
              </Pressable>
            ) : (
              /* Add New Address Form */
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#DAC0C4',
                  padding: 16,
                  gap: 12,
                }}
              >
                <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                  New Address Details
                </Text>

                {/* Label Selector */}
                <View className="flex-row gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((l) => (
                    <Pressable
                      key={l}
                      onPress={() => setNewLabel(l)}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 8,
                        backgroundColor: newLabel === l ? '#7A1F3D' : '#E9EDFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Archivo',
                          fontSize: 13,
                          fontWeight: '700',
                          color: newLabel === l ? '#FFFFFF' : '#141B2B',
                        }}
                      >
                        {l}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Title */}
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Address Name (e.g. My Apartment)"
                  placeholderTextColor="#887275"
                  style={{
                    height: 44,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    fontFamily: 'Archivo',
                    fontSize: 14,
                    color: '#141B2B',
                  }}
                />

                {/* Street */}
                <TextInput
                  value={newStreet}
                  onChangeText={setNewStreet}
                  placeholder="House / Door No, Street, Landmark"
                  placeholderTextColor="#887275"
                  multiline
                  style={{
                    height: 64,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingTop: 10,
                    fontFamily: 'Archivo',
                    fontSize: 14,
                    color: '#141B2B',
                  }}
                />

                <View className="flex-row gap-2 pt-2">
                  <Pressable
                    onPress={() => setAddingNew(false)}
                    style={{
                      flex: 1,
                      height: 44,
                      backgroundColor: '#E9EDFF',
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '600', color: '#141B2B' }}>
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSaveAddress}
                    style={{
                      flex: 1,
                      height: 44,
                      backgroundColor: '#7A1F3D',
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                      Save Address
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
