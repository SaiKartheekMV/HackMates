// components/teams/TeamFilters.jsx
import React from 'react';

const TeamFilters = ({ 
  filters, 
  onFiltersChange, 
  hackathons = [], 
  selectedHackathon, 
  onHackathonChange, 
  onSearch,
  loading = false 
}) => {

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    onFiltersChange(newFilters);
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h6 className="card-title">Filters</h6>
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Hackathon</label>
            <select
              className="form-select"
              value={selectedHackathon || ''}
              onChange={(e) => onHackathonChange?.(e.target.value)}
            >
              <option value="">Select Hackathon</option>
              {hackathons.map((hackathon) => (
                <option key={hackathon._id} value={hackathon._id}>
                  {hackathon.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All</option>
              <option value="forming">Forming</option>
              <option value="complete">Complete</option>
              <option value="competing">Competing</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          
          <div className="col-md-2">
            <label className="form-label">Location</label>
            <select
              className="form-select"
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            >
              <option value="">All</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="in_person">In Person</option>
            </select>
          </div>
          
          <div className="col-md-2">
            <label className="form-label">Skills</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., React, Python"
              value={filters.skills || ''}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
            />
          </div>
          
          <div className="col-md-2 d-flex align-items-end">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="hasOpenings"
                checked={filters.hasOpenings || false}
                onChange={(e) => handleFilterChange('hasOpenings', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="hasOpenings">
                Has Openings
              </label>
            </div>
          </div>
          
          <div className="col-md-1 d-flex align-items-end">
            <button
              className="btn btn-primary"
              onClick={onSearch}
              disabled={!selectedHackathon || loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamFilters;