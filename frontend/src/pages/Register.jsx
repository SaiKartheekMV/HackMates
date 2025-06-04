import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // This matches your backend structure exactly
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(registrationData),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Registration failed");
        }

        setSuccess("Account created successfully! Welcome to HackMates!");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setAgreedToTerms(false);
      } catch (err) {
        setError(err.message || "Registration failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bootstrap CSS */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css"
        rel="stylesheet"
      />

      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-primary bg-gradient p-3">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5 col-xxl-4">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-4 p-md-5">
                  {/* Header Section */}
                  <div className="text-center mb-4">
                    <div
                      className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                      style={{ width: "60px", height: "60px" }}
                    >
                      <UserCheck size={24} />
                    </div>
                    <h1 className="h2 fw-bold text-dark mb-2">
                      Join HackMates
                    </h1>
                    <p className="text-muted mb-0">
                      Create your account and start building amazing teams
                    </p>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div
                      className="alert alert-danger d-flex align-items-center mb-4"
                      role="alert"
                    >
                      <AlertCircle size={20} className="me-2 flex-shrink-0" />
                      <div>{error}</div>
                    </div>
                  )}

                  {/* Success Alert */}
                  {success && (
                    <div
                      className="alert alert-success d-flex align-items-center mb-4"
                      role="alert"
                    >
                      <CheckCircle size={20} className="me-2 flex-shrink-0" />
                      <div>{success}</div>
                    </div>
                  )}

                  {/* Registration Form */}
                  <form onSubmit={handleSubmit}>
                    {/* Name Fields Row */}
                    <div className="row mb-3">
                      <div className="col-12 col-md-6 mb-3 mb-md-0">
                        <label
                          htmlFor="firstName"
                          className="form-label fw-semibold"
                        >
                          First Name
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <User size={18} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <label
                          htmlFor="lastName"
                          className="form-label fw-semibold"
                        >
                          Last Name
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <User size={18} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-semibold">
                        Email Address
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <Mail size={18} className="text-muted" />
                        </span>
                        <input
                          type="email"
                          className="form-control border-start-0"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john.doe@example.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="mb-3">
                      <label
                        htmlFor="password"
                        className="form-label fw-semibold"
                      >
                        Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <Lock size={18} className="text-muted" />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control border-start-0 border-end-0"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a strong password"
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary border-start-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      <div className="form-text">
                        Must be at least 6 characters long
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="mb-3">
                      <label
                        htmlFor="confirmPassword"
                        className="form-label fw-semibold"
                      >
                        Confirm Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <Lock size={18} className="text-muted" />
                        </span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control border-start-0 border-end-0"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary border-start-0"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Terms Agreement */}
                    <div className="form-check mb-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="termsCheck"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        required
                      />
                      <label className="form-check-label" htmlFor="termsCheck">
                        I agree to the{" "}
                        <a
                          href="/terms"
                          className="text-decoration-none fw-semibold"
                        >
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy"
                          className="text-decoration-none fw-semibold"
                        >
                          Privacy Policy
                        </a>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-lg w-100 fw-semibold mb-3"
                    >
                      {loading ? (
                        <div className="d-flex align-items-center justify-content-center">
                          <div
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="text-center position-relative my-4">
                    <hr className="border-secondary" />
                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
                      OR
                    </span>
                  </div>

                  {/* Sign In Link */}
                  <div className="text-center">
                    <p className="text-dark mb-0">
                      Already have an account?{" "}
                      <a
                        href="/login"
                        className="text-decoration-none fw-semibold"
                      >
                        Sign in here
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
