/* =========================================
   BLAIZ BUSINESS MANAGER
   AGENT SUPPORT
========================================= */

import { apiRequest } from "./api.js";


let currentAgentSupportTicketId = null;
let agentSupportReplyPollingTimer = null;


/* =========================================
   INITIALIZE AGENT SUPPORT
========================================= */

export function initializeAgentSupport() {

    const createButton =
        document.getElementById(
            "createAgentSupportTicketBtn"
        );


    if (createButton) {

        createButton.addEventListener(
            "click",
            openCreateAgentSupportTicketForm
        );

    }


    loadAgentSupportTickets();

}


/* =========================================
   LOAD AGENT SUPPORT TICKETS
========================================= */

export async function loadAgentSupportTickets() {

    stopAgentSupportReplyPolling();

    currentAgentSupportTicketId = null;


    const container =
        document.getElementById(
            "agentSupportContent"
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
                "/agent-support",
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


        renderAgentSupportTickets(
            result.tickets || []
        );


    } catch (error) {

        console.error(
            "Load agent support tickets error:",
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
   RENDER AGENT SUPPORT TICKETS
========================================= */

function renderAgentSupportTickets(
    tickets
) {

    const container =
        document.getElementById(
            "agentSupportContent"
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


                    openAgentSupportTicket(
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

function openCreateAgentSupportTicketForm() {

    const container =
        document.getElementById(
            "agentSupportContent"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="content-card">

            <div class="support-form-header">

                <button
                    type="button"
                    id="backToAgentSupportTicketsBtn"
                    class="text-btn"
                >
                    ← Back to Support
                </button>

            </div>


            <br>


            <h2>
                Create Support Ticket
            </h2>


            <br>


            <form
                id="agentSupportTicketForm"
            >

                <div class="input-group">

                    <label>
                        Subject
                    </label>

                    <input
                        type="text"
                        id="agentSupportSubject"
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
                        id="agentSupportCategory"
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

                        <option value="referrals">
                            Referrals
                        </option>

                        <option value="earnings">
                            Earnings
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
                        id="agentSupportMessage"
                        rows="7"
                        maxlength="5000"
                        placeholder="Describe the issue you need help with..."
                        required
                    ></textarea>

                </div>


                <p
                    id="agentSupportFormMessage"
                    class="form-message"
                ></p>


                <button
                    type="submit"
                    class="primary-btn"
                    id="submitAgentSupportTicketBtn"
                >
                    Submit Ticket
                </button>

            </form>

        </div>

    `;


    const backButton =
        document.getElementById(
            "backToAgentSupportTicketsBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            loadAgentSupportTickets
        );

    }


    const form =
        document.getElementById(
            "agentSupportTicketForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleCreateAgentSupportTicket
        );

    }

}


/* =========================================
   CREATE AGENT SUPPORT TICKET
========================================= */

async function handleCreateAgentSupportTicket(
    event
) {

    event.preventDefault();


    const subject =
        document.getElementById(
            "agentSupportSubject"
        )?.value.trim();


    const category =
        document.getElementById(
            "agentSupportCategory"
        )?.value;


    const message =
        document.getElementById(
            "agentSupportMessage"
        )?.value.trim();


    const messageElement =
        document.getElementById(
            "agentSupportFormMessage"
        );


    const submitButton =
        document.getElementById(
            "submitAgentSupportTicketBtn"
        );


    if (
        !subject ||
        !category ||
        !message
    ) {

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
                "/agent-support",
                {
                    method: "POST",

                    body: JSON.stringify({
                        subject,
                        category,
                        message
                    })
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


        currentAgentSupportTicketId =
            result.ticket?._id || null;


        await openAgentSupportTicket(
            currentAgentSupportTicketId
        );


    } catch (error) {

        console.error(
            "Create agent support ticket error:",
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
   OPEN AGENT SUPPORT TICKET
========================================= */

async function openAgentSupportTicket(
    ticketId
) {

    if (!ticketId) {
        return;
    }


    currentAgentSupportTicketId =
        ticketId;


    const container =
        document.getElementById(
            "agentSupportContent"
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
                `/agent-support/${encodeURIComponent(
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


        renderAgentSupportTicket(
            result.ticket,
            result.messages || []
        );


        startAgentSupportReplyPolling();


    } catch (error) {

        console.error(
            "Open agent support ticket error:",
            error
        );


        container.innerHTML = `
            <div class="content-card">

                <button
                    type="button"
                    id="backToAgentSupportTicketsBtn"
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
                "backToAgentSupportTicketsBtn"
            );


        if (backButton) {

            backButton.addEventListener(
                "click",
                loadAgentSupportTickets
            );

        }

    }

}


/* =========================================
   RENDER AGENT SUPPORT TICKET
========================================= */

function renderAgentSupportTicket(
    ticket,
    messages
) {

    const container =
        document.getElementById(
            "agentSupportContent"
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
                    id="backToAgentSupportTicketsBtn"
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
                id="agentSupportMessages"
                class="support-messages"
            >

                ${
                    messages.length
                        ? messages.map(
                            renderAgentSupportMessage
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
                            id="agentSupportReplyForm"
                            class="support-reply-form"
                        >

                            <div class="input-group">

                                <label>
                                    Reply
                                </label>


                                <textarea
                                    id="agentSupportReplyMessage"
                                    rows="5"
                                    maxlength="5000"
                                    placeholder="Write your reply..."
                                    required
                                ></textarea>

                            </div>


                            <p
                                id="agentSupportReplyFormMessage"
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
                                    id="sendAgentSupportReplyBtn"
                                >
                                    Send Reply
                                </button>


                                <button
                                    type="button"
                                    class="secondary-btn"
                                    id="closeAgentSupportTicketBtn"
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
            "backToAgentSupportTicketsBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            loadAgentSupportTickets
        );

    }


    if (!isClosed) {

        const replyForm =
            document.getElementById(
                "agentSupportReplyForm"
            );


        if (replyForm) {

            replyForm.addEventListener(
                "submit",
                handleAgentSupportReply
            );

        }


        const closeButton =
            document.getElementById(
                "closeAgentSupportTicketBtn"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                handleCloseAgentSupportTicket
            );

        }

    }


    const messagesContainer =
        document.getElementById(
            "agentSupportMessages"
        );


    if (messagesContainer) {

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;

    }

}


/* =========================================
   RENDER AGENT SUPPORT MESSAGE
========================================= */

function renderAgentSupportMessage(
    message
) {

    const senderClass =
        message.senderType === "admin"
            ? "support-message-admin"
            : "support-message-user";


    let senderLabel;


    if (
        message.senderType === "admin"
    ) {

        senderLabel =
            message.isAutomatic
                ? "Blaiz Support • Automatic Reply"
                : "Blaiz Support";

    } else {

        senderLabel =
            "You";

    }


    return `
        <div
            class="support-message ${senderClass} ${
                message.isAutomatic
                    ? "support-message-automatic"
                    : ""
            }"
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
   REPLY TO AGENT TICKET
========================================= */

async function handleAgentSupportReply(
    event
) {

    event.preventDefault();


    if (!currentAgentSupportTicketId) {
        return;
    }


    const textarea =
        document.getElementById(
            "agentSupportReplyMessage"
        );


    const message =
        textarea?.value.trim();


    const messageElement =
        document.getElementById(
            "agentSupportReplyFormMessage"
        );


    const sendButton =
        document.getElementById(
            "sendAgentSupportReplyBtn"
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
                `/agent-support/${encodeURIComponent(
                    currentAgentSupportTicketId
                )}/reply`,
                {
                    method: "POST",

                    body: JSON.stringify({
                        message
                    })
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


        await openAgentSupportTicket(
            currentAgentSupportTicketId
        );


    } catch (error) {

        console.error(
            "Agent support reply error:",
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
   CLOSE AGENT TICKET
========================================= */

async function handleCloseAgentSupportTicket() {

    if (!currentAgentSupportTicketId) {
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
                `/agent-support/${encodeURIComponent(
                    currentAgentSupportTicketId
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


        await openAgentSupportTicket(
            currentAgentSupportTicketId
        );


    } catch (error) {

        console.error(
            "Close agent support ticket error:",
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

        referrals:
            "Referrals",

        earnings:
            "Earnings",

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


/* =========================================
   POLL FOR NEW AGENT SUPPORT REPLIES
========================================= */

function startAgentSupportReplyPolling() {

    stopAgentSupportReplyPolling();


    agentSupportReplyPollingTimer =
        setInterval(
            async () => {

                if (
                    !currentAgentSupportTicketId
                ) {
                    return;
                }


                try {

                    const result =
                        await apiRequest(
                            `/agent-support/${encodeURIComponent(
                                currentAgentSupportTicketId
                            )}`,
                            {
                                method: "GET"
                            }
                        );


                    if (
                        !result ||
                        !result.success
                    ) {
                        return;
                    }


                    const statusElement =
                        document.querySelector(
                            ".support-ticket-header .support-status"
                        );


                    if (
                        statusElement &&
                        result.ticket
                    ) {

                        statusElement.className =
                            `support-status support-status-${escapeHtml(
                                result.ticket.status
                            )}`;


                        statusElement.textContent =
                            formatStatus(
                                result.ticket.status
                            );

                    }


                    const messagesContainer =
                        document.getElementById(
                            "agentSupportMessages"
                        );


                    if (
                        messagesContainer
                    ) {

                        messagesContainer.innerHTML =
                            result.messages?.length
                                ? result.messages
                                    .map(
                                        renderAgentSupportMessage
                                    )
                                    .join("")
                                : `
                                    <div class="notification-empty">
                                        No messages yet.
                                    </div>
                                `;


                        messagesContainer.scrollTop =
                            messagesContainer.scrollHeight;

                    }


                } catch (error) {

                    console.error(
                        "Agent support reply polling error:",
                        error
                    );

                }

            },
            5000
        );

}


function stopAgentSupportReplyPolling() {

    if (
        agentSupportReplyPollingTimer
    ) {

        clearInterval(
            agentSupportReplyPollingTimer
        );


        agentSupportReplyPollingTimer =
            null;

    }

}