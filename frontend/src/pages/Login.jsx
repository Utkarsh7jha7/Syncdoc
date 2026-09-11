import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/userService";
import "./Auth.css";

const Login = () => {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        try {

            setLoading(true);

            await loginUser(
                email,
                password
            );

            navigate("/documents");

        } catch (error) {

            setError(error.message);

        } finally {

            setLoading(false);

        }
    };


    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        S
                    </div>

                    <span>
                        SyncDoc
                    </span>
                </div>


                <h1>
                    Welcome back
                </h1>

                <p className="auth-subtitle">
                    Login to continue collaborating
                </p>


                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}


                <form onSubmit={handleSubmit}>

                    <div className="auth-field">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                    </div>


                    <div className="auth-field">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                    </div>


                    <button
                        className="auth-button"
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? "Logging in..."
                            : "Login"
                        }

                    </button>

                </form>


                <div className="auth-footer">

                    Don't have an account?

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/register")
                        }
                    >
                        Create account
                    </button>

                </div>

            </div>

        </div>
    );
};

export default Login;