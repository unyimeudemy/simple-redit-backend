"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
const validateRegister = (options) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(options.email)) {
        return {
            errors: [
                {
                    field: "email",
                    message: "Please input a valid email",
                },
            ],
        };
    }
    if (options.username.length <= 2) {
        return {
            errors: [
                {
                    field: "username",
                    message: "Please input a valid username",
                },
            ],
        };
    }
    if (options.username.includes("@")) {
        return {
            errors: [
                {
                    field: "username",
                    message: "username cannot have @ sign",
                },
            ],
        };
    }
    if (options.password.length < 6) {
        return {
            errors: [
                {
                    field: "password",
                    message: "Password should be atleast 6 characters",
                },
            ],
        };
    }
    return null;
};
exports.validateRegister = validateRegister;
//# sourceMappingURL=validateRegister.js.map