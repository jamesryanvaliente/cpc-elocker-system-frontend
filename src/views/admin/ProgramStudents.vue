<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center">
        <button
          class="btn btn-primary me-3"
          @click="$router.push({ name: 'UserPage' })"
        >
          <i class="bi bi-arrow-left me-1"></i> Back
        </button>
        <h3 class="fw-bold mb-0">
          {{ acronym ? acronym.toUpperCase() : courseName }} Students
        </h3>
      </div>

      <!-- Search -->
      <div class="input-group" style="max-width: 300px">
        <input
          v-model="search"
          type="text"
          class="form-control"
          placeholder="Search students..."
        />
        <span class="input-group-text bg-primary text-white">
          <i class="bi bi-search"></i>
        </span>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table class="table align-middle text-center">
        <thead class="table-primary">
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Gender</th>
            <th>Section</th>
            <th>Year Level</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in paginatedStudents" :key="student.user_id">
            <td>{{ student.user_id }}</td>
            <td>{{ student.full_name }}</td>
            <td>{{ student.gender }}</td>
            <td>{{ student.section }}</td>
            <td>{{ student.year_level }}</td>
            <td>{{ student.email }}</td>
          </tr>
          <tr v-if="paginatedStudents.length === 0">
            <td colspan="6" class="text-muted py-3">No students found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav aria-label="Page navigation" class="mt-3">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: page === 1 }">
          <button class="page-link" @click="prevPage" :disabled="page === 1">
            Prev
          </button>
        </li>
        <li
          v-for="p in totalPages"
          :key="p"
          class="page-item"
          :class="{ active: p === page }"
        >
          <button class="page-link" @click="goToPage(p)">{{ p }}</button>
        </li>
        <li class="page-item" :class="{ disabled: page === totalPages }">
          <button
            class="page-link"
            @click="nextPage"
            :disabled="page === totalPages"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ProgramStudents",
  props: ["id", "acronym", "name"],

  data() {
    return {
      students: [],
      search: "",
      page: 1,
      perPage: 10,
      loading: false,
    };
  },

  computed: {
    courseName() {
      return this.name;
    },
    filteredStudents() {
      return this.students.filter((s) =>
        s.full_name.toLowerCase().includes(this.search.toLowerCase())
      );
    },
    totalPages() {
      return Math.max(Math.ceil(this.filteredStudents.length / this.perPage), 1);
    },
    paginatedStudents() {
      const start = (this.page - 1) * this.perPage;
      return this.filteredStudents.slice(start, start + this.perPage);
    },
  },

  mounted() {
    this.fetchStudents();
  },

  methods: {
    async fetchStudents() {
      this.loading = true;
      try {
        const response = await axios.get(
          `http://localhost:3001/courses/${this.id}/students`
        );

        // ✅ Adjust based on your backend response structure
        // If your backend sends { students: [...] }
        if (response.data.students) {
          this.students = response.data.students;
        }
        // Or if it sends the array directly
        else if (Array.isArray(response.data)) {
          this.students = response.data;
        } else {
          console.warn("Unexpected response format:", response.data);
          this.students = [];
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        this.students = [];
      } finally {
        this.loading = false;
      }
    },

    prevPage() {
      if (this.page > 1) this.page--;
    },
    nextPage() {
      if (this.page < this.totalPages) this.page++;
    },
    goToPage(p) {
      this.page = p;
    },
  },
};
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}
.table thead {
  background-color: #f8f9fa;
}
.btn-primary {
  border-radius: 20px;
}
</style>
