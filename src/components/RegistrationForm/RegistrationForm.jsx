import { useState } from "react";
import "./RegistrationForm.css";

const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    studentName: "",
    rollNumber: "",
    section: "",
    semester: "",
    fatherName: "",
    cnic: "",
    phone: "",
    email: "",
    gender: "",
  });

  const [picture, setPicture] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /*
    Google Apps Script deployment URL yahan paste karna hai
  */
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwyH2Lehw7c3uhkuq7hCz5L3bQFGAmYN5dyhp4EBnTjB1OTuFefbFzNhhiSERjbx-CZaw/exec";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "rollNumber"
          ? value.toUpperCase()
          : value,
    }));
  };

  const handlePicture = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please upload a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Picture must be smaller than 5MB.");
      return;
    }

    setPicture(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!picture) {
      setMessage("Student picture is required.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const imageBase64 =
        await convertImageToBase64(picture);

      const payload = {
        ...formData,

        picture: imageBase64,
        pictureName: picture.name,
        pictureType: picture.type,
      };

      const response = await fetch(SCRIPT_URL, {
        method: "POST",

        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },

        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Registration failed."
        );
      }

      setMessage(
        "Registration submitted successfully!"
      );

      setFormData({
        studentName: "",
        rollNumber: "",
        section: "",
        semester: "",
        fatherName: "",
        cnic: "",
        phone: "",
        email: "",
        gender: "",
      });

      setPicture(null);
      setPreview(null);

      document.getElementById(
        "student-picture"
      ).value = "";
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to submit registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="registration-section">

      <div className="registration-bg-text">
        LGU
      </div>

      <div className="registration-container">

        {/* ===========================
            HEADER
        =========================== */}

        <div className="registration-header">

          <span className="registration-tag">
            STUDENT REGISTRATION
          </span>

          <h1>
            JOIN THE
            <span> COMMUNITY</span>
          </h1>

          <p>
            Complete your student registration using
            accurate university information.
          </p>

          <div className="lgu-notice">
            <span>!</span>

            <p>
              This registration is exclusively for
              students of
              <strong>
                {" "}
                Lahore Garrison University
              </strong>
              .
            </p>
          </div>

        </div>


        {/* ===========================
            FORM
        =========================== */}

        <form
          className="registration-form"
          onSubmit={handleSubmit}
        >

          {/* STUDENT INFORMATION */}

          <div className="form-section-title">
            <span>01</span>

            <div>
              <h3>Student Information</h3>
              <p>
                Enter your university details
              </p>
            </div>
          </div>


          <div className="form-grid">

            <div className="form-group">
              <label>
                Student Full Name
                <span>*</span>
              </label>

              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>


            <div className="form-group">
              <label>
                Roll Number
                <span>*</span>
              </label>

              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="FA/2023/BSCS/598"
                pattern="[A-Za-z]{2,5}/[0-9]{4}/[A-Za-z0-9]{2,10}/[0-9]{1,8}"
                title="Example: FA/2023/BSCS/598"
                required
              />

              <small>
                Example: FA/2023/BSCS/598
              </small>
            </div>


            <div className="form-group">
              <label>
                Section
                <span>*</span>
              </label>

              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g. A"
                required
              />
            </div>


            <div className="form-group">
              <label>
                Semester
                <span>*</span>
              </label>

              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select semester
                </option>

                {semesters.map((semester) => (
                  <option
                    key={semester}
                    value={semester}
                  >
                    Semester {semester}
                  </option>
                ))}
              </select>
            </div>

          </div>


          {/* PERSONAL INFORMATION */}

          <div className="form-section-title">
            <span>02</span>

            <div>
              <h3>Personal Information</h3>
              <p>
                Provide your contact details
              </p>
            </div>
          </div>


          <div className="form-grid">

            <div className="form-group">
              <label>
                Father Name
                <span>*</span>
              </label>

              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                placeholder="Enter father name"
                required
              />
            </div>


            <div className="form-group">
              <label>
                CNIC
                <span>*</span>
              </label>

              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="35202-1234567-1"
                pattern="[0-9]{5}-[0-9]{7}-[0-9]"
                title="Example: 35202-1234567-1"
                required
              />
            </div>


            <div className="form-group">
              <label>
                Phone Number
                <span>*</span>
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="03XXXXXXXXX"
                pattern="03[0-9]{9}"
                required
              />
            </div>


            <div className="form-group">
              <label>
                Email Address
                <span>*</span>
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@example.com"
                required
              />
            </div>

          </div>


          {/* GENDER */}

          <div className="form-section-title">
            <span>03</span>

            <div>
              <h3>Gender</h3>
              <p>Select your gender</p>
            </div>
          </div>


          <div className="gender-options">

            <label
              className={`gender-card ${
                formData.gender === "Male"
                  ? "selected"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={
                  formData.gender === "Male"
                }
                onChange={handleChange}
                required
              />

              <span className="gender-icon">
                ♂
              </span>

              <span>Male</span>
            </label>


            <label
              className={`gender-card ${
                formData.gender === "Female"
                  ? "selected"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={
                  formData.gender === "Female"
                }
                onChange={handleChange}
                required
              />

              <span className="gender-icon">
                ♀
              </span>

              <span>Female</span>
            </label>

          </div>


          {/* PICTURE */}

          <div className="form-section-title">
            <span>04</span>

            <div>
              <h3>Student Picture</h3>

              <p>
                Upload a clear recent picture
              </p>
            </div>
          </div>


          <div className="picture-upload">

            <label
              htmlFor="student-picture"
              className="picture-box"
            >

              {preview ? (
                <img
                  src={preview}
                  alt="Student preview"
                />
              ) : (
                <div className="upload-placeholder">

                  <div className="upload-icon">
                    +
                  </div>

                  <strong>
                    Upload Student Picture
                  </strong>

                  <span>
                    JPG, PNG or WEBP • Max 5MB
                  </span>

                </div>
              )}

            </label>


            <input
              id="student-picture"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePicture}
              required
            />

          </div>


          {message && (
            <div className="form-message">
              {message}
            </div>
          )}


          <button
            type="submit"
            className="registration-submit"
            disabled={loading}
          >
            <span>
              {loading
                ? "SUBMITTING..."
                : "SUBMIT REGISTRATION"}
            </span>

            {!loading && <b>→</b>}
          </button>

        </form>

      </div>

    </section>
  );
};

export default RegistrationForm;