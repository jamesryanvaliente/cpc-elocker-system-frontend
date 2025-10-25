<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <button class="btn btn-outline-primary" @click="goBack">
        <i class="bi bi-arrow-left me-2"></i> Back
      </button>
      <h2 class="fw-bold text-center flex-grow-1 mb-0">DETAILED TRANSACTIONS</h2>
    </div>

    <!-- filters -->
    <div class="d-flex flex-wrap gap-3 mb-4">
      <div class="input-group" style="width: 250px">
        <span class="input-group-text">Start</span>
        <input type="date" v-model="startDate" class="form-control" />
      </div>

      <div class="input-group" style="width: 250px">
        <span class="input-group-text">End</span>
        <input type="date" v-model="endDate" class="form-control" />
      </div>

      <input
        type="text"
        v-model="search"
        placeholder="Search name, ID, or course..."
        class="form-control"
        style="width: 300px"
      />

      <button class="btn btn-primary" @click="fetchTransactions">Apply</button>
      <button class="btn btn-danger" @click="downloadPDF">Download PDF</button>
    </div>

    <!-- transactions table -->
    <div class="table-responsive">
      <table class="table table-striped align-middle">
        <thead class="table-primary">
          <tr>
            <th>Student ID</th>
            <th>Student</th>
            <th>Course</th>
            <th>Locker</th>
            <th>Action</th>
            <th>Amount</th>
            <th>Balance</th>
            <th>Method</th>
            <th>Reference No.</th>
            <th>Payment Date</th>
            <th>Verified By</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, index) in filteredData" :key="index">
            <td>{{ t.stud_id || '-' }}</td>
            <td>{{ t.student_name || '-' }}</td>
            <td>{{ t.course || '-' }}</td>
            <td>{{ t.locker_number || '-' }}</td>
            <td>{{ t.action_type || '-' }}</td>
            <td>₱ {{ Number(t.amount_paid || 0).toFixed(2) }}</td>
            <td>₱ {{ Number(t.balance || 0).toFixed(2) }}</td>
            <td>
              <span
                :class="t.payment_method === 'cash' ? 'badge bg-success' : 'badge bg-info'"
              >
                {{ t.payment_method  || '-' }}
              </span>
            </td>
            <td>{{ t.reference_number || '-' }}</td>
            <td>{{ formatDate(t.payment_date) }}</td>
            <td>{{ t.verified_by || '-' }}</td>
            <td>
              <button
                v-if="t.payment_method !== 'cash' && t.receipt_path"
                class="btn btn-sm btn-outline-primary"
                @click="viewReceipt(t.receipt_path)"
                >
                view
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- modal for qr receipt -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">QR Receipt</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body text-center">
            <img
              :src="receiptImage"
              class="img-fluid rounded shadow"
              alt="Receipt"
              style="max-height: 600px"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import axios from "axios"
import { useRouter } from "vue-router"

const router = useRouter()

const transactions = ref([])
const startDate = ref("")
const endDate = ref("")
const search = ref("")
const showModal = ref(false)
const receiptImage = ref("")

const API_BASE = "http://localhost:3001"

// ✅ back button
const goBack = () => {
  router.push("/TestDashboard/admin-dashboard")
}

// ✅ fetch transactions
const fetchTransactions = async () => {
  try {
    let url = `${API_BASE}/transaction-logs`
    if (startDate.value && endDate.value) {
      url += `?start_date=${startDate.value}&end_date=${endDate.value}`
    }
    const res = await axios.get(url)
    transactions.value = res.data || []
  } catch (err) {
    console.error("Error fetching transactions:", err)
  }
}

// ✅ download pdf
const downloadPDF = async () => {
  try {
    let url = `${API_BASE}/transaction-logs/report/pdf`
    if (startDate.value && endDate.value) {
      url += `?start_date=${startDate.value}&end_date=${endDate.value}`
    }
    const res = await axios.get(url, { responseType: "blob" })
    const blob = new Blob([res.data], { type: "application/pdf" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `transactions_${Date.now()}.pdf`
    link.click()
  } catch (err) {
    console.error("Error downloading PDF:", err)
  }
}

// ✅ filter data by search
const filteredData = computed(() => {
  if (!search.value) return transactions.value
  const s = search.value.toLowerCase()
  return transactions.value.filter(
    t =>
      (t.student_name && t.student_name.toLowerCase().includes(s)) ||
      (t.stud_id && t.stud_id.toLowerCase().includes(s)) ||
      (t.course && t.course.toLowerCase().includes(s))
  )
})

// ✅ view receipt
const viewReceipt = (base64Data) => {
  receiptImage.value = base64Data
  // receiptImage.value = `${API_BASE}/uploads/${path}`
  showModal.value = true
}

// ✅ format date
const formatDate = date => {
  if (!date) return "-"
  return new Date(date).toLocaleString()
}

onMounted(fetchTransactions)
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
  text-align: center;
}

.btn-outline-primary {
  border-radius: 8px;
  border-width: 1px;
  transition: all 0.2s ease;
}

.btn-outline-primary:hover {
  background-color: #0d6efd;
  color: white;
  border-color: solid #0d6efd;
}

.modal-backdrop {
  z-index: 1040;
}
.modal {
  z-index: 1050;
}
</style>