"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types/user";
import { completeOnboarding, skipOnboarding } from "@/services/onboardingService";
import ProgressBar from "./ProgressBar";
import WelcomeStep from "./steps/WelcomeStep";
import AboutYouStep from "./steps/AboutYouStep";
import LifeContextStep from "./steps/LifeContextStep";
import InterestsStep from "./steps/InterestsStep";
import HobbiesStep from "./steps/HobbiesStep";
import HabitsStep from "./steps/HabitsStep";
import CompletionStep from "./steps/CompletionStep";
import styles from "./OnboardingWizard.module.css";

const TOTAL_STEPS = 7;

interface OnboardingWizardProps {
  user: UserProfile;
}

export default function OnboardingWizard({ user }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [age, setAge] = useState<number | undefined>(user.age);
  const [career, setCareer] = useState(user.career || "");
  const [bio, setBio] = useState(user.bio || "");
  const [lifeContext, setLifeContext] = useState(user.lifeContext || "");
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [hobbies, setHobbies] = useState<string[]>(user.hobbies || []);
  const [habits, setHabits] = useState<string[]>(user.habits || []);
  const [timezone] = useState(
    () => {
      try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
      catch { return user.timezone || "UTC"; }
    }
  );

  const toggleItem = (list: string[], setList: (v: string[]) => void) => (item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const addItem = (list: string[], setList: (v: string[]) => void) => (item: string) => {
    if (!list.includes(item)) setList([...list, item]);
  };

  const removeItem = (list: string[], setList: (v: string[]) => void) => (index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await skipOnboarding();
      router.replace("/home");
    } catch {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await completeOnboarding({
        fullName: user.fullName,
        age,
        career,
        bio,
        lifeContext,
        interests,
        hobbies,
        habits,
        timezone,
      });
      router.replace("/home");
    } catch {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (currentStep === TOTAL_STEPS - 1) {
      handleComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => setCurrentStep((s) => Math.max(0, s - 1));

  const isWelcome = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep userName={user.fullName} />;
      case 1:
        return (
          <AboutYouStep
            age={age} career={career} bio={bio}
            onAgeChange={setAge} onCareerChange={setCareer} onBioChange={setBio}
          />
        );
      case 2:
        return <LifeContextStep value={lifeContext} onChange={setLifeContext} />;
      case 3:
        return (
          <InterestsStep
            items={interests}
            onToggle={toggleItem(interests, setInterests)}
            onAdd={addItem(interests, setInterests)}
            onRemove={removeItem(interests, setInterests)}
          />
        );
      case 4:
        return (
          <HobbiesStep
            items={hobbies}
            onToggle={toggleItem(hobbies, setHobbies)}
            onAdd={addItem(hobbies, setHobbies)}
            onRemove={removeItem(hobbies, setHobbies)}
          />
        );
      case 5:
        return (
          <HabitsStep
            items={habits}
            onToggle={toggleItem(habits, setHabits)}
            onAdd={addItem(habits, setHabits)}
            onRemove={removeItem(habits, setHabits)}
          />
        );
      case 6:
        return (
          <CompletionStep
            age={age} career={career} bio={bio}
            lifeContext={lifeContext} interests={interests}
            hobbies={hobbies} habits={habits}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.onboardingContainer}>
      <div className={`${styles.onboardingCard} ${isWelcome ? styles.onboardingCardWelcome : ""}`}>
        <ProgressBar currentStep={currentStep} />

        <div key={currentStep} className={styles.stepContent}>
          {renderStep()}
        </div>

        <div className={`${styles.stepNav} ${isWelcome ? styles.stepNavCentered : ""}`}>
          {currentStep > 0 ? (
            <button type="button" className={styles.backButton} onClick={goBack} disabled={saving}>
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            className={styles.nextButton}
            onClick={goNext}
            disabled={saving}
          >
            {saving ? "Saving..." : isLastStep ? "Go to Dashboard" : isWelcome ? "Get Started" : "Continue"}
          </button>
        </div>

        <div className={styles.stepFooter}>
          {isLastStep ? (
            <button
              type="button"
              className={styles.secondaryLink}
              onClick={() => {
                handleComplete().then(() => router.replace("/profile"));
              }}
            >
              Edit in Profile instead
            </button>
          ) : (
            <button
              type="button"
              className={styles.skipLink}
              onClick={handleSkip}
              disabled={saving}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
