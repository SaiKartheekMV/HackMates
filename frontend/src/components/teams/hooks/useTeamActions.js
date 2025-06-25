// hooks/useTeamActions.js
import { useState } from 'react';
import { teamAPI } from '../../../services/api';

const useTeamActions = (refreshTeams) => {
  const [loading, setLoading] = useState(false);

  const showAlert = (message, type = "success") => {
    // This would typically integrate with your alert system
    if (type === "success") {
      console.log("SUCCESS:", message);
    } else {
      console.error("ERROR:", message);
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      setLoading(true);
      await teamAPI.joinTeam(teamId);
      showAlert("Successfully joined the team!");
      if (refreshTeams) {
        await refreshTeams();
      }
    } catch (error) {
      console.error("Failed to join team:", error);
      if (error.response?.status === 400) {
        showAlert(error.response.data.message || "Failed to join team", "error");
      } else if (error.response?.status === 429) {
        showAlert("Too many requests. Please wait before trying again.", "error");
      } else {
        showAlert("Failed to join team", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to leave this team?")) return;

    try {
      setLoading(true);
      await teamAPI.leaveTeam(teamId);
      showAlert("Successfully left the team");
      if (refreshTeams) {
        await refreshTeams();
      }
    } catch (error) {
      console.error("Failed to leave team:", error);
      showAlert("Failed to leave team", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await teamAPI.deleteTeam(teamId);
      showAlert("Team deleted successfully");
      if (refreshTeams) {
        await refreshTeams();
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
      showAlert("Failed to delete team", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      setLoading(true);

      // Validate team data
      const validation = teamAPI.validateTeamData(teamData);
      if (!validation.isValid) {
        showAlert(validation.errors.join(", "), "error");
        return false;
      }

      const response = await teamAPI.createTeam(teamData);
      console.log("Team created:", response.data);
      showAlert("Team created successfully!");
      
      if (refreshTeams) {
        await refreshTeams();
      }
      
      return true;
    } catch (error) {
      console.error("Failed to create team:", error);
      showAlert("Failed to create team", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleJoinTeam,
    handleLeaveTeam,
    handleDeleteTeam,
    handleCreateTeam
  };
};

export default useTeamActions;