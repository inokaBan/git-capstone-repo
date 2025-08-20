const SignUpValidation = (values) => {
    let errors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;


    if(values.username === "") {
        errors.username = "Name is required";
    } else {
        errors.username = "";
    }

    if(values.email === "") {
        errors.email = "Email is required";
    } else if (!emailPattern.test(values.email)) {
        errors.email = "Invalid email format";
    }else {
        errors.email = "";
    }

    if(values.password === "") {
        errors.password = "Password is required";
    } else if (!passwordPattern.test(values.password)) {
        errors.password = "Password didn't match the required format.";
    } else {
        errors.password = "";
    }
    return errors;
}

export default SignUpValidation