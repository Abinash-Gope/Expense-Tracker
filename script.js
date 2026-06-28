const toRegisterLink = document.querySelector("#to-register-link");
const toLoginLink = document.querySelector("#to-login-link");
const loginBox = document.querySelector("#login-box");
const registerBox = document.querySelector("#register-box");

toRegisterLink.addEventListener('click', (event) => {
    event.preventDefault();
    loginBox.classList.add("hidden");
    registerBox.classList.remove("hidden");
});

toLoginLink.addEventListener('click', (event) => {
    event.preventDefault();
    registerBox.classList.add("hidden");
    loginBox.classList.remove("hidden");
});


const togglePasswordButtons = document.querySelectorAll(".toggle-password-link");

togglePasswordButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault(); 
        
        const passwordInput = button.parentElement.querySelector("input");
        
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            button.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            button.textContent = "Show";
        }
    });
});

const registerUsername = document.querySelector("#register-username");
const passwordRegister = document.querySelector("#password-register");
const registerForm = document.querySelector("#register-form");
const registerError = document.querySelector("#register-error");

function registration() {
    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const enterName = registerUsername.value.trim();
        const enterPassword = passwordRegister.value;

        
        registerError.textContent = "";

    
        const hasCapital = /[A-Z]/.test(enterPassword);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(enterPassword);

        
        if (enterPassword.length < 8) {
            registerError.textContent = "Password must be at least 8 characters long.";
            return;
        }
        
        if (!hasCapital) {
            registerError.textContent = 'Password must include at least one capital letter.';
            return; 
        }
        
        if (!hasSpecial) {
            registerError.textContent = 'Password must include at least one special character (e.g., !, @, #, $).';
            return; 
        }

        
        const users = JSON.parse(localStorage.getItem('users')) || [];

        const usernameExists = users.some(user => user.userName.toLowerCase() === enterName.toLowerCase());

        if (usernameExists) {
            registerError.textContent = "Username is already taken! Try another one.";
            return; 
        }

        
        const accountData = {
            userName: enterName,
            userPassword: enterPassword
        };
        
        users.push(accountData);
        localStorage.setItem('users', JSON.stringify(users));

        alert('Account Created successfully!');
        
        
        registerForm.reset();
        registerBox.classList.add("hidden");
        loginBox.classList.remove("hidden");
    });
}

registration();


const loginForm = document.querySelector("#login-form");
const username = document.querySelector("#username");
const password = document.querySelector("#password");
const errorMessage = document.querySelector("#error-message");
const loginPage = document.querySelector("#login-wrapper");


function login() {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const typeName = username.value;
        const typePassword = password.value;

        const users = JSON.parse(localStorage.getItem('users')) || [];

        const matchedUser = users.find(user => {
            return user.userName === typeName && user.userPassword === typePassword;
        });

        if (matchedUser) {
            alert("Login successful");
            
            localStorage.setItem('currentUser', JSON.stringify(matchedUser));

            loginPage.classList.add("hidden");
        }else{
            errorMessage.textContent = "Account not found click here ↑ to register ";
        }

    });
};

login()

function checkAuthState() {
    const loggedInUser = localStorage.getItem('currentUser');
    
    if (loggedInUser) {
        loginPage.classList.add("hidden");
    }
}

checkAuthState();



