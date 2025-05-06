export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  location?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  preferredPlants?: string[];
  completedOnboarding: boolean;
  createdAt: Date;
  updatedAt: Date;
}