import {
    apiRequest,
    saveToken,
    saveUser,
    saveStore,
    clearSession,
    getToken
} from "./api.js";


/* =========================================
   REGISTER OWNER
========================================= */

async function registerOwner(data) {

    const result =
        await apiRequest(
            "/auth/register",
            {
                method: "POST",

                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    password: data.password,

                    storeName:
                        data.storeName,

                    storePhone:
                        data.storePhone || "",

                    storeEmail:
                        data.storeEmail || "",

                    storeAddress:
                        data.storeAddress || "",

                    businessType:
                        data.businessType || ""
                })
            }
        );


    if (result.token) {
        saveToken(
            result.token
        );
    }


    if (result.user) {
        saveUser(
            result.user
        );
    }


    if (result.store) {
        saveStore(
            result.store
        );
    }


    return result;
}


/* =========================================
   LOGIN
========================================= */

async function loginUser(
    identifier,
    password
) {

    const result =
        await apiRequest(
            "/auth/login",
            {
                method: "POST",

                body: JSON.stringify({
                    identifier:
                        identifier,

                    password:
                        password
                })
            }
        );


    if (result.token) {
        saveToken(
            result.token
        );
    }


    if (result.user) {
        saveUser(
            result.user
        );
    }


    if (result.store) {
        saveStore(
            result.store
        );
    }


    return result;
}


/* =========================================
   LOGOUT
========================================= */

function logoutUser() {

    clearSession();
}


/* =========================================
   CHECK LOGIN
========================================= */

function isLoggedIn() {

    return Boolean(
        getToken()
    );
}


/* =========================================
   EXPORTS
========================================= */

export {
    registerOwner,
    loginUser,
    logoutUser,
    isLoggedIn
};