/**
 * Platform Operations & Operating Hours.
 *
 * Dictates platform sleep mode (late night closing with morning reopening),
 * emergency rain/monsoon pause, and admin automation rules.
 */

export type PlatformStatus = 'online' | 'sleep' | 'emergency_pause';

export interface OperatingSchedule {
  enabled: boolean;
  /** Opening time in HH:mm 24-hour format (e.g. "06:00" for 6 AM). */
  openTime: string;
  /** Closing time in HH:mm 24-hour format (e.g. "23:30" for 11:30 PM). */
  closeTime: string;
  /** Timezone for schedule evaluation (e.g. "Asia/Kolkata"). */
  timezone: string;
  /** Whether customers can schedule breakfast pre-orders during sleep mode. */
  allowMorningPreOrders: boolean;
}

export interface RainSurgeConfig {
  active: boolean;
  /** Multiplier applied to delivery fee (e.g., 1.25 for +25%). */
  multiplier: number;
  /** Additional safety allowance passed 100% to the rider in paise (e.g., 2000 = ₹20). */
  riderSafetyBonusPaise: number;
  /** Reason shown to customers. */
  reasonEn: string;
  reasonTa: string;
}

export interface AdminAutomationsConfig {
  /** Automatically cluster and batch orders within proximity. */
  autoBatchingEnabled: boolean;
  /** Max distance between stops to consider for automatic batching (meters). */
  maxBatchDistanceMeters: number;
  /** Automatically assign best-suited idle rider. */
  autoDispatchEnabled: boolean;
  /** Minutes an order can remain in prep before alerting admin dispatch. */
  autoEscalationMinutes: number;
  /** Automatically 86 (deactivate) dishes when BOM ingredient reaches 0. */
  stockAuto86Enabled: boolean;
  /** Automatically trigger sleep mode based on operating schedule. */
  autoSleepScheduleEnabled: boolean;
}

export interface PlatformConfig {
  /** Current manual override or effective state. */
  status: PlatformStatus;
  manualOverride: boolean;
  schedule: OperatingSchedule;
  rainSurge: RainSurgeConfig;
  automations: AdminAutomationsConfig;
  customMessageEn?: string;
  customMessageTa?: string;
  updatedAt: number;
  updatedBy?: string;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  status: 'online',
  manualOverride: false,
  schedule: {
    enabled: true,
    openTime: '06:00',
    closeTime: '23:30',
    timezone: 'Asia/Kolkata',
    allowMorningPreOrders: true,
  },
  rainSurge: {
    active: false,
    multiplier: 1.25,
    riderSafetyBonusPaise: 2000, // ₹20
    reasonEn: 'Monsoon Rain Surge: Extra safety fee passed directly to delivery captains.',
    reasonTa: 'மழைக்கால கூடுதல் கட்டணம்: உங்கள் டெலிவரி கேப்டனுக்கு நேரடியாக வழங்கப்படுகிறது.',
  },
  automations: {
    autoBatchingEnabled: true,
    maxBatchDistanceMeters: 1800,
    autoDispatchEnabled: true,
    autoEscalationMinutes: 20,
    stockAuto86Enabled: true,
    autoSleepScheduleEnabled: true,
  },
  updatedAt: 1725580800000,
};

/**
 * Checks if the given date is within the operating hours of the schedule.
 */
export function isWithinOperatingSchedule(
  schedule: OperatingSchedule,
  date: Date = new Date(),
): boolean {
  if (!schedule.enabled) return true;

  // Format the current time in the given timezone as HH:mm
  const timeStr = date.toLocaleTimeString('en-GB', {
    timeZone: schedule.timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const [currentH, currentM] = timeStr.split(':').map(Number);
  const [openH, openM] = schedule.openTime.split(':').map(Number);
  const [closeH, closeM] = schedule.closeTime.split(':').map(Number);

  if (
    currentH === undefined ||
    currentM === undefined ||
    openH === undefined ||
    openM === undefined ||
    closeH === undefined ||
    closeM === undefined
  ) {
    return true;
  }

  const currentMinutes = currentH * 60 + currentM;
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  // Crosses midnight (e.g. 06:00 to 02:00)
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}

export interface EffectivePlatformState {
  status: PlatformStatus;
  isOpen: boolean;
  title: { en: string; ta: string };
  message: { en: string; ta: string };
  nextOpenTime?: string;
  allowMorningPreOrders: boolean;
}

/**
 * Computes effective platform operational state taking manual overrides
 * and operating schedule into account.
 */
export function getEffectivePlatformStatus(
  config: PlatformConfig,
  date: Date = new Date(),
): EffectivePlatformState {
  if (config.manualOverride) {
    if (config.status === 'emergency_pause') {
      return {
        status: 'emergency_pause',
        isOpen: false,
        title: {
          en: 'Operations Temporarily Paused',
          ta: 'சேவை தற்காலிகமாக நிறுத்தப்பட்டுள்ளது',
        },
        message: {
          en:
            config.customMessageEn ||
            'Deliveries are temporarily paused due to severe weather/heavy rains in Madurai for rider safety.',
          ta:
            config.customMessageTa ||
            'கடும் மழை மற்றும் கேப்டன்களின் பாதுகாப்பு கருதி சேவை தற்காலிகமாக நிறுத்தப்பட்டுள்ளது.',
        },
        allowMorningPreOrders: false,
      };
    }

    if (config.status === 'sleep') {
      return {
        status: 'sleep',
        isOpen: false,
        title: {
          en: 'Madurai is Resting for the Night',
          ta: 'மதுரை உறங்குகிறது — இரவு ஓய்வு',
        },
        message: {
          en:
            config.customMessageEn ||
            `We are resting for the night! Orders reopen at ${config.schedule.openTime} AM. You can still pre-order for tomorrow morning.`,
          ta:
            config.customMessageTa ||
            `இரவு ஓய்வு நேரம்! காலை ${config.schedule.openTime} மணிக்கு மீண்டும் தொடங்கும். காலை உணவை இப்போதே முன்பதிவு செய்யலாம்.`,
        },
        nextOpenTime: `${config.schedule.openTime} AM`,
        allowMorningPreOrders: config.schedule.allowMorningPreOrders,
      };
    }

    return {
      status: 'online',
      isOpen: true,
      title: { en: 'Accepting Orders', ta: 'ஆர்டர்கள் ஏற்கப்படுகின்றன' },
      message: { en: 'Madurai delivery is live.', ta: 'மதுரை டெலிவரி செயல்படுகிறது.' },
      allowMorningPreOrders: false,
    };
  }

  // Automatic schedule
  const inHours = isWithinOperatingSchedule(config.schedule, date);
  if (!inHours) {
    return {
      status: 'sleep',
      isOpen: false,
      title: {
        en: 'Madurai is Resting for the Night',
        ta: 'மதுரை உறங்குகிறது — இரவு ஓய்வு',
      },
      message: {
        en: `We are closed for the night. Reopening at ${config.schedule.openTime} AM! Pre-order your morning drops now.`,
        ta: `இரவு நேரம் மூடப்பட்டுள்ளது. காலை ${config.schedule.openTime} மணிக்கு தொடங்கும்! காலை உணவை இப்போதே முன்பதிவு செய்யுங்கள்.`,
      },
      nextOpenTime: `${config.schedule.openTime} AM`,
      allowMorningPreOrders: config.schedule.allowMorningPreOrders,
    };
  }

  return {
    status: 'online',
    isOpen: true,
    title: { en: 'Accepting Orders', ta: 'ஆர்டர்கள் ஏற்கப்படுகின்றன' },
    message: { en: 'Madurai delivery is live.', ta: 'மதுரை டெலிவரி செயல்படுகிறது.' },
    allowMorningPreOrders: false,
  };
}

/**
 * Calculates delivery fees adjusted for weather / rain surge.
 */
export function computeRainAdjustedPricing(
  baseDeliveryPaise: number,
  rainConfig: RainSurgeConfig,
): {
  customerDeliveryPaise: number;
  riderBonusPaise: number;
  surgeActive: boolean;
} {
  if (!rainConfig.active) {
    return {
      customerDeliveryPaise: baseDeliveryPaise,
      riderBonusPaise: 0,
      surgeActive: false,
    };
  }

  const multiplier = Math.max(1.0, rainConfig.multiplier);
  const adjusted = Math.round(baseDeliveryPaise * multiplier);
  const riderBonus = rainConfig.riderSafetyBonusPaise;

  return {
    customerDeliveryPaise: adjusted,
    riderBonusPaise: riderBonus,
    surgeActive: true,
  };
}
