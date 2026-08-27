import { TERMS_OF_SERVICE } from '@dfc/core';
import { PolicyView } from '@/ui/policy';

export default function TermsScreen() {
  return <PolicyView doc={TERMS_OF_SERVICE} />;
}
