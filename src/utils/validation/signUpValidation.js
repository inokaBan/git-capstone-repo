import { validatePasswordStrength } from './passwordStrength';

const signUpValidation = (values) => {
  let errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (values.username === "") {
    errors.username = "Name is required";
  } else {
    errors.username = "";
  }

  if (values.email === "") {
    errors.email = "Email is required";
  } else if (!emailPattern.test(values.email)) {
    errors.email = "Invalid email format";
  } else {
    errors.email = "";
  }

  if (values.password === "") {
    errors.password = "Password is required";
  } else {
    const passwordValidation = validatePasswordStrength(values.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    } else {
      errors.password = "";
    }
  }
  
  return errors;
};

export default signUpValidation;
