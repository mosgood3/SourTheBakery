'use client';

import RecipesPanel from './RecipesPanel';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function RecipesPage() {
  const { admin } = useAdminAuth();

  return <RecipesPanel admin={admin} />;
}
