/**
 * Stitch TopAppBar Component
 * Displays location avatar, current area ("Anna Nagar"), and notifications button,
 * or a transactional back navigation header.
 */

import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, ChevronDown, HelpCircle, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/providers/auth';

interface TopAppBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotifications?: boolean;
  showHelp?: boolean;
  showShare?: boolean;
  onShare?: () => void;
  onLocationPress?: () => void;
  rightAction?: React.ReactNode;
}

export function TopAppBar({
  title,
  subtitle,
  showBack = false,
  onBack,
  showNotifications = true,
  showHelp = false,
  showShare = false,
  onShare,
  onLocationPress,
  rightAction,
}: TopAppBarProps) {
  const router = useRouter();
  const { profile } = useAuth();

  const handleBack = () => {
    void Haptics.selectionAsync();
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(customer)/chat');
    }
  };

  return (
    <View
      style={{
        height: 64,
        backgroundColor: '#F9F9FF',
        borderBottomWidth: 1,
        borderBottomColor: '#DAC0C430',
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
      }}
    >
      {showBack ? (
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={handleBack}
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
          {title ? (
            <View>
              <Text style={{ fontFamily: 'Archivo', fontSize: 20, fontWeight: '800', color: '#7A1F3D' }}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '500', color: '#554245' }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={onLocationPress || (() => router.push('/(customer)/account/addresses'))}
          className="flex-row items-center gap-2.5"
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#7A1F3D',
              borderWidth: 1.5,
              borderColor: '#DAC0C4',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
              {(profile?.name ?? 'Karthik').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View>
            <View className="flex-row items-center gap-1">
              <Text style={{ fontFamily: 'Archivo', fontSize: 18, fontWeight: '800', color: '#7A1F3D', letterSpacing: -0.3 }}>
                {title ?? 'Anna Nagar'}
              </Text>
              <ChevronDown size={16} color="#7A1F3D" strokeWidth={2.5} />
            </View>
            <Text style={{ fontFamily: 'Archivo', fontSize: 11, fontWeight: '500', color: '#554245' }}>
              Madurai · 15-30 min delivery
            </Text>
          </View>
        </Pressable>
      )}

      <View className="flex-row items-center gap-2">
        {rightAction}

        {showShare ? (
          <Pressable
            onPress={onShare}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#E9EDFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Share2 size={18} color="#7A1F3D" strokeWidth={2} />
          </Pressable>
        ) : null}

        {showHelp ? (
          <Pressable
            onPress={() => router.push('/(customer)/account/help')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#E9EDFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HelpCircle size={20} color="#7A1F3D" strokeWidth={2} />
          </Pressable>
        ) : null}

        {showNotifications && !showBack ? (
          <Pressable
            onPress={() => router.push('/(customer)/account/notifications')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#E9EDFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={19} color="#7A1F3D" strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
