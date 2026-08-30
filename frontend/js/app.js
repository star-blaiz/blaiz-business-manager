import {
    loginUser,
    registerOwner,
    logoutUser,
    isLoggedIn
} from "./auth.js";

import {
    getUser,
    getStore,
    saveStore,
    saveUser,
    apiRequest
} from "./api.js";


/* =========================
   ELEMENTS
========================= */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const authContainer =
    document.getElementById(
        "authContainer"
    );

const appContainer =
    document.getElementById(
        "appContainer"
    );

const loginPage =
    document.getElementById(
        "loginPage"
    );

const registerPage =
    document.getElementById(
        "registerPage"
    );

const loginForm =
    document.getElementById(
        "loginForm"
    );

const registerForm =
    document.getElementById(
        "registerForm"
    );

const showRegisterBtn =
    document.getElementById(
        "showRegisterBtn"
    );

const showLoginBtn =
    document.getElementById(
        "showLoginBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const menuBtn =
    document.getElementById(
        "menuBtn"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

const modalContainer =
    document.getElementById(
        "modalContainer"
    );

const modalContent =
    document.getElementById(
        "modalContent"
    );

const modalOverlay =
    document.getElementById(
        "modalOverlay"
    );

const notification =
    document.getElementById(
        "notification"
    );

/* =========================
   PRODUCT ELEMENTS
========================= */

const addProductBtn =
    document.getElementById(
        "addProductBtn"
    );

const productSearch =
    document.getElementById(
        "productSearch"
    );

const productsList =
    document.getElementById(
        "productsList"
    );


let products = [];
let customers = [];
let sales = [];
let saleCart = [];

/* =========================
   APP START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeApp();
    }
);


function initializeApp() {

    /*
     * Small delay gives the splash
     * screen a clean appearance.
     */

    setTimeout(async () => {

        loadingScreen
            .classList
            .add("hidden");


        if (isLoggedIn()) {

            showApplication();


            /*
             * Check if the user has returned
             * from a Premium Paystack payment.
             */

            const currentPath =
                window.location.pathname;


            if (
                currentPath ===
                "/premium-payment"
            ) {

                await verifyReturnedPremiumPayment();

            }

        } else {

            showAuthentication();

        }

    }, 700);
}
/* =========================
   AUTH DISPLAY
========================= */

function showAuthentication() {

    authContainer
        .classList
        .remove("hidden");

    appContainer
        .classList
        .add("hidden");

    showLoginPage();
}


function showLoginPage() {

    loginPage
        .classList
        .remove("hidden");

    registerPage
        .classList
        .add("hidden");
}


function showRegisterPage() {

    loginPage
        .classList
        .add("hidden");

    registerPage
        .classList
        .remove("hidden");
}


/* =========================
   APPLICATION DISPLAY
========================= */

function showApplication() {

    authContainer
        .classList
        .add("hidden");

    appContainer
        .classList
        .remove("hidden");

    updateUserInformation();

    setupNavigation();

    setupDashboard();

    showPage("dashboard");
}


/* =========================
   USER INFORMATION
========================= */

function updateUserInformation() {

    const user =
        getUser();

    const store =
        getStore();

    const userName =
        document.getElementById(
            "topbarUserName"
        );

    const userRole =
        document.getElementById(
            "topbarUserRole"
        );

    const storeName =
        document.getElementById(
            "topbarStoreName"
        );

    const avatar =
        document.querySelector(
            ".user-avatar"
        );

    if (user) {

        userName.textContent =
            user.name ||
            user.fullName ||
            "User";

        userRole.textContent =
            formatRole(
                user.role ||
                user.accountType ||
                "owner"
            );

        const firstLetter =
            (
                user.name ||
                user.fullName ||
                "U"
            )
            .charAt(0)
            .toUpperCase();

        avatar.textContent =
            firstLetter;
    }

    if (store) {

        storeName.textContent =
            store.storeName ||
            store.name ||
            "My Store";
    }
}


function formatRole(role) {

    if (!role) {
        return "User";
    }

    return role
        .charAt(0)
        .toUpperCase() +
        role.slice(1);
}


/* =========================
   NAVIGATION
========================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;

                    showPage(page);

                    sidebar
                        .classList
                        .remove("open");
                }
            );
        }
    );


    /*
     * Quick action buttons
     */

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(
            (button) => {

                if (
                    button.classList
                        .contains(
                            "nav-item"
                        )
                ) {
                    return;
                }

                button.addEventListener(
                    "click",
                    () => {

                        showPage(
                            button.dataset.page
                        );
                    }
                );
            }
        );
}


function showPage(pageName) {

    const pages =
        document.querySelectorAll(
            ".app-page"
        );

    pages.forEach(
        (page) => {

            page.classList
                .remove(
                    "active-page"
                );
        }
    );


    const selectedPage =
        document.getElementById(
            `${pageName}Page`
        );

    if (selectedPage) {

        selectedPage.classList
            .add(
                "active-page"
            );
    }


    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(
        (item) => {

            item.classList
                .remove(
                    "active"
                );

            if (
                item.dataset.page ===
                pageName
            ) {

                item.classList
                    .add(
                        "active"
                    );
            }
        }
    );


    /*
     * Page-specific loading.
     */

    if (
        pageName ===
        "dashboard"
    ) {
        setupDashboard();
    }

     if (
    pageName ===
    "products"
) {
    loadProducts();
}

if (
    pageName ===
    "sales"
) {
    loadSales();
}

if (
    pageName ===
    "customers"
) {
    loadCustomers();
}

if (
    pageName ===
    "receipts"
) {
    loadReceipts();
}

if (
    pageName === 
    "workers"
) {
    loadWorkers();
}

if (
    pageName ===
    "premium"
) {
    loadPremium();
}

if (
    pageName ===
    "settings"
) {
    loadSettings();
}

}


/* =========================
   DASHBOARD
========================= */

function setupDashboard() {

    const greeting =
        document.getElementById(
            "dashboardGreeting"
        );

    const hour =
        new Date()
            .getHours();

    let text;

    if (hour < 12) {

        text =
            "Good morning";

    } else if (hour < 17) {

        text =
            "Good afternoon";

    } else if (hour < 21) {

        text =
            "Good evening";

    } else {

        text =
            "Good night";
    }

    greeting.textContent =
        text;
}


/* =========================
   LOGIN
========================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const identifierInput =
            document.getElementById(
                "loginIdentifier"
            );

        const passwordInput =
            document.getElementById(
                "loginPassword"
            );

        const message =
            document.getElementById(
                "loginMessage"
            );

        const button =
            loginForm.querySelector(
                "button[type='submit']"
            );


        const identifier =
            identifierInput
                ? identifierInput.value.trim()
                : "";

        const password =
            passwordInput
                ? passwordInput.value
                : "";


        console.log(
            "Login attempt:",
            {
                identifier,
                passwordProvided:
                    Boolean(password)
            }
        );


        if (!identifier || !password) {

            message.textContent =
                "Please enter your email/phone and password.";

            return;
        }


        message.textContent =
            "";

        button.disabled =
            true;

        button.textContent =
            "Logging in...";


        try {

            await loginUser(
                identifier,
                password
            );


            showNotification(
                "Login successful."
            );


            showApplication();


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            message.textContent =
                error.message ||
                "Unable to log in.";


            showNotification(
                error.message ||
                "Unable to log in."
            );


        } finally {

            button.disabled =
                false;

            button.textContent =
                "Login";
        }
    }
);


/* =========================
   REGISTER
========================= */

registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const name =
            document.getElementById(
                "registerName"
            )
            .value
            .trim();

        const storeName =
            document.getElementById(
                "registerStoreName"
            )
            .value
            .trim();

        const email =
            document.getElementById(
                "registerEmail"
            )
            .value
            .trim();

        const phone =
            document.getElementById(
                "registerPhone"
            )
            .value
            .trim();

        const password =
            document.getElementById(
                "registerPassword"
            )
            .value;

        const confirmPassword =
            document.getElementById(
                "registerConfirmPassword"
            )
            .value;

        const message =
            document.getElementById(
                "registerMessage"
            );

        const button =
            registerForm.querySelector(
                "button[type='submit']"
            );


        if (
            password !==
            confirmPassword
        ) {

            message.textContent =
                "Passwords do not match.";

            return;
        }


        if (
            password.length < 6
        ) {

            message.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        button.disabled =
            true;

        button.textContent =
            "Creating store...";

        message.textContent =
            "";


        try {

            await registerOwner({
                name,
                storeName,
                email,
                phone,
                password
            });

            showNotification(
                "Store created successfully."
            );

            showApplication();

        } catch (error) {

            message.textContent =
                error.message;

            showNotification(
                error.message
            );

        } finally {

            button.disabled =
                false;

            button.textContent =
                "Create Store";
        }
    }
);


/* =========================
   SWITCH AUTH PAGES
========================= */

showRegisterBtn.addEventListener(
    "click",
    () => {

        showRegisterPage();
    }
);


showLoginBtn.addEventListener(
    "click",
    () => {

        showLoginPage();
    }
);

/* =========================
   FORGOT PASSWORD
========================= */

const forgotPasswordButton =
    document.getElementById(
        "forgotPasswordButton"
    );


const forgotPasswordPage =
    document.getElementById(
        "forgotPasswordPage"
    );


const backToLoginFromForgot =
    document.getElementById(
        "backToLoginFromForgot"
    );

    const backToLoginFromReset =
    document.getElementById(
        "backToLoginFromReset"
    );

    if (backToLoginFromReset) {

    backToLoginFromReset.addEventListener(
        "click",
        () => {

            resetPasswordPage.classList.add(
                "hidden"
            );

            loginPage.classList.remove(
                "hidden"
            );

        }
    );

}

    const verifyOtpPage =
    document.getElementById(
        "verifyOtpPage"
    );


const resetPasswordPage =
    document.getElementById(
        "resetPasswordPage"
    );

if (forgotPasswordButton) {

    forgotPasswordButton.addEventListener(
        "click",
        () => {

            loginPage.classList.add(
                "hidden"
            );

            registerPage.classList.add(
                "hidden"
            );

            forgotPasswordPage.classList.remove(
                "hidden"
            );

        }
    );

}


if (backToLoginFromForgot) {

    backToLoginFromForgot.addEventListener(
        "click",
        () => {

            forgotPasswordPage.classList.add(
                "hidden"
            );

            registerPage.classList.add(
                "hidden"
            );

            loginPage.classList.remove(
                "hidden"
            );

        }
    );

}

/* =========================
   FORGOT PASSWORD - SEND OTP
========================= */

const forgotPasswordForm =
    document.getElementById(
        "forgotPasswordForm"
    );


if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document.getElementById(
                    "forgotPasswordEmail"
                ).value.trim();


            const message =
                document.getElementById(
                    "forgotPasswordMessage"
                );


            const button =
                document.getElementById(
                    "sendResetOtpButton"
                );


            if (!email) {

                message.textContent =
                    "Please enter your email address.";

                return;

            }


            button.disabled = true;

            button.textContent =
                "Sending...";

            message.textContent =
                "";


            try {

                const result =
                    await apiRequest(
                        "/auth/forgot-password",
                        {

                            method: "POST",

                            body:
                                JSON.stringify({
                                    email
                                })

                        }
                    );


                message.textContent =
                    result.message ||
                    "If an account exists with this email, an OTP has been sent.";

                message.classList.add(
                    "success-message"
                );


                /*
 * Open OTP verification page.
 */

forgotPasswordPage.classList.add(
    "hidden"
);

verifyOtpPage.classList.remove(
    "hidden"
);


            } catch (error) {

                console.error(
                    "Forgot password error:",
                    error
                );


                message.textContent =
                    error.message ||
                    "Unable to send OTP.";

                message.classList.remove(
                    "success-message"
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    "Send OTP";

            }

        }
    );

}

/* =========================
   VERIFY OTP
========================= */

const verifyOtpForm =
    document.getElementById(
        "verifyOtpForm"
    );

const resendOtpButton =
    document.getElementById(
        "resendOtpButton"
    );

    if (resendOtpButton) {

    resendOtpButton.addEventListener(
        "click",
        async () => {

            const email =
                document.getElementById(
                    "forgotPasswordEmail"
                ).value.trim();

            const message =
                document.getElementById(
                    "verifyOtpMessage"
                );

            if (!email) {

                message.textContent =
                    "Email address is missing.";

                return;

            }

            resendOtpButton.disabled = true;

            resendOtpButton.textContent =
                "Sending...";

            message.textContent = "";

            try {

                const result =
                    await apiRequest(
                        "/auth/forgot-password",
                        {
                            method: "POST",

                            body:
                                JSON.stringify({
                                    email
                                })
                        }
                    );

                message.textContent =
                    result.message ||
                    "A new OTP has been sent to your email.";

                message.classList.add(
                    "success-message"
                );

            } catch (error) {

                console.error(
                    "Resend OTP error:",
                    error
                );

                message.textContent =
                    error.message ||
                    "Unable to resend OTP.";

                message.classList.remove(
                    "success-message"
                );

            } finally {

                resendOtpButton.disabled =
                    false;

                resendOtpButton.textContent =
                    "Resend OTP";

            }

        }
    );

}

const backToForgotPassword =
    document.getElementById(
        "backToForgotPassword"
    );


if (verifyOtpForm) {

    verifyOtpForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document.getElementById(
                    "forgotPasswordEmail"
                ).value.trim();

            const otp =
                document.getElementById(
                    "resetOtp"
                ).value.trim();

            const message =
                document.getElementById(
                    "verifyOtpMessage"
                );

            const button =
                document.getElementById(
                    "verifyOtpButton"
                );


            if (!email) {

                message.textContent =
                    "Email address is missing.";

                return;

            }


            if (!otp || otp.length !== 6) {

                message.textContent =
                    "Please enter the 6-digit OTP.";

                return;

            }


            button.disabled = true;

            button.textContent =
                "Verifying...";

            message.textContent =
                "";


            try {

                const result =
                    await apiRequest(
                        "/auth/verify-reset-otp",
                        {

                            method: "POST",

                            body:
                                JSON.stringify({
                                    email,
                                    otp
                                })

                        }
                    );


                message.textContent =
    result.message ||
    "OTP verified successfully.";


/*
 * Save the reset token temporarily.
 */

if (result.resetToken) {

    sessionStorage.setItem(
        "passwordResetToken",
        result.resetToken
    );

}


/*
 * Hide OTP page.
 */

verifyOtpPage.classList.add(
    "hidden"
);


/*
 * Show reset password page.
 */

resetPasswordPage.classList.remove(
    "hidden"
);


            } catch (error) {

                console.error(
                    "Verify OTP error:",
                    error
                );


                message.textContent =
                    error.message ||
                    "Invalid or expired OTP.";

            } finally {

                button.disabled = false;

                button.textContent =
                    "Verify OTP";

            }

        }
    );

}

/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener(
    "click",
    () => {

        const confirmed =
            confirm(
                "Are you sure you want to logout?"
            );

        if (!confirmed) {
            return;
        }

        logoutUser();

        showNotification(
            "Logged out successfully."
        );

        setTimeout(
            () => {
                location.reload();
            },
            400
        );
    }
);


/* =========================
   MOBILE MENU
========================= */

menuBtn.addEventListener(
    "click",
    () => {

        sidebar
            .classList
            .toggle("open");
    }
);


/* =========================
   MODAL
========================= */

function openModal(content) {

    modalContent.innerHTML =
        content;

    modalContainer
        .classList
        .remove("hidden");

    document.body.style
        .overflow = "hidden";
}


function closeModal() {

    modalContainer
        .classList
        .add("hidden");

    modalContent.innerHTML =
        "";

    document.body.style
        .overflow = "";
}


modalOverlay.addEventListener(
    "click",
    closeModal
);


/* =========================
   NOTIFICATIONS
========================= */

let notificationTimer;

function showNotification(
    message
) {

    clearTimeout(
        notificationTimer
    );

    notification.textContent =
        message;

    notification.classList
        .add("show");

    notificationTimer =
        setTimeout(
            () => {

                notification.classList
                    .remove("show");

            },
            3000
        );
}


/* =========================
   GLOBAL ACCESS
========================= */

/* =========================
   PRODUCTS
========================= */

async function loadProducts() {

    if (!productsList) {
        return;
    }

    productsList.innerHTML = `
        <div class="empty-state">
            Loading products...
        </div>
    `;

    try {

        const result =
            await apiRequest(
                "/products",
                {
                    method: "GET"
                }
            );


        products =
            result.products || [];


        renderProducts();

        updateProductCount();

    } catch (error) {

        console.error(
            "Load products error:",
            error
        );


        productsList.innerHTML = `
            <div class="empty-state">
                Unable to load products.
            </div>
        `;

    }
}


/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts(
    searchTerm = ""
) {

    if (!productsList) {
        return;
    }


    const search =
        searchTerm
            .trim()
            .toLowerCase();


    const filteredProducts =
        products.filter(
            (product) => {

                if (!search) {
                    return true;
                }


                return (

                    product.name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    product.code
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    product.category
                        ?.toLowerCase()
                        .includes(search)

                );

            }
        );


    if (
        filteredProducts.length === 0
    ) {

        productsList.innerHTML = `
            <div class="empty-state">
                ${
                    search
                        ? "No products found."
                        : "No products yet. Add your first product."
                }
            </div>
        `;

        return;
    }


    productsList.innerHTML =
        filteredProducts
            .map(
                (product) => {

                    let stockClass =
                        "in-stock";

                    let stockText =
                        "In Stock";


                    if (
                        product.quantity <= 0
                    ) {

                        stockClass =
                            "out-of-stock";

                        stockText =
                            "Out of Stock";

                    } else if (
                        product.quantity <=
                        product.minimumStock
                    ) {

                        stockClass =
                            "low-stock";

                        stockText =
                            "Low Stock";
                    }


                    return `

                        <div
                            class="data-card product-card"
                            data-product-id="${product._id}"
                        >

                            <div class="data-card-main">

                                <div class="data-card-info">

                                    <h3>
                                        ${escapeHtml(
                                            product.name
                                        )}
                                    </h3>

                                    <p>
                                        ${
                                            product.category
                                                ? escapeHtml(
                                                    product.category
                                                )
                                                : "No category"
                                        }
                                    </p>

                                    ${
                                        product.code
                                            ? `
                                                <small>
                                                    Code:
                                                    ${escapeHtml(
                                                        product.code
                                                    )}
                                                </small>
                                            `
                                            : ""
                                    }

                                </div>


                                <div class="product-stock">

                                    <strong>
                                        ${formatNumber(
                                            product.quantity
                                        )}
                                    </strong>

                                    <span>
                                        ${stockText}
                                    </span>

                                </div>

                            </div>


                            <div class="product-details">

                                <div>

                                    <span>
                                        Buying Price
                                    </span>

                                    <strong>
                                        ${formatCurrency(
                                            product.buyingPrice
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Selling Price
                                    </span>

                                    <strong>
                                        ${formatCurrency(
                                            product.sellingPrice
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Stock
                                    </span>

                                    <strong
                                        class="${stockClass}"
                                    >
                                        ${formatNumber(
                                            product.quantity
                                        )}
                                    </strong>

                                </div>

                            </div>


                            <div class="data-card-actions">

                                <button
                                    type="button"
                                    class="secondary-btn"
                                    onclick="window.blaizApp.editProduct('${product._id}')"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="secondary-btn"
                                    onclick="window.blaizApp.adjustProductStock('${product._id}')"
                                >
                                    Stock
                                </button>


                                <button
                                    type="button"
                                    class="danger-btn"
                                    onclick="window.blaizApp.deleteProduct('${product._id}')"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================
   ADD PRODUCT
========================= */

function openAddProductModal() {

    openModal(`

        <div class="modal-header">

            <h2>
                Add Product
            </h2>

            <button
                type="button"
                class="modal-close"
                onclick="window.blaizApp.closeModal()"
            >
                ×
            </button>

        </div>


        <form
            id="productForm"
            class="modal-form"
        >

            <div class="input-group">

                <label>
                    Product Name
                </label>

                <input
                    type="text"
                    id="productName"
                    placeholder="Enter product name"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Product Code / SKU
                </label>

                <input
                    type="text"
                    id="productCode"
                    placeholder="Optional"
                >

            </div>


            <div class="input-group">

                <label>
                    Category
                </label>

                <input
                    type="text"
                    id="productCategory"
                    placeholder="e.g. Drinks"
                >

            </div>


            <div class="input-group">

                <label>
                    Buying Price
                </label>

                <input
                    type="number"
                    id="productBuyingPrice"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Selling Price
                </label>

                <input
                    type="number"
                    id="productSellingPrice"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Quantity
                </label>

                <input
                    type="number"
                    id="productQuantity"
                    min="0"
                    step="1"
                    placeholder="0"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Minimum Stock Alert
                </label>

                <input
                    type="number"
                    id="productMinimumStock"
                    min="0"
                    step="1"
                    value="5"
                >

            </div>


            <div class="input-group">

                <label>
                    Description
                </label>

                <textarea
                    id="productDescription"
                    placeholder="Optional product description"
                ></textarea>

            </div>


            <p
                id="productFormMessage"
                class="form-message"
            ></p>


            <button
                type="submit"
                class="primary-btn"
            >
                Add Product
            </button>

        </form>

    `);


    const form =
        document.getElementById(
            "productForm"
        );


    form.addEventListener(
        "submit",
        handleAddProduct
    );

}


/* =========================
   HANDLE ADD PRODUCT
========================= */

async function handleAddProduct(
    event
) {

    event.preventDefault();


    const form =
        event.target;


    const message =
        document.getElementById(
            "productFormMessage"
        );


    const button =
        form.querySelector(
            "button[type='submit']"
        );


    const productData = {

        name:
            document.getElementById(
                "productName"
            ).value.trim(),

        code:
            document.getElementById(
                "productCode"
            ).value.trim(),

        category:
            document.getElementById(
                "productCategory"
            ).value.trim(),

        buyingPrice:
            Number(
                document.getElementById(
                    "productBuyingPrice"
                ).value
            ),

        sellingPrice:
            Number(
                document.getElementById(
                    "productSellingPrice"
                ).value
            ),

        quantity:
            Number(
                document.getElementById(
                    "productQuantity"
                ).value
            ),

        minimumStock:
            Number(
                document.getElementById(
                    "productMinimumStock"
                ).value || 5
            ),

        description:
            document.getElementById(
                "productDescription"
            ).value.trim(),

    };


    button.disabled =
        true;

    button.textContent =
        "Adding...";


    message.textContent =
        "";


    try {

        const result =
            await apiRequest(
                "/products",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            productData
                        )
                }
            );


        showNotification(
            result.message ||
            "Product added successfully."
        );


        closeModal();


        await loadProducts();


    } catch (error) {

        console.error(
            "Add product error:",
            error
        );


        message.textContent =
            error.message ||
            "Unable to add product.";


    } finally {

        button.disabled =
            false;

        button.textContent =
            "Add Product";

    }

}


/* =========================
   EDIT PRODUCT
========================= */

async function editProduct(
    productId
) {

    const product =
        products.find(
            (item) =>
                item._id === productId
        );


    if (!product) {

        showNotification(
            "Product not found."
        );

        return;
    }


    openModal(`

        <div class="modal-header">

            <h2>
                Edit Product
            </h2>

            <button
                type="button"
                class="modal-close"
                onclick="window.blaizApp.closeModal()"
            >
                ×
            </button>

        </div>


        <form
            id="editProductForm"
            class="modal-form"
        >

            <div class="input-group">

                <label>
                    Product Name
                </label>

                <input
                    type="text"
                    id="editProductName"
                    value="${escapeAttribute(
                        product.name
                    )}"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Product Code / SKU
                </label>

                <input
                    type="text"
                    id="editProductCode"
                    value="${escapeAttribute(
                        product.code || ""
                    )}"
                >

            </div>


            <div class="input-group">

                <label>
                    Category
                </label>

                <input
                    type="text"
                    id="editProductCategory"
                    value="${escapeAttribute(
                        product.category || ""
                    )}"
                >

            </div>


            <div class="input-group">

                <label>
                    Buying Price
                </label>

                <input
                    type="number"
                    id="editProductBuyingPrice"
                    min="0"
                    step="0.01"
                    value="${product.buyingPrice}"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Selling Price
                </label>

                <input
                    type="number"
                    id="editProductSellingPrice"
                    min="0"
                    step="0.01"
                    value="${product.sellingPrice}"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Quantity
                </label>

                <input
                    type="number"
                    id="editProductQuantity"
                    min="0"
                    step="1"
                    value="${product.quantity}"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Minimum Stock Alert
                </label>

                <input
                    type="number"
                    id="editProductMinimumStock"
                    min="0"
                    value="${product.minimumStock}"
                >

            </div>


            <div class="input-group">

                <label>
                    Description
                </label>

                <textarea
                    id="editProductDescription"
                >${escapeHtml(
                    product.description || ""
                )}</textarea>

            </div>


            <p
                id="editProductMessage"
                class="form-message"
            ></p>


            <button
                type="submit"
                class="primary-btn"
            >
                Save Changes
            </button>

        </form>

    `);


    const form =
        document.getElementById(
            "editProductForm"
        );


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "editProductMessage"
                );


            const button =
                form.querySelector(
                    "button[type='submit']"
                );


            button.disabled =
                true;

            button.textContent =
                "Saving...";


            try {

                const result =
                    await apiRequest(
                        `/products/${productId}`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify({

                                    name:
                                        document.getElementById(
                                            "editProductName"
                                        ).value.trim(),

                                    code:
                                        document.getElementById(
                                            "editProductCode"
                                        ).value.trim(),

                                    category:
                                        document.getElementById(
                                            "editProductCategory"
                                        ).value.trim(),

                                    buyingPrice:
                                        Number(
                                            document.getElementById(
                                                "editProductBuyingPrice"
                                            ).value
                                        ),

                                    sellingPrice:
                                        Number(
                                            document.getElementById(
                                                "editProductSellingPrice"
                                            ).value
                                        ),

                                    quantity:
                                        Number(
                                            document.getElementById(
                                                "editProductQuantity"
                                            ).value
                                        ),

                                    minimumStock:
                                        Number(
                                            document.getElementById(
                                                "editProductMinimumStock"
                                            ).value
                                        ),

                                    description:
                                        document.getElementById(
                                            "editProductDescription"
                                        ).value.trim(),

                                })
                        }
                    );


                showNotification(
                    result.message ||
                    "Product updated successfully."
                );


                closeModal();


                await loadProducts();


            } catch (error) {

                console.error(
                    "Update product error:",
                    error
                );


                message.textContent =
                    error.message ||
                    "Unable to update product.";


            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "Save Changes";

            }

        }
    );

}


/* =========================
   DELETE PRODUCT
========================= */

async function deleteProduct(
    productId
) {

    const product =
        products.find(
            (item) =>
                item._id === productId
        );


    const productName =
        product
            ? product.name
            : "this product";


    const confirmed =
        confirm(
            `Are you sure you want to delete "${productName}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await apiRequest(
                `/products/${productId}`,
                {
                    method: "DELETE"
                }
            );


        showNotification(
            result.message ||
            "Product deleted successfully."
        );


        await loadProducts();


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to delete product."
        );

    }

}


/* =========================
   STOCK ADJUSTMENT
========================= */

function adjustProductStock(
    productId
) {

    const product =
        products.find(
            (item) =>
                item._id === productId
        );


    if (!product) {
        return;
    }


    openModal(`

        <div class="modal-header">

            <h2>
                Adjust Stock
            </h2>

            <button
                type="button"
                class="modal-close"
                onclick="window.blaizApp.closeModal()"
            >
                ×
            </button>

        </div>


        <div class="stock-product-name">

            <strong>
                ${escapeHtml(
                    product.name
                )}
            </strong>

            <span>
                Current stock:
                ${formatNumber(
                    product.quantity
                )}
            </span>

        </div>


        <form
            id="stockForm"
            class="modal-form"
        >

            <div class="input-group">

                <label>
                    Action
                </label>

                <select id="stockType">

                    <option value="add">
                        Add Stock
                    </option>

                    <option value="remove">
                        Remove Stock
                    </option>

                </select>

            </div>


            <div class="input-group">

                <label>
                    Quantity
                </label>

                <input
                    type="number"
                    id="stockQuantity"
                    min="1"
                    step="1"
                    required
                >

            </div>


            <p
                id="stockMessage"
                class="form-message"
            ></p>


            <button
                type="submit"
                class="primary-btn"
            >
                Update Stock
            </button>

        </form>

    `);


    const form =
        document.getElementById(
            "stockForm"
        );


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "stockMessage"
                );


            const button =
                form.querySelector(
                    "button[type='submit']"
                );


            button.disabled =
                true;

            button.textContent =
                "Updating...";


            try {

                const result =
                    await apiRequest(
                        `/products/${productId}/stock`,
                        {
                            method: "PATCH",

                            body:
                                JSON.stringify({

                                    quantity:
                                        Number(
                                            document.getElementById(
                                                "stockQuantity"
                                            ).value
                                        ),

                                    type:
                                        document.getElementById(
                                            "stockType"
                                        ).value,

                                })
                        }
                    );


                showNotification(
                    result.message ||
                    "Stock updated successfully."
                );


                closeModal();


                await loadProducts();


            } catch (error) {

                console.error(
                    "Stock adjustment error:",
                    error
                );


                message.textContent =
                    error.message ||
                    "Unable to update stock.";


            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "Update Stock";

            }

        }
    );

}


/* =========================
   SEARCH
========================= */

if (productSearch) {

    productSearch.addEventListener(
        "input",
        () => {

            renderProducts(
                productSearch.value
            );

        }
    );

}


/* =========================
   ADD PRODUCT BUTTON
========================= */

if (addProductBtn) {

    addProductBtn.addEventListener(
        "click",
        () => {

            openAddProductModal();

        }
    );

}


/* =========================
   LOAD PRODUCTS WHEN PAGE OPENS
========================= */



/* =========================
   DASHBOARD PRODUCT COUNT
========================= */

function updateProductCount() {

    const countElement =
        document.getElementById(
            "productCount"
        );


    if (countElement) {

        countElement.textContent =
            products.length;

    }

}


/* =========================
   FORMATTING HELPERS
========================= */

function formatCurrency(
    amount
) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 2
        }
    ).format(
        Number(amount || 0)
    );

}


function formatNumber(
    number
) {

    return new Intl.NumberFormat(
        "en-NG"
    ).format(
        Number(number || 0)
    );

}


/* =========================
   HTML SAFETY
========================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}

/* =========================
   CUSTOMERS
========================= */

const addCustomerBtn =
    document.getElementById(
        "addCustomerBtn"
    );

const customerSearch =
    document.getElementById(
        "customerSearch"
    );

const customersList =
    document.getElementById(
        "customersList"
    );


/* =========================
   LOAD CUSTOMERS
========================= */

async function loadCustomers() {

    if (!customersList) {
        return;
    }

    customersList.innerHTML = `
        <div class="empty-state">
            Loading customers...
        </div>
    `;

    try {

        const result =
            await apiRequest(
                "/customers",
                {
                    method: "GET"
                }
            );

        customers =
            result.customers || [];

        renderCustomers();

        updateCustomerCount();

    } catch (error) {

        console.error(
            "Load customers error:",
            error
        );

        customersList.innerHTML = `
            <div class="empty-state">
                Unable to load customers.
            </div>
        `;

    }

}


/* =========================
   RENDER CUSTOMERS
========================= */

function renderCustomers(
    searchTerm = ""
) {

    if (!customersList) {
        return;
    }

    const search =
        searchTerm
            .trim()
            .toLowerCase();


    const filteredCustomers =
        customers.filter(
            (customer) => {

                if (!search) {
                    return true;
                }

                return (

                    customer.name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    customer.phone
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    customer.email
                        ?.toLowerCase()
                        .includes(search)

                );

            }
        );


    if (
        filteredCustomers.length === 0
    ) {

        customersList.innerHTML = `
            <div class="empty-state">
                ${
                    search
                        ? "No customers found."
                        : "No customers yet. Add your first customer."
                }
            </div>
        `;

        return;
    }


    customersList.innerHTML =
        filteredCustomers
            .map(
                (customer) => {

                    const debt =
                        Number(
                            customer.outstandingDebt ||
                            0
                        );


                    return `

                        <div
                            class="data-card customer-card"
                            data-customer-id="${customer._id}"
                        >

                            <div class="data-card-main">

                                <div class="data-card-info">

                                    <h3>
                                        ${escapeHtml(
                                            customer.name
                                        )}
                                    </h3>


                                    ${
                                        customer.phone
                                            ? `
                                                <p>
                                                    📞
                                                    ${escapeHtml(
                                                        customer.phone
                                                    )}
                                                </p>
                                            `
                                            : ""
                                    }


                                    ${
                                        customer.email
                                            ? `
                                                <p>
                                                    ✉️
                                                    ${escapeHtml(
                                                        customer.email
                                                    )}
                                                </p>
                                            `
                                            : ""
                                    }


                                    ${
                                        customer.address
                                            ? `
                                                <small>
                                                    ${escapeHtml(
                                                        customer.address
                                                    )}
                                                </small>
                                            `
                                            : ""
                                    }

                                </div>


                                <div class="product-stock">

                                    <strong>
                                        ${formatCurrency(
                                            customer.totalPurchases
                                        )}
                                    </strong>

                                    <span>
                                        Total Purchases
                                    </span>

                                </div>

                            </div>


                            <div class="product-details">

                                <div>

                                    <span>
                                        Total Purchases
                                    </span>

                                    <strong>
                                        ${formatCurrency(
                                            customer.totalPurchases
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Total Paid
                                    </span>

                                    <strong>
                                        ${formatCurrency(
                                            customer.totalPaid
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Outstanding
                                    </span>

                                    <strong
                                        class="${
                                            debt > 0
                                                ? "low-stock"
                                                : "in-stock"
                                        }"
                                    >
                                        ${formatCurrency(
                                            debt
                                        )}
                                    </strong>

                                </div>

                            </div>


                            <div class="data-card-actions">

                                <button
                                    type="button"
                                    class="secondary-btn"
                                    onclick="window.blaizApp.editCustomer('${customer._id}')"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="danger-btn"
                                    onclick="window.blaizApp.deleteCustomer('${customer._id}')"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================
   ADD CUSTOMER MODAL
========================= */

function openAddCustomerModal() {

    openModal(`

        <div class="modal-header">

            <h2>
                Add Customer
            </h2>


            <button
                type="button"
                class="modal-close"
                onclick="window.blaizApp.closeModal()"
            >
                ×
            </button>

        </div>


        <form
            id="customerForm"
            class="modal-form"
        >

            <div class="input-group">

                <label>
                    Customer Name
                </label>

                <input
                    type="text"
                    id="customerName"
                    placeholder="Enter customer name"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Phone Number
                </label>

                <input
                    type="tel"
                    id="customerPhone"
                    placeholder="Enter phone number"
                >

            </div>


            <div class="input-group">

                <label>
                    Email
                </label>

                <input
                    type="email"
                    id="customerEmail"
                    placeholder="Enter email address"
                >

            </div>


            <div class="input-group">

                <label>
                    Address
                </label>

                <textarea
                    id="customerAddress"
                    placeholder="Enter customer address"
                ></textarea>

            </div>


            <p
                id="customerFormMessage"
                class="form-message"
            ></p>


            <button
                type="submit"
                class="primary-btn"
            >
                Add Customer
            </button>

        </form>

    `);


    const form =
        document.getElementById(
            "customerForm"
        );


    form.addEventListener(
        "submit",
        handleAddCustomer
    );

}


/* =========================
   HANDLE ADD CUSTOMER
========================= */

async function handleAddCustomer(
    event
) {

    event.preventDefault();


    const form =
        event.target;


    const message =
        document.getElementById(
            "customerFormMessage"
        );


    const button =
        form.querySelector(
            "button[type='submit']"
        );


    const customerData = {

        name:
            document.getElementById(
                "customerName"
            ).value.trim(),

        phone:
            document.getElementById(
                "customerPhone"
            ).value.trim(),

        email:
            document.getElementById(
                "customerEmail"
            ).value.trim(),

        address:
            document.getElementById(
                "customerAddress"
            ).value.trim()

    };


    if (!customerData.name) {

        message.textContent =
            "Customer name is required.";

        return;
    }


    button.disabled =
        true;

    button.textContent =
        "Adding...";

    message.textContent =
        "";


    try {

        const result =
            await apiRequest(
                "/customers",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            customerData
                        )
                }
            );


        showNotification(
            result.message ||
            "Customer added successfully."
        );


        closeModal();


        await loadCustomers();


    } catch (error) {

        console.error(
            "Add customer error:",
            error
        );


        message.textContent =
            error.message ||
            "Unable to add customer.";

    } finally {

        button.disabled =
            false;

        button.textContent =
            "Add Customer";

    }

}


/* =========================
   EDIT CUSTOMER
========================= */

function editCustomer(
    customerId
) {

    const customer =
        customers.find(
            (item) =>
                item._id === customerId
        );


    if (!customer) {

        showNotification(
            "Customer not found."
        );

        return;
    }


    openModal(`

        <div class="modal-header">

            <h2>
                Edit Customer
            </h2>


            <button
                type="button"
                class="modal-close"
                onclick="window.blaizApp.closeModal()"
            >
                ×
            </button>

        </div>


        <form
            id="editCustomerForm"
            class="modal-form"
        >

            <div class="input-group">

                <label>
                    Customer Name
                </label>

                <input
                    type="text"
                    id="editCustomerName"
                    value="${escapeAttribute(
                        customer.name
                    )}"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Phone Number
                </label>

                <input
                    type="tel"
                    id="editCustomerPhone"
                    value="${escapeAttribute(
                        customer.phone || ""
                    )}"
                >

            </div>


            <div class="input-group">

                <label>
                    Email
                </label>

                <input
                    type="email"
                    id="editCustomerEmail"
                    value="${escapeAttribute(
                        customer.email || ""
                    )}"
                >

            </div>


            <div class="input-group">

                <label>
                    Address
                </label>

                <textarea
                    id="editCustomerAddress"
                >${escapeHtml(
                    customer.address || ""
                )}</textarea>

            </div>


            <p
                id="editCustomerMessage"
                class="form-message"
            ></p>


            <button
                type="submit"
                class="primary-btn"
            >
                Save Changes
            </button>

        </form>

    `);


    const form =
        document.getElementById(
            "editCustomerForm"
        );


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "editCustomerMessage"
                );


            const button =
                form.querySelector(
                    "button[type='submit']"
                );


            button.disabled =
                true;

            button.textContent =
                "Saving...";

            message.textContent =
                "";


            try {

                const result =
                    await apiRequest(
                        `/customers/${customerId}`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify({

                                    name:
                                        document.getElementById(
                                            "editCustomerName"
                                        ).value.trim(),

                                    phone:
                                        document.getElementById(
                                            "editCustomerPhone"
                                        ).value.trim(),

                                    email:
                                        document.getElementById(
                                            "editCustomerEmail"
                                        ).value.trim(),

                                    address:
                                        document.getElementById(
                                            "editCustomerAddress"
                                        ).value.trim()

                                })
                        }
                    );


                showNotification(
                    result.message ||
                    "Customer updated successfully."
                );


                closeModal();


                await loadCustomers();


            } catch (error) {

                console.error(
                    "Update customer error:",
                    error
                );


                message.textContent =
                    error.message ||
                    "Unable to update customer.";

            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "Save Changes";

            }

        }
    );

}


/* =========================
   DELETE CUSTOMER
========================= */

async function deleteCustomer(
    customerId
) {

    const customer =
        customers.find(
            (item) =>
                item._id === customerId
        );


    const customerName =
        customer
            ? customer.name
            : "this customer";


    const confirmed =
        confirm(
            `Are you sure you want to delete "${customerName}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await apiRequest(
                `/customers/${customerId}`,
                {
                    method: "DELETE"
                }
            );


        showNotification(
            result.message ||
            "Customer deleted successfully."
        );


        await loadCustomers();


    } catch (error) {

        console.error(
            "Delete customer error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to delete customer."
        );

    }

}


/* =========================
   CUSTOMER SEARCH
========================= */

if (customerSearch) {

    customerSearch.addEventListener(
        "input",
        () => {

            renderCustomers(
                customerSearch.value
            );

        }
    );

}


/* =========================
   ADD CUSTOMER BUTTON
========================= */

if (addCustomerBtn) {

    addCustomerBtn.addEventListener(
        "click",
        () => {

            openAddCustomerModal();

        }
    );

}


/* =========================
   DASHBOARD CUSTOMER COUNT
========================= */

function updateCustomerCount() {

    const countElement =
        document.getElementById(
            "customerCount"
        );


    if (countElement) {

        countElement.textContent =
            customers.length;

    }

}
/* =========================
   SALES
========================= */

async function loadSales() {

    const salesList =
        document.getElementById("salesList");

    if (!salesList) {
        return;
    }

    salesList.innerHTML = `
        <div class="empty-state">
            Loading sales...
        </div>
    `;

    try {

        const result =
            await apiRequest(
                "/sales",
                {
                    method: "GET"
                }
            );

        sales =
            result.sales || [];

        renderSales();

        updateSalesCount();
        updateRevenue();

        renderRecentSales();

    } catch (error) {

        console.error(
            "Load sales error:",
            error
        );

        salesList.innerHTML = `
            <div class="empty-state">
                Unable to load sales.
            </div>
        `;

    }

}


/* =========================
   RENDER SALES
========================= */

function renderSales() {

    const salesList =
        document.getElementById(
            "salesList"
        );

    if (!salesList) {
        return;
    }


    if (!sales || sales.length === 0) {

        salesList.innerHTML = `
            <div class="empty-state">
                No sales yet. Record your first sale.
            </div>
        `;

        return;
    }


    salesList.innerHTML =
        sales.map(
            (sale) => {

                const total =
                    Number(
                        sale.totalAmount || 0
                    );

                const paid =
                    Number(
                        sale.amountPaid || 0
                    );

                const debt =
                    Number(
                        sale.debt || 0
                    );

                const itemCount =
                    sale.items
                        ? sale.items.length
                        : 0;

                const date =
                    sale.createdAt
                        ? new Date(
                            sale.createdAt
                        ).toLocaleString()
                        : "Unknown date";


                return `

                    <div
                        class="data-card"
                        data-sale-id="${sale._id}"
                    >

                        <div class="data-card-main">

                            <div class="data-card-info">

                                <h3>
                                    ${escapeHtml(
                                        sale.customerName ||
                                        "Walk-in Customer"
                                    )}
                                </h3>

                                <p>
                                    Receipt:
                                    <strong>
                                        ${escapeHtml(
                                            sale.receiptNumber ||
                                            "Not available"
                                        )}
                                    </strong>
                                </p>

                                <p>
                                    ${itemCount}
                                    ${itemCount === 1
                                        ? "product"
                                        : "products"}
                                </p>

                                <small>
                                    ${escapeHtml(date)}
                                </small>

                            </div>


                            <div class="product-stock">

                                <strong>
                                    ${formatCurrency(total)}
                                </strong>

                                <span>
                                    Total
                                </span>

                            </div>

                        </div>


                        <div class="product-details">

                            <div>

                                <span>
                                    Amount Paid
                                </span>

                                <strong>
                                    ${formatCurrency(paid)}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Outstanding
                                </span>

                                <strong
                                    class="${
                                        debt > 0
                                            ? "low-stock"
                                            : "in-stock"
                                    }"
                                >
                                    ${formatCurrency(debt)}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Payment
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        formatPaymentMethod(
                                            sale.paymentMethod
                                        )
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="data-card-actions">

                            <button
                                type="button"
                                class="secondary-btn"
                                onclick="window.blaizApp.viewSale('${sale._id}')"
                            >
                                View
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================
   FORMAT PAYMENT METHOD
========================= */

function formatPaymentMethod(
    method
) {

    const methods = {

        cash: "Cash",

        transfer: "Transfer",

        pos: "POS",

        other: "Other"

    };

    return (
        methods[method] ||
        "Cash"
    );

}


/* =========================
   UPDATE SALES COUNT
========================= */

function updateSalesCount() {

    const countElement =
        document.getElementById(
            "salesCount"
        );

    if (!countElement) {
        return;
    }

    countElement.textContent =
        sales.length;

}


/* =========================
   UPDATE REVENUE
========================= */

function updateRevenue() {

    const revenueElement =
        document.getElementById(
            "revenueAmount"
        );

    if (!revenueElement) {
        return;
    }


    const revenue =
        sales.reduce(
            (total, sale) => {

                return (
                    total +
                    Number(
                        sale.totalAmount || 0
                    )
                );

            },
            0
        );


    revenueElement.textContent =
        formatCurrency(revenue);

}


/* =========================
   RECENT SALES
========================= */

function renderRecentSales() {

    const recentSales =
        document.getElementById(
            "recentSales"
        );

    if (!recentSales) {
        return;
    }


    if (
        !sales ||
        sales.length === 0
    ) {

        recentSales.innerHTML = `
            <p class="empty-state">
                No sales yet.
            </p>
        `;

        return;
    }


    const recent =
        sales.slice(0, 5);


    recentSales.innerHTML =
        recent.map(
            (sale) => {

                return `

                    <div class="recent-sale-item">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    sale.customerName ||
                                    "Walk-in Customer"
                                )}
                            </strong>

                            <small>
                                ${
                                    sale.receiptNumber ||
                                    ""
                                }
                            </small>

                        </div>


                        <strong>
                            ${formatCurrency(
                                Number(
                                    sale.totalAmount ||
                                    0
                                )
                            )}
                        </strong>

                    </div>

                `;

            }
        ).join("");

}


/* =========================
   NEW SALE BUTTON
========================= */

const newSaleBtn =
    document.getElementById(
        "newSaleBtn"
    );


if (newSaleBtn) {

    newSaleBtn.addEventListener(
        "click",
        () => {

            openNewSaleModal();

        }
    );

}


/* =========================
   OPEN NEW SALE MODAL
========================= */

function openNewSaleModal() {

    if (
        !products ||
        products.length === 0
    ) {

        showNotification(
            "You need to add at least one product before recording a sale."
        );

        return;

    }


    const availableProducts =
        products.filter(
            (product) =>
                Number(
                    product.quantity || 0
                ) > 0
        );


    if (
        availableProducts.length === 0
    ) {

        showNotification(
            "There are no products with available stock."
        );

        return;

    }


    const productOptions =
        availableProducts.map(
            (product) => {

                return `

                    <option
                        value="${product._id}"
                    >
                        ${escapeHtml(
                            product.name
                        )}
                        —
                        ${formatCurrency(
                            Number(
                                product.sellingPrice || 0
                            )
                        )}
                        —
                        Stock:
                        ${Number(
                            product.quantity || 0
                        )}
                    </option>

                `;

            }
        ).join("");


    const customerOptions =
        (customers || []).map(
            (customer) => {

                return `

                    <option
                        value="${customer._id}"
                    >
                        ${escapeHtml(
                            customer.name
                        )}
                        ${
                            customer.phone
                                ? ` - ${escapeHtml(
                                    customer.phone
                                )}`
                                : ""
                        }
                    </option>

                `;

            }
        ).join("");


    openModal(`

        <div class="modal-header">

            <h2>
                Record Sale
            </h2>


            <button
                type="button"
                class="modal-close"
                onclick="window.blaizApp.closeModal()"
            >
                ×
            </button>

        </div>


        <form
            id="saleForm"
            class="modal-form"
        >

            <div class="input-group">

                <label>
                    Customer
                </label>

                <select
                    id="saleCustomer"
                >

                    <option value="">
                        Walk-in Customer
                    </option>

                    ${customerOptions}

                </select>

            </div>


            <div
                id="saleItemsContainer"
            >

                <div
                    class="sale-item-row"
                    data-row="1"
                >

                    <div class="input-group">

                        <label>
                            Product
                        </label>

                        <select
                            class="sale-product"
                            required
                        >

                            <option value="">
                                Select product
                            </option>

                            ${productOptions}

                        </select>

                    </div>


                    <div class="input-group">

                        <label>
                            Quantity
                        </label>

                        <input
                            type="number"
                            class="sale-quantity"
                            min="1"
                            value="1"
                            required
                        >

                    </div>


                    <div class="sale-item-total">
                        ₦0
                    </div>

                </div>

            </div>


            <button
                type="button"
                id="addSaleItemBtn"
                class="secondary-btn"
            >
                + Add Another Product
            </button>


            <div class="input-group">

                <label>
                    Discount
                </label>

                <input
                    type="number"
                    id="saleDiscount"
                    min="0"
                    value="0"
                    placeholder="Enter discount"
                >

            </div>


            <div class="sale-summary">

                <div>

                    <span>
                        Subtotal
                    </span>

                    <strong
                        id="saleSubtotal"
                    >
                        ₦0
                    </strong>

                </div>


                <div>

                    <span>
                        Discount
                    </span>

                    <strong
                        id="saleDiscountDisplay"
                    >
                        ₦0
                    </strong>

                </div>


                <div>

                    <span>
                        Total
                    </span>

                    <strong
                        id="saleTotal"
                    >
                        ₦0
                    </strong>

                </div>

            </div>


            <div class="input-group">

                <label>
                    Amount Paid
                </label>

                <input
                    type="number"
                    id="saleAmountPaid"
                    min="0"
                    value="0"
                    required
                >

            </div>


            <div class="input-group">

                <label>
                    Payment Method
                </label>

                <select
                    id="salePaymentMethod"
                >

                    <option value="cash">
                        Cash
                    </option>

                    <option value="transfer">
                        Transfer
                    </option>

                    <option value="pos">
                        POS
                    </option>

                    <option value="other">
                        Other
                    </option>

                </select>

            </div>


            <div class="sale-summary">

                <div>

                    <span>
                        Outstanding Debt
                    </span>

                    <strong
                        id="saleDebt"
                    >
                        ₦0
                    </strong>

                </div>

            </div>


            <p
                id="saleFormMessage"
                class="form-message"
            ></p>


            <button
                type="submit"
                class="primary-btn"
            >
                Record Sale
            </button>

        </form>

    `);


    setupSaleForm();

}


/* =========================
   SETUP SALE FORM
========================= */

function setupSaleForm() {

    const form =
        document.getElementById(
            "saleForm"
        );

    if (!form) {
        return;
    }


    const itemsContainer =
        document.getElementById(
            "saleItemsContainer"
        );


    const addItemBtn =
        document.getElementById(
            "addSaleItemBtn"
        );


    const discountInput =
        document.getElementById(
            "saleDiscount"
        );


    const amountPaidInput =
        document.getElementById(
            "saleAmountPaid"
        );


    const updateTotals = () => {

        let subtotal = 0;


        const rows =
            itemsContainer.querySelectorAll(
                ".sale-item-row"
            );


        rows.forEach(
            (row) => {

                const productSelect =
                    row.querySelector(
                        ".sale-product"
                    );

                const quantityInput =
                    row.querySelector(
                        ".sale-quantity"
                    );

                const totalElement =
                    row.querySelector(
                        ".sale-item-total"
                    );


                const product =
                    products.find(
                        (item) =>
                            item._id ===
                            productSelect.value
                    );


                const quantity =
                    Number(
                        quantityInput.value || 0
                    );


                let itemTotal = 0;


                if (
                    product &&
                    quantity > 0
                ) {

                    itemTotal =
                        Number(
                            product.sellingPrice ||
                            0
                        ) *
                        quantity;

                }


                subtotal +=
                    itemTotal;


                totalElement.textContent =
                    formatCurrency(
                        itemTotal
                    );

            }
        );


        const discount =
            Number(
                discountInput.value || 0
            );


        const total =
            Math.max(
                0,
                subtotal - discount
            );


        const amountPaid =
            Number(
                amountPaidInput.value || 0
            );


        const debt =
            Math.max(
                0,
                total - amountPaid
            );


        document.getElementById(
            "saleSubtotal"
        ).textContent =
            formatCurrency(
                subtotal
            );


        document.getElementById(
            "saleDiscountDisplay"
        ).textContent =
            formatCurrency(
                discount
            );


        document.getElementById(
            "saleTotal"
        ).textContent =
            formatCurrency(
                total
            );


        document.getElementById(
            "saleDebt"
        ).textContent =
            formatCurrency(
                debt
            );

    };


    const attachRowEvents = (
        row
    ) => {

        const productSelect =
            row.querySelector(
                ".sale-product"
            );

        const quantityInput =
            row.querySelector(
                ".sale-quantity"
            );


        productSelect.addEventListener(
            "change",
            () => {

                const product =
                    products.find(
                        (item) =>
                            item._id ===
                            productSelect.value
                    );


                if (product) {

                    quantityInput.max =
                        product.quantity;

                }


                updateTotals();

            }
        );


        quantityInput.addEventListener(
            "input",
            updateTotals
        );

    };


    const firstRow =
        itemsContainer.querySelector(
            ".sale-item-row"
        );


    attachRowEvents(
        firstRow
    );


    addItemBtn.addEventListener(
        "click",
        () => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "sale-item-row";


            const productOptions =
                products
                    .filter(
                        (product) =>
                            Number(
                                product.quantity || 0
                            ) > 0
                    )
                    .map(
                        (product) => {

                            return `

                                <option
                                    value="${product._id}"
                                >
                                    ${escapeHtml(
                                        product.name
                                    )}
                                    —
                                    ${formatCurrency(
                                        Number(
                                            product.sellingPrice ||
                                            0
                                        )
                                    )}
                                    —
                                    Stock:
                                    ${Number(
                                        product.quantity ||
                                        0
                                    )}
                                </option>

                            `;

                        }
                    )
                    .join("");


            row.innerHTML = `

                <div class="input-group">

                    <label>
                        Product
                    </label>

                    <select
                        class="sale-product"
                        required
                    >

                        <option value="">
                            Select product
                        </option>

                        ${productOptions}

                    </select>

                </div>


                <div class="input-group">

                    <label>
                        Quantity
                    </label>

                    <input
                        type="number"
                        class="sale-quantity"
                        min="1"
                        value="1"
                        required
                    >

                </div>


                <div class="sale-item-total">
                    ₦0
                </div>


                <button
                    type="button"
                    class="danger-btn remove-sale-item"
                >
                    Remove
                </button>

            `;


            itemsContainer.appendChild(
                row
            );


            attachRowEvents(
                row
            );


            row.querySelector(
                ".remove-sale-item"
            ).addEventListener(
                "click",
                () => {

                    row.remove();

                    updateTotals();

                }
            );


            updateTotals();

        }
    );


    discountInput.addEventListener(
        "input",
        updateTotals
    );


    amountPaidInput.addEventListener(
        "input",
        updateTotals
    );


    form.addEventListener(
        "submit",
        handleCreateSale
    );


    updateTotals();

}


/* =========================
   CREATE SALE
========================= */

async function handleCreateSale(
    event
) {

    event.preventDefault();


    const form =
        event.target;


    const message =
        document.getElementById(
            "saleFormMessage"
        );


    const button =
        form.querySelector(
            "button[type='submit']"
        );


    const customerId =
        document.getElementById(
            "saleCustomer"
        ).value;


    const discount =
        Number(
            document.getElementById(
                "saleDiscount"
            ).value || 0
        );


    const amountPaid =
        Number(
            document.getElementById(
                "saleAmountPaid"
            ).value || 0
        );


    const paymentMethod =
        document.getElementById(
            "salePaymentMethod"
        ).value;


    const rows =
        document.querySelectorAll(
            "#saleItemsContainer .sale-item-row"
        );


    const items = [];


    rows.forEach(
        (row) => {

            const productId =
                row.querySelector(
                    ".sale-product"
                ).value;


            const quantity =
                Number(
                    row.querySelector(
                        ".sale-quantity"
                    ).value || 0
                );


            if (
                productId &&
                quantity > 0
            ) {

                items.push({

                    productId,

                    quantity

                });

            }

        }
    );


    if (items.length === 0) {

        message.textContent =
            "Please select at least one product.";

        return;

    }


    if (
        !Number.isFinite(discount) ||
        discount < 0
    ) {

        message.textContent =
            "Please enter a valid discount.";

        return;

    }


    if (
        !Number.isFinite(amountPaid) ||
        amountPaid < 0
    ) {

        message.textContent =
            "Please enter a valid amount paid.";

        return;

    }


    button.disabled =
        true;

    button.textContent =
        "Recording...";

    message.textContent =
        "";


    try {

        const result =
            await apiRequest(
                "/sales",
                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            customerId:
                                customerId ||
                                null,

                            items,

                            discount,

                            amountPaid,

                            paymentMethod

                        })

                }
            );


        showNotification(
            result.message ||
            "Sale recorded successfully."
        );


        closeModal();


        await Promise.all([
            loadProducts(),
            loadCustomers(),
            loadSales()
        ]);


        if (
            result.receiptNumber
        ) {

            showNotification(
                `Sale recorded successfully. Receipt ${result.receiptNumber}`
            );

        }


    } catch (error) {

        console.error(
            "Create sale error:",
            error
        );


        message.textContent =
            error.message ||
            "Unable to record sale.";

    } finally {

        button.disabled =
            false;

        button.textContent =
            "Record Sale";

    }

}


/* =========================
   VIEW SALE
========================= */

async function viewSale(
    saleId
) {

    try {

        const result =
            await apiRequest(
                `/sales/${saleId}`,
                {
                    method: "GET"
                }
            );


        const sale =
            result.sale;


        if (!sale) {

            showNotification(
                "Sale not found."
            );

            return;

        }


        const date =
            sale.createdAt
                ? new Date(
                    sale.createdAt
                ).toLocaleString()
                : "Unknown date";


        const itemsHtml =
            (sale.items || [])
                .map(
                    (item) => {

                        return `

                            <div class="product-details">

                                <div>

                                    <span>
                                        Product
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            item.productName
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Qty
                                    </span>

                                    <strong>
                                        ${Number(
                                            item.quantity
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Total
                                    </span>

                                    <strong>
                                        ${formatCurrency(
                                            Number(
                                                item.total ||
                                                0
                                            )
                                        )}
                                    </strong>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        openModal(`

            <div class="modal-header">

                <h2>
                    Sale Details
                </h2>


                <button
                    type="button"
                    class="modal-close"
                    onclick="window.blaizApp.closeModal()"
                >
                    ×
                </button>

            </div>


            <div class="modal-form">

                <div>

                    <strong>
                        Receipt:
                    </strong>

                    ${escapeHtml(
                        sale.receiptNumber ||
                        "Not available"
                    )}

                </div>


                <div>

                    <strong>
                        Customer:
                    </strong>

                    ${escapeHtml(
                        sale.customerName ||
                        "Walk-in Customer"
                    )}

                </div>


                <div>

                    <strong>
                        Date:
                    </strong>

                    ${escapeHtml(date)}

                </div>


                <div>

                    <strong>
                        Sold By:
                    </strong>

                    ${escapeHtml(
                        sale.soldBy?.name ||
                        "Unknown"
                    )}

                </div>


                <div>

                    <strong>
                        Payment:
                    </strong>

                    ${escapeHtml(
                        formatPaymentMethod(
                            sale.paymentMethod
                        )
                    )}

                </div>


                <hr>


                <h3>
                    Products
                </h3>


                ${itemsHtml}


                <hr>


                <div class="product-details">

                    <div>

                        <span>
                            Subtotal
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    sale.subtotal ||
                                    0
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Discount
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    sale.discount ||
                                    0
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Total
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    sale.totalAmount ||
                                    0
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Paid
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    sale.amountPaid ||
                                    0
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Debt
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    sale.debt ||
                                    0
                                )
                            )}
                        </strong>

                    </div>

                </div>

            </div>

        `);


    } catch (error) {

        console.error(
            "View sale error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to load sale."
        );

    }

}

/* =========================
   VIEW RECEIPT
========================= */

async function viewReceipt(
    receiptNumber
) {

    try {

        const result =
            await apiRequest(
                `/receipts/${receiptNumber}`,
                {
                    method: "GET"
                }
            );


        const receipt =
            result.receipt;


        if (!receipt) {

            showNotification(
                "Receipt not found."
            );

            return;

        }


        const itemsHtml =
            (receipt.items || [])
                .map(
                    (item) => {

                        return `

                            <div class="product-details">

                                <div>

                                    <span>
                                        Product
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            item.productName ||
                                            "Unknown Product"
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Quantity
                                    </span>

                                    <strong>
                                        ${Number(
                                            item.quantity || 0
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Total
                                    </span>

                                    <strong>
                                        ${formatCurrency(
                                            Number(
                                                item.total || 0
                                            )
                                        )}
                                    </strong>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        const date =
            receipt.date
                ? new Date(
                    receipt.date
                ).toLocaleString(
                    "en-NG"
                )
                : "Unknown date";


        openModal(`

            <div class="modal-header">

                <h2>
                    Receipt
                </h2>


                <button
                    type="button"
                    class="modal-close"
                    onclick="window.blaizApp.closeModal()"
                >
                    ×
                </button>

            </div>


            <div class="modal-form">

                <div class="stock-product-name">

                    <strong>
                        ${escapeHtml(
                            receipt.store?.name ||
                            "Store"
                        )}
                    </strong>

                    <span>
                        Receipt:
                        ${escapeHtml(
                            receipt.receiptNumber ||
                            "Not available"
                        )}
                    </span>

                </div>


                <p>
                    Customer:
                    <strong>
                        ${escapeHtml(
                            receipt.customer?.name ||
                            "Walk-in Customer"
                        )}
                    </strong>
                </p>


                <p>
                    Date:
                    <strong>
                        ${escapeHtml(date)}
                    </strong>
                </p>


                <hr>


                <h3>
                    Products
                </h3>


                ${itemsHtml}


                <hr>


                <div class="product-details">

                    <div>

                        <span>
                            Subtotal
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.subtotal || 0
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Discount
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.discount || 0
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Total
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.totalAmount || 0
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Amount Paid
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.amountPaid || 0
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Debt
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.debt || 0
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Payment Method
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatPaymentMethod(
                                    receipt.paymentMethod
                                )
                            )}
                        </strong>

                    </div>

                </div>


                ${
                    receipt.soldBy
                        ? `
                            <p>
                                Sold By:
                                <strong>
                                    ${escapeHtml(
                                        receipt.soldBy.name ||
                                        "Unknown"
                                    )}
                                </strong>
                            </p>
                        `
                        : ""
                }


                <button
                    type="button"
                    class="primary-btn"
                    onclick="window.blaizApp.printReceipt('${encodeURIComponent(
                        receipt.receiptNumber
                    )}')"
                >
                    Print Receipt
                </button>

            </div>

        `);

    } catch (error) {

        console.error(
            "View receipt error:",
            error
        );

        showNotification(
            error.message ||
            "Unable to load receipt."
        );

    }

}

/* =========================
   LOAD RECEIPTS
========================= */

async function loadReceipts() {

    const receiptList =
        document.getElementById(
            "receiptList"
        );

    if (!receiptList) {
        return;
    }

    receiptList.innerHTML = `
        <div class="empty-state">
            Loading receipts...
        </div>
    `;

    try {

        const result =
            await apiRequest(
                "/receipts",
                {
                    method: "GET"
                }
            );

        const receipts =
            result.receipts || [];

        renderReceipts(receipts);

    } catch (error) {

        console.error(
            "Load receipts error:",
            error
        );

        receiptList.innerHTML = `
            <div class="empty-state">
                Unable to load receipts.
            </div>
        `;

    }

}

/* =========================
   RENDER RECEIPTS
========================= */

function renderReceipts(receipts) {

    const receiptList =
        document.getElementById(
            "receiptList"
        );

    if (!receiptList) {
        return;
    }

    if (
        !receipts ||
        receipts.length === 0
    ) {

        receiptList.innerHTML = `
            <div class="empty-state">
                No receipts yet.
            </div>
        `;

        return;
    }


    receiptList.innerHTML =
        receipts.map(
            (receipt) => {

                const date =
                    receipt.createdAt
                        ? new Date(
                            receipt.createdAt
                        ).toLocaleString(
                            "en-NG"
                        )
                        : "Unknown date";


                return `

                    <div
                        class="data-card receipt-card"
                    >

                        <div
                            class="data-card-main"
                        >

                            <div
                                class="data-card-info"
                            >

                                <h3>
                                    ${escapeHtml(
                                        receipt.receiptNumber ||
                                        "No receipt number"
                                    )}
                                </h3>

                                <p>
                                    Customer:
                                    ${escapeHtml(
                                        receipt.customerName ||
                                        "Walk-in Customer"
                                    )}
                                </p>

                                <small>
                                    ${escapeHtml(date)}
                                </small>

                            </div>


                            <div
                                class="product-stock"
                            >

                                <strong>
                                    ${formatCurrency(
                                        Number(
                                            receipt.totalAmount ||
                                            0
                                        )
                                    )}
                                </strong>

                                <span>
                                    Total
                                </span>

                            </div>

                        </div>


                        <div
                            class="product-details"
                        >

                            <div>

                                <span>
                                    Paid
                                </span>

                                <strong>
                                    ${formatCurrency(
                                        Number(
                                            receipt.amountPaid ||
                                            0
                                        )
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Debt
                                </span>

                                <strong>
                                    ${formatCurrency(
                                        Number(
                                            receipt.debt ||
                                            0
                                        )
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div
                            class="data-card-actions"
                        >

                            <button
                                type="button"
                                class="secondary-btn"
                                onclick="window.blaizApp.viewReceipt('${encodeURIComponent(
                                    receipt.receiptNumber
                                )}')"
                            >
                                View
                            </button>


                            <button
                                type="button"
                                class="primary-btn"
                                onclick="window.blaizApp.printReceipt('${encodeURIComponent(
                                    receipt.receiptNumber
                                )}')"
                            >
                                Print
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");

}

/* =========================
   VERIFY RECEIPT
========================= */

async function verifyReceipt() {

    const input =
        document.getElementById(
            "verifyReceiptInput"
        );

    const result =
        document.getElementById(
            "receiptVerificationResult"
        );

    if (!input || !result) {
        return;
    }

    let receiptNumber =
        input.value.trim();

    if (!receiptNumber) {

        result.innerHTML = `
            <div class="error-message">
                Please enter a receipt number.
            </div>
        `;

        return;
    }

    result.innerHTML = `
        <div class="empty-state">
            Verifying receipt...
        </div>
    `;

    try {

        const response =
            await apiRequest(
                "/receipts/verify",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            receiptNumber
                        })
                }
            );

        const receipt =
            response.receipt;

        if (!receipt) {

            result.innerHTML = `
                <div class="error-message">
                    Receipt information was not found.
                </div>
            `;

            return;
        }

        const items =
            receipt.sale?.items || [];

        const itemsHtml =
            items.map(
                (item) => `
                    <div class="product-details">

                        <div>
                            <span>
                                Product
                            </span>

                            <strong>
                                ${escapeHtml(
                                    item.productName ||
                                    "Unknown Product"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Quantity
                            </span>

                            <strong>
                                ${Number(
                                    item.quantity || 0
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Total
                            </span>

                            <strong>
                                ${formatCurrency(
                                    Number(
                                        item.total || 0
                                    )
                                )}
                            </strong>
                        </div>

                    </div>
                `
            ).join("");

        result.innerHTML = `

            <div class="verification-success">

                <h3>
                    ✅ Receipt Verified
                </h3>

                <p>
                    ${escapeHtml(
                        response.message ||
                        "Receipt verified successfully."
                    )}
                </p>

            </div>


            <div class="receipt-details">

                <h3>
                    ${escapeHtml(
                        receipt.store?.name ||
                        "Store"
                    )}
                </h3>

                <p>
                    Receipt:
                    <strong>
                        ${escapeHtml(
                            receipt.receiptNumber
                        )}
                    </strong>
                </p>

                <p>
                    Date:
                    ${escapeHtml(
                        new Date(
                            receipt.date
                        ).toLocaleString(
                            "en-NG"
                        )
                    )}
                </p>


                <hr>


                <p>
                    Customer:
                    <strong>
                        ${escapeHtml(
                            receipt.customer?.name ||
                            "Walk-in Customer"
                        )}
                    </strong>
                </p>


                <h4>
                    Products
                </h4>

                ${itemsHtml}


                <hr>


                <div class="product-details">

                    <div>
                        <span>
                            Subtotal
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.sale?.subtotal ||
                                    0
                                )
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Discount
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.sale?.discount ||
                                    0
                                )
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Total
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.sale?.totalAmount ||
                                    0
                                )
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Amount Paid
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.sale?.amountPaid ||
                                    0
                                )
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Debt
                        </span>

                        <strong>
                            ${formatCurrency(
                                Number(
                                    receipt.sale?.debt ||
                                    0
                                )
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Payment Method
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatPaymentMethod(
                                    receipt.sale?.paymentMethod
                                )
                            )}
                        </strong>
                    </div>

                </div>


                ${
                    receipt.soldBy
                        ? `
                            <p>
                                Sold By:
                                <strong>
                                    ${escapeHtml(
                                        receipt.soldBy.name ||
                                        "Unknown"
                                    )}
                                </strong>
                            </p>
                        `
                        : ""
                }

            </div>
        `;

    } catch (error) {

        console.error(
            "Verify receipt error:",
            error
        );

        result.innerHTML = `
            <div class="error-message">
                ${
                    escapeHtml(
                        error.message ||
                        "Unable to verify receipt."
                    )
                }
            </div>
        `;
    }
}

/* =========================
   PRINT RECEIPT
========================= */

async function printReceipt(receiptNumber) {

    try {

        receiptNumber =
            decodeURIComponent(
                receiptNumber
            );

        const result =
            await apiRequest(
                `/receipts/${encodeURIComponent(receiptNumber)}`,
                {
                    method: "GET"
                }
            );

        const receipt =
            result.receipt;


        if (!receipt) {

            showNotification(
                "Receipt not found."
            );

            return;

        }


        const date =
            receipt.date
                ? new Date(
                    receipt.date
                ).toLocaleString(
                    "en-NG"
                )
                : "Unknown date";


        const itemsHtml =
            (receipt.items || [])
                .map(
                    (item) => {

                        const quantity =
                            Number(
                                item.quantity || 0
                            );

                        const unitPrice =
                            Number(
                                item.unitPrice || 0
                            );

                        const total =
                            Number(
                                item.total || 0
                            );


                        return `
                            <tr>

                                <td>
                                    ${escapeHtml(
                                        item.productName ||
                                        "Unknown Product"
                                    )}
                                </td>

                                <td>
                                    ${quantity}
                                </td>

                                <td>
                                    ${formatCurrency(
                                        unitPrice
                                    )}
                                </td>

                                <td>
                                    ${formatCurrency(
                                        total
                                    )}
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");


        const printWindow =
            window.open(
                "",
                "_blank",
                "width=800,height=900"
            );


        if (!printWindow) {

            showNotification(
                "Please allow pop-ups to print the receipt."
            );

            return;

        }


        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <meta charset="UTF-8">

                <title>
                    Receipt ${escapeHtml(
                        receipt.receiptNumber ||
                        ""
                    )}
                </title>


                <style>

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 30px;
                        color: #111;
                        background: #fff;
                    }

                    .receipt {
                        max-width: 700px;
                        margin: auto;
                    }

                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }

                    .header h1 {
                        margin: 0 0 8px;
                        font-size: 26px;
                    }

                    .header p {
                        margin: 4px 0;
                        font-size: 14px;
                    }

                    .receipt-title {
                        text-align: center;
                        margin: 20px 0;
                        font-size: 20px;
                        font-weight: bold;
                    }

                    .info {
                        margin-bottom: 20px;
                    }

                    .info p {
                        margin: 6px 0;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }

                    th,
                    td {
                        border-bottom: 1px solid #ddd;
                        padding: 10px 6px;
                        text-align: left;
                    }

                    th {
                        font-weight: bold;
                    }

                    td:nth-child(2),
                    td:nth-child(3),
                    td:nth-child(4),
                    th:nth-child(2),
                    th:nth-child(3),
                    th:nth-child(4) {
                        text-align: right;
                    }

                    .summary {
                        margin-top: 20px;
                        border-top: 2px solid #111;
                        padding-top: 12px;
                    }

                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
                    }

                    .summary-row.total {
                        font-size: 18px;
                        font-weight: bold;
                        margin-top: 8px;
                    }

                    .footer {
                        text-align: center;
                        margin-top: 35px;
                        border-top: 1px solid #ddd;
                        padding-top: 15px;
                        font-size: 13px;
                    }

                    @media print {

                        body {
                            padding: 10px;
                        }

                        .receipt {
                            max-width: none;
                        }

                    }

                </style>

            </head>


            <body>

                <div class="receipt">


                    <div class="header">

                        <h1>
                            ${escapeHtml(
                                receipt.store?.name ||
                                "Store"
                            )}
                        </h1>

                        ${
                            receipt.store?.phone
                                ? `
                                    <p>
                                        ${escapeHtml(
                                            receipt.store.phone
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        ${
                            receipt.store?.email
                                ? `
                                    <p>
                                        ${escapeHtml(
                                            receipt.store.email
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        ${
                            receipt.store?.address
                                ? `
                                    <p>
                                        ${escapeHtml(
                                            receipt.store.address
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>


                    <div class="receipt-title">
                        SALES RECEIPT
                    </div>


                    <div class="info">

                        <p>
                            <strong>
                                Receipt:
                            </strong>

                            ${escapeHtml(
                                receipt.receiptNumber ||
                                "Not available"
                            )}
                        </p>


                        <p>
                            <strong>
                                Date:
                            </strong>

                            ${escapeHtml(date)}
                        </p>


                        <p>
                            <strong>
                                Customer:
                            </strong>

                            ${escapeHtml(
                                receipt.customer?.name ||
                                "Walk-in Customer"
                            )}
                        </p>


                        ${
                            receipt.soldBy
                                ? `
                                    <p>
                                        <strong>
                                            Sold By:
                                        </strong>

                                        ${escapeHtml(
                                            receipt.soldBy.name ||
                                            "Unknown"
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>


                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Product
                                </th>

                                <th>
                                    Qty
                                </th>

                                <th>
                                    Price
                                </th>

                                <th>
                                    Total
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${itemsHtml}

                        </tbody>

                    </table>


                    <div class="summary">

                        <div class="summary-row">

                            <span>
                                Subtotal
                            </span>

                            <strong>
                                ${formatCurrency(
                                    Number(
                                        receipt.subtotal || 0
                                    )
                                )}
                            </strong>

                        </div>


                        <div class="summary-row">

                            <span>
                                Discount
                            </span>

                            <strong>
                                ${formatCurrency(
                                    Number(
                                        receipt.discount || 0
                                    )
                                )}
                            </strong>

                        </div>


                        <div class="summary-row total">

                            <span>
                                TOTAL
                            </span>

                            <strong>
                                ${formatCurrency(
                                    Number(
                                        receipt.totalAmount || 0
                                    )
                                )}
                            </strong>

                        </div>


                        <div class="summary-row">

                            <span>
                                Amount Paid
                            </span>

                            <strong>
                                ${formatCurrency(
                                    Number(
                                        receipt.amountPaid || 0
                                    )
                                )}
                            </strong>

                        </div>


                        <div class="summary-row">

                            <span>
                                Outstanding Debt
                            </span>

                            <strong>
                                ${formatCurrency(
                                    Number(
                                        receipt.debt || 0
                                    )
                                )}
                            </strong>

                        </div>


                        <div class="summary-row">

                            <span>
                                Payment Method
                            </span>

                            <strong>
                                ${escapeHtml(
                                    formatPaymentMethod(
                                        receipt.paymentMethod
                                    )
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="footer">

                        <p>
                            Thank you for your patronage!
                        </p>

                        <p>
                            Powered by Blaiz Business Manager
                        </p>

                    </div>


                </div>


                <script>

                    window.onload = function() {

                        window.print();

                    };

                <\/script>

            </body>

            </html>

        `);


        printWindow.document.close();


    } catch (error) {

        console.error(
            "Print receipt error:",
            error
        );

        showNotification(
            error.message ||
            "Unable to print receipt."
        );

    }

}

/* =========================
   VERIFY RECEIPT BUTTON
========================= */

const verifyReceiptBtn =
    document.getElementById(
        "verifyReceiptBtn"
    );

if (verifyReceiptBtn) {

    verifyReceiptBtn.addEventListener(
        "click",
        verifyReceipt
    );

}

/* =========================================================
   WORKERS
========================================================= */

async function loadWorkers() {

    const workersList =
        document.getElementById(
            "workersList"
        );

    if (!workersList) {
        return;
    }

    workersList.innerHTML = `
        <div class="empty-state">
            Loading workers...
        </div>
    `;

    try {

        const result =
            await apiRequest(
                "/workers",
                {
                    method: "GET"
                }
            );

        const workers =
            result.workers || [];

        if (workers.length === 0) {

            workersList.innerHTML = `
                <div class="empty-state">
                    No workers yet.
                </div>
            `;

            return;
        }

        workersList.innerHTML =
            workers
                .map(
                    (worker) => {

                        const role =
                            worker.role === "sales"
                                ? "Sales"
                                : "Inventory";

                        const status =
                            worker.status || "active";

                        return `

                            <div
                                class="data-card"
                                data-worker-id="${worker._id}"
                            >

                                <div class="data-card-main">

                                    <div class="data-card-info">

                                        <h3>
                                            ${escapeHtml(
                                                worker.name
                                            )}
                                        </h3>

                                        <p>
                                            Role:
                                            <strong>
                                                ${role}
                                            </strong>
                                        </p>

                                        ${
                                            worker.email
                                                ? `
                                                    <p>
                                                        Email:
                                                        ${escapeHtml(
                                                            worker.email
                                                        )}
                                                    </p>
                                                `
                                                : ""
                                        }

                                        ${
                                            worker.phone
                                                ? `
                                                    <p>
                                                        Phone:
                                                        ${escapeHtml(
                                                            worker.phone
                                                        )}
                                                    </p>
                                                `
                                                : ""
                                        }

                                    </div>


                                    <div class="product-stock">

                                        <strong>
                                            ${
                                                status === "active"
                                                    ? "Active"
                                                    : "Inactive"
                                            }
                                        </strong>

                                        <span>
                                            ${role}
                                        </span>

                                    </div>

                                </div>


                                <div class="data-card-actions">

                                    <button
                                        type="button"
                                        class="secondary-btn"
                                        onclick="window.blaizApp.editWorker('${worker._id}')"
                                    >
                                        Edit
                                    </button>


                                    <button
                                        type="button"
                                        class="secondary-btn"
                                        onclick="window.blaizApp.toggleWorkerStatus('${worker._id}', '${status}')"
                                    >
                                        ${
                                            status === "active"
                                                ? "Suspend"
                                                : "Activate"
                                        }
                                    </button>


                                    <button
                                        type="button"
                                        class="danger-btn"
                                        onclick="window.blaizApp.deleteWorker('${worker._id}')"
                                    >
                                        Remove
                                    </button>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");

    } catch (error) {

        console.error(
            "Load workers error:",
            error
        );

        workersList.innerHTML = `
            <div class="empty-state">
                Unable to load workers.
            </div>
        `;

        showNotification(
            error.message ||
            "Unable to load workers."
        );

    }

}

/* =========================================================
   PREMIUM
========================================================= */

async function loadPremium() {

    const premiumContent =
        document.getElementById(
            "premiumContent"
        );

    if (!premiumContent) {
        return;
    }

    premiumContent.innerHTML = `
        <div class="empty-state">
            Loading Premium...
        </div>
    `;

    try {

        const result =
            await apiRequest(
                "/premium/status",
                {
                    method: "GET"
                }
            );

        const premium =
            result.premium || {};

        const active =
            premium.active === true;

        if (active) {

            const expiry =
                premium.expiry
                    ? new Date(
                        premium.expiry
                    ).toLocaleDateString(
                        "en-NG",
                        {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        }
                    )
                    : "Unknown";

            premiumContent.innerHTML = `

                <div class="premium-card">

                    <h2>
                        Premium Active
                    </h2>

                    <p>
                        Your store is currently
                        enjoying unlimited access.
                    </p>

                    <div class="premium-details">

                        <div>
                            <span>
                                Plan
                            </span>

                            <strong>
                                Premium
                            </strong>
                        </div>

                        <div>
                            <span>
                                Price
                            </span>

                            <strong>
                                ₦30,000 / year
                            </strong>
                        </div>

                        <div>
                            <span>
                                Days Remaining
                            </span>

                            <strong>
                                ${premium.daysRemaining || 0}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Expiry Date
                            </span>

                            <strong>
                                ${expiry}
                            </strong>
                        </div>

                    </div>

                </div>

            `;

            return;
        }


        premiumContent.innerHTML = `

            <div class="premium-card">

                <h2>
                    Upgrade to Premium
                </h2>

                <p>
                    Unlock unlimited business
                    management for your store.
                </p>


                <div class="premium-details">

                    <div>

                        <span>
                            Premium Price
                        </span>

                        <strong>
                            ₦30,000 / year
                        </strong>

                    </div>


                    <div>

                        <span>
                            Duration
                        </span>

                        <strong>
                            365 Days
                        </strong>

                    </div>

                </div>


                <div class="premium-features">

                    <h3>
                        Premium Benefits
                    </h3>

                    <p>
                        ✓ Unlimited products
                    </p>

                    <p>
                        ✓ Unlimited sales
                    </p>

                    <p>
                        ✓ Unlimited customers
                    </p>

                    <p>
                        ✓ Unlimited workers
                    </p>

                    <p>
                        ✓ Full access to business features
                    </p>

                </div>


                <button
                    type="button"
                    class="primary-btn"
                    id="upgradePremiumBtn"
                >
                    Upgrade to Premium
                </button>


                <p
                    id="premiumMessage"
                    class="form-message"
                ></p>

            </div>

        `;


        const upgradeButton =
            document.getElementById(
                "upgradePremiumBtn"
            );


        if (!upgradeButton) {
            return;
        }


        upgradeButton.addEventListener(
            "click",
            async () => {

                upgradeButton.disabled = true;

                upgradeButton.textContent =
                    "Connecting to Paystack...";


                const message =
                    document.getElementById(
                        "premiumMessage"
                    );


                if (message) {
                    message.textContent = "";
                }


                try {

                    const payment =
                        await apiRequest(
                            "/premium/initialize",
                            {
                                method: "POST"
                            }
                        );


                    if (
                        !payment.authorizationUrl
                    ) {

                        throw new Error(
                            "Unable to start Premium payment."
                        );

                    }


                    /*
                     * Save the payment reference
                     * temporarily so we can verify
                     * it after payment.
                     */

                    sessionStorage.setItem(
                        "blaiz_premium_reference",
                        payment.reference
                    );


                    /*
                     * Open Paystack.
                     */

                    window.location.href =
                        payment.authorizationUrl;

                } catch (error) {

                    console.error(
                        "Premium payment error:",
                        error
                    );


                    if (message) {

                        message.textContent =
                            error.message ||
                            "Unable to start Premium payment.";

                    }


                    upgradeButton.disabled =
                        false;

                    upgradeButton.textContent =
                        "Upgrade to Premium";

                }

            }
        );

    } catch (error) {

        console.error(
            "Load Premium error:",
            error
        );


        premiumContent.innerHTML = `
            <div class="empty-state">
                Unable to load Premium information.
            </div>
        `;


        showNotification(
            error.message ||
            "Unable to load Premium information."
        );

    }

}

/* =========================================================
   VERIFY PREMIUM PAYMENT AFTER PAYSTACK RETURN
========================================================= */

async function verifyReturnedPremiumPayment() {

    const reference =
        sessionStorage.getItem(
            "blaiz_premium_reference"
        );

    if (!reference) {
        return;
    }

    try {

        showNotification(
            "Verifying Premium payment..."
        );


        const result =
            await apiRequest(
                "/premium/verify",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            reference
                        })
                }
            );


        if (
            result.success &&
            result.paid
        ) {

            /*
             * Payment was successfully verified.
             */

            sessionStorage.removeItem(
                "blaiz_premium_reference"
            );


            showNotification(
                result.message ||
                "Premium activated successfully."
            );


            /*
             * Reload Premium information
             * so the page immediately shows
             * the new expiry date.
             */

            await loadPremium();


            return;

        }


        throw new Error(
            result.message ||
            "Premium payment could not be verified."
        );

    } catch (error) {

        console.error(
            "Premium verification error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to verify Premium payment."
        );

    }

}

/* =========================================================
   ADD WORKER
========================================================= */

function openAddWorkerModal() {

    openModal(`

        <div class="modal-header">

            <h2>
                Add Worker
            </h2>

            <button
                type="button"
                class="modal-close"
                onclick="window.blaizApp.closeModal()"
            >
                ×
            </button>

        </div>


        <form
            id="workerForm"
            class="modal-form"
        >

            <div class="input-group">

                <label>
                    Worker Name
                </label>

                <input
                    type="text"
                    id="workerName"
                    required
                    placeholder="Enter worker name"
                >

            </div>


            <div class="input-group">

                <label>
                    Email
                </label>

                <input
                    type="email"
                    id="workerEmail"
                    placeholder="Enter worker email"
                >

            </div>


            <div class="input-group">

                <label>
                    Phone
                </label>

                <input
                    type="tel"
                    id="workerPhone"
                    placeholder="Enter worker phone"
                >

            </div>


            <div class="input-group">

                <label>
                    Password
                </label>

                <input
                    type="password"
                    id="workerPassword"
                    required
                    minlength="6"
                    placeholder="Minimum 6 characters"
                >

            </div>


            <div class="input-group">

                <label>
                    Role
                </label>

                <select
                    id="workerRole"
                    required
                >

                    <option value="">
                        Select role
                    </option>

                    <option value="sales">
                        Sales
                    </option>

                    <option value="inventory">
                        Inventory
                    </option>

                </select>

            </div>


            <p
                id="workerFormMessage"
                class="form-message"
            ></p>


            <button
                type="submit"
                class="primary-btn"
            >
                Add Worker
            </button>

        </form>

    `);


    const form =
        document.getElementById(
            "workerForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        handleAddWorker
    );

}


/* =========================================================
   HANDLE ADD WORKER
========================================================= */

async function handleAddWorker(
    event
) {

    event.preventDefault();


    const form =
        event.target;


    const message =
        document.getElementById(
            "workerFormMessage"
        );


    const button =
        form.querySelector(
            "button[type='submit']"
        );


    const name =
        document.getElementById(
            "workerName"
        ).value.trim();


    const email =
        document.getElementById(
            "workerEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "workerPhone"
        ).value.trim();


    const password =
        document.getElementById(
            "workerPassword"
        ).value;


    const role =
        document.getElementById(
            "workerRole"
        ).value;


    if (!email && !phone) {

        message.textContent =
            "Enter either an email or phone number.";

        return;

    }


    button.disabled = true;

    button.textContent =
        "Adding...";


    message.textContent =
        "";


    try {

        const result =
            await apiRequest(
                "/workers",
                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            name,
                            email:
                                email || undefined,
                            phone:
                                phone || undefined,
                            password,
                            role

                        })

                }
            );


        showNotification(
            result.message ||
            "Worker added successfully."
        );


        closeModal();


        await loadWorkers();


    } catch (error) {

        console.error(
            "Add worker error:",
            error
        );


        message.textContent =
            error.message ||
            "Unable to add worker.";

    } finally {

        button.disabled = false;

        button.textContent =
            "Add Worker";

    }

}


/* =========================================================
   EDIT WORKER
========================================================= */

async function editWorker(
    workerId
) {

    try {

        const result =
            await apiRequest(
                "/workers",
                {
                    method: "GET"
                }
            );


        const worker =
            (result.workers || [])
                .find(
                    (item) =>
                        item._id ===
                        workerId
                );


        if (!worker) {

            showNotification(
                "Worker not found."
            );

            return;

        }


        openModal(`

            <div class="modal-header">

                <h2>
                    Edit Worker
                </h2>

                <button
                    type="button"
                    class="modal-close"
                    onclick="window.blaizApp.closeModal()"
                >
                    ×
                </button>

            </div>


            <form
                id="editWorkerForm"
                class="modal-form"
            >

                <div class="input-group">

                    <label>
                        Worker Name
                    </label>

                    <input
                        type="text"
                        id="editWorkerName"
                        value="${escapeHtml(
                            worker.name || ""
                        )}"
                        required
                    >

                </div>


                <div class="input-group">

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        id="editWorkerEmail"
                        value="${escapeHtml(
                            worker.email || ""
                        )}"
                    >

                </div>


                <div class="input-group">

                    <label>
                        Phone
                    </label>

                    <input
                        type="tel"
                        id="editWorkerPhone"
                        value="${escapeHtml(
                            worker.phone || ""
                        )}"
                    >

                </div>


                <div class="input-group">

                    <label>
                        Role
                    </label>

                    <select
                        id="editWorkerRole"
                    >

                        <option
                            value="sales"
                            ${
                                worker.role === "sales"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Sales
                        </option>

                        <option
                            value="inventory"
                            ${
                                worker.role === "inventory"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Inventory
                        </option>

                    </select>

                </div>


                <div class="input-group">

                    <label>
                        Status
                    </label>

                    <select
                        id="editWorkerStatus"
                    >

                        <option
                            value="active"
                            ${
                                worker.status === "active"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Active
                        </option>

                        <option
                            value="suspended"
                            ${
                                worker.status === "suspended"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Suspended
                        </option>

                        <option
                            value="inactive"
                            ${
                                worker.status === "inactive"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Inactive
                        </option>

                    </select>

                </div>


                <p
                    id="editWorkerMessage"
                    class="form-message"
                ></p>


                <button
                    type="submit"
                    class="primary-btn"
                >
                    Save Changes
                </button>

            </form>

        `);


        const form =
            document.getElementById(
                "editWorkerForm"
            );


        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const message =
                    document.getElementById(
                        "editWorkerMessage"
                    );


                const button =
                    form.querySelector(
                        "button[type='submit']"
                    );


                button.disabled = true;

                button.textContent =
                    "Saving...";


                try {

                    const result =
                        await apiRequest(
                            `/workers/${workerId}`,
                            {

                                method: "PUT",

                                body:
                                    JSON.stringify({

                                        name:
                                            document.getElementById(
                                                "editWorkerName"
                                            ).value.trim(),

                                        email:
                                            document.getElementById(
                                                "editWorkerEmail"
                                            ).value.trim(),

                                        phone:
                                            document.getElementById(
                                                "editWorkerPhone"
                                            ).value.trim(),

                                        role:
                                            document.getElementById(
                                                "editWorkerRole"
                                            ).value,

                                        status:
                                            document.getElementById(
                                                "editWorkerStatus"
                                            ).value

                                    })

                            }
                        );


                    showNotification(
                        result.message ||
                        "Worker updated successfully."
                    );


                    closeModal();


                    await loadWorkers();


                } catch (error) {

                    console.error(
                        "Edit worker error:",
                        error
                    );


                    message.textContent =
                        error.message ||
                        "Unable to update worker.";

                } finally {

                    button.disabled =
                        false;

                    button.textContent =
                        "Save Changes";

                }

            }
        );


    } catch (error) {

        console.error(
            "Edit worker error:",
            error
        );

        showNotification(
            error.message ||
            "Unable to load worker."
        );

    }

}


/* =========================================================
   TOGGLE WORKER STATUS
========================================================= */

async function toggleWorkerStatus(
    workerId,
    currentStatus
) {

    const newStatus =
        currentStatus === "active"
            ? "suspended"
            : "active";


    if (
        !confirm(
            newStatus === "suspended"
                ? "Suspend this worker?"
                : "Activate this worker?"
        )
    ) {
        return;
    }


    try {

        const result =
            await apiRequest(
                `/workers/${workerId}`,
                {

                    method: "PUT",

                    body:
                        JSON.stringify({

                            status:
                                newStatus

                        })

                }
            );


        showNotification(
            result.message ||
            "Worker status updated."
        );


        await loadWorkers();


    } catch (error) {

        console.error(
            "Worker status error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to update worker status."
        );

    }

}


/* =========================================================
   DELETE WORKER
========================================================= */

async function deleteWorker(
    workerId
) {

    if (
        !confirm(
            "Are you sure you want to remove this worker?"
        )
    ) {
        return;
    }


    try {

        const result =
            await apiRequest(
                `/workers/${workerId}`,
                {

                    method: "DELETE"

                }
            );


        showNotification(
            result.message ||
            "Worker removed successfully."
        );


        await loadWorkers();


    } catch (error) {

        console.error(
            "Delete worker error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to remove worker."
        );

    }

}


/* =========================================================
   WORKER BUTTON
========================================================= */

const addWorkerBtn =
    document.getElementById(
        "addWorkerBtn"
    );


if (addWorkerBtn) {

    addWorkerBtn.addEventListener(
        "click",
        openAddWorkerModal
    );

}

/* =========================================================
   SETTINGS
========================================================= */

async function loadSettings() {

    const settingsContent =
        document.getElementById(
            "settingsContent"
        );

    if (!settingsContent) {
        return;
    }


    settingsContent.innerHTML = `
        <div class="empty-state">
            Loading settings...
        </div>
    `;


    try {

        const result =
            await apiRequest(
                "/settings",
                {
                    method: "GET"
                }
            );


        const user =
            result.user || {};

        const store =
            result.store || {};


        const plan =
            store.plan === "premium"
                ? "Premium"
                : "Free";


        settingsContent.innerHTML = `

            <!-- ACCOUNT INFORMATION -->

            <div class="settings-card">

                <div class="card-header">

                    <h2>
                        Account Information
                    </h2>

                </div>


                <form
                    id="settingsAccountForm"
                    class="modal-form"
                >

                    <div class="input-group">

                        <label>
                            Name
                        </label>

                        <input
                            type="text"
                            id="settingsName"
                            value="${escapeHtml(
                                user.name || ""
                            )}"
                            required
                        >

                    </div>


                    <div class="input-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            id="settingsEmail"
                            value="${escapeHtml(
                                user.email || ""
                            )}"
                        >

                    </div>


                    <div class="input-group">

                        <label>
                            Phone Number
                        </label>

                        <input
                            type="tel"
                            id="settingsPhone"
                            value="${escapeHtml(
                                user.phone || ""
                            )}"
                        >

                    </div>


                    <p
                        id="settingsAccountMessage"
                        class="form-message"
                    ></p>


                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save Account Changes
                    </button>

                </form>

            </div>


            <!-- STORE INFORMATION -->

            <div class="settings-card">

                <div class="card-header">

                    <h2>
                        Store Information
                    </h2>

                </div>


                <form
                    id="settingsStoreForm"
                    class="modal-form"
                >

                    <div class="input-group">

                        <label>
                            Store Name
                        </label>

                        <input
                            type="text"
                            id="settingsStoreName"
                            value="${escapeHtml(
                                store.storeName || ""
                            )}"
                            required
                        >

                    </div>


                    <div class="input-group">

                        <label>
                            Store Phone
                        </label>

                        <input
                            type="tel"
                            id="settingsStorePhone"
                            value="${escapeHtml(
                                store.phone || ""
                            )}"
                        >

                    </div>


                    <div class="input-group">

                        <label>
                            Store Email
                        </label>

                        <input
                            type="email"
                            id="settingsStoreEmail"
                            value="${escapeHtml(
                                store.email || ""
                            )}"
                        >

                    </div>


                    <div class="input-group">

                        <label>
                            Business Type
                        </label>

                        <input
                            type="text"
                            id="settingsBusinessType"
                            value="${escapeHtml(
                                store.businessType || ""
                            )}"
                            placeholder="e.g. Retail"
                        >

                    </div>


                    <div class="input-group">

                        <label>
                            Address
                        </label>

                        <textarea
                            id="settingsAddress"
                            rows="3"
                            placeholder="Enter your business address"
                        >${escapeHtml(
                            store.address || ""
                        )}</textarea>

                    </div>


                    <p
                        id="settingsStoreMessage"
                        class="form-message"
                    ></p>


                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save Store Changes
                    </button>

                </form>

            </div>


            <!-- PREMIUM INFORMATION -->

            <div class="settings-card">

                <div class="card-header">

                    <h2>
                        Subscription
                    </h2>

                </div>


                <div class="settings-info">

                    <p>
                        <strong>
                            Current Plan:
                        </strong>

                        ${plan}
                    </p>


                    ${
                        store.subscriptionExpiry
                            ? `
                                <p>
                                    <strong>
                                        Premium Expiry:
                                    </strong>

                                    ${new Date(
                                        store.subscriptionExpiry
                                    ).toLocaleDateString()}
                                </p>
                            `
                            : ""
                    }


                    ${
                        store.plan === "premium"
                            ? `
                                <p>
                                    Your store currently
                                    has unlimited access.
                                </p>
                            `
                            : `
                                <p>
                                    Upgrade to Premium
                                    to unlock unlimited
                                    business management.
                                </p>

                                <button
                                    type="button"
                                    class="primary-btn"
                                    onclick="window.blaizApp.showPage('premium')"
                                >
                                    Upgrade to Premium
                                </button>
                            `
                    }

                </div>

            </div>


            <!-- CHANGE PASSWORD -->

            <div class="settings-card">

                <div class="card-header">

                    <h2>
                        Change Password
                    </h2>

                </div>


                <form
                    id="changePasswordForm"
                    class="modal-form"
                >

                    <div class="input-group">

                        <label>
                            Current Password
                        </label>

                        <input
                            type="password"
                            id="currentPassword"
                            placeholder="Enter current password"
                            required
                        >

                    </div>


                    <div class="input-group">

                        <label>
                            New Password
                        </label>

                        <input
                            type="password"
                            id="newPassword"
                            placeholder="Enter new password"
                            minlength="6"
                            required
                        >

                    </div>


                    <div class="input-group">

                        <label>
                            Confirm New Password
                        </label>

                        <input
                            type="password"
                            id="confirmNewPassword"
                            placeholder="Confirm new password"
                            minlength="6"
                            required
                        >

                    </div>


                    <p
                        id="changePasswordMessage"
                        class="form-message"
                    ></p>


                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Change Password
                    </button>

                </form>

            </div>

            <!-- DELETE STORE -->

<div class="settings-card danger-settings-card">

    <div class="card-header">

        <h2>
            Delete Store
        </h2>

    </div>

    <div class="settings-info">

        <p>
            Permanently delete your store and all
            of its associated data.
        </p>

        <p>
            This includes your products, customers,
            sales, receipts, workers and store
            information.
        </p>

        <p>
            <strong>
                This action cannot be undone.
            </strong>
        </p>

        <button
            type="button"
            id="deleteStoreButton"
            class="danger-btn"
        >
            Delete Store Permanently
        </button>

    </div>

</div>
        `;


        /* =========================================
           ACCOUNT FORM
        ========================================= */

        const accountForm =
            document.getElementById(
                "settingsAccountForm"
            );


        accountForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const message =
                    document.getElementById(
                        "settingsAccountMessage"
                    );


                const button =
                    accountForm.querySelector(
                        "button[type='submit']"
                    );


                button.disabled = true;

                button.textContent =
                    "Saving...";


                message.textContent =
                    "";


                try {

                    const result =
                        await apiRequest(
                            "/settings/account",
                            {

                                method: "PUT",

                                body:
                                    JSON.stringify({

                                        name:
                                            document.getElementById(
                                                "settingsName"
                                            ).value.trim(),

                                        email:
                                            document.getElementById(
                                                "settingsEmail"
                                            ).value.trim(),

                                        phone:
                                            document.getElementById(
                                                "settingsPhone"
                                            ).value.trim()

                                    })

                            }
                        );


                    if (result.user) {

                        saveUser(
                            result.user
                        );

                    }


                    showNotification(
                        result.message ||
                        "Account information updated successfully."
                    );


                    await loadSettings();


                    if (
                        typeof updateTopbar ===
                        "function"
                    ) {
                        updateTopbar();
                    }


                } catch (error) {

                    console.error(
                        "Update account error:",
                        error
                    );


                    message.textContent =
                        error.message ||
                        "Unable to update account.";

                } finally {

                    button.disabled =
                        false;

                    button.textContent =
                        "Save Account Changes";

                }

            }
        );


        /* =========================================
           STORE FORM
        ========================================= */

        const storeForm =
            document.getElementById(
                "settingsStoreForm"
            );


        storeForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const message =
                    document.getElementById(
                        "settingsStoreMessage"
                    );


                const button =
                    storeForm.querySelector(
                        "button[type='submit']"
                    );


                button.disabled = true;

                button.textContent =
                    "Saving...";


                message.textContent =
                    "";


                try {

                    const result =
                        await apiRequest(
                            "/stores/my-store",
                            {

                                method: "PUT",

                                body:
                                    JSON.stringify({

                                        storeName:
                                            document.getElementById(
                                                "settingsStoreName"
                                            ).value.trim(),

                                        phone:
                                            document.getElementById(
                                                "settingsStorePhone"
                                            ).value.trim(),

                                        email:
                                            document.getElementById(
                                                "settingsStoreEmail"
                                            ).value.trim(),

                                        businessType:
                                            document.getElementById(
                                                "settingsBusinessType"
                                            ).value.trim(),

                                        address:
                                            document.getElementById(
                                                "settingsAddress"
                                            ).value.trim()

                                    })

                            }
                        );


                    if (result.store) {

                        saveStore(
                            result.store
                        );

                    }


                    showNotification(
                        result.message ||
                        "Store information updated successfully."
                    );


                    await loadSettings();


                } catch (error) {

                    console.error(
                        "Update store error:",
                        error
                    );


                    message.textContent =
                        error.message ||
                        "Unable to update store.";

                } finally {

                    button.disabled =
                        false;

                    button.textContent =
                        "Save Store Changes";

                }

            }
        );


        /* =========================================
           CHANGE PASSWORD FORM
        ========================================= */

        const passwordForm =
            document.getElementById(
                "changePasswordForm"
            );


        passwordForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const message =
                    document.getElementById(
                        "changePasswordMessage"
                    );


                const button =
                    passwordForm.querySelector(
                        "button[type='submit']"
                    );


                const currentPassword =
                    document.getElementById(
                        "currentPassword"
                    ).value;


                const newPassword =
                    document.getElementById(
                        "newPassword"
                    ).value;


                const confirmPassword =
                    document.getElementById(
                        "confirmNewPassword"
                    ).value;


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    message.textContent =
                        "New passwords do not match.";

                    return;

                }


                button.disabled =
                    true;

                button.textContent =
                    "Changing...";


                message.textContent =
                    "";


                try {

                    const result =
                        await apiRequest(
                            "/settings/password",
                            {

                                method: "PUT",

                                body:
                                    JSON.stringify({

                                        currentPassword,

                                        newPassword

                                    })

                            }
                        );


                    showNotification(
                        result.message ||
                        "Password changed successfully."
                    );


                    passwordForm.reset();


                } catch (error) {

                    console.error(
                        "Change password error:",
                        error
                    );


                    message.textContent =
                        error.message ||
                        "Unable to change password.";

                } finally {

                    button.disabled =
                        false;

                    button.textContent =
                        "Change Password";

                }

            }
        );

                /* =========================================
           DELETE STORE
        ========================================= */

        const deleteStoreButton =
            document.getElementById(
                "deleteStoreButton"
            );


        if (deleteStoreButton) {

            deleteStoreButton.addEventListener(
                "click",
                async () => {

                    const firstConfirmation =
                        confirm(
                            "Are you sure you want to permanently delete your store and all associated data?"
                        );


                    if (!firstConfirmation) {
                        return;
                    }


                    const secondConfirmation =
                        confirm(
                            "FINAL WARNING: This will permanently delete your products, customers, sales, receipts, workers, store information and your owner account. This action cannot be undone. Continue?"
                        );


                    if (!secondConfirmation) {
                        return;
                    }


                    deleteStoreButton.disabled =
                        true;

                    deleteStoreButton.textContent =
                        "Deleting...";


                    try {

                        const result =
                            await apiRequest(
                                "/stores/my-store",
                                {
                                    method: "DELETE"
                                }
                            );


                        showNotification(
                            result.message ||
                            "Store deleted successfully."
                        );


                        /* Clear login/session data */

                        localStorage.removeItem(
                            "token"
                        );

                        localStorage.removeItem(
                            "user"
                        );

                        localStorage.removeItem(
                            "store"
                        );


                        /* Return to login */

                        setTimeout(() => {

                            window.location.reload();

                        }, 1200);


                    } catch (error) {

                        console.error(
                            "Delete store error:",
                            error
                        );


                        showNotification(
                            error.message ||
                            "Unable to delete store."
                        );


                        deleteStoreButton.disabled =
                            false;

                        deleteStoreButton.textContent =
                            "Delete Store Permanently";

                    }

                }
            );

        }


    } catch (error) {

        console.error(
            "Load settings error:",
            error
        );


        settingsContent.innerHTML = `
            <div class="empty-state">
                Unable to load settings.
            </div>

        `;


        showNotification(
            error.message ||
            "Unable to load settings."
        );

    }

    
}



window.blaizApp = {

    showPage,

    openModal,

    closeModal,

    showNotification,

    editProduct,

    deleteProduct,

    adjustProductStock,

    editCustomer,

    deleteCustomer,
    
    viewSale,

    viewReceipt,

    printReceipt,

    loadWorkers,

    editWorker,

    toggleWorkerStatus,

    deleteWorker,

};