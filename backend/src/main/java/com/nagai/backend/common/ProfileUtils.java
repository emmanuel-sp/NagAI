package com.nagai.backend.common;

import com.nagai.backend.goals.Goal;
import com.nagai.backend.users.User;

public final class ProfileUtils {

    private ProfileUtils() {}

    public static String buildUserProfile(User user) {
        StringBuilder sb = new StringBuilder();
        if (user.getAge() != null)
            sb.append("Age: ").append(user.getAge()).append("\n");
        if (user.getCareer() != null && !user.getCareer().isBlank())
            sb.append("Career: ").append(user.getCareer()).append("\n");
        if (user.getBio() != null && !user.getBio().isBlank())
            sb.append("About: ").append(user.getBio()).append("\n");
        if (user.getInterests() != null && user.getInterests().length > 0)
            sb.append("Interests: ").append(String.join(", ", user.getInterests())).append("\n");
        if (user.getHobbies() != null && user.getHobbies().length > 0)
            sb.append("Hobbies: ").append(String.join(", ", user.getHobbies())).append("\n");
        if (user.getHabits() != null && user.getHabits().length > 0)
            sb.append("Habits: ").append(String.join(", ", user.getHabits())).append("\n");
        if (user.getLifeContext() != null && !user.getLifeContext().isBlank())
            sb.append("Life context: ").append(user.getLifeContext()).append("\n");
        return sb.toString().trim();
    }

    public static String buildGoalSmartContext(Goal goal) {
        StringBuilder sb = new StringBuilder();
        if (goal.getSpecific() != null && !goal.getSpecific().isBlank())
            sb.append("Specific: ").append(goal.getSpecific()).append("\n");
        if (goal.getMeasurable() != null && !goal.getMeasurable().isBlank())
            sb.append("Measurable: ").append(goal.getMeasurable()).append("\n");
        if (goal.getAttainable() != null && !goal.getAttainable().isBlank())
            sb.append("Attainable: ").append(goal.getAttainable()).append("\n");
        if (goal.getRelevant() != null && !goal.getRelevant().isBlank())
            sb.append("Relevant: ").append(goal.getRelevant()).append("\n");
        if (goal.getTimely() != null && !goal.getTimely().isBlank())
            sb.append("Timely: ").append(goal.getTimely()).append("\n");
        if (goal.getStepsTaken() != null && !goal.getStepsTaken().isBlank())
            sb.append("Steps already taken: ").append(goal.getStepsTaken()).append("\n");
        return sb.toString().trim();
    }
}
