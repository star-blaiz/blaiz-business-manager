const API_URL =
    localStorage.getItem("blaiz_api_url") ||
    "https://blaiz-business-manager-gq8b.onrender.com/api";
    console.log("BLAIZ API URL:", API_URL);

async function apiRequest(
    endpoint,
    options = {}
) {
    const token =
        localStorage.getItem("blaiz_token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    let response;

try {

    response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

} catch (error) {

    console.error(
        "API Network Error:",
        error
    );

    throw new Error(
        "No internet connection. Please connect to the internet and try again."
    );
}

    let data;

    try {
        data = await response.json();
    } catch {
        data = {
            success: false,
            message:
                "The server returned an invalid response."
        };
    }

    if (!response.ok) {

    /* =========================================
       STORE SUSPENSION
    ========================================= */

    if (
    response.status === 403 &&
    data.code === "STORE_SUSPENDED" &&
    token
) {

        window.dispatchEvent(
            new CustomEvent(
                "storeSuspended",
                {
                    detail: {
                        message:
                            data.message,

                        reason:
                            data.suspensionReason,

                        liftDate:
                            data.suspensionLiftDate
                    }
                }
            )
        );
    }

    throw new Error(
        data.message ||
        "Something went wrong."
    );
}

    return data;
}

function saveToken(token) {
    localStorage.setItem(
        "blaiz_token",
        token
    );
}

function getToken() {
    return localStorage.getItem(
        "blaiz_token"
    ) || "";
}

function clearSession() {
    localStorage.removeItem(
        "blaiz_token"
    );

    localStorage.removeItem(
        "blaiz_user"
    );

    localStorage.removeItem(
        "blaiz_store"
    );
}

function saveUser(user) {
    localStorage.setItem(
        "blaiz_user",
        JSON.stringify(user)
    );
}

function getUser() {
    try {
        return JSON.parse(
            localStorage.getItem(
                "blaiz_user"
            )
        );
    } catch {
        return null;
    }
}

function saveStore(store) {
    localStorage.setItem(
        "blaiz_store",
        JSON.stringify(store)
    );
}

function getStore() {
    try {
        return JSON.parse(
            localStorage.getItem(
                "blaiz_store"
            )
        );
    } catch {
        return null;
    }
}

export {
    API_URL,
    apiRequest,
    saveToken,
    getToken,
    clearSession,
    saveUser,
    getUser,
    saveStore,
    getStore
};