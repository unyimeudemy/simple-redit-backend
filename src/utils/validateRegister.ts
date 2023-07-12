import { usernameAndPassword } from "src/resolvers/usernameAndPassword";

export const validateRegister = (options: usernameAndPassword) => {
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
  // check if username valid
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

  // check if username has @ to avoid confusion with email
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

  //check password
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
