/**
 * DFC Location Setup & Saved Addresses Screen — Stitch Dark Floating Theme
 * Map Pin Target, "Use Current Location" GPS trigger, Search Area Bar, and Saved Addresses Drawer.
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
import { StitchHeader } from '@/ui/stitch-header';

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
    if (
      profile &&
      (profile as any).addresses &&
      Array.isArray((profile as any).addresses) &&
      (profile as any).addresses.length > 0
    ) {
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
        ...(created.isDefault
          ? { addressLine: `${created.street}, ${created.title}`, localityId: created.localityId }
          : {}),
        ...({ addresses: nextAddresses } as any),
      });
    }
  };

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      <StitchHeader showBack={true} title="Saved Addresses" showNotifications={false} />

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Visual Map Area with Pin Drop */}
        <View
          style={{
            height: 200,
            backgroundColor: '#121216',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Subtle concentric circles */}
          <View
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: 110,
              borderWidth: 1,
              borderColor: 'rgba(106, 90, 205, 0.15)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 140,
              height: 140,
              borderRadius: 70,
              borderWidth: 1,
              borderColor: 'rgba(106, 90, 205, 0.25)',
            }}
          />

          {/* Map Pin Target */}
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#6A5ACD',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: '#FFFFFF',
              shadowColor: '#6A5ACD',
              shadowOpacity: 0.5,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <MapPin size={24} color="#FFFFFF" />
          </View>

          {/* Use Current Location Floating Button */}
          <Pressable
            onPress={handleUseCurrentLocation}
            style={{
              position: 'absolute',
              bottom: 16,
              backgroundColor: '#1C1B24',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: 'rgba(106, 90, 205, 0.4)',
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Crosshair size={16} color="#C8BFFF" strokeWidth={2.5} />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#C8BFFF',
              }}
            >
              Use Current Location
            </Text>
          </Pressable>
        </View>

        {/* Drawer Content */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -20,
            padding: 16,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: '#26262B',
          }}
        >
          {/* Search Area Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#121215',
              borderWidth: 1,
              borderColor: '#26262B',
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 48,
              marginBottom: 20,
            }}
          >
            <Search size={18} color="#928F9E" />
            <TextInput
              value={searchArea}
              onChangeText={setSearchArea}
              placeholder="Search area, apartment, street in Madurai..."
              placeholderTextColor="#5C5A64"
              style={{
                flex: 1,
                paddingHorizontal: 10,
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: '#E5E1E4',
              }}
            />
          </View>

          {/* Saved Addresses Section */}
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 11,
              fontWeight: '700',
              color: '#C8BFFF',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 12,
            }}
          >
            SAVED DELIVERY ADDRESSES
          </Text>

          <View className="gap-3 mb-6">
            {addresses.map((addr) => {
              const isDefault = addr.isDefault;
              return (
                <Pressable
                  key={addr.id}
                  onPress={() => handleMakeDefault(addr.id)}
                  style={{
                    backgroundColor: isDefault ? '#1F1E26' : '#141416',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isDefault ? '#6A5ACD' : '#26262B',
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: isDefault ? 'rgba(106, 90, 205, 0.25)' : '#26252E',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    {addr.label === 'Home' ? (
                      <Home size={18} color={isDefault ? '#C8BFFF' : '#928F9E'} />
                    ) : addr.label === 'Work' ? (
                      <Briefcase size={18} color={isDefault ? '#C8BFFF' : '#928F9E'} />
                    ) : (
                      <MapPin size={18} color={isDefault ? '#C8BFFF' : '#928F9E'} />
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 15,
                          fontWeight: '700',
                          color: '#E5E1E4',
                        }}
                      >
                        {addr.title} ({addr.label})
                      </Text>
                      {isDefault ? (
                        <View
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'PlusJakartaSans',
                              fontSize: 9,
                              fontWeight: '800',
                              color: '#34D399',
                            }}
                          >
                            DEFAULT
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 13,
                        color: '#928F9E',
                        lineHeight: 18,
                      }}
                    >
                      {addr.street}, {addr.pincode}
                    </Text>
                  </View>

                  {isDefault ? <Check size={18} color="#6A5ACD" strokeWidth={3} /> : null}
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
                  borderColor: '#6A5ACD',
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Plus size={18} color="#C8BFFF" strokeWidth={2.5} />
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#C8BFFF',
                  }}
                >
                  Add New Address
                </Text>
              </Pressable>
            ) : (
              /* Add New Address Form */
              <View
                style={{
                  backgroundColor: '#141416',
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#26262B',
                  padding: 16,
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#E5E1E4',
                  }}
                >
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
                        borderRadius: 10,
                        backgroundColor: newLabel === l ? '#6A5ACD' : '#1F1E26',
                        borderWidth: 1,
                        borderColor: newLabel === l ? '#6A5ACD' : '#2D2C34',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 13,
                          fontWeight: '700',
                          color: newLabel === l ? '#FFFFFF' : '#928F9E',
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
                  placeholderTextColor="#5C5A64"
                  style={{
                    height: 44,
                    borderWidth: 1,
                    borderColor: '#2D2C34',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    color: '#E5E1E4',
                    backgroundColor: '#18181B',
                  }}
                />

                {/* Street */}
                <TextInput
                  value={newStreet}
                  onChangeText={setNewStreet}
                  placeholder="House / Door No, Street, Landmark"
                  placeholderTextColor="#5C5A64"
                  multiline
                  style={{
                    height: 68,
                    borderWidth: 1,
                    borderColor: '#2D2C34',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingTop: 10,
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    color: '#E5E1E4',
                    backgroundColor: '#18181B',
                    textAlignVertical: 'top',
                  }}
                />

                <View className="flex-row gap-2 pt-2">
                  <Pressable
                    onPress={() => setAddingNew(false)}
                    style={{
                      flex: 1,
                      height: 44,
                      backgroundColor: '#1F1E26',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#2D2C34',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#928F9E',
                      }}
                    >
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSaveAddress}
                    style={{
                      flex: 1,
                      height: 44,
                      backgroundColor: '#6A5ACD',
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#FFFFFF',
                      }}
                    >
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
