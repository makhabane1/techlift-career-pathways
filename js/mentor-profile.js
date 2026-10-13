document.addEventListener("DOMContentLoaded", () => {
  const profileKey = "techliftMentorProfile";
  const profileForm = document.getElementById("mentorProfileForm");
  const profileStatus = document.getElementById("mentorProfileStatus");
  const photoInput = document.getElementById("mentorPhoto");
  const photoPreview = document.getElementById("mentorPhotoPreview");
  const initialsPreview = document.getElementById("mentorPhotoInitials");
  const removePhotoButton = document.getElementById("removeMentorPhoto");
  let photoData = "";

  const readProfile = () => {
    try {
      return JSON.parse(localStorage.getItem(profileKey) || "null");
    } catch {
      return null;
    }
  };

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });

  const getInitials = (name) =>
    String(name || "Mentor")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

  const setPhotoPreview = (photo, name) => {
    const initials = getInitials(name);
    if (photo && /^data:image\/(png|jpeg|webp);base64,/i.test(photo)) {
      photoPreview.innerHTML = `<img src="${escapeHtml(photo)}" alt="" />`;
    } else {
      photoPreview.innerHTML = `<span id="mentorPhotoInitials">${escapeHtml(initials)}</span>`;
    }
  };

  const loadProfileEditor = (profile) => {
    if (!profileForm || !profile) return;
    profileForm.elements.mentorName.value = profile.name || "";
    profileForm.elements.mentorRole.value = profile.role || "";
    profileForm.elements.mentorBio.value = profile.bio || "";
    profileForm.elements.mentorDegrees.value = profile.degrees || "";
    profileForm.elements.mentorCertifications.value =
      profile.certifications || "";
    profileForm.elements.mentorExperience.value = profile.experience || "";
    profileForm.elements.mentorExpertise.value = (profile.expertise || []).join(
      ", ",
    );
    photoData = profile.photo || "";
    setPhotoPreview(photoData, profile.name);
    if (profileStatus)
      profileStatus.textContent =
        "Profile saved. Learners can see these details.";
  };

  const profile = readProfile();
  if (profileForm) loadProfileEditor(profile);

  if (profileForm) {
    profileForm.elements.mentorName.addEventListener("input", () => {
      if (!photoData)
        setPhotoPreview("", profileForm.elements.mentorName.value);
    });

    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (!file) return;
      if (
        !/^image\/(png|jpeg|webp)$/.test(file.type) ||
        file.size > 1024 * 1024
      ) {
        profileStatus.textContent =
          "Choose a JPG, PNG, or WebP image smaller than 1 MB.";
        photoInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        photoData = reader.result;
        setPhotoPreview(photoData, profileForm.elements.mentorName.value);
        profileStatus.textContent =
          "Photo ready. Save your profile to publish it.";
      });
      reader.readAsDataURL(file);
    });

    removePhotoButton.addEventListener("click", () => {
      photoData = "";
      photoInput.value = "";
      setPhotoPreview("", profileForm.elements.mentorName.value);
      profileStatus.textContent =
        "Photo removed. Save your profile to publish the change.";
    });

    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!profileForm.reportValidity()) return;

      const nextProfile = {
        name: profileForm.elements.mentorName.value.trim(),
        role: profileForm.elements.mentorRole.value.trim(),
        bio: profileForm.elements.mentorBio.value.trim(),
        degrees: profileForm.elements.mentorDegrees.value.trim(),
        certifications: profileForm.elements.mentorCertifications.value.trim(),
        experience: profileForm.elements.mentorExperience.value,
        expertise: profileForm.elements.mentorExpertise.value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        photo: photoData,
      };

      try {
        localStorage.setItem(profileKey, JSON.stringify(nextProfile));
        profileStatus.textContent =
          "Profile published. Learners can now see your expertise.";
        setPhotoPreview(photoData, nextProfile.name);
        renderPublicProfile(nextProfile);
      } catch {
        profileStatus.textContent =
          "Could not save this profile. Try a smaller photo.";
      }
    });
  }

  function renderPublicProfile(savedProfile) {
    if (!savedProfile) return;
    const learnerName = document.getElementById("learnerMentorName");
    if (learnerName) {
      learnerName.textContent = savedProfile.name;
      document.getElementById("learnerMentorRole").textContent =
        savedProfile.role;
      const learnerPhoto = document.getElementById("learnerMentorPhoto");
      if (
        savedProfile.photo &&
        /^data:image\/(png|jpeg|webp);base64,/i.test(savedProfile.photo)
      ) {
        learnerPhoto.innerHTML = `<img src="${escapeHtml(savedProfile.photo)}" alt="" />`;
      } else {
        learnerPhoto.textContent = getInitials(savedProfile.name);
      }

      const credentials = [];
      if (savedProfile.degrees)
        credentials.push(["Education", savedProfile.degrees]);
      if (savedProfile.certifications)
        credentials.push(["Certifications", savedProfile.certifications]);
      if (savedProfile.experience)
        credentials.push(["Experience", `${savedProfile.experience} years`]);
      if (savedProfile.expertise?.length)
        credentials.push(["Expertise", savedProfile.expertise.join(", ")]);
      document.getElementById("learnerMentorCredentials").innerHTML =
        credentials
          .map(
            ([label, value]) =>
              `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
          )
          .join("");
      const learnerBio = document.getElementById("learnerMentorBio");
      if (learnerBio) {
        learnerBio.textContent = savedProfile.bio || "";
        learnerBio.classList.toggle("hidden", !savedProfile.bio);
      }
    }

    const directory = document.getElementById("publishedMentorDirectory");
    if (directory) {
      const initials = escapeHtml(getInitials(savedProfile.name));
      const portrait =
        savedProfile.photo &&
        /^data:image\/(png|jpeg|webp);base64,/i.test(savedProfile.photo)
          ? `<img src="${escapeHtml(savedProfile.photo)}" alt="" />`
          : `<span>${initials}</span>`;
      const expertise = (savedProfile.expertise || [])
        .map(
          (item) =>
            `<span class="mentor-expertise-item">${escapeHtml(item)}</span>`,
        )
        .join("");
      directory.innerHTML = `
        <article class="mentor-card published-mentor-card">
          <div class="mentor-photo mentor-profile-photo">${portrait}</div>
          <div class="published-mentor-copy">
            <p class="eyebrow">TechLift mentor</p>
            <h3>${escapeHtml(savedProfile.name)}</h3>
            <span class="published-mentor-role">${escapeHtml(savedProfile.role)}</span>
            ${savedProfile.bio ? `<p>${escapeHtml(savedProfile.bio)}</p>` : ""}
            <dl class="mentor-credentials">
              ${savedProfile.degrees ? `<div><dt>Education</dt><dd>${escapeHtml(savedProfile.degrees)}</dd></div>` : ""}
              ${savedProfile.certifications ? `<div><dt>Certifications</dt><dd>${escapeHtml(savedProfile.certifications)}</dd></div>` : ""}
              ${savedProfile.experience ? `<div><dt>Experience</dt><dd>${escapeHtml(savedProfile.experience)} years</dd></div>` : ""}
            </dl>
            ${expertise ? `<div class="mentor-expertise">${expertise}</div>` : ""}
          </div>
        </article>
      `;
    }

    const avatar = document.querySelector(".mentor-avatar");
    if (avatar) {
      avatar.textContent = getInitials(savedProfile.name);
      avatar.setAttribute("aria-label", `${savedProfile.name} mentor profile`);
    }
  }

  renderPublicProfile(profile);
});
