let currentRole = '';
let books = JSON.parse(localStorage.getItem('books')) || [];
let students = JSON.parse(localStorage.getItem('students')) || [];
let borrows = JSON.parse(localStorage.getItem('borrows')) || [];
let logs = JSON.parse(localStorage.getItem('logs')) || [];
let editingBookId = null;
let editingStudentId = null;

// --- رمزهای ذخیره شده در localStorage ---
let passwords = JSON.parse(localStorage.getItem('libraryPasswords')) || {
    vice: '1234',
    librarian: '1234'
};

// --- سیستم Toast کاستوم ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', type);

    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-times-circle';
    if (type === 'confirm') icon = 'fa-question-circle';

    let html = `
        <i class="fas ${icon} fa-2x"></i>
        <div class="toast-message">${message}</div>
    `;

    if (type === 'confirm') {
        html += `
            <div class="toast-buttons">
                <button class="confirm-yes">بله</button>
                <button class="confirm-no">خیر</button>
            </div>
        `;
    }

    toast.innerHTML = html;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    if (type !== 'confirm') {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    if (type === 'confirm') {
        return new Promise((resolve) => {
            toast.querySelector('.confirm-yes').onclick = () => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
                resolve(true);
            };
            toast.querySelector('.confirm-no').onclick = () => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
                resolve(false);
            };
        });
    }
}

// نمایش/مخفی رمز
function togglePassword() {
    const input = document.getElementById('password-input');
    const icon = document.querySelector('.toggle-password');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

// نمایش مودال لاگین
function showPasswordModal(role) {
    currentRole = role;
    document.getElementById('modal-title').textContent = 
        role === 'vice' ? 'ورود به عنوان معاون پرورشی' : 'ورود به عنوان مسئول کتابخانه';
    document.getElementById('password-modal').classList.remove('hidden');
    document.getElementById('password-input').value = '';
    document.getElementById('password-input').type = 'password';
    document.querySelector('.toggle-password').classList.remove('fa-eye');
    document.querySelector('.toggle-password').classList.add('fa-eye-slash');
    document.getElementById('remember-me').checked = false;
    document.getElementById('password-input').focus();
    document.getElementById('modal-error').textContent = '';
}

function closeModal() {
    document.getElementById('password-modal').classList.add('hidden');
    document.getElementById('modal-error').textContent = '';
}

// چک رمز و ورود
function checkPassword() {
    const password = document.getElementById('password-input').value.trim();
    const remember = document.getElementById('remember-me').checked;

    const correctPassword = passwords[currentRole];

    if (password === correctPassword) {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-page').classList.remove('hidden');
        document.getElementById('vice-only').classList.toggle('hidden', currentRole !== 'vice');
        
        closeModal();
        showTab('dashboard');
        updateBottomNav(); // اضافه کردن دکمه تغییر رمز

        if (remember) {
            const loginTime = new Date().getTime();
            localStorage.setItem('tempLogin', JSON.stringify({ role: currentRole, timestamp: loginTime }));
        } else {
            localStorage.removeItem('tempLogin');
        }

        showToast('با موفقیت وارد شدید!', 'success');
        addLog('ورود به سیستم', `کاربر: ${currentRole === 'vice' ? 'معاون پرورشی' : 'مسئول کتابخانه'}`);
    } else {
        document.getElementById('modal-error').textContent = 'رمز عبور اشتباه است!';
        showToast('رمز عبور اشتباه است!', 'error');
    }
}

function logout() {
    localStorage.removeItem('tempLogin');
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('vice-only').classList.add('hidden');
    showToast('با موفقیت خارج شدید', 'success');
}

// چک لاگین موقت
function checkTempLogin() {
    const tempData = localStorage.getItem('tempLogin');
    if (tempData) {
        const data = JSON.parse(tempData);
        const now = new Date().getTime();
        if ((now - data.timestamp) / (1000 * 60) < 20) {
            currentRole = data.role;
            document.getElementById('login-page').classList.add('hidden');
            document.getElementById('main-page').classList.remove('hidden');
            document.getElementById('vice-only').classList.toggle('hidden', currentRole !== 'vice');
            showTab('dashboard');
            updateBottomNav();
            return true;
        } else {
            localStorage.removeItem('tempLogin');
        }
    }
    return false;
}

// --- تابع اضافه کردن لاگ ---
function addLog(action, details) {
    const log = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        role: currentRole === 'vice' ? 'معاون پرورشی' : 'مسئول کتابخانه',
        action,
        details
    };
    logs.unshift(log);
    localStorage.setItem('logs', JSON.stringify(logs));
}

// --- مودال تغییر رمز عبور ---
function showChangePasswordModal() {
    let html = `
        <div id="change-password-modal" class="modal">
            <div class="modal-content">
                <h2>تغییر رمز عبور</h2>
                <div class="password-wrapper">
                    <input type="password" id="current-password" placeholder="رمز عبور فعلی">
                    <i class="fas fa-eye-slash toggle-password-current" onclick="toggleCurrentPassword()"></i>
                </div>
                <div class="password-wrapper">
                    <input type="password" id="new-password" placeholder="رمز عبور جدید">
                    <i class="fas fa-eye-slash toggle-password-new" onclick="toggleNewPassword()"></i>
                </div>
                <div class="password-wrapper">
                    <input type="password" id="confirm-password" placeholder="تکرار رمز عبور جدید">
                    <i class="fas fa-eye-slash toggle-password-confirm" onclick="toggleConfirmPassword()"></i>
                </div>
                <p id="change-password-error" class="error"></p>
                <div class="modal-buttons">
                    <button onclick="saveNewPassword()">ذخیره رمز جدید</button>
                    <button onclick="closeChangePasswordModal()" class="cancel">انصراف</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
}

function closeChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) modal.remove();
}

function toggleCurrentPassword() {
    const input = document.getElementById('current-password');
    const icon = document.querySelector('.toggle-password-current');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

function toggleNewPassword() {
    const input = document.getElementById('new-password');
    const icon = document.querySelector('.toggle-password-new');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

function toggleConfirmPassword() {
    const input = document.getElementById('confirm-password');
    const icon = document.querySelector('.toggle-password-confirm');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

function saveNewPassword() {
    const current = document.getElementById('current-password').value.trim();
    const newPass = document.getElementById('new-password').value.trim();
    const confirm = document.getElementById('confirm-password').value.trim();

    const correctCurrent = passwords[currentRole];

    if (current !== correctCurrent) {
        document.getElementById('change-password-error').textContent = 'رمز عبور فعلی اشتباه است!';
        showToast('رمز عبور فعلی اشتباه است!', 'error');
        return;
    }

    if (newPass.length < 6) {
        document.getElementById('change-password-error').textContent = 'رمز جدید باید حداقل ۶ کاراکتر باشد!';
        showToast('رمز جدید باید حداقل ۶ کاراکتر باشد!', 'error');
        return;
    }

    if (newPass !== confirm) {
        document.getElementById('change-password-error').textContent = 'رمز جدید و تکرار آن مطابقت ندارند!';
        showToast('رمز جدید و تکرار آن مطابقت ندارند!', 'error');
        return;
    }

    passwords[currentRole] = newPass;
    localStorage.setItem('libraryPasswords', JSON.stringify(passwords));

    showToast('رمز عبور با موفقیت تغییر کرد!', 'success');
    addLog('تغییر رمز عبور', `کاربر: ${currentRole === 'vice' ? 'معاون پرورشی' : 'مسئول کتابخانه'}`);
    closeChangePasswordModal();
}

// --- اضافه کردن دکمه تغییر رمز به منوی پایین ---
function updateBottomNav() {
    const bottomNav = document.querySelector('.bottom-nav');
    if (!document.getElementById('change-password-btn')) {
        const changePassBtn = document.createElement('button');
        changePassBtn.id = 'change-password-btn';
        changePassBtn.className = 'nav-btn';
        changePassBtn.innerHTML = `
            <i class="fas fa-key"></i>
            <span>تغییر رمز</span>
        `;
        changePassBtn.onclick = showChangePasswordModal;
        bottomNav.appendChild(changePassBtn);
    }
}

// --- بخش کتاب‌ها ---
function showBooksTab() {
    let html = `
        <h2>مدیریت کتاب‌ها</h2>
        <button class="add-book-btn" onclick="openBookModal()">+ ثبت کتاب جدید</button>
        
        <input type="text" id="book-search" class="search-box" placeholder="جستجو در عنوان یا نویسنده..." onkeyup="searchBooks()">
        
        <div class="books-table-container">
    `;

    if (books.length === 0) {
        html += `<p class="no-books">هنوز کتابی ثبت نشده است.</p>`;
    } else {
        html += `
            <table>
                <thead>
                    <tr>
                        <th>عنوان</th>
                        <th>نویسنده</th>
                        <th>تعداد نسخه</th>
                        <th>عملیات</th>
                    </tr>
                </thead>
                <tbody id="books-table-body">
                    ${books.map(book => `
                        <tr>
                            <td>${book.title}</td>
                            <td>${book.author}</td>
                            <td>${book.copies}</td>
                            <td>
                                <button class="action-btn edit-btn" onclick="editBook('${book.id}')">ویرایش</button>
                                <button class="action-btn delete-btn" onclick="deleteBook('${book.id}')">حذف</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    html += `</div>`;

    html += `
        <div id="book-modal" class="book-modal hidden">
            <div class="book-modal-content">
                <h2 id="book-modal-title">ثبت کتاب جدید</h2>
                <input type="text" id="book-title" placeholder="عنوان کتاب">
                <input type="text" id="book-author" placeholder="نویسنده">
                <input type="number" id="book-copies" placeholder="تعداد نسخه" min="1" value="1">
                <div class="modal-buttons">
                    <button class="save-book-btn" onclick="saveBook()">ذخیره</button>
                    <button class="close-book-modal" onclick="closeBookModal()">انصراف</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('content').innerHTML = html;
}

function openBookModal(bookId = null) {
    editingBookId = bookId;
    if (bookId) {
        const book = books.find(b => b.id === bookId);
        if (book) {
            document.getElementById('book-modal-title').textContent = 'ویرایش کتاب';
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-author').value = book.author;
            document.getElementById('book-copies').value = book.copies;
        }
    } else {
        document.getElementById('book-modal-title').textContent = 'ثبت کتاب جدید';
        document.getElementById('book-title').value = '';
        document.getElementById('book-author').value = '';
        document.getElementById('book-copies').value = '1';
    }
    document.getElementById('book-modal').classList.remove('hidden');
}

function closeBookModal() {
    document.getElementById('book-modal').classList.add('hidden');
}

async function saveBook() {
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const copies = parseInt(document.getElementById('book-copies').value) || 1;

    if (!title || !author) {
        showToast('عنوان و نویسنده الزامی است!', 'error');
        return;
    }

    if (editingBookId) {
        const book = books.find(b => b.id === editingBookId);
        if (book) {
            book.title = title;
            book.author = author;
            book.copies = copies;
        }
        showToast('کتاب با موفقیت ویرایش شد', 'success');
        addLog('ویرایش کتاب', `عنوان: ${title}, نویسنده: ${author}, تعداد نسخه: ${copies}`);
    } else {
        const newBook = {
            id: Date.now().toString(),
            title,
            author,
            copies
        };
        books.push(newBook);
        showToast('کتاب جدید با موفقیت ثبت شد', 'success');
        addLog('ثبت کتاب جدید', `عنوان: ${title}, نویسنده: ${author}, تعداد نسخه: ${copies}`);
    }

    localStorage.setItem('books', JSON.stringify(books));
    closeBookModal();
    showBooksTab();
    if (document.querySelector('h2') && document.querySelector('h2').textContent === 'داشبورد اصلی') {
        showDashboard();
    }
}

async function deleteBook(id) {
    const confirmed = await showToast('آیا مطمئن هستید که می‌خواهید این کتاب را حذف کنید؟', 'confirm');
    if (confirmed) {
        const book = books.find(b => b.id === id);
        books = books.filter(b => b.id !== id);
        localStorage.setItem('books', JSON.stringify(books));
        showBooksTab();
        showToast('کتاب با موفقیت حذف شد', 'success');
        addLog('حذف کتاب', `عنوان: ${book.title}, نویسنده: ${book.author}`);
        if (document.querySelector('h2') && document.querySelector('h2').textContent === 'داشبورد اصلی') {
            showDashboard();
        }
    }
}

function editBook(id) {
    openBookModal(id);
}

function searchBooks() {
    const query = document.getElementById('book-search').value.toLowerCase();
    const filtered = books.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
    );

    const tbody = document.getElementById('books-table-body');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#aaa;">کتابی یافت نشد</td></tr>`;
    } else {
        tbody.innerHTML = filtered.map(book => `
            <tr>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.copies}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editBook('${book.id}')">ویرایش</button>
                    <button class="action-btn delete-btn" onclick="deleteBook('${book.id}')">حذف</button>
                </td>
            </tr>
        `).join('');
    }
}

// --- بخش دانش‌آموزان با پایه و کلاس دو مرحله‌ای + شماره تلفن ---
function getGradeLabel(grade) {
    switch(grade) {
        case '7': return 'هفتم';
        case '8': return 'هشتم';
        case '9': return 'نهم';
        default: return 'نامشخص';
    }
}

function updateClassOptions() {
    const gradeSelect = document.getElementById('student-grade');
    const classSelect = document.getElementById('student-class');
    const grade = gradeSelect.value;

    classSelect.innerHTML = '<option value="">انتخاب کلاس</option>';

    let options = [];
    if (grade === '7') options = ['701', '702'];
    else if (grade === '8') options = ['801', '802'];
    else if (grade === '9') options = ['901', '902', '903'];

    options.forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls;
        classSelect.appendChild(opt);
    });
}

function showStudentsTab() {
    let html = `
        <h2>مدیریت دانش‌آموزان</h2>
        <button class="add-student-btn" onclick="openStudentModal()">+ ثبت دانش‌آموز جدید</button>
        
        <input type="text" id="student-search" class="search-box" placeholder="جستجو با نام یا شماره تلفن..." onkeyup="searchStudents()">
        
        <div class="students-table-container">
    `;

    if (students.length === 0) {
        html += `<p class="no-students">هنوز دانش‌آموزی ثبت نشده است.</p>`;
    } else {
        html += `
            <table class="students-table">
                <thead>
                    <tr>
                        <th>نام کامل</th>
                        <th>پایه</th>
                        <th>کلاس</th>
                        <th>شماره تلفن</th>
                        <th>وضعیت عضویت</th>
                        <th>عملیات</th>
                    </tr>
                </thead>
                <tbody id="students-table-body">
                    ${students.map(student => `
                        <tr>
                            <td>${student.name}</td>
                            <td>${getGradeLabel(student.grade)}</td>
                            <td>${student.class}</td>
                            <td>${student.phone}</td>
                            <td class="${student.paid ? 'paid' : 'not-paid'}">
                                ${student.paid ? 'پرداخت شده ✓' : 'پرداخت نشده ✗'}
                            </td>
                            <td>
                                <button class="action-btn edit-btn" onclick="editStudent('${student.id}')">ویرایش</button>
                                <button class="action-btn delete-btn" onclick="deleteStudent('${student.id}')">حذف</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    html += `</div>`;

    html += `
        <div id="student-modal" class="student-modal hidden">
            <div class="student-modal-content">
                <h2 id="student-modal-title">ثبت دانش‌آموز جدید</h2>
                <input type="text" id="student-name" placeholder="نام کامل دانش‌آموز">
                
                <select id="student-grade" onchange="updateClassOptions()">
                    <option value="">انتخاب پایه</option>
                    <option value="7">هفتم</option>
                    <option value="8">هشتم</option>
                    <option value="9">نهم</option>
                </select>
                
                <select id="student-class">
                    <option value="">ابتدا پایه را انتخاب کنید</option>
                </select>
                
                <input type="text" id="student-phone" placeholder="شماره تلفن">
                
                <label style="color:#b0b0ff; margin:15px 0; display:block;">
                    <input type="checkbox" id="student-paid">
                    هزینه عضویت سالانه پرداخت شده است (۲۰ هزار تومان)
                </label>
                
                <div class="modal-buttons">
                    <button class="save-book-btn" onclick="saveStudent()">ذخیره</button>
                    <button class="close-book-modal" onclick="closeStudentModal()">انصراف</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('content').innerHTML = html;
}

function openStudentModal(studentId = null) {
    editingStudentId = studentId;
    if (studentId) {
        const student = students.find(s => s.id === studentId);
        if (student) {
            document.getElementById('student-modal-title').textContent = 'ویرایش دانش‌آموز';
            document.getElementById('student-name').value = student.name;
            document.getElementById('student-grade').value = student.grade;
            updateClassOptions();
            document.getElementById('student-class').value = student.class;
            document.getElementById('student-phone').value = student.phone;
            document.getElementById('student-paid').checked = student.paid;
        }
    } else {
        document.getElementById('student-modal-title').textContent = 'ثبت دانش‌آموز جدید';
        document.getElementById('student-name').value = '';
        document.getElementById('student-grade').value = '';
        document.getElementById('student-class').innerHTML = '<option value="">ابتدا پایه را انتخاب کنید</option>';
        document.getElementById('student-phone').value = '';
        document.getElementById('student-paid').checked = false;
    }
    document.getElementById('student-modal').classList.remove('hidden');
}

function closeStudentModal() {
    document.getElementById('student-modal').classList.add('hidden');
}

async function saveStudent() {
    const name = document.getElementById('student-name').value.trim();
    const grade = document.getElementById('student-grade').value;
    const className = document.getElementById('student-class').value;
    const phone = document.getElementById('student-phone').value.trim();
    const paid = document.getElementById('student-paid').checked;

    if (!name || !grade || !className || !phone) {
        showToast('تمام فیلدها الزامی است!', 'error');
        return;
    }

    if (editingStudentId) {
        const student = students.find(s => s.id === editingStudentId);
        if (student) {
            student.name = name;
            student.grade = grade;
            student.class = className;
            student.phone = phone;
            student.paid = paid;
        }
        showToast('دانش‌آموز با موفقیت ویرایش شد', 'success');
        addLog('ویرایش دانش‌آموز', `نام: ${name}, کلاس: ${className}, تلفن: ${phone}`);
    } else {
        const newStudent = {
            id: Date.now().toString(),
            name,
            grade,
            class: className,
            phone,
            paid
        };
        students.push(newStudent);
        showToast('دانش‌آموز جدید با موفقیت ثبت شد', 'success');
        addLog('ثبت دانش‌آموز جدید', `نام: ${name}, کلاس: ${className}, تلفن: ${phone}`);
    }

    localStorage.setItem('students', JSON.stringify(students));
    closeStudentModal();
    showStudentsTab();
    if (document.querySelector('h2') && document.querySelector('h2').textContent === 'داشبورد اصلی') {
        showDashboard();
    }
}

async function deleteStudent(id) {
    const confirmed = await showToast('آیا مطمئن هستید که می‌خواهید این دانش‌آموز را حذف کنید؟', 'confirm');
    if (confirmed) {
        const student = students.find(s => s.id === id);
        students = students.filter(s => s.id !== id);
        localStorage.setItem('students', JSON.stringify(students));
        showStudentsTab();
        showToast('دانش‌آموز با موفقیت حذف شد', 'success');
        addLog('حذف دانش‌آموز', `نام: ${student.name}, کلاس: ${student.class}`);
        if (document.querySelector('h2') && document.querySelector('h2').textContent === 'داشبورد اصلی') {
            showDashboard();
        }
    }
}

function editStudent(id) {
    openStudentModal(id);
}

function searchStudents() {
    const query = document.getElementById('student-search').value.toLowerCase();
    const filtered = students.filter(student => 
        student.name.toLowerCase().includes(query) ||
        student.phone.includes(query)
    );

    const tbody = document.getElementById('students-table-body');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#aaa;">دانش‌آموزی یافت نشد</td></tr>`;
    } else {
        tbody.innerHTML = filtered.map(student => `
            <tr>
                <td>${student.name}</td>
                <td>${getGradeLabel(student.grade)}</td>
                <td>${student.class}</td>
                <td>${student.phone}</td>
                <td class="${student.paid ? 'paid' : 'not-paid'}">
                    ${student.paid ? 'پرداخت شده ✓' : 'پرداخت نشده ✗'}
                </td>
                <td>
                    <button class="action-btn edit-btn" onclick="editStudent('${student.id}')">ویرایش</button>
                    <button class="action-btn delete-btn" onclick="deleteStudent('${student.id}')">حذف</button>
                </td>
            </tr>
        `).join('');
    }
}

// --- بخش امانت و بازگشت با انتخاب دانش‌آموز از لیست ---
function showBorrowsTab() {
    let html = `
        <h2>امانت و بازگشت کتاب</h2>
        
        <div class="borrow-search">
            <select id="borrow-student-select">
                <option value="">انتخاب دانش‌آموز</option>
                ${students.map(s => `<option value="${s.id}">${s.name} (${s.class} - ${s.phone})</option>`).join('')}
            </select>
            
            <select id="borrow-book-select">
                <option value="">انتخاب کتاب</option>
                ${books.filter(book => book.copies > 0).map(book => 
                    `<option value="${book.id}">${book.title} (${book.author} - ${book.copies} نسخه)</option>`
                ).join('')}
            </select>
            
            <button id="lend-book-btn" onclick="lendBook()" disabled>ثبت امانت</button>
        </div>

        <h3 style="margin-top:40px;">امانت‌های فعال</h3>
        <div class="active-borrows-table">
    `;

    const activeBorrows = borrows.filter(b => !b.returned);
    if (activeBorrows.length === 0) {
        html += `<p class="no-active-borrows">هیچ امانت فعالی وجود ندارد.</p>`;
    } else {
        html += `
            <table>
                <thead>
                    <tr>
                        <th>دانش‌آموز</th>
                        <th>کتاب</th>
                        <th>تاریخ امانت</th>
                        <th>وضعیت</th>
                        <th>عملیات</th>
                    </tr>
                </thead>
                <tbody>
                    ${activeBorrows.map(borrow => {
                        const student = students.find(s => s.id === borrow.studentId);
                        const book = books.find(bk => bk.id === borrow.bookId);
                        const borrowDate = new Date(borrow.borrowDate);
                        const diffDays = Math.floor((new Date() - borrowDate) / (1000 * 60 * 60 * 24));
                        const isLate = diffDays > 7;
                        return `
                            <tr class="${isLate ? 'late-row' : ''}">
                                <td>${student ? student.name : 'نامشخص'}</td>
                                <td>${book ? book.title : 'نامشخص'}</td>
                                <td>${borrowDate.toLocaleDateString('fa-IR')}</td>
                                <td>${isLate ? 'تأخیری 🔴 (' + diffDays + ' روز)' : 'عادی (' + diffDays + ' روز)'}</td>
                                <td>
                                    <button class="action-btn return-btn" onclick="returnBook('${borrow.id}')">بازگشت کتاب</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    html += `</div>`;

    document.getElementById('content').innerHTML = html;

    const studentSelect = document.getElementById('borrow-student-select');
    const bookSelect = document.getElementById('borrow-book-select');
    const lendBtn = document.getElementById('lend-book-btn');

    const checkLendButton = () => {
        lendBtn.disabled = !(studentSelect.value && bookSelect.value);
    };

    studentSelect.addEventListener('change', checkLendButton);
    bookSelect.addEventListener('change', checkLendButton);
}

async function lendBook() {
    const studentId = document.getElementById('borrow-student-select').value;
    const bookId = document.getElementById('borrow-book-select').value;

    if (!studentId || !bookId) {
        showToast('دانش‌آموز و کتاب را انتخاب کنید!', 'error');
        return;
    }

    const student = students.find(s => s.id === studentId);
    const book = books.find(b => b.id === bookId);

    if (book.copies <= 0) {
        showToast('این کتاب موجود نیست!', 'error');
        return;
    }

    const newBorrow = {
        id: Date.now().toString(),
        studentId: student.id,
        bookId: book.id,
        borrowDate: new Date().toISOString(),
        returned: false
    };

    borrows.push(newBorrow);
    book.copies -= 1;

    localStorage.setItem('borrows', JSON.stringify(borrows));
    localStorage.setItem('books', JSON.stringify(books));

    showToast(`کتاب "${book.title}" با موفقیت به "${student.name}" امانت داده شد`, 'success');
    addLog('امانت کتاب', `کتاب: ${book.title} به دانش‌آموز: ${student.name} (${student.class})`);
    showBorrowsTab();
    if (document.querySelector('h2') && document.querySelector('h2').textContent === 'داشبورد اصلی') {
        showDashboard();
    }
}

async function returnBook(borrowId) {
    const confirmed = await showToast('آیا کتاب بازگشت داده شده است؟', 'confirm');
    if (confirmed) {
        const borrow = borrows.find(b => b.id === borrowId);
        if (borrow) {
            borrow.returned = true;
            borrow.returnDate = new Date().toISOString();

            const book = books.find(bk => bk.id === borrow.bookId);
            if (book) book.copies += 1;

            const student = students.find(s => s.id === borrow.studentId);

            localStorage.setItem('borrows', JSON.stringify(borrows));
            localStorage.setItem('books', JSON.stringify(books));

            showToast('کتاب با موفقیت بازگشت داده شد', 'success');
            addLog('بازگشت کتاب', `کتاب: ${book.title} از دانش‌آموز: ${student.name}`);
            showBorrowsTab();
            if (document.querySelector('h2') && document.querySelector('h2').textContent === 'داشبورد اصلی') {
                showDashboard();
            }
        }
    }
}

// --- بخش لاگ فعالیت‌ها ---
function showLogsTab() {
    if (currentRole !== 'vice') {
        document.getElementById('content').innerHTML = `
            <h2>لاگ فعالیت‌ها</h2>
            <p style="text-align:center; color:#ff6b6b; font-size:18px; margin-top:50px;">
                دسترسی به لاگ‌ها فقط برای معاون پرورشی امکان‌پذیر است.
            </p>
        `;
        return;
    }

    let html = `
        <h2>لاگ فعالیت‌ها</h2>
        <div class="logs-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <p style="color:#b0b0ff; margin:0;">مجموع لاگ‌ها: ${logs.length} مورد</p>
            <button class="action-btn delete-btn" onclick="clearAllLogs()" style="padding:10px 20px;">
                <i class="fas fa-trash-alt"></i> پاک کردن همه لاگ‌ها
            </button>
        </div>
        <div class="logs-table-container">
    `;

    if (logs.length === 0) {
        html += `<p style="text-align:center; padding:60px; color:#aaa;">هنوز فعالیتی ثبت نشده است.</p>`;
    } else {
        html += `
            <table>
                <thead>
                    <tr>
                        <th>زمان</th>
                        <th>کاربر</th>
                        <th>عملیات</th>
                        <th>جزئیات</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => {
                        const date = new Date(log.timestamp);
                        const persianDate = date.toLocaleDateString('fa-IR');
                        const time = date.toLocaleTimeString('fa-IR');
                        return `
                            <tr>
                                <td>${persianDate}<br><small>${time}</small></td>
                                <td>${log.role}</td>
                                <td>${log.action}</td>
                                <td>${log.details}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    html += `</div>`;

    document.getElementById('content').innerHTML = html;
}

// --- تابع پاک کردن همه لاگ‌ها ---
async function clearAllLogs() {
    const confirmed = await showToast('آیا مطمئن هستید که می‌خواهید همه لاگ‌ها را پاک کنید؟ این عمل قابل بازگشت نیست!', 'confirm');
    if (confirmed) {
        logs = [];
        localStorage.setItem('logs', JSON.stringify(logs));
        showLogsTab();
        showToast('همه لاگ‌ها با موفقیت پاک شدند', 'success');
        addLog('پاک کردن همه لاگ‌ها', 'تمام لاگ‌های سیستم حذف شد');
    }
}

// --- بخش آمار و گزارش‌ها ---
function showStatsTab() {
    // آمار پایه‌ها
    const gradeCounts = {7: 0, 8: 0, 9: 0};
    borrows.forEach(b => {
        if (!b.returned) {
            const student = students.find(s => s.id === b.studentId);
            if (student && student.grade) {
                gradeCounts[student.grade]++;
            }
        }
    });

    // وضعیت پرداخت عضویت
    const paidCount = students.filter(s => s.paid).length;
    const notPaidCount = students.filter(s => !s.paid).length;

    // پرطرفدارترین کتاب‌ها
    const bookBorrowCounts = {};
    borrows.forEach(b => {
        if (bookBorrowCounts[b.bookId]) bookBorrowCounts[b.bookId]++;
        else bookBorrowCounts[b.bookId] = 1;
    });

    const sortedBooks = Object.keys(bookBorrowCounts)
        .sort((a, b) => bookBorrowCounts[b] - bookBorrowCounts[a])
        .slice(0, 5)
        .map(id => {
            const book = books.find(bk => bk.id === id);
            return { title: book ? book.title : 'نامشخص', count: bookBorrowCounts[id] };
        });

    let html = `
        <div class="stats-grid">
            <div class="stat-card large">
                <h3>امانت‌ها بر اساس پایه</h3>
                <canvas id="gradeChart"></canvas>
            </div>
            
            <div class="stat-card large">
                <h3>وضعیت پرداخت عضویت</h3>
                <canvas id="paymentChart"></canvas>
            </div>
            
            <div class="stat-card full">
                <h3>۵ کتاب پرطرفدار</h3>
                ${sortedBooks.length === 0 ? 
                    '<p style="text-align:center; color:#aaa; margin:40px;">هنوز امانتی ثبت نشده است.</p>' :
                    `<ul class="top-books-list">
                        ${sortedBooks.map((book, index) => `
                            <li>
                                <span class="rank">${index + 1}</span>
                                <span class="title">${book.title}</span>
                                <span class="count">${book.count} امانت</span>
                            </li>
                        `).join('')}
                    </ul>`
                }
            </div>
        </div>
    `;

    document.getElementById('content').innerHTML += html;

    // نمودار امانت‌ها بر اساس پایه
    const gradeCtx = document.getElementById('gradeChart').getContext('2d');
    new Chart(gradeCtx, {
        type: 'bar',
        data: {
            labels: ['هفتم', 'هشتم', 'نهم'],
            datasets: [{
                label: 'تعداد امانت فعال',
                data: [gradeCounts[7], gradeCounts[8], gradeCounts[9]],
                backgroundColor: ['#a78bfa', '#7c3aed', '#c4b5fd'],
                borderRadius: 10
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { color: '#e0e0e0' } } }
        }
    });

    // نمودار وضعیت پرداخت
    const paymentCtx = document.getElementById('paymentChart').getContext('2d');
    new Chart(paymentCtx, {
        type: 'doughnut',
        data: {
            labels: ['پرداخت شده', 'پرداخت نشده'],
            datasets: [{
                data: [paidCount, notPaidCount],
                backgroundColor: ['#4ade80', '#ff6b6b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#e0e0e0' } } }
        }
    });
}

// --- داشبورد ---
function getStats() {
    const totalBooks = books.length;
    const totalStudents = students.length;
    const activeBorrows = borrows.filter(b => !b.returned).length;
    
    const now = new Date();
    const lateBorrows = borrows.filter(b => {
        if (b.returned) return false;
        const borrowDate = new Date(b.borrowDate);
        const diffDays = Math.floor((now - borrowDate) / (1000 * 60 * 60 * 24));
        return diffDays > 7;
    }).length;

    const bookCounts = {};
    borrows.forEach(b => {
        if (bookCounts[b.bookId]) bookCounts[b.bookId]++;
        else bookCounts[b.bookId] = 1;
    });
    let popularBook = 'هنوز امانتی ثبت نشده';
    if (Object.keys(bookCounts).length > 0) {
        const maxId = Object.keys(bookCounts).reduce((a, b) => bookCounts[a] > bookCounts[b] ? a : b);
        const book = books.find(bk => bk.id === maxId);
        popularBook = book ? book.title : 'نامشخص';
    }

    return { totalBooks, totalStudents, activeBorrows, lateBorrows, popularBook };
}

function showDashboard() {
    const stats = getStats();
    const roleName = currentRole === 'vice' ? 'جناب آقای وریرنار' : 'مسئول محترم کتابخانه';

    let html = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <i class="fas fa-book fa-3x"></i>
                <h3>${stats.totalBooks}</h3>
                <p>تعداد کل کتاب‌ها</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-users fa-3x"></i>
                <h3>${stats.totalStudents}</h3>
                <p>دانش‌آموزان ثبت‌شده</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-exchange-alt fa-3x"></i>
                <h3>${stats.activeBorrows}</h3>
                <p>کتاب در امانت</p>
            </div>
            <div class="stat-card warning ${stats.lateBorrows > 0 ? 'late-alert' : ''}">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>${stats.lateBorrows}</h3>
                <p>کتاب تأخیری ${stats.lateBorrows > 0 ? '🔴' : ''}</p>
            </div>
        </div>

        <div class="popular-section">
            <h3>🔥 پرطرفدارترین کتاب</h3>
            <p class="popular-book">${stats.popularBook}</p>
        </div>

        <div class="chart-container">
            <canvas id="borrowChart"></canvas>
        </div>

        <div class="welcome-text">
            <p>خوش آمدید، ${roleName}</p>
            <p>سیستم مدیریت کتابخانه دبیرستان شهید حسین علیخانی</p>
        </div>
    `;

    document.getElementById('content').innerHTML = html;

    const ctx = document.getElementById('borrowChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['در امانت', 'تأخیری', 'موجود'],
            datasets: [{
                data: [stats.activeBorrows, stats.lateBorrows, stats.totalBooks - stats.activeBorrows],
                backgroundColor: ['#a78bfa', '#ff6b6b', '#4ade80'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#e0e0e0' } } }
        }
    });
}

function showTab(tabName) {
    const titles = {
        dashboard: 'داشبورد اصلی',
        books: 'مدیریت کتاب‌ها',
        students: 'مدیریت دانش‌آموزان',
        borrows: 'امانت و بازگشت کتاب',
        logs: 'لاگ فعالیت‌ها',
        stats: 'آمار و گزارش‌ها'
    };

    document.getElementById('content').innerHTML = `<h2>${titles[tabName]}</h2>`;

    if (tabName === 'dashboard') {
        showDashboard();
    } else if (tabName === 'books') {
        showBooksTab();
    } else if (tabName === 'students') {
        showStudentsTab();
    } else if (tabName === 'borrows') {
        showBorrowsTab();
    } else if (tabName === 'logs') {
        showLogsTab();
    } else if (tabName === 'stats') {
        showStatsTab();
    } else {
        document.getElementById('content').innerHTML += `
            <div style="text-align:center; padding:100px; color:#aaa;">
                <i class="fas fa-tools fa-3x" style="color:#7c3aed;"></i>
                <p style="font-size:20px; margin-top:30px;">این بخش به زودی فعال می‌شه!</p>
            </div>
        `;
    }

    // هایلایت تب فعال
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.style.background = 'rgba(100, 100, 150, 0.6)';
        btn.style.transform = 'translateY(0)';
    });
    const activeBtns = document.querySelectorAll(`.nav-btn[onclick="showTab('${tabName}')"]`);
    activeBtns.forEach(btn => {
        btn.style.background = '#a78bfa';
        btn.style.transform = 'translateY(-8px) scale(1.1)';
    });
}

// شروع صفحه
window.addEventListener('load', function() {
    if (!checkTempLogin()) {
        document.getElementById('main-page').classList.add('hidden');
        document.getElementById('password-modal').classList.add('hidden');
        document.getElementById('vice-only').classList.add('hidden');
        document.getElementById('login-page').classList.remove('hidden');
    }
});