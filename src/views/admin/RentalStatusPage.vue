<template>
  <div class="container py-4">
    <h2 class="text-center fw-bold mb-4">RENT STATUS</h2>

    <!-- Search + Sort Controls -->
    <div class="d-flex flex-wrap gap-3 mb-3 justify-content-center">
      <!-- Search -->
      <div class="input-group" style="width: 300px">
        <input
          v-model="searchQuery"
          type="text"
          class="form-control"
          placeholder="Search by Student ID, Name, or Course..."
          @keyup.enter="fetchRentals"
        />
        <button class="btn btn-primary" @click="fetchRentals">
          <i class="bi bi-search"></i>
        </button>
      </div>

      <!-- Sort -->
      <div class="input-group" style="width: 300px">
        <label class="input-group-text">Sort By</label>
        <select v-model="sortBy" class="form-select" @change="fetchRentals">
          <option value="due_date">Due Date</option>
          <option value="locker_number">Locker Number</option>
        </select>
        <select v-model="sortOrder" class="form-select" @change="fetchRentals">
          <option value="asc">ASC</option>
          <option value="desc">DESC</option>
        </select>
      </div>
    </div>

    <!-- Scrollable Table -->
    <div class="table-container">
      <table class="table table-bordered table-hover align-middle text-center">
        <thead class="table-dark">
          <tr>
            <th>Student ID</th>
            <th>Student Name</th>
            <th>Course</th>
            <th>Email</th>
            <th>Locker No.</th>
            <th>Status</th>
            <th>Date Started</th>
            <th>Date End</th>
            <th>Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rental in rentals" :key="rental.rental_id">
            <td>{{ rental.stud_id }}</td>
            <td>{{ rental.f_name }} {{ rental.l_name }}</td>
            <td>{{ rental.course_name }}</td>
            <td>{{ rental.email }}</td>
            <td>{{ rental.locker_number }}</td>
            <td>{{ rental.rental_status }}</td>
            <td>{{ formatDate(rental.start_date) }}</td>
            <td>{{ formatDate(rental.due_date) }}</td>
            <td>₱{{ rental.paid_amount }}</td>
          </tr>
          <tr v-if="rentals.length === 0">
            <td colspan="9" class="text-muted fst-italic">
              No active rentals found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import axios from "axios"

const rentals = ref([])
const searchQuery = ref("")
const sortBy = ref("due_date")
const sortOrder = ref("asc")

const fetchRentals = async () => {
  try {
    let url = `http://localhost:3001/active-rentals?sortBy=${sortBy.value}&sortOrder=${sortOrder.value}`

    if (searchQuery.value) {
      url = `http://localhost:3001/active-rentals?search=${searchQuery.value}`
    }

    const res = await axios.get(url)
    console.log("API response:", res.data)

    rentals.value = res.data.records || []
  } catch (err) {
    console.error("Error fetching rentals:", err)
    rentals.value = []
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

onMounted(fetchRentals)
</script>

<style scoped>
.table-container {
  max-height: 600px; /* bigger table height */
  overflow-y: auto;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Larger and cleaner table style */
table {
  font-size: 16px;
  border-radius: 10px;
  overflow: hidden;
}

table th,
table td {
  padding: 14px 12px;
  vertical-align: middle;
}

/* Header styling */
thead th {
  background-color: #0d6efd;
  color: white;
  font-weight: 600;
}

/* Zebra striping */
tbody tr:nth-child(odd) {
  background-color: #f9f9f9;
}

/* Hover effect */
tbody tr:hover {
  background-color: #eef6ff;
  transition: background-color 0.2s ease-in-out;
}

/* Scrollbar customization */
.table-container::-webkit-scrollbar {
  width: 10px;
}
.table-container::-webkit-scrollbar-thumb {
  background-color: #bbb;
  border-radius: 10px;
}
.table-container::-webkit-scrollbar-thumb:hover {
  background-color: #888;
}
</style>
