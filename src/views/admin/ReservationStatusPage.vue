<template>
  <div class="container py-4">
    <h2 class="text-center fw-bold mb-4 text-primary">RESERVATION DETAILS</h2>

    <!-- 🔍 Search -->
    <div class="d-flex justify-content-center mb-4">
      <div class="input-group shadow-sm rounded" style="width: 380px">
        <input
          v-model="searchQuery"
          type="text"
          class="form-control border-0"
          placeholder="Search by Locker No., Course, or Status..."
          @keyup.enter="fetchPendingRentals"
        />
        <button class="btn btn-primary shadow-sm" @click="fetchPendingRentals">
          <i class="bi bi-search"></i>
        </button>
      </div>
    </div>

    <!-- 🖥 TABLE VIEW -->
    <div class="table-container shadow-lg bg-white rounded-4 p-3 d-none d-xl-block">
      <table class="table table-hover align-middle text-center mb-0">
        <thead class="table-header">
          <tr>
            <th>Student ID</th>
            <th>Student Name</th>
            <th>Locker No.</th>
            <!-- <th>Rental Status</th> -->
            <th>Course</th>
            <th>Payment Method</th>
            <th>Reference </th>
            <th>Amount</th>
            <th>Status</th>
            <th>Receipt</th>
            <th>Actions</th>
          </tr>
        </thead>

<tbody>
  <tr v-for="rental in filteredRentals" :key="rental.rental_id">
    <td>{{ rental.stud_id }}</td>
    <td>
      {{ rental.f_name }} 
      <span v-if="rental.m_name"> {{ rental.m_name.charAt(0) }}.</span>
      {{ rental.l_name }}
    </td>
    <td>{{ rental.locker_number }}</td>
    <!-- <td>{{ rental.status }}</td> -->
    <td>{{ rental.course_name }}</td>
    <td>
      <span class="badge bg-secondary">
        {{ rental.pay_method ? rental.pay_method : (rental.payment_method || 'cash') }}
      </span>
    </td>
    <td>{{ rental.reference_number || '—' }}</td>
    <td>{{ rental.amount_paid ? `₱${Number(rental.amount_paid).toFixed(2)}` : '—' }}</td>
    <td>
      <span
      :class="[
        'badge status-badge',
        rental.status?.toLowerCase() === 'pending' ? 'bg-warning text-dark' :
        rental.status?.toLowerCase() === 'reserved' ? 'bg-info text-dark' :
        rental.status?.toLowerCase() === 'active' ? 'bg-success' :
        rental.status?.toLowerCase() === 'follow-up' ? 'bg-primary text-white' :
        // rental.status?.toLowerCase() === 'expired' ? 'bg-danger text-white' :
        'bg-danger'
        ]"
        >
        {{ rental.status }}
      </span>
    </td>
    <td>
      <button
        v-if="rental.receipt_path"
        class="btn btn-sm btn-outline-primary"
        @click="viewReceipt(rental.receipt_path)"
      >
        view
      </button>
      <span v-else class="text-muted">—</span>
    </td>
    <td>
      <div class="d-flex justify-content-center gap-2">
        <button
          class="btn btn-approve shadow-sm"
          @click="approveReservation(rental.rental_id)"
          :disabled="rental.status?.toLowerCase() === 'active'"
        >
          <i class="bi bi-check-circle me-1"></i> Approve
        </button>
        <button
          class="btn btn-cancel shadow-sm"
          @click="cancelRental(rental.rental_id)"
          :disabled="rental.status?.toLowerCase() === 'active'"
        >
          <i class="bi bi-x-circle me-1"></i> Cancel
        </button>
      </div>
    </td>
  </tr>
</tbody>

      </table>
    </div>

    <!-- 📱 CARD VIEW (Mobile) -->
    <div class="card-container d-xl-none">
      <div class="scrollable-cards">
        <div
          v-for="rental in filteredRentals"
          :key="rental.rental_id"
          class="rental-card shadow-sm"
        >
          <div class="card-row">
  <div><strong>ID:</strong> {{ rental.student_id || rental.user_id }}</div>
  <div><strong>Name:</strong> {{ rental.student_name || `${rental.first_name} ${rental.last_name}` }}</div>
  <div><strong>Locker:</strong> {{ rental.locker_number }}</div>
  <div><strong>Course:</strong> {{ rental.course_name }}</div>
  <div><strong>Method:</strong> {{ rental.pay_method || rental.payment_method }}</div>
  <div><strong>Status:</strong>
    <span
      :class="[
        'badge status-badge-sm',
        rental.status?.toLowerCase() === 'pending'
          ? 'bg-warning text-dark'
          : rental.status?.toLowerCase() === 'reserved'
          ? 'bg-info text-dark'
          : rental.status?.toLowerCase() === 'active'
          ? 'bg-success'
          : 'bg-danger',
      ]"
    >
      {{ rental.status }}
    </span>
  </div>
  <div>
    <button
      v-if="rental.receipt_path"
      class="btn btn-sm btn-outline-primary w-100 mt-2"
      @click="viewReceipt(rental.receipt_path)"
    >
      View Receipt
    </button>
  </div>
</div>

        </div>
      </div>
      <p v-if="filteredRentals.length === 0" class="text-center text-muted fst-italic py-4">
        No rentals found
      </p>
    </div>

    <!-- 🧾 RECEIPT MODAL -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Payment Receipt</h5>
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

  <!-- 🟦 APPROVE (CASH) — INPUT MONTHS PAID MODAL -->
<div v-if="showCashModal" class="modal fade show d-block" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title">Enter Months Paid</h5>
        <button type="button" class="btn-close" @click="closeCashModal"></button>
      </div>

      <div class="modal-body">
        <label class="form-label">Months Paid:</label>
        <input
          v-model.number="cashMonthsPaid"
          type="number"
          class="form-control"
          min="1"
          required
        />

        <div v-if="selectedRentalId" class="text-success small mt-2">
          ₱{{ cashAmount.toFixed(2) }} (with {{ cashMonthsPaid }} month(s) added)
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeCashModal">Cancel</button>
        <button class="btn btn-primary" @click="confirmCashApproval">Submit</button>
      </div>

    </div>
  </div>
</div>
<div v-if="showCashModal" class="modal-backdrop fade show"></div>

</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";

const rentals = ref([]);
const searchQuery = ref("");
const showModal = ref(false);
const receiptImage = ref("");

const showCashModal = ref(false);
const cashMonthsPaid = ref(0);
const selectedRentalId = ref(null);

// const selectedRental = ref(null);

const fetchPendingRentals = async () => {
  try {
    const token = localStorage.getItem("authToken");

    const [rentalsRes, followUpsRes] = await Promise.all([
      axios.get("http://localhost:3001/pending-rentals", { headers: { Authorization: `Bearer ${token}` } }),
      axios.get("http://localhost:3001/pending-follow-up", { headers: { Authorization: `Bearer ${token}` } })
    ]);

    const pendingRentals = Array.isArray(rentalsRes.data.records) ? rentalsRes.data.records : [];
    const pendingFollowUps = Array.isArray(followUpsRes.data.payments) ? followUpsRes.data.payments : [];

    // console.log('Follow-ups received:', pendingFollowUps); //debug

    // normalize follow-up payments to match rental fields
    const normalizedFollowUps = pendingFollowUps.map(p => ({
      rental_id: p.rental_id,
      payment_id: p.payment_id,
      stud_id: p.student_id,
      f_name: p.student_name.split(' ')[0],
      m_name: p.student_name.split(' ').length === 3 ? p.student_name.split(' ')[1] : '',
      l_name: p.student_name.split(' ').slice(-1)[0],
      locker_number: p.locker_number,
      course_name: p.course,
      pay_method: p.payment_method,
      reference_number: p.reference_number,
      amount_paid: p.amount_paid,
      status: 'follow-up', // special status for follow-up payments
      rental_status: p.current_rental_status || 'unknown',
      receipt_path: p.receipt_path || null,
      payment_date: p.payment_date
    }));

    rentals.value = [...pendingRentals, ...normalizedFollowUps]
      .sort((a, b) => new Date(b.created_at || b.payment_date) - new Date(a.created_at || a.payment_date));

  } catch (err) {
    console.error("Failed to fetch rentals and follow-ups:", err);
    rentals.value = [];
  }
};

// const filteredRentals = computed(() => rentals.value);
const filteredRentals = computed(() => {
  if (!searchQuery.value) return rentals.value;
  
  const query = searchQuery.value.toLowerCase();
  return rentals.value.filter(r => 
    r.locker_number?.toLowerCase().includes(query) ||
    r.course_name?.toLowerCase().includes(query) ||
    r.status?.toLowerCase().includes(query) ||
    r.rental_status?.toLowerCase().includes(query)
  );
});

/* 🧾 open receipt modal */
// const viewReceipt = (receiptPath) => {
//   if (!receiptPath) return;
//   if (receiptPath.startsWith("data:image")) {
//     receiptImage.value = receiptPath;
//   } else {
//     receiptImage.value = `data:image/jpeg;base64,${receiptPath}`;
//   }
//   showModal.value = true;
// };
const viewReceipt = (receiptPath) => {
  // 🛡️ Safety Check: If it's not a string (e.g., null, undefined, or boolean), stop.
  if (!receiptPath || typeof receiptPath !== 'string') { 
    console.warn("Invalid receipt data:", receiptPath);
    return; 
  }

  // Logic: Add prefix if missing
  if (receiptPath.startsWith("data:image")) {
    receiptImage.value = receiptPath;
  } else {
    // This handles the Base64 string coming from your DB
    receiptImage.value = `data:image/jpeg;base64,${receiptPath}`;
  }
  showModal.value = true;
};

const approveReservation = async (rentalId) => {
  const rental = rentals.value.find(r => Number(r.rental_id) === Number(rentalId) || r.payment_id === rentalId);
  if (!rental) {
    alert("Rental not found.");
    return;
  }

  // selectedRentalId.value = rentalId;
  // cashMonthsPaid.value = 0;

  // check payment method
  // const method = rental.pay_method || rental.payment_method || "cash";

  // check if this is a follow-up payment
  if (rental.status === 'follow-up') {
    // call follow-up verification endpoint
    const confirmedAmount = rental.amount_paid;

      // Show warning for expired rentals
      if (rental.rental_status === 'expired') {
        const confirmMsg = `⚠️ EXPIRED RENTAL PAYMENT\n\nThis payment is for an EXPIRED rental.\nApproving will reduce the balance but will NOT reactivate the locker.\n\nAmount: ₱${Number(confirmedAmount).toFixed(2)}\nLocker: ${rental.locker_number}\n\nContinue?`;
        if (!confirm(confirmMsg)) return;
      }

    try {
      const token = localStorage.getItem("authToken");
      await axios.put(`http://localhost:3001/verify/${rental.payment_id}`, {
        approve: true,
        confirmed_amount: confirmedAmount
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Follow-up payment verified!");
      fetchPendingRentals();
    } catch (err) {
      alert(err.response?.data?.error || "Follow-up approval failed");
    }
    return;
  } 

  // For reserved rentals (already paid via QR)
  if (rental.status === 'reserved') {
    if (!confirm(`Approve reserved locker #${rental.locker_number}?`)) return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        "http://localhost:3001/approve-rental",
        { rental_id: rental.rental_id, payment_method: "cash" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Rental approved!");
      fetchPendingRentals();
    } catch (err) {
      alert(err.response?.data?.error || "Rental approval failed");
    }
    return; // Exit early
  }
  // else {
  //   // original approve logic for new rentals
    const method = rental.pay_method || rental.payment_method || "cash";
    // selectedRentalId.value = rental.rental_id;
    // cashMonthsPaid.value = 0; // reset
    if (method.toLowerCase() === "qr") {
      try {
        const token = localStorage.getItem("authToken");
        await axios.post(
          "http://localhost:3001/approve-rental",
          { rental_id: rental.rental_id, payment_method: "qr" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Rental approved!");
        fetchPendingRentals();
      } catch (err) {
        alert(err.response?.data?.error || "Rental approval failed");
      }
    } else {
      // Cash payment - show modal
      selectedRentalId.value = rental.rental_id;
      cashMonthsPaid.value = 0;
      showCashModal.value = true;
    }
  }
// };

const cancelRental = async (rental) => {
  // if (rental.status === 'follow-up') {
  //   alert("Cannot cancel follow-up payments from here.");
  //   return;
  // }

  if (rental.status === 'follow-up') {
    if (!confirm(`Reject this follow-up payment of ₱${Number(rental.amount_paid).toFixed(2)}?`)) return;
    
    try {
      const token = localStorage.getItem("authToken");
      await axios.put(
        `http://localhost:3001/verify/${rental.payment_id}`,
        { 
          approve: false,
          verified_remarks: 'Payment rejected by admin'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Follow-up payment rejected!");
      fetchPendingRentals();
    } catch (err) {
      alert(err.response?.data?.error || "Rejection failed");
    }
    return;
  }

  // original cancel logic
  if (!confirm(`Cancel rental #${rental.rental_id}?`)) return;
  try {
    const token = localStorage.getItem("authToken");
    await axios.post("http://localhost:3001/cancel-rental", { rental_id: rental.rental_id }, { headers: { Authorization: `Bearer ${token}` } });
    alert("Rental cancelled!");
    fetchPendingRentals();
  } catch (err) {
    alert(err.response?.data?.error || "Cancel failed");
  }
};


const confirmCashApproval = async () => {
  try {
    if (cashMonthsPaid.value <= 0) {
      alert("Enter a valid number of months.");
      return;
    }

    const token = localStorage.getItem("authToken");

    const res = await axios.post(
      "http://localhost:3001/approve-rental",
      {
        rental_id: selectedRentalId.value,
        payment_method: "cash",
        paid_months: cashMonthsPaid.value
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    alert(res.data.message || "Cash payment recorded & rental activated!");

    showCashModal.value = false;
    fetchPendingRentals();
  } catch (err) {
    alert(err.response?.data?.error || "Approval failed.");
  }
};

const monthlyRate = 60; // fixed monthly rate
// const rentalPrice = ref({}); // store monthly cost for each rental by id

const cashAmount = computed(() => {
  const rental = rentals.value.find(r => Number(r.rental_id) === Number(selectedRentalId.value));
  if (!rental) return 0;
  return Number(rental.amount_paid || 0) + cashMonthsPaid.value * monthlyRate;
});

const closeCashModal = () => {
  showCashModal.value = false;
  selectedRentalId.value = null;
  cashMonthsPaid.value = 0;
};

onMounted(fetchPendingRentals);

// ===== WATCHER: recalc payment amount if months changed =====
watch(cashMonthsPaid, (val) => {
  if (!val || val <= 0) {
    cashMonthsPaid.value = 0;
  }
});
</script>

<style scoped>
.table-container {
  max-height: 600px;
  overflow-y: auto;
  border-radius: 15px;
}

.table-header {
  background: linear-gradient(135deg, #0d6efd, #007bff);
  color: white;
  position: sticky;
  top: 0;
}

.btn-outline-primary {
  border-radius: 8px;
  border-width: 1px;
  transition: all 0.2s ease;
}
.btn-outline-primary:hover {
  background-color: #0d6efd;
  color: white;
}

.modal-backdrop {
  z-index: 1040;
}
.modal {
  z-index: 1050;
}
/* --- BASE TABLE STYLES (Desktop) --- */
.table-container {
  max-height: 600px;
  overflow-y: auto;
  border-radius: 15px;
  transition: all 0.3s ease-in-out;
}

.table-header {
  background: linear-gradient(135deg, #0d6efd, #007bff);
  color: white;
  font-weight: 600;
  position: sticky; /* Sticky header for scrolling table */
  top: 0;
  z-index: 10;
}

table {
  border-radius: 15px;
  overflow: hidden;
}

table th,
table td {
  padding: 14px 12px;
  vertical-align: middle;
}

tbody tr:hover {
  background-color: #f0f8ff;
  transition: 0.2s ease-in-out;
  box-shadow: inset 0 0 6px rgba(0, 123, 255, 0.15);
}

/* --- BUTTON & BADGE STYLES --- */
.status-badge {
  padding: 8px 14px;
  font-size: 14px;
  border-radius: 50px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.status-badge-sm { /* For card view */
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 50px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-approve,
.btn-cancel {
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  transition: 0.3s ease;
  color: white;
}

.btn-approve {
  background-color: #198754;
}
.btn-approve:hover:not(:disabled) {
  background-color: #157347;
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(25, 135, 84, 0.4);
}

.btn-cancel {
  background-color: #dc3545;
}
.btn-cancel:hover:not(:disabled) {
  background-color: #bb2d3b;
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(220, 53, 69, 0.4);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* --- MOBILE CARD STYLES (Screen < 1200px) --- */
.card-container {
  display: flex;
  flex-direction: column;
}

.scrollable-cards {
  max-height: calc(100vh - 200px); /* Adjust height for scrolling */
  overflow-y: auto;
  padding-right: 5px;
}

.rental-card {
  border: 1px solid #dee2e6;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
  background-color: white;
  transition: all 0.2s ease;
  cursor: pointer;
}
.rental-card:hover {
  transform: scale(1.01);
  background-color: #f0f8ff;
  border-color: #0d6efd;
}

.card-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  font-size: 14px;
}
.card-row > div {
  flex: 1 1 30%;
  min-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 576px) {
  .card-row {
    flex-direction: column;
    gap: 4px;
  }
  .card-row > div {
    flex: 1 1 100%;
    font-size: 13px;
    white-space: normal;
  }
}

.text-success.small {
  font-size: 12px;
  font-weight: 500;
}

</style>