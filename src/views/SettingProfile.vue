<template>
  <div class="container py-4">
    <!-- Header section -->
    <div class="d-flex align-items-center mb-4 border-bottom pb-3">
      <div class="position-relative">
        <img
          :src="profileImageUrl"
          alt="Profile"
          class="rounded-circle border"
          width="120"
          height="120"
        />
        <button
          class="btn btn-sm btn-light position-absolute bottom-0 start-0 translate-middle p-1 rounded-circle shadow"
        >
          <i class="bi bi-camera"></i>
        </button>
      </div>
      <div class="ms-4">
        <h4 class="fw-bold mb-1">
          {{ form.first_name }} {{ form.last_name }}
        </h4>
        <div class="text-muted">{{ form.course }}</div>
      </div>
    </div>

    <!-- Form section -->
    <form @submit.prevent="updateProfile">
      <div class="row mb-3">
        <div class="col-md-6 mb-3">
          <label for="idNumber" class="form-label">Student ID:</label>
          <input
            type="text"
            id="idNumber"
            class="form-control"
            v-model="form.student_id"
            disabled
          />
        </div>
        <div class="col-md-6 mb-3">
          <label for="course" class="form-label">Course:</label>
          <input
            type="text"
            id="course"
            class="form-control"
            v-model="form.course"
            disabled
          />
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6 mb-3">
          <label for="firstName" class="form-label">First Name:</label>
          <input
            type="text"
            id="firstName"
            class="form-control"
            v-model="form.first_name"
          />
        </div>
        <div class="col-md-6 mb-3">
          <label for="lastName" class="form-label">Last Name:</label>
          <input
            type="text"
            id="lastName"
            class="form-control"
            v-model="form.last_name"
          />
        </div>
      </div>

      <div class="row mb-4">
        <div class="col-md-6 mb-3">
          <label for="currentPassword" class="form-label">
            Current Password:
          </label>
          <input
            type="password"
            id="currentPassword"
            class="form-control"
            placeholder="Enter current password"
            v-model="form.currentPassword"
          />
        </div>
        <div class="col-md-6 mb-3">
          <label for="newPassword" class="form-label">New Password:</label>
          <input
            type="password"
            id="newPassword"
            class="form-control"
            placeholder="Enter new password"
            v-model="form.newPassword"
          />
        </div>
      </div>

      <button type="submit" class="btn btn-primary px-4">Save</button>
    </form>

    <!-- Success / Error messages -->
    <div v-if="message" class="mt-3 alert" :class="messageClass">
      {{ message }}
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "SettingProfile",
  data() {
    return {
      form: {
        student_id: "",
        first_name: "",
        last_name: "",
        course: "",
        username: "",
        role: "",
        profile_picture: "",
        profile_pic_url: "",
        currentPassword: "",
        newPassword: "",
      },
      message: "",
      messageClass: "",
    };
  },
  computed: {
    profileImageUrl() {
      // ✅ Show uploaded image if available, otherwise show default logo
      return this.form.profile_pic_url
        ? `http://localhost:3001${this.form.profile_pic_url}`
        : require("@/assets/logo.png");
    },
  },
  async created() {
    try {
      // ✅ Fetch user info from /settings
      const response = await axios.get("http://localhost:3001/settings");

      if (response.data.user) {
        const user = response.data.user;
        this.form = {
          ...this.form,
          student_id: user.student_id,
          first_name: user.first_name,
          last_name: user.last_name,
          course: user.course,
          username: user.username,
          role: user.role,
          profile_picture: user.profile_picture,
          profile_pic_url: user.profile_pic_url,
        };
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      this.message = "Failed to load profile information.";
      this.messageClass = "alert-danger";
    }
  },
  methods: {
    async updateProfile() {
      try {
        const updateData = {
          first_name: this.form.first_name,
          last_name: this.form.last_name,
          currentPassword: this.form.currentPassword,
          newPassword: this.form.newPassword,
        };

        const res = await axios.put("http://localhost:3001/settings", updateData);

        this.message = res.data.message || "Profile updated successfully!";
        this.messageClass = "alert-success";

        // Clear password fields
        this.form.currentPassword = "";
        this.form.newPassword = "";
      } catch (error) {
        console.error("Error updating profile:", error);
        this.message =
          error.response?.data?.error || "Failed to update profile.";
        this.messageClass = "alert-danger";
      }
    },
  },
};
</script>

<style scoped>
.container {
  max-width: 700px;
}
.btn-light i {
  font-size: 1rem;
}
</style>
