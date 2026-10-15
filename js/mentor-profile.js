TechLiftStore.ready.then(() => {
  const profileForm = document.getElementById("mentorProfileForm");
  const profileStatus = document.getElementById("mentorProfileStatus");
  const photoInput = document.getElementById("mentorPhoto");
  const photoPreview = document.getElementById("mentorPhotoPreview");
  const removePhotoButton = document.getElementById("removeMentorPhoto");
  const { escapeHtml } = TechLiftStore;
  let photoData = "";

  const getInitials = (name) =>
    String(name || "Mentor")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

  const isSafePhoto = (photo) => /^data:image\/(png|jpeg|webp);base64,/i.test(photo || "");

  const setPhotoPreview = (photo, name) => {
    if (isSafePhoto(photo)) {
      photoPreview.innerHTML = `<img src="${escapeHtml(photo)}" alt="" />`;
    } else {
      photoPreview.innerHTML = `<span id="mentorPhotoInitials">${escapeHtml(getInitials(name))}</span>`;
    }
  };

  const loadProfileEditor = (profile) => {
    if (!profileForm || !profile) return;
    profileForm.elements.mentorName.value = profile.name || "";
    profileForm.elements.mentorRole.value = profile.role || "";
    profileForm.elements.mentorBio.value = profile.bio || "";
    profileForm.elements.mentorDegrees.value = profile.degrees || "";
    profileForm.elements.mentorCertifications.value = profile.certifications || "";
    profileForm.elements.mentorExperience.value = profile.experience || "";
    profileForm.elements.mentorExpertise.value = (profile.expertise || []).join(", ");
    photoData = profile.photo || "";
    setPhotoPreview(photoData, profile.name);
    if (profileStatus) profileStatus.textContent = "Profile saved. Learners can see these details.";
  };

  if (profileForm) {
    loadProfileEditor(TechLiftStore.getCurrentMentor());

    profileForm.elements.mentorName.addEventListener("input", () => {
      if (!photoData) setPhotoPreview("", profileForm.elements.mentorName.value);
    });

    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 1024 * 1024) {
        profileStatus.textContent = "Choose a JPG, PNG, or WebP image smaller than 1 MB.";
        photoInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        photoData = reader.result;
        setPhotoPreview(photoData, profileForm.elements.mentorName.value);
        profileStatus.textContent = "Photo ready. Save your profile to publish it.";
      });
      reader.readAsDataURL(file);
    });

    removePhotoButton.addEventListener("click", () => {
      photoData = "";
      photoInput.value = "";
      setPhotoPreview("", profileForm.elements.mentorName.value);
      profileStatus.textContent = "Photo removed. Save your profile to publish the change.";
    });

    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!profileForm.reportValidity()) return;

      const nextProfile = {
        id: TechLiftStore.getCurrentMentor()?.id,
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
        TechLiftStore.saveMentorProfile(nextProfile);
        profileStatus.textContent = "Profile published. Learners can now see your expertise.";
        setPhotoPreview(photoData, nextProfile.name);
        renderDirectory();
      } catch {
        profileStatus.textContent = "Could not save this profile. Try a smaller photo.";
      }
    });
  }

  function renderDirectory() {
    const directory = document.getElementById("publishedMentorDirectory");
    if (!directory) return;

    const mentors = TechLiftStore.getMentorDirectory();
    if (!mentors.length) {
      directory.innerHTML = '<p class="muted">No mentors have published profiles yet.</p>';
      return;
    }

    directory.innerHTML = mentors
      .map((mentor) => {
        const portrait = isSafePhoto(mentor.photo)
          ? `<img src="${escapeHtml(mentor.photo)}" alt="" />`
          : `<span>${escapeHtml(getInitials(mentor.name))}</span>`;
        const expertise = (mentor.expertise || [])
          .map((item) => `<span class="mentor-expertise-item">${escapeHtml(item)}</span>`)
          .join("");
        return `
          <article class="mentor-card published-mentor-card">
            <div class="mentor-photo mentor-profile-photo">${portrait}</div>
            <div class="published-mentor-copy">
              <p class="eyebrow">TechLift mentor</p>
              <h3>${escapeHtml(mentor.name)}</h3>
              <span class="published-mentor-role">${escapeHtml(mentor.role)}</span>
              ${mentor.bio ? `<p>${escapeHtml(mentor.bio)}</p>` : ""}
              <dl class="mentor-credentials">
                ${mentor.degrees ? `<div><dt>Education</dt><dd>${escapeHtml(mentor.degrees)}</dd></div>` : ""}
                ${mentor.certifications ? `<div><dt>Certifications</dt><dd>${escapeHtml(mentor.certifications)}</dd></div>` : ""}
                ${mentor.experience ? `<div><dt>Experience</dt><dd>${escapeHtml(mentor.experience)} years</dd></div>` : ""}
              </dl>
              ${expertise ? `<div class="mentor-expertise">${expertise}</div>` : ""}
            </div>
          </article>
        `;
      })
      .join("");
  }

  const current = TechLiftStore.getCurrentMentor();
  const avatar = document.querySelector(".mentor-avatar");
  if (avatar && current) {
    avatar.textContent = getInitials(current.name);
    avatar.setAttribute("aria-label", `${current.name} mentor profile`);
  }

  renderDirectory();
});
