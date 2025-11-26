import { validatePasswordStrength } from './PasswordStrength';

const SignUpValidation = (values) => {
    let errors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(values.username === "") {
        errors.username = "Name is required";
    } else {
        errors.username = "";
    }

    if(values.email === "") {
        errors.email = "Email is required";
    } else if (!emailPattern.test(values.email)) {
        errors.email = "Invalid email format";
    } else {
        errors.email = "";
    }

    if(values.password === "") {
        errors.password = "Password is required";
    } else {
        const passwordValidation = validatePasswordStrength(values.password);
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.message;
        } else {
            errors.password = "";
        }
    }

    if (values.fullname === "") {
        errors.fullname = "Full name is required";
    } else if (values.fullname.length < 2) {
        errors.fullname = "Full name must be at least 2 characters";
    } else {
        errors.fullname = "";
    }

    if (values.gender === "") {
        errors.gender = "Gender is required";
    } else {
        errors.gender = "";
    }

    if (values.age === "") {
        errors.age = "Age is required";
    } else if (isNaN(values.age) || parseInt(values.age) < 1 || parseInt(values.age) > 120) {
        errors.age = "Please enter a valid age between 1 and 120";
    } else {
        errors.age = "";
    }

    if (values.address === "") {
        errors.address = "Address is required";
    } else if (values.address.length < 5) {
        errors.address = "Address must be at least 5 characters";
    } else {
        errors.address = "";
    }
    
    return errors;
}

export default SignUpValidation;
