/* =========================================
   BLAIZ BUSINESS MANAGER
   SUPPORT
========================================= */

import { apiRequest } from "./api.js";


let currentSupportTicketId = null;


/* =========================================
   INITIALIZE SUPPORT
========================================= */

export function initializeSupport() {

    const createButton =
        document.getElementById(
            "createSupportTicketBtn"
        );


    if (createButton) {

        createButton.addEventListener(
            "click",
            openCreateTicketForm
        );

    }


    loadSupportTickets();

}


/* =========================================
   LOAD SUPPORT TICKETS
========================================= */

export async function loadSupportTickets() {

    const container =
        document.getElementById(
            "supportContent"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="content-card">
            <p class="notification-empty">
                Loading support tickets...
            </p>
        </div>
    `;


    try {

        const result =
            await apiRequest(
                "/support",
                {
                    method: "GET"
                }
            );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Unable to load support tickets."
            );

        }


        renderSupportTickets(
            result.tickets || []
        );


    } catch (error) {

        console.error(
            "Load support tickets error:",
            error
        );


        container.innerHTML = `
            <div class="content-card">
                <p class="form-message">
                    Unable to load support tickets.
                </p>
            </div>
        `;

    }

}


/* =========================================
   RENDER SUPPORT TICKETS
========================================= */

function renderSupportTickets(
    tickets
) {

    const container =
        document.getElementById(
            "supportContent"
        );


    if (!container) {
        return;
    }


    if (!tickets.length) {

        container.innerHTML = `
            <div class="content-card">

                <div class="notification-empty">

                    <h3>
                        No support tickets
                    </h3>

                    <p>
                        If you need help, create a new
                        support ticket.
                    </p>

                </div>

            </div>
        `;

        return;

    }


    container.innerHTML = `

        <div class="content-card">

            <div class="support-ticket-list">

                ${tickets.map(
                    ticket => `
                        <button
                            type="button"
                            class="support-ticket-item"
                            data-ticket-id="${ticket._id}"
                        >

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        ticket.subject
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        ticket.ticketNumber
                                    )}
                                </span>

                            </div>


                            <div>

                                <span
                                    class="support-status support-status-${escapeHtml(
                                        ticket.status
                                    )}"
                                >
                                    ${formatStatus(
                                        ticket.status
                                    )}
                                </span>

                            </div>

                        </button>
                    `
                ).join("")}

            </div>

        </div>

    `;


    const ticketButtons =
        container.querySelectorAll(
            ".support-ticket-item"
        );


    ticketButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const ticketId =
                        button.dataset.ticketId;

                    openSupportTicket(
                        ticketId
                    );

                }
            );

        }
    );

}


/* =========================================
   CREATE TICKET FORM
========================================= */

function openCreateTicketForm() {

    const container =
        document.getElementById(
            "supportContent"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="content-card">

            <div class="support-form-header">

                <button
                    type="button"
                    id="backToSupportTicketsBtn"
                    class="text-btn"
                >
                    ← Back to Support
                </button>

            </div><br>


            <h2>
                Create Support Ticket
            </h2><br>


            <form id="supportTicketForm">

                <div class="input-group">

                    <label>
                        Subject
                    </label>

                    <input
                        type="text"
                        id="supportSubject"
                        placeholder="What do you need help with?"
                        maxlength="200"
                        required
                    >

                </div>


                <div class="input-group">

                    <label>
                        Category
                    </label>

                    <select
                        id="supportCategory"
                        required
                    >

                        <option
                            value=""
                            disabled
                            selected
                        >
                            Select category
                        </option>

                        <option value="account">
                            Account
                        </option>

                        <option value="login">
                            Login
                        </option>

                        <option value="workers">
                            Workers
                        </option>

                        <option value="inventory">
                            Inventory
                        </option>

                        <option value="sales">
                            Sales
                        </option>

                        <option value="customers">
                            Customers
                        </option>

                        <option value="receipts">
                            Receipts
                        </option>

                        <option value="premium">
                            Premium
                        </option>

                        <option value="payments">
                            Payments
                        </option>

                        <option value="technical">
                            Technical
                        </option>

                        <option value="other">
                            Other
                        </option>

                    </select>

                </div>


                <div class="input-group">

                    <label>
                        Message
                    </label>

                    <textarea
                        id="supportMessage"
                        rows="7"
                        maxlength="5000"
                        placeholder="Describe the issue you need help with..."
                        required
                    ></textarea>

                </div>


                <p
                    id="supportFormMessage"
                    class="form-message"
                ></p>


                <button
                    type="submit"
                    class="primary-btn"
                    id="submitSupportTicketBtn"
                >
                    Submit Ticket
                </button>

            </form>

        </div>

    `;


    const backButton =
        document.getElementById(
            "backToSupportTicketsBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            loadSupportTickets
        );

    }


    const form =
        document.getElementById(
            "supportTicketForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleCreateSupportTicket
        );

    }

}


/* =========================================
   CREATE SUPPORT TICKET
========================================= */

async function handleCreateSupportTicket(
    event
) {

    event.preventDefault();


    const subject =
        document.getElementById(
            "supportSubject"
        )?.value.trim();


    const category =
        document.getElementById(
            "supportCategory"
        )?.value;


    const message =
        document.getElementById(
            "supportMessage"
        )?.value.trim();


    const messageElement =
        document.getElementById(
            "supportFormMessage"
        );


    const submitButton =
        document.getElementById(
            "submitSupportTicketBtn"
        );


    if (!subject || !category || !message) {

        if (messageElement) {

            messageElement.textContent =
                "Please complete all fields.";

        }

        return;

    }


    try {

        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Submitting...";

        }


        const result =
            await apiRequest(
                "/support",
                {
                    method: "POST",

                    body: {
                        subject,
                        category,
                        message
                    }
                }
            );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Unable to create support ticket."
            );

        }


        currentSupportTicketId =
            result.ticket?._id || null;


        await openSupportTicket(
            currentSupportTicketId
        );


    } catch (error) {

        console.error(
            "Create support ticket error:",
            error
        );


        if (messageElement) {

            messageElement.textContent =
                error.message ||
                "Unable to create support ticket.";

        }


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Submit Ticket";

        }

    }

}


/* =========================================
   OPEN SUPPORT TICKET
========================================= */

async function openSupportTicket(
    ticketId
) {

    if (!ticketId) {
        return;
    }


    currentSupportTicketId =
        ticketId;


    const container =
        document.getElementById(
            "supportContent"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="content-card">
            <p class="notification-empty">
                Loading ticket...
            </p>
        </div>
    `;


    try {

        const result =
            await apiRequest(
                `/support/${encodeURIComponent(
                    ticketId
                )}`,
                {
                    method: "GET"
                }
            );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Unable to load support ticket."
            );

        }


        renderSupportTicket(
            result.ticket,
            result.messages || []
        );


    } catch (error) {

        console.error(
            "Open support ticket error:",
            error
        );


        container.innerHTML = `
            <div class="content-card">

                <button
                    type="button"
                    id="backToSupportTicketsBtn"
                    class="text-btn"
                >
                    ← Back to Support
                </button>

                <p class="form-message">
                    Unable to load this support ticket.
                </p>

            </div>
        `;


        const backButton =
            document.getElementById(
                "backToSupportTicketsBtn"
            );


        if (backButton) {

            backButton.addEventListener(
                "click",
                loadSupportTickets
            );

        }

    }

}


/* =========================================
   RENDER SUPPORT TICKET
========================================= */

function renderSupportTicket(
    ticket,
    messages
) {

    const container =
        document.getElementById(
            "supportContent"
        );


    if (!container) {
        return;
    }


    const isClosed =
        ticket.status === "closed";


    container.innerHTML = `

        <div class="content-card">

            <div class="support-ticket-header">

                <button
                    type="button"
                    id="backToSupportTicketsBtn"
                    class="text-btn"
                >
                    ← Back to Support
                </button>


                <div>

                    <span class="support-ticket-number">
                        ${escapeHtml(
                            ticket.ticketNumber
                        )}
                    </span>

                    <span
                        class="support-status support-status-${escapeHtml(
                            ticket.status
                        )}"
                    >
                        ${formatStatus(
                            ticket.status
                        )}
                    </span>

                </div>

            </div>


            <h2>
                ${escapeHtml(
                    ticket.subject
                )}
            </h2>


            <p>
                Category:
                <strong>
                    ${escapeHtml(
                        formatCategory(
                            ticket.category
                        )
                    )}
                </strong>
            </p>


            <div
                id="supportMessages"
                class="support-messages"
            >

                ${
                    messages.length
                        ? messages.map(
                            renderSupportMessage
                        ).join("")
                        : `
                            <div class="notification-empty">
                                No messages yet.
                            </div>
                        `
                }

            </div>


            ${
                isClosed
                    ? `
                        <div class="support-closed-message">
                            This support ticket is closed.
                        </div>
                    `
                    : `
                        <form
                            id="supportReplyForm"
                            class="support-reply-form"
                        >

                            <div class="input-group">

                                <label>
                                    Reply
                                </label>

                                <textarea
                                    id="supportReplyMessage"
                                    rows="5"
                                    maxlength="5000"
                                    placeholder="Write your reply..."
                                    required
                                ></textarea>

                            </div>


                            <p
                                id="supportReplyFormMessage"
                                class="form-message"
                            ></p>


                            <div
                                style="
                                    display:flex;
                                    gap:10px;
                                    flex-wrap:wrap;
                                "
                            >

                                <button
                                    type="submit"
                                    class="primary-btn"
                                    id="sendSupportReplyBtn"
                                >
                                    Send Reply
                                </button>


                                <button
                                    type="button"
                                    class="secondary-btn"
                                    id="closeSupportTicketBtn"
                                >
                                    Close Ticket
                                </button>

                            </div>

                        </form>
                    `
            }

        </div>

    `;


    const backButton =
        document.getElementById(
            "backToSupportTicketsBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            loadSupportTickets
        );

    }


    if (!isClosed) {

        const replyForm =
            document.getElementById(
                "supportReplyForm"
            );


        if (replyForm) {

            replyForm.addEventListener(
                "submit",
                handleSupportReply
            );

        }


        const closeButton =
            document.getElementById(
                "closeSupportTicketBtn"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                handleCloseSupportTicket
            );

        }

    }


    const messagesContainer =
        document.getElementById(
            "supportMessages"
        );


    if (messagesContainer) {

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;

    }

}


/* =========================================
   RENDER SUPPORT MESSAGE
========================================= */

function renderSupportMessage(
    message
) {

    const senderClass =
        message.senderType === "admin"
            ? "support-message-admin"
            : "support-message-user";


    const senderLabel =
        message.senderType === "admin"
            ? "Blaiz Support"
            : "You";


    return `
        <div
            class="support-message ${senderClass}"
        >

            <div class="support-message-header">

                <strong>
                    ${senderLabel}
                </strong>

                <span>
                    ${formatDate(
                        message.createdAt
                    )}
                </span>

            </div>


            <p>
                ${escapeHtml(
                    message.message
                )}
            </p>

        </div>
    `;

}


/* =========================================
   REPLY TO TICKET
========================================= */

async function handleSupportReply(
    event
) {

    event.preventDefault();


    if (!currentSupportTicketId) {
        return;
    }


    const textarea =
        document.getElementById(
            "supportReplyMessage"
        );


    const message =
        textarea?.value.trim();


    const messageElement =
        document.getElementById(
            "supportReplyFormMessage"
        );


    const sendButton =
        document.getElementById(
            "sendSupportReplyBtn"
        );


    if (!message) {

        if (messageElement) {

            messageElement.textContent =
                "Please enter a message.";

        }

        return;

    }


    try {

        if (sendButton) {

            sendButton.disabled =
                true;

            sendButton.textContent =
                "Sending...";

        }


        const result =
            await apiRequest(
                `/support/${encodeURIComponent(
                    currentSupportTicketId
                )}/reply`,
                {
                    method: "POST",

                    body: {
                        message
                    }
                }
            );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Unable to send reply."
            );

        }


        await openSupportTicket(
            currentSupportTicketId
        );


    } catch (error) {

        console.error(
            "Support reply error:",
            error
        );


        if (messageElement) {

            messageElement.textContent =
                error.message ||
                "Unable to send reply.";

        }


        if (sendButton) {

            sendButton.disabled =
                false;

            sendButton.textContent =
                "Send Reply";

        }

    }

}


/* =========================================
   CLOSE TICKET
========================================= */

async function handleCloseSupportTicket() {

    if (!currentSupportTicketId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to close this support ticket?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await apiRequest(
                `/support/${encodeURIComponent(
                    currentSupportTicketId
                )}/close`,
                {
                    method: "PATCH"
                }
            );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Unable to close support ticket."
            );

        }


        await openSupportTicket(
            currentSupportTicketId
        );


    } catch (error) {

        console.error(
            "Close support ticket error:",
            error
        );

        window.alert(
            error.message ||
            "Unable to close support ticket."
        );

    }

}


/* =========================================
   HELPERS
========================================= */

function formatStatus(
    status
) {

    const labels = {

        open:
            "Open",

        in_progress:
            "In Progress",

        waiting_for_user:
            "Waiting for You",

        resolved:
            "Resolved",

        closed:
            "Closed"

    };


    return (
        labels[status] ||
        status ||
        "Unknown"
    );

}


function formatCategory(
    category
) {

    const labels = {

        account:
            "Account",

        login:
            "Login",

        workers:
            "Workers",

        inventory:
            "Inventory",

        sales:
            "Sales",

        customers:
            "Customers",

        receipts:
            "Receipts",

        premium:
            "Premium",

        payments:
            "Payments",

        technical:
            "Technical",

        other:
            "Other"

    };


    return (
        labels[category] ||
        category ||
        "Other"
    );

}


function formatDate(
    date
) {

    if (!date) {
        return "";
    }


    const parsedDate =
        new Date(date);


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return "";
    }


    return parsedDate.toLocaleString();

}


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