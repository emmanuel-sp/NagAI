package com.nagai.backend.goals;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.nagai.backend.exceptions.GoalNotFoundException;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@Service
public class GoalService {
    private final GoalRepository goalRepository;
    private final UserService userService;
    
    public GoalService(GoalRepository goalRepository, UserService userService) {
        this.goalRepository = goalRepository;
        this.userService = userService;
    }

    public Goal addGoal(GoalAddRequest goalAddRequest) {
        User currentUser = userService.getCurrentUser();
        Goal goal = new Goal();
        goal.setUserId(currentUser.getUserId());
        goal.setTitle(goalAddRequest.getTitle());
        goal.setDescription(goalAddRequest.getDescription());
        goal.setTargetDate(goalAddRequest.getTargetDate());
        goal.setSpecific(goalAddRequest.getSpecific());
        goal.setMeasurable(goalAddRequest.getMeasurable());
        goal.setAttainable(goalAddRequest.getAttainable());
        goal.setRelevant(goalAddRequest.getRelevant());
        goal.setTimely(goalAddRequest.getTimely());
        goal.setStepsTaken(goalAddRequest.getStepsTaken());

        return goalRepository.save(goal);
    }

    public Goal updateGoal(GoalUpdateRequest goalUpdateRequest) {
        User currentUser = userService.getCurrentUser();
        Goal goal = goalRepository.findById(goalUpdateRequest.getGoalId()).orElseThrow(() -> new GoalNotFoundException());
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to update this goal");
        }
        goal.setTitle(goalUpdateRequest.getTitle());
        goal.setDescription(goalUpdateRequest.getDescription());
        goal.setTargetDate(goalUpdateRequest.getTargetDate());
        goal.setSpecific(goalUpdateRequest.getSpecific());
        goal.setMeasurable(goalUpdateRequest.getMeasurable());
        goal.setAttainable(goalUpdateRequest.getAttainable());
        goal.setRelevant(goalUpdateRequest.getRelevant());
        goal.setTimely(goalUpdateRequest.getTimely());
        goal.setStepsTaken(goalUpdateRequest.getStepsTaken());

        return goalRepository.save(goal);
    }

    public Goal getGoal(Long goalId) {
        Goal goal = goalRepository.findById(goalId).orElseThrow(() -> new GoalNotFoundException());
        return goal;
    }

    public Goal getGoalForCurrentUser(Long goalId) {
        Goal goal = goalRepository.findById(goalId).orElseThrow(GoalNotFoundException::new);
        User currentUser = userService.getCurrentUser();
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to view this goal");
        }
        return goal;
    }

    public List<Goal> getAllGoals() {
        User user = userService.getCurrentUser();
        List<Goal> goals = goalRepository.findAllByUserId(user.getUserId());
        return goals;
    }

    public void deleteGoal(Long goalId) {
        User user = userService.getCurrentUser();
        Goal goal = goalRepository.findById(goalId).orElseThrow(() -> new GoalNotFoundException());
        if (user.getUserId().equals(goal.getUserId())) {
            goalRepository.delete(goal);
        } else {
            throw new AccessDeniedException("You do not have permission to delete this goal");
        }
    }


}
