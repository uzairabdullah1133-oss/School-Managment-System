// === KEYS ===
const STORAGE_KEY_STUDENTS = 'eduCore_students';
const STORAGE_KEY_TEACHERS = 'eduCore_teachers';
const STORAGE_KEY_CLASSES = 'eduCore_classes';
const STORAGE_KEY_SETTINGS = 'eduCore_settings';
const STORAGE_KEY_NOTIFICATIONS = 'eduCore_notifications';
const STORAGE_KEY_AUTH = 'eduCore_auth';
const STORAGE_KEY_TEACHER_ATTENDANCE = 'eduCore_teacher_attendance';
const STORAGE_KEY_STAFF = 'eduCore_staff';

document.addEventListener('DOMContentLoaded', () => {

    // === INIT ICONS ===
    if (typeof lucide !== 'undefined' && window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }

    // === NOTIFICATION SYSTEM ===
    const bell = document.getElementById('notificationBell');
    const panel = document.getElementById('notificationPanel');

    if (bell && panel) {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = panel.classList.contains('active');

            if (isActive) {
                // If the user clicks the bell to close, we clear the seen alerts and hide it
                clearAllNotifications();
                panel.classList.remove('active');
            } else {
                // Only open if there are notifications to see
                const notifications = getData(STORAGE_KEY_NOTIFICATIONS);
                if (notifications.length > 0) {
                    panel.classList.add('active');
                } else {
                    // Optional: You could show a small "No Notifications" toast here if desired
                    console.log('Notification tray is empty.');
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (panel.classList.contains('active') && !panel.contains(e.target)) {
                clearAllNotifications();
                panel.classList.remove('active');
            }
        });

        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    renderNotifications();

    // === LOGIN PAGE ===
    const loginForm = document.getElementById('loginForm');

    // === PASSWORD TOGGLE ===
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email').value;
            const passwordInput = document.getElementById('password').value;

            const storedAuth = localStorage.getItem('eduCore_auth');
            const auth = storedAuth ? JSON.parse(storedAuth) : { email: 'apexiumstechnologies@gmail.com', password: 'apexiums3841' };

            if (emailInput.toLowerCase() === auth.email.toLowerCase() && passwordInput === auth.password) {
                // Track login for system usage statistics
                const loginTracking = JSON.parse(localStorage.getItem('EDUCORE_LOGIN_TRACKING')) || { count: 0, lastLogin: null };
                loginTracking.count += 1;
                loginTracking.lastLogin = new Date().toISOString();
                localStorage.setItem('EDUCORE_LOGIN_TRACKING', JSON.stringify(loginTracking));

                // Track Login History List
                const loginHistory = JSON.parse(localStorage.getItem('EDUCORE_LOGIN_HISTORY')) || [];
                loginHistory.unshift({
                    timestamp: new Date().toISOString(),
                    email: emailInput,
                    status: 'Success',
                    ip: '127.0.0.1' // Simulated IP for local
                });
                if (loginHistory.length > 50) loginHistory.pop(); // Keep last 50
                localStorage.setItem('EDUCORE_LOGIN_HISTORY', JSON.stringify(loginHistory));

                // Log Login Activity
                pushNotification('System Access', `Admin logged in successfully from ${new Date().toLocaleTimeString()}`, 'login');

                const btn = loginForm.querySelector('button');
                btn.innerText = 'Signing In...';
                btn.style.opacity = '0.7';
                btn.disabled = true;
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
            } else {
                pushNotification('Security Alert', `Failed login attempt for ${emailInput}`, 'alert');
                alert('Invalid Email or Password. Please try again.');
            }
        });
    }

    // === STUDENT PAGE ===
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        renderStudents(); // Initial Load
        studentForm.addEventListener('submit', handleStudentFormSubmit);
        const searchInput = document.getElementById('searchInput'); // ID specific to student page
        if (searchInput) {
            searchInput.addEventListener('input', (e) => renderStudents(e.target.value.toLowerCase()));
        }
    }

    // === TEACHER PAGE ===
    const teacherForm = document.getElementById('teacherForm');
    if (teacherForm) {
        renderTeachers(); // Initial Load
        teacherForm.addEventListener('submit', handleTeacherFormSubmit);
        const tSearch = document.getElementById('teacherSearchInput');
        if (tSearch) {
            tSearch.addEventListener('input', (e) => renderTeachers(e.target.value.toLowerCase()));
        }
    }

    // === STAFF PAGE ===
    const staffForm = document.getElementById('staffForm');
    if (staffForm) {
        renderStaff(); // Initial Load
        staffForm.addEventListener('submit', handleStaffFormSubmit);
        const sSearch = document.getElementById('staffSearchInput');
        if (sSearch) {
            sSearch.addEventListener('input', (e) => renderStaff(e.target.value.toLowerCase()));
        }
    }

    // === CLASSES PAGE ===
    const classForm = document.getElementById('classForm');
    if (classForm) {
        renderClasses(); // Initial Load
        classForm.addEventListener('submit', handleClassFormSubmit);
        const cSearch = document.getElementById('classSearchInput');
        if (cSearch) {
            cSearch.addEventListener('input', (e) => renderClasses(e.target.value.toLowerCase()));
        }
    }

    // === SETTINGS PAGE ===
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        loadSettings();
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }

    // === DASHBOARD HOME LOGIC ===
    const dashStudentCount = document.getElementById('dashStudentCount');
    if (dashStudentCount) {
        // We are on the dashboard
        updateDashboardStats();
        // renderDashboardTable(); // Table removed by user request

        const dSearch = document.getElementById('dashSearch');
        if (dSearch) {
            dSearch.addEventListener('input', (e) => { }); // renderDashboardTable(e.target.value.toLowerCase())
        }
    }

    // === FINANCE PAGE ===
    const financeTable = document.getElementById('financeTable');
    if (financeTable) {
        renderFinance();
        const fSearch = document.getElementById('financeSearchInput');
        if (fSearch) {
            fSearch.addEventListener('input', (e) => renderFinance(e.target.value.toLowerCase()));
        }
    }


});

// =======================================================
// ==================== GENERIC HELPERS ==================
// =======================================================

function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// =======================================================
// ==================== DASHBOARD LOGIC ==================
// =======================================================

function renderDashboardTable(term = '') {
    const tbody = document.getElementById('dashTableBody');
    if (!tbody) return;

    // Use students data for the "Activity" table
    const students = getData(STORAGE_KEY_STUDENTS);
    const filtered = students.filter(s =>
        s.fullName.toLowerCase().includes(term) ||
        s.rollNo.toLowerCase().includes(term)
    );

    // If searching, show all matches. Otherwise show last 5.
    const displayList = term ? filtered : students.slice(-5).reverse();

    tbody.innerHTML = '';

    if (displayList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-secondary);">No records found.</td></tr>';
    } else {
        displayList.forEach(s => {
            let statusClass = s.feesStatus === 'Paid' ? 'status-paid' : (s.feesStatus === 'Late' ? 'status-failed' : 'status-pending');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div style="font-weight:500">${s.fullName}</div></td>
                <td><span style="color:var(--text-secondary); font-size:0.85rem">${s.rollNo}</span></td>
                <td>${s.classGrade}</td>
                <td>PKR ${parseInt(s.monthlyFee) || 0}</td>
                <td><span class="status-badge ${statusClass}">${s.feesStatus}</span></td>
                <td>
                    <button class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.75rem;" onclick="toggleFeeStatus('${s.id}')">
                        ${s.feesStatus === 'Paid' ? 'Mark Pending' : 'Mark Paid'}
                    </button>
                    <button class="btn btn-secondary" style="padding:0.3rem 0.8rem; font-size:0.75rem;" onclick="editBill('${s.id}')">
                        Edit
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// =======================================================
// ==================== FINANCE LOGIC ====================
// =======================================================

// =======================================================
// ==================== FINANCE LOGIC (BILLS) ============
// =======================================================
const STORAGE_KEY_BILLS = 'eduCore_bills';
let currentCategory = null;

function getBills() {
    const data = localStorage.getItem(STORAGE_KEY_BILLS);
    return data ? JSON.parse(data) : [];
}

function saveBills(bills) {
    localStorage.setItem(STORAGE_KEY_BILLS, JSON.stringify(bills));
}

// Function called when a card is clicked
function selectBillCategory(category) {
    currentCategory = category;

    // UI Update
    const prompt = document.getElementById('selectPrompt');
    if (prompt) prompt.style.display = 'none';

    const details = document.getElementById('billDetailsSection');
    if (details) details.style.display = 'block';

    const title = document.getElementById('selectedCategoryTitle');
    if (title) title.innerText = category + ' Records';

    const formContainer = document.getElementById('billFormContainer');
    if (formContainer) formContainer.style.display = 'none'; // Hide form if open

    // Highlight Card
    document.querySelectorAll('.bill-card').forEach(c => c.style.border = '2px solid transparent');
    const idMap = {
        'Electricity': 'card-Electricity',
        'Gas': 'card-Gas',
        'Internet': 'card-Internet',
        'Building Rent': 'card-Rent'
    };
    if (document.getElementById(idMap[category])) {
        document.getElementById(idMap[category]).style.border = '2px solid var(--primary-color)';
    }

    renderFinance();
}

function renderFinance(term = '') {
    const tbody = document.getElementById('financeTableBody');
    if (!tbody) return;

    // If no category selected yet, do nothing or clear
    if (!currentCategory) {
        tbody.innerHTML = '';
        return;
    }

    const bills = getBills();
    // Filter by Current Category and Search Term
    let filtered = bills.filter(b => b.category === currentCategory);

    if (term) {
        filtered = filtered.filter(b => b.note && b.note.toLowerCase().includes(term));
    }

    tbody.innerHTML = '';
    const noData = document.getElementById('noFinanceData');

    if (filtered.length === 0) {
        if (noData) noData.style.display = 'block';
    } else {
        if (noData) noData.style.display = 'none';

        // Sort by date desc
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        filtered.forEach(b => {
            const statusClass = b.status === 'Paid' ? 'status-paid' : 'status-failed';
            const tr = document.createElement('tr');

            tr.innerHTML = `
                 <td>${b.date}</td>
                 <td>${b.note || '-'}</td>
                 <td>PKR ${parseInt(b.amount).toLocaleString()}</td>
                 <td><span class="status-badge ${statusClass}">${b.status}</span></td>
                 <td>
                     <button class="action-btn btn-edit" onclick='editBill("${b.id}")' title="Edit">
                         <i data-lucide="edit-2" width="14"></i>
                     </button>
                     <button class="action-btn btn-delete" onclick="deleteBill('${b.id}')" title="Delete">
                         <i data-lucide="trash-2" width="14"></i>
                     </button>
                 </td>
             `;
            tbody.appendChild(tr);
        });
        if (window.lucide) window.lucide.createIcons();
    }
}

function toggleBillForm(editMode = false) {
    if (!currentCategory) return;

    const container = document.getElementById('billFormContainer');
    const form = document.getElementById('billForm');
    const title = document.getElementById('billFormTitle');

    if (container.style.display === 'block' && !editMode) {
        container.style.display = 'none';
        form.reset();
        document.getElementById('billId').value = '';
    } else {
        container.style.display = 'block';
        if (!editMode) {
            form.reset();
            document.getElementById('billDate').valueAsDate = new Date();
            document.getElementById('billId').value = '';
            // Auto-set category
            document.getElementById('billCategory').value = currentCategory;
            title.innerText = 'Add ' + currentCategory + ' Bill';
        } else {
            title.innerText = 'Edit Bill Details';
        }
    }
}

// Global listener for the Bill Form
document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'billForm') {
        e.preventDefault();
        const idField = document.getElementById('billId');
        const isEdit = idField.value !== '';

        const newBill = {
            id: isEdit ? idField.value : Date.now().toString(),
            category: currentCategory, // Always use current selected category
            amount: document.getElementById('billAmount').value,
            date: document.getElementById('billDate').value,
            status: document.getElementById('billStatus').value,
            note: document.getElementById('billNote').value
        };

        let bills = getBills();
        if (isEdit) {
            const index = bills.findIndex(b => b.id === newBill.id);
            if (index !== -1) bills[index] = newBill;
        } else {
            bills.push(newBill);
        }
        saveBills(bills);
        toggleBillForm();
        renderFinance();
        pushNotification('Expense Updated', `Bill for ${newBill.category} recorded.`, 'trending-up');
    }
});

function editBill(id) {
    const bills = getBills();
    const b = bills.find(x => x.id === id);
    if (!b) return;

    toggleBillForm(true);
    document.getElementById('billId').value = b.id;
    // document.getElementById('billCategory').value = b.category; // set in toggle or here
    document.getElementById('billAmount').value = b.amount;
    document.getElementById('billDate').value = b.date;
    document.getElementById('billStatus').value = b.status;
    document.getElementById('billNote').value = b.note || '';
}

function deleteBill(id) {
    if (confirm('Delete this expense record?')) {
        let bills = getBills();
        bills = bills.filter(b => b.id !== id);
        saveBills(bills);
        renderFinance();
    }
}

function updateDashboardStats() {
    const s = getData(STORAGE_KEY_STUDENTS);
    const t = getData(STORAGE_KEY_TEACHERS);
    const staff = getData(STORAGE_KEY_STAFF);

    // Calculate total revenue from paid fees
    let totalRevenue = 0;
    let paidCount = 0;
    s.forEach(student => {
        if (student.feesStatus === 'Paid') {
            const fee = parseInt(student.monthlyFee) || 0;
            totalRevenue += fee;
            paidCount++;
        }
    });

    if (document.getElementById('dashStudentCount')) document.getElementById('dashStudentCount').innerText = s.length || '0';
    if (document.getElementById('dashTeacherCount')) document.getElementById('dashTeacherCount').innerText = t.length || '0';
    if (document.getElementById('dashStaffCount')) document.getElementById('dashStaffCount').innerText = staff.length || '0';

    // Update revenue display
    if (document.getElementById('dashRevenue')) {
        document.getElementById('dashRevenue').innerText = 'PKR ' + totalRevenue.toLocaleString();
    }
    if (document.getElementById('dashRevenueDesc')) {
        document.getElementById('dashRevenueDesc').innerText = `${paidCount} paid fees`;
    }
}
// =======================================================
// ==================== STUDENT LOGIC ====================
// =======================================================

function toggleStudentForm(editMode = false) {
    const container = document.getElementById('studentFormContainer');
    const form = document.getElementById('studentForm');
    const title = document.getElementById('formTitle');

    if (container.style.display === 'block' && !editMode) {
        container.style.display = 'none';
        form.reset();
        document.getElementById('studentId').value = '';
    } else {
        container.style.display = 'block';
        if (!editMode) {
            form.reset();
            document.getElementById('studentId').value = '';
            title.innerText = 'Add New Student';
        } else {
            title.innerText = 'Edit Student Details';
        }
    }
}

function handleStudentFormSubmit(e) {
    e.preventDefault();
    const idField = document.getElementById('studentId');
    const isEdit = idField.value !== '';

    const existingStudents = getData(STORAGE_KEY_STUDENTS);
    const existingStudent = isEdit ? existingStudents.find(s => s.id === idField.value) : null;
    const currentStatus = document.getElementById('feesStatus').value;

    const newStudent = {
        id: isEdit ? idField.value : Date.now().toString(),
        fullName: document.getElementById('fullName').value,
        fatherName: document.getElementById('fatherName').value,
        classGrade: document.getElementById('classGrade').value,
        parentPhone: document.getElementById('parentPhone').value,
        rollNo: document.getElementById('rollNo').value,
        formB: document.getElementById('formB').value,
        monthlyFee: document.getElementById('monthlyFee').value || '0',
        feesStatus: currentStatus,
    };

    // Auto-set payment date if status is Paid
    if (currentStatus === 'Paid') {
        if (existingStudent && existingStudent.feesStatus === 'Paid' && existingStudent.paymentDate) {
            newStudent.paymentDate = existingStudent.paymentDate;
        } else {
            newStudent.paymentDate = new Date().toLocaleDateString();
        }
    } else {
        newStudent.paymentDate = '';
    }

    let students = getData(STORAGE_KEY_STUDENTS);
    if (isEdit) {
        const index = students.findIndex(s => s.id === newStudent.id);
        if (index !== -1) students[index] = newStudent;
    } else {
        students.push(newStudent);
    }
    saveData(STORAGE_KEY_STUDENTS, students);
    pushNotification('Student Updated', `A new student record for "${newStudent.fullName}" was created/updated.`, 'user');
    toggleStudentForm();
    renderStudents();
}

function renderStudents(term = '') {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    const students = getData(STORAGE_KEY_STUDENTS);
    const filtered = students.filter(s => s.fullName.toLowerCase().includes(term) || s.rollNo.toLowerCase().includes(term));

    // Update total count display
    const totalCountEl = document.getElementById('totalStudentCount');
    if (totalCountEl) totalCountEl.innerText = students.length;

    tbody.innerHTML = '';
    const noData = document.getElementById('noDataMessage');

    if (filtered.length === 0) {
        noData.style.display = 'block';
    } else {
        noData.style.display = 'none';
        filtered.forEach(s => {
            let statusClass = s.feesStatus === 'Paid' ? 'status-paid' : (s.feesStatus === 'Late' ? 'status-failed' : 'status-pending');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${s.rollNo}</b></td>
                <td><div style="display:flex;align-items:center;gap:0.5rem">
                    <div style="width:30px;height:30px;background:rgba(32, 176, 164, 0.1);color:var(--primary-color);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold">${s.fullName.charAt(0).toUpperCase()}</div>
                    ${s.fullName}
                </div></td>
                <td>${s.fatherName || '-'}</td>
                <td>${s.classGrade}</td>
                <td>${s.parentPhone}</td>
                <td>${s.formB || '-'}</td>
                <td><span class="status-badge ${statusClass}">${s.feesStatus}</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick='editStudent(${JSON.stringify(s)})'><i data-lucide="edit-2" width="14"></i> Edit</button>
                    <button class="action-btn btn-delete" onclick="deleteStudent('${s.id}')"><i data-lucide="trash-2" width="14"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        window.lucide.createIcons();
    }
}

function editStudent(s) {
    toggleStudentForm(true);
    document.getElementById('studentId').value = s.id;
    document.getElementById('fullName').value = s.fullName;
    document.getElementById('fatherName').value = s.fatherName || '';
    document.getElementById('classGrade').value = s.classGrade;
    document.getElementById('parentPhone').value = s.parentPhone;
    document.getElementById('rollNo').value = s.rollNo;
    document.getElementById('formB').value = s.formB || '';
    document.getElementById('monthlyFee').value = s.monthlyFee || '0';
    document.getElementById('feesStatus').value = s.feesStatus;
}

function deleteStudent(id) {
    if (confirm('Delete this student?')) {
        let students = getData(STORAGE_KEY_STUDENTS);
        students = students.filter(s => s.id !== id);
        saveData(STORAGE_KEY_STUDENTS, students);
        renderStudents();
    }
}


// =======================================================
// ==================== TEACHER LOGIC ====================
// =======================================================

function toggleTeacherForm(editMode = false) {
    const container = document.getElementById('teacherFormContainer');
    const form = document.getElementById('teacherForm');
    const title = document.getElementById('teacherFormTitle');

    if (container.style.display === 'block' && !editMode) {
        container.style.display = 'none';
        form.reset();
        document.getElementById('teacherId').value = '';
    } else {
        container.style.display = 'block';
        if (!editMode) {
            form.reset();
            document.getElementById('teacherId').value = '';
            title.innerText = 'Add New Teacher';
        } else {
            title.innerText = 'Edit Teacher Details';
        }
    }
}

function handleTeacherFormSubmit(e) {
    e.preventDefault();
    const idField = document.getElementById('teacherId');
    const isEdit = idField.value !== '';

    const newTeacher = {
        id: isEdit ? idField.value : Date.now().toString(),
        fullName: document.getElementById('tFullName').value,
        fatherName: document.getElementById('tFatherName').value,
        cnic: document.getElementById('tCnic').value,
        phone: document.getElementById('tPhone').value,
        address: document.getElementById('tAddress').value,
        qualification: document.getElementById('tQualification').value,
        gender: document.getElementById('tGender').value,
        subject: document.getElementById('tSubject').value,
    };

    let teachers = getData(STORAGE_KEY_TEACHERS);
    if (isEdit) {
        const index = teachers.findIndex(t => t.id === newTeacher.id);
        if (index !== -1) teachers[index] = newTeacher;
    } else {
        teachers.push(newTeacher);
    }
    saveData(STORAGE_KEY_TEACHERS, teachers);
    pushNotification('Staff Updated', `Teacher record for "${newTeacher.fullName}" was added/updated.`, 'book');
    toggleTeacherForm();
    renderTeachers();
}

function renderTeachers(term = '') {
    const tbody = document.getElementById('teacherTableBody');
    if (!tbody) return;

    const teachers = getData(STORAGE_KEY_TEACHERS);
    const filtered = teachers.filter(t => t.fullName.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term));

    // Update total count display
    const totalCountEl = document.getElementById('totalTeacherCount');
    if (totalCountEl) totalCountEl.innerText = teachers.length;

    tbody.innerHTML = '';
    const noData = document.getElementById('noTeacherDataMessage');

    if (filtered.length === 0) {
        noData.style.display = 'block';
    } else {
        noData.style.display = 'none';
        filtered.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div style="display:flex;align-items:center;gap:0.5rem">
                    <div style="width:30px;height:30px;background:#f0bdd1;color:#be185d;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold">${t.fullName.charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-weight:500">${t.fullName}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary)">${t.qualification || ''}</div>
                    </div>
                </div></td>
                <td>${t.fatherName || '-'}</td>
                <td>${t.subject}</td>
                <td>${t.cnic || '-'}</td>
                <td>${t.phone || '-'}</td>
                <td>
                    <button class="action-btn btn-view" onclick='viewTeacherAttendance(${JSON.stringify(t)})' title="View Attendance">
                        <i data-lucide="eye" width="14"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick='editTeacher(${JSON.stringify(t)})'><i data-lucide="edit-2" width="14"></i> Edit</button>
                    <button class="action-btn btn-delete" onclick="deleteTeacher('${t.id}')"><i data-lucide="trash-2" width="14"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        window.lucide.createIcons();
    }
}

function editTeacher(t) {
    toggleTeacherForm(true);
    document.getElementById('teacherId').value = t.id;
    document.getElementById('tFullName').value = t.fullName;
    document.getElementById('tFatherName').value = t.fatherName || '';
    document.getElementById('tCnic').value = t.cnic || '';
    document.getElementById('tPhone').value = t.phone;
    document.getElementById('tAddress').value = t.address || '';
    document.getElementById('tQualification').value = t.qualification || '';
    document.getElementById('tGender').value = t.gender || '';
    document.getElementById('tSubject').value = t.subject;
}

function deleteTeacher(id) {
    if (confirm('Delete this teacher?')) {
        let teachers = getData(STORAGE_KEY_TEACHERS);
        teachers = teachers.filter(t => t.id !== id);
        saveData(STORAGE_KEY_TEACHERS, teachers);
        renderTeachers();
    }
}


function viewTeacherAttendance(teacher, monthKey = null) {
    const modal = document.getElementById('attendanceModal');
    const title = document.getElementById('attModalTitle');
    const grid = document.getElementById('attendanceGrid');

    if (!modal || !grid) return;

    // Default to current month if not specified (Format: YYYY-MM)
    const date = new Date();
    if (!monthKey) {
        monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    title.innerText = `Attendance: ${teacher.fullName} (${monthKey})`;
    modal.style.display = 'flex';
    grid.innerHTML = '';

    // Get Attendance Data
    const allAttendance = getData(STORAGE_KEY_TEACHER_ATTENDANCE) || {};
    // Structure: { "teacherID_YYYY-MM": [P, P, A, ...] }
    const recordKey = `${teacher.id}_${monthKey}`;

    let monthRecord = allAttendance[recordKey];

    // If no record, init with defaults (Absent)
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    if (!monthRecord) {
        monthRecord = Array(daysInMonth).fill('A');
        // We don't save yet unless modified, or we can save init state. Let's save on modify.
    }

    // Calculate Today's Date Components for Validation
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // Check if the viewed month is strictly the current month
    const [viewYear, viewMonth] = monthKey.split('-').map(Number);
    const isCurrentMonth = (viewYear === currentYear && viewMonth === currentMonth);

    // Render Grid
    monthRecord.forEach((status, index) => {
        const day = index + 1;
        const isPresent = status === 'P';
        const statusClass = isPresent ? 'status-present' : 'status-absent';

        // "One day valid": Is this cell for Today?
        const isToday = isCurrentMonth && (day === currentDay);

        const cell = document.createElement('div');
        cell.className = `attendance-day ${statusClass}`;

        // Only Today is clickable
        if (isToday) {
            cell.style.cursor = 'pointer';
            cell.style.border = '2px solid var(--primary-color)'; // Highlight today
            cell.title = "Mark Attendance";
            cell.onclick = () => toggleTeacherAttendanceDay(teacher.id, monthKey, index);
        } else {
            cell.style.cursor = 'default';
            cell.style.opacity = '0.7'; // Visual cue that others are locked
        }

        cell.innerHTML = `
            <div style="font-weight:bold; font-size:1.1rem;">${day}</div>
            <div>${status}</div>
        `;

        grid.appendChild(cell);
    });

    // Close modal on outside click
    modal.onclick = (e) => {
        if (e.target === modal) closeAttendanceModal();
    };
}

function toggleTeacherAttendanceDay(teacherId, monthKey, dayIndex) {
    const recordKey = `${teacherId}_${monthKey}`;
    let allAttendance = getData(STORAGE_KEY_TEACHER_ATTENDANCE) || {};
    let monthRecord = allAttendance[recordKey];

    // If starting fresh
    if (!monthRecord) {
        const date = new Date(); // Simplified for current month context
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        monthRecord = Array(daysInMonth).fill('A');
    }

    // Toggle
    monthRecord[dayIndex] = monthRecord[dayIndex] === 'P' ? 'A' : 'P';

    // Save
    allAttendance[recordKey] = monthRecord;
    saveData(STORAGE_KEY_TEACHER_ATTENDANCE, allAttendance);

    // Refresh View
    const teachers = getData(STORAGE_KEY_TEACHERS);
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) viewTeacherAttendance(teacher, monthKey);
}

function closeAttendanceModal() {
    const modal = document.getElementById('attendanceModal');
    if (modal) modal.style.display = 'none';
}

// =======================================================
// ==================== STAFF LOGIC ======================
// =======================================================

function toggleStaffForm(editMode = false) {
    const container = document.getElementById('staffFormContainer');
    const form = document.getElementById('staffForm');
    const title = document.getElementById('staffFormTitle');

    if (container.style.display === 'block' && !editMode) {
        container.style.display = 'none';
        form.reset();
        document.getElementById('staffId').value = '';
    } else {
        container.style.display = 'block';
        if (!editMode) {
            form.reset();
            document.getElementById('staffId').value = '';
            title.innerText = 'Add New Staff Member';
        } else {
            title.innerText = 'Edit Staff Member';
        }
    }
}

function handleStaffFormSubmit(e) {
    e.preventDefault();
    const idField = document.getElementById('staffId');
    const isEdit = idField.value !== '';

    const newStaff = {
        id: isEdit ? idField.value : Date.now().toString(),
        fullName: document.getElementById('sFullName').value,
        fatherName: document.getElementById('sFatherName').value,
        designation: document.getElementById('sDesignation').value,
        cnic: document.getElementById('sCnic').value,
        phone: document.getElementById('sPhone').value,
        address: document.getElementById('sAddress').value,
        gender: document.getElementById('sGender').value,
        salary: document.getElementById('sSalary').value || '0',
    };

    let staff = getData(STORAGE_KEY_STAFF);
    if (isEdit) {
        const index = staff.findIndex(s => s.id === newStaff.id);
        if (index !== -1) staff[index] = newStaff;
    } else {
        staff.push(newStaff);
    }
    saveData(STORAGE_KEY_STAFF, staff);
    pushNotification('Staff Updated', `Staff record for "${newStaff.fullName}" was added/updated.`, 'user');
    toggleStaffForm();
    renderStaff();
}

function renderStaff(term = '') {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;

    const staff = getData(STORAGE_KEY_STAFF);
    const filtered = staff.filter(s => s.fullName.toLowerCase().includes(term) || s.designation.toLowerCase().includes(term));

    // Update total count display
    const totalCountEl = document.getElementById('totalStaffCount');
    if (totalCountEl) totalCountEl.innerText = staff.length;

    tbody.innerHTML = '';
    const noData = document.getElementById('noStaffDataMessage');

    if (filtered.length === 0) {
        noData.style.display = 'block';
    } else {
        noData.style.display = 'none';
        filtered.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div style="display:flex;align-items:center;gap:0.5rem">
                    <div style="width:30px;height:30px;background:#dcfce7;color:#166534;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold">${s.fullName.charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-weight:500">${s.fullName}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary)">${s.designation || ''}</div>
                    </div>
                </div></td>
                <td>${s.fatherName || '-'}</td>
                <td>${s.designation}</td>
                <td>${s.cnic || '-'}</td>
                <td>${s.phone || '-'}</td>
                <td>PKR ${s.salary}</td>
                <td>
                    <button class="action-btn btn-edit" onclick='editStaff(${JSON.stringify(s)})'><i data-lucide="edit-2" width="14"></i> Edit</button>
                    <button class="action-btn btn-delete" onclick="deleteStaff('${s.id}')"><i data-lucide="trash-2" width="14"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        window.lucide.createIcons();
    }
}

function editStaff(s) {
    toggleStaffForm(true);
    document.getElementById('staffId').value = s.id;
    document.getElementById('sFullName').value = s.fullName;
    document.getElementById('sFatherName').value = s.fatherName || '';
    document.getElementById('sDesignation').value = s.designation || '';
    document.getElementById('sCnic').value = s.cnic || '';
    document.getElementById('sPhone').value = s.phone;
    document.getElementById('sAddress').value = s.address || '';
    document.getElementById('sGender').value = s.gender || '';
    document.getElementById('sSalary').value = s.salary || '0';
}

function deleteStaff(id) {
    if (confirm('Delete this staff member?')) {
        let staff = getData(STORAGE_KEY_STAFF);
        staff = staff.filter(s => s.id !== id);
        saveData(STORAGE_KEY_STAFF, staff);
        renderStaff();
    }
}


// =======================================================
// ==================== CLASS LOGIC ======================
// =======================================================

function toggleClassForm(editMode = false) {
    const container = document.getElementById('classFormContainer');
    const form = document.getElementById('classForm');
    const title = document.getElementById('classFormTitle');

    if (container.style.display === 'block' && !editMode) {
        container.style.display = 'none';
        form.reset();
        document.getElementById('classId').value = '';
    } else {
        container.style.display = 'block';
        if (!editMode) {
            form.reset();
            document.getElementById('classId').value = '';
            title.innerText = 'Add New Class';
        } else {
            title.innerText = 'Edit Class Details';
        }
    }
}

function handleClassFormSubmit(e) {
    e.preventDefault();
    const idField = document.getElementById('classId');
    const isEdit = idField.value !== '';

    const newClass = {
        id: isEdit ? idField.value : Date.now().toString(),
        name: document.getElementById('cName').value,
        section: document.getElementById('cSection').value,
        room: document.getElementById('cRoom').value,
        capacity: document.getElementById('cCapacity').value,
    };

    let classes = getData(STORAGE_KEY_CLASSES);
    if (isEdit) {
        const index = classes.findIndex(c => c.id === newClass.id);
        if (index !== -1) classes[index] = newClass;
    } else {
        classes.push(newClass);
    }
    saveData(STORAGE_KEY_CLASSES, classes);

    toggleClassForm();
    renderClasses();
}

function renderClasses(term = '') {
    const tbody = document.getElementById('classTableBody');
    if (!tbody) return;

    const classes = getData(STORAGE_KEY_CLASSES);
    const filtered = classes.filter(c => c.name.toLowerCase().includes(term));

    tbody.innerHTML = '';
    const noData = document.getElementById('noClassDataMessage');

    if (filtered.length === 0) {
        noData.style.display = 'block';
    } else {
        noData.style.display = 'none';
        filtered.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${c.name}</b></td>
                <td>${c.section}</td>
                <td>${c.room}</td>
                <td>${c.capacity}</td>
                <td>
                    <button class="action-btn btn-edit" onclick='editClass(${JSON.stringify(c)})'><i data-lucide="edit-2" width="14"></i> Edit</button>
                    <button class="action-btn btn-delete" onclick="deleteClass('${c.id}')"><i data-lucide="trash-2" width="14"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        window.lucide.createIcons();
    }
}

function editClass(c) {
    toggleClassForm(true);
    document.getElementById('classId').value = c.id;
    document.getElementById('cName').value = c.name;
    document.getElementById('cSection').value = c.section;
    document.getElementById('cRoom').value = c.room;
    document.getElementById('cCapacity').value = c.capacity;
}

function deleteClass(id) {
    if (confirm('Delete this class?')) {
        let classes = getData(STORAGE_KEY_CLASSES);
        classes = classes.filter(c => c.id !== id);
        saveData(STORAGE_KEY_CLASSES, classes);
        renderClasses();
    }
}

// =======================================================
// ==================== SETTINGS LOGIC ===================
// =======================================================

function renderLoginHistory() {
    // Get Current User Info
    const authData = localStorage.getItem(STORAGE_KEY_AUTH);
    const auth = authData ? JSON.parse(authData) : { email: 'Admin User' };
    const userDisplay = document.getElementById('currentUserDisplay');
    if (userDisplay) {
        userDisplay.innerText = auth.email;
    }

    // Get History
    const history = JSON.parse(localStorage.getItem('EDUCORE_LOGIN_HISTORY')) || [];
    const tbody = document.getElementById('loginHistoryBody');
    const noData = document.getElementById('noLoginData');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (history.length === 0) {
        if (noData) noData.style.display = 'block';
    } else {
        if (noData) noData.style.display = 'none';
        history.forEach(log => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 0.75rem 1rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">${log.email}</td>
                <td style="padding: 0.75rem 1rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">${dateStr}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);">
                    <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 99px; font-size: 0.75rem;">${log.status}</span>
                </td>
                <td style="padding: 0.75rem 1rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${log.ip}</td>
            `;
            tbody.appendChild(row);
        });
    }
}



function loadSettings() {
    const settings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const auth = localStorage.getItem(STORAGE_KEY_AUTH);

    if (settings) {
        const data = JSON.parse(settings);
        if (document.getElementById('sSchoolName')) document.getElementById('sSchoolName').value = data.schoolName || '';
        if (document.getElementById('sSession')) document.getElementById('sSession').value = data.session || '';
        if (document.getElementById('sPhone')) document.getElementById('sPhone').value = data.phone || '';
    }

    if (auth) {
        const authData = JSON.parse(auth);
        if (document.getElementById('sContactEmail')) document.getElementById('sContactEmail').value = authData.email || 'Apexiumstechnologies@gmail.com';
    }
}

function handleSettingsSubmit(e) {
    e.preventDefault();

    // 1. Get current values from storage for verification
    const storedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
    const currentAuth = storedAuth ? JSON.parse(storedAuth) : { email: 'apexiumstechnologies@gmail.com', password: 'apexiums3841' };

    // 2. Get verification inputs
    const vEmail = document.getElementById('vOldEmail').value;
    const vPass = document.getElementById('vOldPassword').value;

    // 3. Verify
    if (vEmail.toLowerCase() !== currentAuth.email.toLowerCase() || vPass !== currentAuth.password) {
        alert('Verification Failed: Current Email or Password is incorrect. Changes not saved.');
        return;
    }

    // 4. If verified, proceed with update
    const settings = {};
    if (document.getElementById('sSchoolName')) settings.schoolName = document.getElementById('sSchoolName').value;
    if (document.getElementById('sSession')) settings.session = document.getElementById('sSession').value;
    if (document.getElementById('sPhone')) settings.phone = document.getElementById('sPhone').value;

    const emailEl = document.getElementById('sContactEmail');
    const passEl = document.getElementById('sPassword');

    const newEmail = emailEl ? emailEl.value : currentAuth.email;
    const newPassword = passEl ? passEl.value : '';

    const updatedAuth = { ...currentAuth };
    if (newEmail) updatedAuth.email = newEmail;
    if (newPassword) updatedAuth.password = newPassword;

    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updatedAuth));

    alert('Account Credentials Updated Successfully!');
    pushNotification('Security Update', 'Admin credentials have been updated.', 'login');

    // Reset security/verification fields
    if (passEl) passEl.value = '';
    if (document.getElementById('vOldEmail')) document.getElementById('vOldEmail').value = '';
    if (document.getElementById('vOldPassword')) document.getElementById('vOldPassword').value = '';

    // Refresh display
    renderLoginHistory();
}

// =======================================================
// ==================== NOTIFICATIONS LOGIC ==============
// =======================================================

function pushNotification(title, message, type = 'info') {
    const notifications = getData(STORAGE_KEY_NOTIFICATIONS);
    const newNotif = {
        id: Date.now(),
        title,
        message,
        type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
    };
    notifications.unshift(newNotif);
    saveData(STORAGE_KEY_NOTIFICATIONS, notifications.slice(0, 20)); // Keep last 20
    renderNotifications();
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    const badge = document.getElementById('notifBadge');
    const panel = document.getElementById('notificationPanel');
    if (!list) return;

    const notifications = getData(STORAGE_KEY_NOTIFICATIONS);

    // Update Badge
    if (badge) {
        badge.innerText = notifications.length;
        badge.style.display = notifications.length > 0 ? 'flex' : 'none';
    }

    if (notifications.length === 0) {
        // If empty, remove the active class so the entire panel (header included) disappears
        if (panel) panel.classList.remove('active');
        list.innerHTML = '';
        return;
    }

    list.innerHTML = '';
    notifications.forEach(n => {
        let icon = 'bell';
        let bg = 'rgba(32, 176, 164, 0.1)';
        let color = 'var(--primary-color)';

        if (n.type === 'login') { icon = 'log-in'; }
        if (n.type === 'user') { icon = 'user'; }
        if (n.type === 'book') { icon = 'book-open'; }
        if (n.type === 'alert') { icon = 'alert-triangle'; bg = '#fef2f2'; color = '#ef4444'; }

        const div = document.createElement('div');
        div.className = 'notif-item';
        div.style.cursor = 'pointer';
        div.title = 'Click to dismiss';
        div.onclick = (e) => {
            e.stopPropagation();
            removeNotification(n.id);
        };

        div.innerHTML = `
            <div class="notif-icon" style="background: ${bg}; color: ${color};">
                <i data-lucide="${icon}" size="18"></i>
            </div>
            <div class="notif-content">
                <span class="notif-title">${n.title}</span>
                <p class="notif-desc">${n.message}</p>
                <span class="notif-time">${n.time} • ${n.date}</span>
            </div>
        `;
        list.appendChild(div);
    });

    if (window.lucide) window.lucide.createIcons();
}

function removeNotification(id) {
    let notifications = getData(STORAGE_KEY_NOTIFICATIONS);
    notifications = notifications.filter(n => n.id !== id);
    saveData(STORAGE_KEY_NOTIFICATIONS, notifications);
    renderNotifications();
}

function clearAllNotifications(e) {
    if (e) e.stopPropagation();
    saveData(STORAGE_KEY_NOTIFICATIONS, []);
    renderNotifications();
}

