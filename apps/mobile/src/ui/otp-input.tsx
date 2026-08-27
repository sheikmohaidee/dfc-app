/**
 * A segmented OTP field.
 *
 * Six boxes, but one real TextInput behind them — that is the trick. Six
 * separate inputs is the obvious implementation and it is the wrong one: it
 * fights autofill, breaks paste, and backspace at the start of a box does
 * nothing useful. One hidden input with `textContentType="oneTimeCode"` gets
 * the iOS keyboard suggestion and the Android SMS Retriever for free, and the
 * boxes become pure presentation.
 *
 * Fills, animates the active box, and calls back the moment the last digit
 * lands so nobody has to hunt for a Submit button.
 */

import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SPRING } from './glass';
import { Num } from './index';

export interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  /** Fires once the field is full. */
  onComplete?: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  /** Paints every box red — pair it with useShake(). */
  error?: boolean;
  disabled?: boolean;
}

function Cell({
  digit,
  active,
  error,
}: {
  digit: string | undefined;
  active: boolean;
  error?: boolean;
}) {
  const filled = digit !== undefined && digit !== '';
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (filled) {
      // A tiny pop as each digit lands — confirms input without a sound.
      scale.value = withSpring(1.06, SPRING, () => {
        scale.value = withSpring(1, SPRING);
      });
    }
  }, [filled, scale]);

  const caret = useSharedValue(1);
  React.useEffect(() => {
    if (!active) return;
    caret.value = withTiming(0, { duration: 520 });
    const id = setInterval(() => {
      caret.value = withTiming(caret.value > 0.5 ? 0 : 1, { duration: 220 });
    }, 520);
    return () => clearInterval(id);
  }, [active, caret]);

  const boxStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const caretStyle = useAnimatedStyle(() => ({ opacity: caret.value }));

  return (
    <Animated.View
      style={boxStyle}
      className={`h-[58px] flex-1 items-center justify-center rounded-[11px] border-[1.5px] ${
        error
          ? 'border-destructive bg-destructive-tint'
          : active
            ? 'border-primary bg-background'
            : filled
              ? 'border-border bg-background'
              : 'border-border bg-surface'
      }`}
    >
      {filled ? (
        <Num className="text-[24px] font-semibold tracking-tight">{digit}</Num>
      ) : active ? (
        <Animated.View style={caretStyle} className="h-6 w-[2px] rounded-full bg-primary" />
      ) : (
        <View className="size-1.5 rounded-full bg-disabled" />
      )}
    </Animated.View>
  );
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus,
  error,
  disabled,
}: OtpInputProps) {
  const ref = React.useRef<TextInput>(null);
  const [focused, setFocused] = React.useState(false);

  // Fire exactly once per fill, not on every re-render at full length.
  const fired = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (value.length === length && fired.current !== value) {
      fired.current = value;
      onComplete?.(value);
    }
    if (value.length < length) fired.current = null;
  }, [value, length, onComplete]);

  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      accessibilityRole="none"
      accessibilityLabel={`Verification code, ${value.length} of ${length} digits entered`}
    >
      <View className="flex-row gap-2.5">
        {Array.from({ length }).map((_, i) => (
          <Cell
            key={i}
            digit={value[i]}
            active={focused && i === Math.min(value.length, length - 1)}
            error={error}
          />
        ))}
      </View>

      {/* The real field. Invisible, but focusable and autofillable. */}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        editable={!disabled}
        maxLength={length}
        caretHidden
        // Not display:none — a hidden input cannot receive autofill on iOS.
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          color: 'transparent',
        }}
      />
    </Pressable>
  );
}
