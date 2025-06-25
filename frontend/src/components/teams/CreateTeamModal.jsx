import React, { useState } from 'react';

const CreateTeamModal = ({ isOpen, onClose, onSubmit, hackathons, loading }) => {
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    hackathonId: "",
    maxMembers: 4,
    requiredSkills: [],
    preferredRoles: [],
    tags: [],
    settings: {
      isPublic: true,
      allowDirectJoin: false,
      requireApproval: true,
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(newTeam);
    resetForm();
  };

  const resetForm = () => {
    setNewTeam({
      name: "",
      description: "",
      hackathonId: "",
      maxMembers: 4,
      requiredSkills: [],
      preferredRoles: [],
      tags: [],
      settings: {
        isPublic: true,
        allowDirectJoin: false,
        requireApproval: true,
      },
    });
  };

  const addSkill = () => {
    setNewTeam((prev) => ({
      ...prev,
      requiredSkills: [
        ...prev.requiredSkills,
        { skill: "", priority: "medium" },
      ],
    }));
  };

  const updateSkill = (index, field, value) => {
    setNewTeam((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.map((skill, i) =>
        i === index ? { ...skill, [field]: value } : skill
      ),
    }));
  };

  const removeSkill = (index) => {
    setNewTeam((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index),
    }));
  };

  const addRole = () => {
    setNewTeam((prev) => ({
      ...prev,
      preferredRoles: [...prev.preferredRoles, { role: "developer", count: 1 }],
    }));
  };

  const updateRole = (index, field, value) => {
    setNewTeam((prev) => ({
      ...prev,
      preferredRoles: prev.preferredRoles.map((role, i) =>
        i === index ? { ...role, [field]: value } : role
      ),
    }));
  };

  const removeRole = (index) => {
    setNewTeam((prev) => ({
      ...prev,
      preferredRoles: prev.preferredRoles.filter((_, i) => i !== index),
    }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Create New Team</h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Team Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTeam.name}
                    onChange={(e) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Hackathon *</label>
                  <select
                    className="form-select"
                    value={newTeam.hackathonId}
                    onChange={(e) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        hackathonId: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select Hackathon</option>
                    {hackathons.map((hackathon) => (
                      <option key={hackathon._id} value={hackathon._id}>
                        {hackathon.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={newTeam.description}
                    onChange={(e) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    required
                  ></textarea>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Max Members</label>
                  <input
                    type="number"
                    className="form-control"
                    min="2"
                    max="10"
                    value={newTeam.maxMembers}
                    onChange={(e) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        maxMembers: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>

                {/* Required Skills */}
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">Required Skills</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={addSkill}
                    >
                      Add Skill
                    </button>
                  </div>
                  {newTeam.requiredSkills.map((skill, index) => (
                    <div key={index} className="row g-2 mb-2">
                      <div className="col-md-6">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Skill name"
                          value={skill.skill}
                          onChange={(e) =>
                            updateSkill(index, "skill", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-4">
                        <select
                          className="form-select"
                          value={skill.priority}
                          onChange={(e) =>
                            updateSkill(index, "priority", e.target.value)
                          }
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeSkill(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preferred Roles */}
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">Preferred Roles</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={addRole}
                    >
                      Add Role
                    </button>
                  </div>
                  {newTeam.preferredRoles.map((role, index) => (
                    <div key={index} className="row g-2 mb-2">
                      <div className="col-md-6">
                        <select
                          className="form-select"
                          value={role.role}
                          onChange={(e) =>
                            updateRole(index, "role", e.target.value)
                          }
                        >
                          <option value="developer">Developer</option>
                          <option value="designer">Designer</option>
                          <option value="data_scientist">Data Scientist</option>
                          <option value="product_manager">
                            Product Manager
                          </option>
                          <option value="marketing">Marketing</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Count"
                          min="1"
                          value={role.count}
                          onChange={(e) =>
                            updateRole(index, "count", parseInt(e.target.value))
                          }
                        />
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeRole(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="col-12">
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., AI, Web Development, Mobile"
                    value={newTeam.tags.join(", ")}
                    onChange={(e) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag),
                      }))
                    }
                  />
                </div>

                {/* Settings */}
                <div className="col-12">
                  <h6>Team Settings</h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={newTeam.settings.isPublic}
                      onChange={(e) =>
                        setNewTeam((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            isPublic: e.target.checked,
                          },
                        }))
                      }
                    />
                    <label className="form-check-label">Public Team</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={newTeam.settings.allowDirectJoin}
                      onChange={(e) =>
                        setNewTeam((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            allowDirectJoin: e.target.checked,
                          },
                        }))
                      }
                    />
                    <label className="form-check-label">Allow Direct Join</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={newTeam.settings.requireApproval}
                      onChange={(e) =>
                        setNewTeam((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            requireApproval: e.target.checked,
                          },
                        }))
                      }
                    />
                    <label className="form-check-label">Require Approval</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Team"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;