/// <reference types="nativewind/types" />

/**
 * NativeWind's `className` prop, declared locally.
 *
 * NativeWind ships this augmentation behind a triple-slash reference
 * (`nativewind/types` -> `react-native-css-interop/types`). In an npm-workspaces
 * monorepo the package hoists to the repo root and that reference stops
 * resolving from inside the app, so `className` silently disappears from every
 * React Native component and the whole app fails to typecheck.
 *
 * Re-declaring the same merge here costs nothing at runtime — the Babel plugin
 * does the actual work — and makes the types independent of where npm decides
 * to physically place the package. The reference above stays so that when it
 * does resolve, the two simply merge.
 */

export {};

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImagePropsBase {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
    placeholderClassName?: string;
  }
  interface SwitchProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
    indicatorClassName?: string;
  }
  interface KeyboardAvoidingViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
    contentContainerClassName?: string;
    columnWrapperClassName?: string;
    ListHeaderComponentClassName?: string;
    ListFooterComponentClassName?: string;
  }
  interface SectionListProps<ItemT, SectionT> {
    className?: string;
    contentContainerClassName?: string;
  }
  interface ActivityIndicatorProps {
    className?: string;
  }
  interface StatusBarProps {
    className?: string;
  }
  interface ModalBaseProps {
    presentationClassName?: string;
  }
}

declare module 'react-native-safe-area-context' {
  interface NativeSafeAreaViewProps {
    className?: string;
  }
}
