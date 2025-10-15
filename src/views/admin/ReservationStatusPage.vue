<template>
  <div class="container py-4">
    <h2 class="text-center fw-bold mb-4">RESERVATION DETAILS</h2>

    <!-- 🔍 Search Bar -->
    <div class="d-flex justify-content-center mb-4">
      <div class="input-group" style="width: 350px">
        <input
          v-model="searchQuery"
          type="text"
          class="form-control"
          placeholder="Search by Locker No., Location, or Status..."
          @keyup.enter="fetchLockers"
        />
        <button class="btn btn-primary" @click="fetchLockers">
          <i class="bi bi-search"></i>
        </button>
      </div>
    </div>

    <!-- 🧾 Table -->
    <div class="table-container">
      <table class="table table-bordered table-hover align-middle text-center">
        <thead class="table-dark">
          <tr>
            <th>Locker ID</th>
            <th>Locker Number</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="locker in filteredLockers" :key="locker.locker_id">
            <td>{{ locker.locker_id }}</td>
            <td>{{ locker.locker_number }}</td>
            <td>{{ locker.location }}</td>
            <td>
              <span
                :class="[ 
                  'badge',
                  locker.status?.toLowerCase() === 'available'
                    ? 'bg-success'
                    : locker.status?.toLowerCase() === 'reserved'
                    ? 'bg-warning text-dark'
                    : 'bg-danger'
                ]"
              >
                {{ locker.status }}
              </span>
            </td>
            <td>
              <div class="d-flex justify-content-center gap-2">
                <button
                  class="btn btn-primary btn-sm px-3"
                  @click="approve(locker.locker_id)"
                >
                  Approve
                </button>
                <button
                  class="btn btn-danger btn-sm px-3"
                  @click="cancel(locker.locker_id)"
                >
                  Cancel
                </button>
              </div>
            </td>
          </tr>

          <!-- If no lockers found -->
          <tr v-if="filteredLockers.length === 0">
            <td colspan="5" class="text-muted fst-italic">
              No reservations found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const lockers = ref([]); // ✅ Always an array
const searchQuery = ref("");

// ✅ Fetch lockers safely
const fetchLockers = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:3001/locker/lockers", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = res.data;
    console.log("Locker API Response:", data);

    // ✅ Automatically handle any format (array or wrapped)
    if (Array.isArray(data)) {
      lockers.value = data;
    } else if (data && Array.isArray(data.lockers)) {
      lockers.value = data.lockers;
    } else if (data && Array.isArray(data.data)) {
      lockers.value = data.data;
    } else if (data && Array.isArray(data.result)) {
      lockers.value = data.result;
    } else {
      console.error("Unexpected locker response:", data);
      lockers.value = [];
    }
  } catch (err) {
    console.error("Failed to fetch lockers:", err);
    lockers.value = [];
  }
};

// ✅ Computed search filter (safe)
const filteredLockers = computed(() => {
  if (!Array.isArray(lockers.value)) return []; // safety
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return lockers.value;
  return lockers.value.filter(
    (l) =>
      l.locker_number?.toString().toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.status?.toLowerCase().includes(q)
  );
});

// Mock Approve / Cancel
const approve = (lockerId) => {
  alert(`✅ Approved reservation for Locker ID: ${lockerId}`);
};
const cancel = (lockerId) => {
  alert(`❌ Canceled reservation for Locker ID: ${lockerId}`);
};

onMounted(fetchLockers);
</script>

<style scoped>
.table-container {
  max-height: 600px;
  overflow-y: auto;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Table style */
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

/* Scrollbar */
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
