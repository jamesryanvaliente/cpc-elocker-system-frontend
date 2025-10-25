<template>
<div class="container my-5 pb-5">
<div class="d-flex justify-content-end mb-3">
<button
class="btn btn-success fw-semibold shadow-sm"
data-bs-toggle="modal"
data-bs-target="#addLockerModal"
>
<i class="bi bi-plus-lg me-1"></i> Add Locker
</button>
</div>

<div
class="modal fade"
id="addLockerModal"
tabindex="-1"
aria-labelledby="addLockerModalLabel"
aria-hidden="true"
>
<div class="modal-dialog modal-dialog-centered">
<div class="modal-content">
<div class="modal-header bg-success text-white">
<h5 class="modal-title fw-bold" id="addLockerModalLabel">Add New Locker</h5>
<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
</div>

<div class="modal-body">
<div class="mb-3">
<label class="form-label">Locker Number</label>
<input
v-model.trim="newLocker.locker_number"
class="form-control"
placeholder="e.g. A01"
/>
</div>

<div class="mb-3">
<label class="form-label">Location</label>
<input
v-model="newLocker.location"
class="form-control"
placeholder="e.g. Ground Floor"
/>
</div>

<div class="mb-3">
<label class="form-label">Remarks</label>
<input
v-model="newLocker.remarks"
class="form-control"
placeholder="Optional notes"
/>
</div>
</div>

<div class="modal-footer">
<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
Cancel
</button>
<button
type="button"
class="btn btn-success"
@click="addLocker"
data-bs-dismiss="modal"
>
<i class="bi bi-check-circle me-1"></i> Save Locker
</button>
</div>
</div>
</div>
</div>

<div class="stats d-flex justify-content-start gap-4 mb-4">
<div><span class="dot bg-danger"></span> RENTED</div>
<div><span class="dot bg-warning"></span> RESERVED</div>
<div><span class="dot bg-success"></span> AVAILABLE</div>
</div>

<div v-if="sortedLockers.length" class="row justify-content-center mb-5 position-relative">
    
    <div
        v-if="hoveredLocker && hoveredLocker.status === 'rented'"
        class="custom-hover-box"
        :style="{ left: hoverBoxPosition.left, top: hoverBoxPosition.top }"
    >
        <p class="mb-1 fw-bold text-white text-truncate" style="font-size: 11px;">RENTED</p>
        <p class="mb-1 text-white text-truncate">Name: {{ hoveredLocker.student_name }}</p>
        <p class="mb-0 text-white-50 small">ID: {{ hoveredLocker.student_id_number }}</p>
    </div>
    <div class="col-md-6 text-center">
<h5 class="fw-bold mb-3">{{ currentBatchLetters[0] }}</h5>
<div class="row g-3 justify-content-center">
<div
v-for="locker in leftBatch"
:key="locker.locker_id"
class="col-3 d-flex justify-content-center"
@mouseenter="showHoverBox($event, locker)"
@mouseleave="hideHoverBox"
>
<div
class="card locker-card shadow-sm"
:class="{ selected: selectedLocker && selectedLocker.locker_id === locker.locker_id }"
@click="openLocker(locker)"
>
<div class="card-body text-center p-3">
<div class="locker-icon-wrapper mb-2">
<img :src="lockerIcon" alt="Locker" class="locker-icon" />
</div>
<div class="locker-number">{{ locker.locker_number }}</div>
<div class="status-dot mt-1" :class="statusColor(locker.status)"></div>
</div>
</div>
</div>
</div>
</div>

<div class="col-md-6 text-center">
<h5 class="fw-bold mb-3">{{ currentBatchLetters[1] }}</h5>
<div class="row g-3 justify-content-center">
<div
v-for="locker in rightBatch"
:key="locker.locker_id"
class="col-3 d-flex justify-content-center"
@mouseenter="showHoverBox($event, locker)"
@mouseleave="hideHoverBox"
>
<div
class="card locker-card shadow-sm"
:class="{ selected: selectedLocker && selectedLocker.locker_id === locker.locker_id }"
@click="openLocker(locker)"
>
<div class="card-body text-center p-3">
<div class="locker-icon-wrapper mb-2">
<img :src="lockerIcon" alt="Locker" class="locker-icon" />
</div>
<div class="locker-number">{{ locker.locker_number }}</div>
<div class="status-dot mt-1" :class="statusColor(locker.status)"></div>
</div>
</div>
</div>
</div>
</div>
</div>

<div v-else class="text-center text-muted py-5">
<h5>No lockers found.</h5>
</div>

<div
v-if="selectedLocker"
class="modal fade show"
style="display: block; background: rgba(0,0,0,0.5);"
tabindex="-1"
@click.self="selectedLocker = null"
>
<div class="modal-dialog modal-dialog-centered">
<div class="modal-content">
<div class="modal-header">
<h5 class="modal-title">
Rent Locker {{ selectedLocker.locker_number }}
</h5>
<button type="button" class="btn-close" @click="selectedLocker = null"></button>
</div>

<div class="modal-body">
<template v-if="selectedLocker.status === 'available'">
<form @submit.prevent="submitLockerAction">
<div class="mb-3">
<label class="form-label fw-semibold">Student ID</label>
<input
v-model.trim="form.student_id"
type="text"
class="form-control"
placeholder="Enter Student ID"
required
/>
</div>

<div class="mb-3">
<label class="form-label fw-semibold">Number of Months to Rent:</label>
<input
v-model.number="form.months"
type="number"
class="form-control"
min="1"
required
/>
</div>

<div class="mb-3">
<label class="form-label fw-semibold">Months Paid:</label>
<input
v-model.number="form.paid_months"
type="number"
class="form-control"
min="0"
:max="form.months"
required
/>
</div>

<div class="mt-4 p-3 border rounded bg-light">
<p class="mb-1 text-muted">Rate: ₱{{ ratePerMonth }} per month</p>
<p class="mb-1 text-primary fw-semibold">
Amount Paid: ₱{{ computedAmountPaid }}
</p>
<p class="fw-bold text-danger fs-5 mb-0">
Remaining Balance: ₱{{ computedBalance }}
</p>
<p v-if="form.paid_months > 0" class="text-muted mt-2">
Next Due Date: {{ computedDueDate }}
</p>
<p class="text-success fw-bold mt-2 mb-0">Payment Method: CASH</p>
</div>

<div class="d-flex justify-content-center mt-4">
<button type="button" class="btn btn-secondary me-2" @click="selectedLocker = null">Cancel</button>
<button type="submit" class="btn btn-primary">Confirm Rent</button>
</div>
</form>
</template>

<template v-else-if="selectedLocker.status === 'rented'">
<p class="text-center text-danger fw-semibold">This locker is currently RENTED.</p>
<div class="text-center">
<button class="btn btn-primary" @click="selectedLocker = null">Okay</button>
</div>
</template>
<template v-else-if="selectedLocker.status === 'reserved'">
<p class="text-center text-warning fw-semibold">This locker is currently RESERVED.</p>
<div class="text-center">
<button class="btn btn-primary" @click="selectedLocker = null">Okay</button>
</div>
</template>
</div>
</div>
</div>
</div>

<div v-if="sortedLockers.length" class="pagination-footer">
<button
class="btn btn-outline-primary rounded-pill px-4 fw-semibold pagination-btn"
@click="prevPage"
:disabled="currentPage === 1"
>
‹ Prev
</button>

<div class="d-flex gap-2">
<button
v-for="page in totalPages"
:key="page"
@click="goToPage(page)"
class="page-circle"
:class="{ active: currentPage === page }"
>
{{ page }}
</button>
</div>

<button
class="btn btn-outline-primary rounded-pill px-4 fw-semibold pagination-btn"
@click="nextPage"
:disabled="currentPage === totalPages"
>
Next ›
</button>
</div>
</div>
</template>

<script>
import axios from "axios";
import lockerIcon from "@/assets/locker-black.png";
// Removed Bootstrap Tooltip import

export default {
name: "LockersPage",
data() {
return {
lockers: [],
activeRentals: [], 
newLocker: { locker_number: "", location: "", remarks: "" },
selectedLocker: null,
currentPage: 1,
lockerIcon,
letters: ["A", "B", "C", "D"],
form: { student_id: "", months: 1, paid_months: 1 },
ratePerMonth: 60,
// New state for the custom hover box
hoveredLocker: null,
hoverBoxPosition: { left: '0px', top: '0px' }
};
},
computed: {
totalPages() {
return Math.ceil(this.letters.length / 2);
},
currentBatchLetters() {
const index = (this.currentPage - 1) * 2;
return [this.letters[index], this.letters[index + 1]];
},
sortedLockers() {
if (!Array.isArray(this.lockers)) return [];
// Merge locker data with active rental data
const lockersWithRentals = [...this.lockers].map(locker => {
const rental = this.activeRentals.find(r => r.locker_id === locker.locker_id);
if (rental) {
locker.status = "rented";
// Add student info to the locker object for the hover box
locker.student_name = `${rental.f_name} ${rental.l_name}`;
locker.student_id_number = rental.stud_id; 
}
return locker;
});

return lockersWithRentals.sort((a, b) => {
const letterA = a.locker_number?.charAt(0).toUpperCase() || "";
const letterB = b.locker_number?.charAt(0).toUpperCase() || "";
const numA = parseInt(a.locker_number?.slice(1)) || 0;
const numB = parseInt(b.locker_number?.slice(1)) || 0;
if (letterA === letterB) return numA - numB;
return letterA.localeCompare(letterB);
});
},
leftBatch() {
return this.sortedLockers.filter(l => l.locker_number?.startsWith(this.currentBatchLetters[0]));
},
rightBatch() {
return this.sortedLockers.filter(l => l.locker_number?.startsWith(this.currentBatchLetters[1]));
},
computedAmountPaid() {
return this.form.paid_months * this.ratePerMonth;
},
computedBalance() {
return this.form.months * this.ratePerMonth - this.form.paid_months * this.ratePerMonth;
},
computedDueDate() {
if (this.form.paid_months <= 0) return "N/A";
const now = new Date();
now.setMonth(now.getMonth() + this.form.paid_months);
return now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
},
},
methods: {
// Custom hover box methods to replace Bootstrap Tooltip initialization
showHoverBox(event, locker) {
    if (locker.status === 'rented') {
        this.hoveredLocker = locker;
        
        // Calculate position based on the hovered element
        // event.currentTarget is the element with the @mouseenter handler (the col-3 wrapper)
        const targetRect = event.currentTarget.getBoundingClientRect();
        
        // Find the relative container (the row wrapper) for absolute positioning
        const container = this.$el.querySelector('.row.justify-content-center');
        const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
        
        // Position the box above the hovered element and center it horizontally
        const left = targetRect.left - containerRect.left + (targetRect.width / 2) - 100; // 100 is half the custom-hover-box width (200px)
        const top = targetRect.top - containerRect.top - 100; // Position above the element, minus 100px for height/padding

        this.hoverBoxPosition = {
            left: `${left}px`,
            top: `${top}px`
        };
    } else {
        this.hoveredLocker = null;
    }
},
hideHoverBox() {
    this.hoveredLocker = null;
},
async fetchLockers() {
try {
const [lockerRes, rentalRes] = await Promise.all([
axios.get("http://localhost:3001/locker/lockers"),
axios.get("http://localhost:3001/active-rentals") 
]);

this.lockers = Array.isArray(lockerRes.data) ? lockerRes.data : lockerRes.data.lockers || [];
this.activeRentals = Array.isArray(rentalRes.data) ? rentalRes.data : rentalRes.data.rentals || [];

// REMOVED ALL BOOTSTRAP TOOLTIP INITIALIZATION

} catch (error) {
console.error("Error fetching lockers or rentals:", error);
this.lockers = [];
this.activeRentals = [];
}
},
async addLocker() {
this.newLocker.locker_number = this.newLocker.locker_number.trim();
if (!this.newLocker.locker_number) return alert("Please enter a locker number.");
try {
const res = await axios.post("http://localhost:3001/locker/add", this.newLocker, { withCredentials: true });
alert(res.data.message || "Locker added successfully!");
this.newLocker = { locker_number: "", location: "", remarks: "" };
this.fetchLockers();
} catch (error) {
console.error("Add Locker Error:", error);
alert(error.response?.data?.error || error.response?.data?.message || "Failed to add locker.");
}
},
statusColor(status) {
switch (status) {
case "rented": return "bg-danger";
case "reserved": return "bg-warning";
case "available": return "bg-success";
default: return "bg-secondary";
}
},
openLocker(locker) {
this.selectedLocker = locker;
this.form = { student_id: "", months: 1, paid_months: 1 };
},
async submitLockerAction() {
this.form.student_id = this.form.student_id.trim();
if (!this.form.student_id) return alert("Please enter a Student ID.");
if (this.form.months < 1 || this.form.paid_months < 0 || this.form.paid_months > this.form.months)
return alert("Please check the months to rent and months paid fields.");
try {
const locker_id = this.selectedLocker.locker_id;
const url = "http://localhost:3001/locker/transaction";
const payload = { locker_id, student_id: this.form.student_id, months: this.form.months, paid_months: this.form.paid_months, action_type: "rent", payment_method: "Cash" };
const response = await axios.post(url, payload, { withCredentials: true });
alert(response.data.message || "Locker rental successful!");
this.selectedLocker = null;
await this.fetchLockers();
} catch (error) {
console.error("Locker transaction failed:", error.response?.data || error.message);
alert(error.response?.data?.error || error.response?.data?.message || "Something went wrong during rental assignment.");
}
},
nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },
prevPage() { if (this.currentPage > 1) this.currentPage--; },
goToPage(page) { this.currentPage = page; },
},
mounted() {
this.fetchLockers();
},
};
</script>

<style scoped>
/* Custom Hover Box Styling */
.row.justify-content-center {
    /* Important for positioning the custom-hover-box relative to the whole grid */
    position: relative;
}

.custom-hover-box {
    position: absolute;
    width: 200px;
    background-color: #343a40; /* Dark background */
    color: white;
    border-radius: 6px;
    padding: 10px;
    z-index: 1000; /* Ensure it stays on top of other elements */
    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
    pointer-events: none; /* Allows clicks to pass through */
    font-size: 14px;
    line-height: 1.2;
}

.custom-hover-box p {
    margin-bottom: 3px !important;
}

.custom-hover-box::after {
    /* Simple arrow pointing down to the locker */
    content: "";
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8px 8px 0;
    border-style: solid;
    border-color: #343a40 transparent transparent transparent;
}
/* End Custom Hover Box Styling */

/* Existing Styles */
.stats { margin-bottom: 60px; }
.dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 4px; }
.locker-card { width: 90px; border: none; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.25)!important; transition: transform 0.2s ease; cursor: pointer; background: white; }
.locker-card:hover { transform: translateY(-4px); }
.locker-icon-wrapper { border-bottom: 3px solid #000; padding-bottom: 6px; display: flex; justify-content: center; }
.locker-icon { width: 45px; }
.locker-number { font-weight: bold; font-size: 14px; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; margin: 0 auto; }
.pagination-footer { position: relative; bottom: -150px; background: white; padding: 10px 0; display: flex; justify-content: center; align-items: center; gap: 15px; }
.page-circle { width: 38px; height: 38px; border-radius: 50%; border: 2px solid #007bff; background-color: white; color: #007bff; font-weight: bold; font-size: 15px; text-align: center; line-height: 34px; cursor: pointer; }
.page-circle.active { background-color: #007bff; color: white; box-shadow: 0 0 8px rgba(0,123,255,0.5); }
@media (max-width: 768px) {
.stats { justify-content: flex-start; gap: 1.2rem; }
.locker-card { max-width: 90px; }
.locker-icon { width: 34px; }
.locker-number { font-size: 12px; }
.page-circle { width: 34px; height: 34px; font-size: 13px; line-height: 30px; }
.modal-content { border-radius: 0.5rem; }
}
</style>