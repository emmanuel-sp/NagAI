/**
 * Profile Page
 *
 * Main page for the Profile module. This page only imports and renders the ProfileContainer component.
 * All business logic and state management is handled in the container component.
 *
 * Component Hierarchy:
 * - ProfilePage (this page)
 *   └── ProfileContainer
 *       ├── ProfileHeader
 *       ├── ProfileContent
 *       │   ├── BasicInfoCard
 *       │   ├── ProfessionalCard
 *       │   ├── InterestsCard
 *       │   ├── HobbiesCard
 *       │   ├── HabitsCard
 *       │   └── SecurityCard
 *       └── ProfileActions
 */

import ProfileContainer from "@/components/profile/ProfileContainer";

export default function ProfilePage() {
  return <ProfileContainer />;
}
