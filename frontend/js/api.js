const API_URL =
    localStorage.getItem("blaiz_api_url") ||
    "http://localhost:5000/api";

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

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

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