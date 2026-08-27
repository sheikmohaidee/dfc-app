import { PRIVACY_POLICY } from '@dfc/core';
import { PolicyView } from '@/ui/policy';

export default function PrivacyPolicyScreen() {
  return <PolicyView doc={PRIVACY_POLICY} />;
}
